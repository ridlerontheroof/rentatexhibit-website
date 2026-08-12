import type { Logger } from "pino";
import { logger as defaultLogger } from "./logger";
import { createDailyClaim } from "./dailyClaim";
import { createDailyHeartbeat } from "./dailyHeartbeat";
import { mailerConfigured } from "./mailer";
import { sendApexRedirectAlert } from "./email";

/**
 * Watchdog for the apex → www redirect.
 *
 * rentatexhibit.com issues a real HTTP 301 to www via a Squarespace Domain
 * Forwarding rule (July 26, 2026). If the domain is ever reconnected to the
 * deployment via Entri/Domain Connect (e.g. a future re-verification), the
 * apex A record (34.111.179.208) can be re-provisioned automatically,
 * silently replacing the 301 with site-serving again — reintroducing the
 * duplicate-host SEO issue.
 *
 * This module periodically fetches https://rentatexhibit.com/fees without
 * following redirects and alerts when the response is not a 301/308 whose
 * Location points at www.rentatexhibit.com.
 *
 * Alerting matches the fee-copy conventions: at most one email per UTC day,
 * enforced cluster-wide via the shared `email_throttle_counters` table
 * (INSERT … ON CONFLICT DO NOTHING RETURNING), with a per-process in-memory
 * fallback when the database is unreachable. Checks only run in production —
 * dev/test workspaces would produce noise (and workspace egress differs).
 */

const APEX_CHECK_URL = "https://rentatexhibit.com/fees";
const EXPECTED_HOST = "www.rentatexhibit.com";
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 hours
/**
 * Delay before the startup run. Deployment log ingestion drops the first
 * ~25s of a fresh container's stdout, so an immediate run would report its
 * "Apex redirect check passed" info line into the void (confirmed after the
 * 2026-08-12 publish; same rationale as gtmCheck/redirectCheck).
 */
const STARTUP_DELAY_MS = 60 * 1000;
const FETCH_TIMEOUT_MS = 15_000;

/**
 * Once-per-UTC-day alert dedupe (shared implementation — see dailyClaim.ts):
 * cluster-wide database claim with a per-process in-memory fallback.
 */
const dailyClaim = createDailyClaim({
  prefix: "apexredirect",
  claimFailedMessage:
    "Apex redirect alert database claim failed; falling back to in-memory dedupe",
});

/**
 * Daily liveness heartbeat (shared implementation — see dailyHeartbeat.ts).
 * Healthy checks log at debug level, which production (info-level)
 * suppresses — so without this, a silently-dead interval is
 * indistinguishable from a healthy one. Once per UTC day (after the first
 * check of a new day) we emit a single info-level line summarizing the
 * checks run since the previous heartbeat, proving the watchdog is alive.
 */
const heartbeat = createDailyHeartbeat({
  outcomes: ["healthy", "unreachable", "unhealthy"] as const,
  message: "Apex redirect watchdog heartbeat — still running its checks",
  extraFields: { intervalHours: CHECK_INTERVAL_MS / 3_600_000 },
});

function recordAndMaybeHeartbeat(
  log: Logger,
  now: number,
  outcome: "healthy" | "unreachable" | "unhealthy",
): void {
  heartbeat.record(log, now, outcome);
}

/** Result of inspecting one apex response. */
export interface ApexCheckResult {
  healthy: boolean;
  status: number | null;
  location: string | null;
  problem: string | null;
}

/**
 * Decide whether an apex response still looks like the Squarespace 301.
 * Healthy = 301/308 with a Location whose host is www.rentatexhibit.com
 * (http or https — Squarespace's forwarder hops through http first).
 */
