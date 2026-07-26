import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import type { Logger } from "pino";
import { logger as defaultLogger } from "./logger";
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
const FETCH_TIMEOUT_MS = 15_000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** UTC day ("YYYY-MM-DD") the alert was last sent — in-memory fallback only. */
let alertedOnDay: string | null = null;

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

function utcDay(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
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
 * Try to claim the shared once-per-day alert slot. Returns true when this
 * process won the claim. Throws when the database is unreachable — the
 * caller falls back to per-process memory.
 */
async function claimShared(day: string, now: number): Promise<boolean> {
  const expiresAt = new Date(now + 2 * DAY_MS);
  const result = await db.execute(sql`
    INSERT INTO email_throttle_counters (key, count, expires_at)
    VALUES (${`apexredirect:${day}`}, 1, ${expiresAt})
    ON CONFLICT (key) DO NOTHING
    RETURNING count
  `);
  return result.rows.length > 0;
}

function claimInMemory(day: string): boolean {
  if (alertedOnDay === day) return false;
  alertedOnDay = day;
  return true;
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
    log.debug(
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
    const day = utcDay(now);
    let claimed: boolean;
    try {
      claimed = await claimShared(day, now);
      // Mirror successful shared claims so a later DB outage the same day
      // (same process) still can't re-send.
      if (claimed) alertedOnDay = day;
    } catch (err) {
      log.error(
        { err },
        "Apex redirect alert database claim failed; falling back to in-memory dedupe",
      );
      claimed = claimInMemory(day);
    }
    if (!claimed) return;
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
 * runs would hit the live domain and generate meaningless alerts. Kicks off
 * an immediate check, then repeats every CHECK_INTERVAL_MS.
 */
export function startApexRedirectCheck(log: Logger = defaultLogger): void {
  if (process.env.NODE_ENV !== "production") return;
  void checkApexRedirectOnce(log);
  const timer = setInterval(() => void checkApexRedirectOnce(log), CHECK_INTERVAL_MS);
  timer.unref?.();
  log.info(
    { url: APEX_CHECK_URL, intervalHours: CHECK_INTERVAL_MS / 3_600_000 },
    "Apex redirect watchdog started",
  );
}

/** Test-only: clear the per-process fallback dedupe state. */
export function __resetApexRedirectCheckForTests(): void {
  alertedOnDay = null;
  heartbeat.reset();
}