export function evaluateApexResponse(
  status: number,
  location: string | null,
): ApexCheckResult {
  if (status !== 301 && status !== 308) {
    return {
      healthy: false,
      status,
      location,
      problem: `Expected a permanent redirect (301/308) but got HTTP ${status} — the apex is likely serving the site directly again.`,
    };
  }
  if (!location) {
    return {
      healthy: false,
      status,
      location,
      problem: "The redirect response is missing its Location header.",
    };
  }
  let host: string;
  try {
    host = new URL(location, APEX_CHECK_URL).hostname.toLowerCase();
  } catch {
    return {
      healthy: false,
      status,
      location,
      problem: `The redirect's Location header ("${location}") is not a valid URL.`,
    };
  }
  if (host !== EXPECTED_HOST) {
    return {
      healthy: false,
      status,
      location,
      problem: `The redirect points at "${host}" instead of ${EXPECTED_HOST}.`,
    };
  }
  return { healthy: true, status, location, problem: null };
}

/**
 * Run one check of the apex redirect. Exported for tests. Best-effort:
 * never throws, so a network or mail outage can't crash the interval.
 */
export async function checkApexRedirectOnce(
  log: Logger = defaultLogger,
  now: number = Date.now(),
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  let result: ApexCheckResult;
  try {
    const res = await fetchImpl(APEX_CHECK_URL, {
      redirect: "manual",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { "user-agent": "exhibit-apex-redirect-check/1.0" },
    });
    // Drain/cancel the body so the connection is released.
    await res.body?.cancel().catch(() => {});
    result = evaluateApexResponse(res.status, res.headers.get("location"));
  } catch (err) {
    // A fetch failure is ambiguous (transient network blip vs. DNS change);
    // log it but do not alert — a mis-provisioned apex *serves* the site,
    // it doesn't go dark, so alert-worthy states always produce a response.
    log.warn({ err }, "Apex redirect check could not reach the apex domain");
    recordAndMaybeHeartbeat(log, now, "unreachable");
    return;
  }

  if (result.healthy) {
    // info (not debug): the check runs only every 6 hours, so deployment
    // logs (INFO+) should show each healthy run — the once-daily heartbeat
    // alone is too sparse to confirm a publish.
    log.info(
      { status: result.status, location: result.location },
      "Apex redirect check passed",
    );
    recordAndMaybeHeartbeat(log, now, "healthy");
    return;
  }
  recordAndMaybeHeartbeat(log, now, "unhealthy");

  log.error(
    { status: result.status, location: result.location, problem: result.problem },
    "Apex domain is no longer 301-redirecting to www — duplicate-host SEO risk",
  );

  try {
    if (!(await dailyClaim.claim(log, now))) return;
    if (!mailerConfigured()) return;
    await sendApexRedirectAlert({
      status: result.status,
      location: result.location,
      problem: result.problem ?? "The apex response did not match the expected redirect.",
    });
  } catch (err) {
    log.error({ err }, "Failed to send apex-redirect broken alert");
  }
}

/**
 * Start the periodic apex-redirect watchdog. Production only — dev and test
 * runs would hit the live domain and generate meaningless alerts. Runs the
 * first check STARTUP_DELAY_MS after boot (keeps its outcome out of the
 * dropped early-stdout window), then repeats every CHECK_INTERVAL_MS.
 */
export function startApexRedirectCheck(log: Logger = defaultLogger): void {
  if (process.env.NODE_ENV !== "production") return;
  const startupTimer = setTimeout(() => void checkApexRedirectOnce(log), STARTUP_DELAY_MS);
  startupTimer.unref?.();
  const timer = setInterval(() => void checkApexRedirectOnce(log), CHECK_INTERVAL_MS);
  timer.unref?.();
  log.info(
    {
      url: APEX_CHECK_URL,
      intervalHours: CHECK_INTERVAL_MS / 3_600_000,
      startupDelaySeconds: STARTUP_DELAY_MS / 1000,
    },
    "Apex redirect watchdog started",
  );
}

/** Test-only: clear the per-process fallback dedupe state. */
export function __resetApexRedirectCheckForTests(): void {
  dailyClaim.reset();
  heartbeat.reset();
}
