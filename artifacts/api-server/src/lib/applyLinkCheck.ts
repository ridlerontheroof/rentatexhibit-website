import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import type { Logger } from "pino";
import { logger as defaultLogger } from "./logger";
import { createDailyClaim } from "./dailyClaim";
import { createDailyHeartbeat } from "./dailyHeartbeat";
import { mailerConfigured } from "./mailer";
import { sendApplyLinkAlert } from "./email";
import { applyUrlForListing } from "./appfolio";
import { getAvailabilitySnapshot } from "../routes/availability";

/**
 * Watchdog for the AppFolio "Apply Now" hand-off link.
 *
 * The web app derives each posted unit's online rental application URL from
 * its public listing URL (…/listings/rental_applications/new?listable_uid=…).
 * That path is an AppFolio *convention*, not an API contract — AppFolio can
 * restructure its hosted application URLs at any time, after which every
 * "Start Application" hand-off on the site becomes a dead link that nobody
 * notices until a frustrated applicant calls the office.
 *
 * This module periodically probes the derived apply URL for one currently
 * posted unit and treats any 4xx/5xx final status (or a network failure) as
 * a failing run. Redirects are followed — AppFolio fronts the application
 * form with sign-in/interstitial redirects, so only the FINAL status is
 * meaningful; a 3xx chain ending in 2xx is healthy.
 *
 * A single failed run is ambiguous (transient AppFolio blip vs. a real URL
 * restructure), so consecutive failing runs are counted in the shared
 * `email_throttle_counters` table (restarts can't reset the clock, mirroring
 * showingSchedulerCheck); once the streak reaches ESCALATION_RUNS the
 * watchdog alerts the leasing inbox — at most one email per UTC day,
 * enforced cluster-wide via the shared daily claim.
 *
 * When no unit is currently posted there is nothing to probe against; the
 * run records "skipped" and the failure streak resets. Checks only run in
 * production; APPLY_LINK_CHECK_DISABLED=1 is a kill switch.
 */

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // hourly — the probe is one cheap GET
const FETCH_TIMEOUT_MS = 20_000;
const DAY_MS = 24 * 60 * 60 * 1000;
const USER_AGENT = "exhibit-apply-link-check/1.0";

/**
 * Consecutive failing runs before the alert. At the hourly interval, 3 runs
 * ≈ three hours of the apply link being dead — no longer plausibly a
 * transient AppFolio blip, and worth a leasing-inbox heads-up before real
 * applicants pile up against it.
 */
export const ESCALATION_RUNS = 3;

/** Shared-table key holding the persisted consecutive-failure count. */
const FAILURE_COUNTER_KEY = "applylinkcheck:failed-runs";

const dailyClaim = createDailyClaim({
  prefix: "applylinkcheck",
  claimFailedMessage:
    "Apply-link alert database claim failed; falling back to in-memory dedupe",
});

/**
 * Daily liveness heartbeat (shared implementation — see dailyHeartbeat.ts).
 * Healthy probes log at debug level, which production suppresses, so without
 * this a silently-dead interval would be indistinguishable from weeks of
 * healthy probes.
 */
const heartbeat = createDailyHeartbeat({
  outcomes: ["healthy", "failed", "skipped"] as const,
  message:
    "Apply-link watchdog heartbeat — still probing AppFolio's rental application URL",
  extraFields: { intervalHours: CHECK_INTERVAL_MS / 3_600_000 },
});

/** Consecutive failing runs — per-process mirror of the shared counter. */
let consecutiveFailedRuns = 0;

/** The unit + derived application URL the probe targets. */
export interface ApplyProbeTarget {
  unit: string;
  applyUrl: string;
}

export interface ApplyProbeDeps {
  /** Resolve a posted unit's derived apply URL, or null when none is posted. */
  resolveTarget(): Promise<ApplyProbeTarget | null>;
  /** GET the apply URL following redirects; resolve to the FINAL HTTP status. */
  probeStatus(applyUrl: string): Promise<number>;
}

/** Pick the first posted unit with a public listing from the availability snapshot. */
async function defaultResolveTarget(): Promise<ApplyProbeTarget | null> {
  const snapshot = await getAvailabilitySnapshot();
  for (const unit of snapshot?.units ?? []) {
    const applyUrl = unit.listingUrl ? applyUrlForListing(unit.listingUrl) : null;
    if (applyUrl) return { unit: unit.unit, applyUrl };
  }
  return null;
}

const defaultDeps: ApplyProbeDeps = {
  resolveTarget: defaultResolveTarget,
  probeStatus: async (applyUrl) => {
    const res = await fetch(applyUrl, {
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { "user-agent": USER_AGENT, accept: "text/html" },
    });
    // The body is irrelevant (and large); cancel it so the socket is freed.
    await res.body?.cancel().catch(() => {});
    return res.status;
  },
};

/**
 * Persist one more consecutive failing run in the shared table and return
 * the new total. Throws when the database is unreachable — the caller falls
 * back to the per-process mirror.
 */
async function bumpFailureShared(now: number): Promise<number> {
  const expiresAt = new Date(now + 2 * DAY_MS);
  const result = await db.execute(sql`
    INSERT INTO email_throttle_counters (key, count, expires_at)
    VALUES (${FAILURE_COUNTER_KEY}, 1, ${expiresAt})
    ON CONFLICT (key) DO UPDATE
      SET count = email_throttle_counters.count + 1,
          expires_at = ${expiresAt}
    RETURNING count
  `);
  const count = Number(result.rows[0]?.count);
  return Number.isFinite(count) ? count : 0;
}

/** Clear the persisted failure counter after a healthy (or skipped) run. */
async function resetFailureShared(): Promise<void> {
  await db.execute(sql`
    DELETE FROM email_throttle_counters
    WHERE key = ${FAILURE_COUNTER_KEY}
  `);
}

async function recordFailedRun(log: Logger, now: number): Promise<number> {
  consecutiveFailedRuns += 1;
  try {
    const shared = await bumpFailureShared(now);
    consecutiveFailedRuns = Math.max(consecutiveFailedRuns, shared);
  } catch (err) {
    log.error(
      { err },
      "Failed to persist apply-link failure counter; using in-memory count",
    );
  }
  return consecutiveFailedRuns;
}

async function recordRecoveredRun(log: Logger): Promise<void> {
  consecutiveFailedRuns = 0;
  try {
    await resetFailureShared();
  } catch (err) {
    log.error(
      { err },
      "Failed to clear persisted apply-link failure counter after a healthy run",
    );
  }
}

async function alertOncePerDay(
  log: Logger,
  now: number,
  opts: { unit: string; applyUrl: string; detail: string; failedRuns: number },
): Promise<void> {
  try {
    if (!(await dailyClaim.claim(log, now))) return;
    if (!mailerConfigured()) return;
    await sendApplyLinkAlert(opts);
  } catch (err) {
    log.error({ err }, "Failed to send apply-link broken alert");
  }
}

/**
 * Run one probe of the derived AppFolio application URL and alert (once/day,
 * leasing inbox) on a sustained failure. Exported for tests. Best-effort:
 * never throws, so a network or mail outage can't crash the interval.
 */
export async function checkApplyLinkOnce(
  log: Logger = defaultLogger,
  now: number = Date.now(),
  deps: ApplyProbeDeps = defaultDeps,
): Promise<void> {
  // --- Find a posted unit to probe against --------------------------------
  let target: ApplyProbeTarget | null;
  try {
    target = await deps.resolveTarget();
  } catch (err) {
    // Snapshot trouble is an availability-pipeline problem with its own
    // alerting, not evidence the apply link broke; treat like "nothing posted".
    log.warn({ err }, "Apply-link probe could not resolve a posted unit");
    target = null;
  }
  if (!target) {
    log.debug("Apply-link probe skipped — no posted unit to probe against");
    heartbeat.record(log, now, "skipped");
    await recordRecoveredRun(log);
    return;
  }

  // --- Probe the derived application URL ----------------------------------
  let failure: string | null = null;
  try {
    const status = await deps.probeStatus(target.applyUrl);
    // 2xx = the application form answered; 3xx only surfaces here if the
    // redirect chain was cut short (fetch follows otherwise) — still a live
    // endpoint, not a dead link. 4xx/5xx = the derived URL pattern is wrong.
    if (status >= 400) failure = `application URL answered status ${status}`;
  } catch (err) {
    failure = `application URL fetch failed: ${(err as Error).message}`;
  }

  // --- Healthy run ----------------------------------------------------------
  if (!failure) {
    log.debug({ unit: target.unit }, "Apply-link probe passed");
    heartbeat.record(log, now, "healthy");
    await recordRecoveredRun(log);
    return;
  }

  // --- Failed run: escalate only when sustained ----------------------------
  heartbeat.record(log, now, "failed");
  const failedRuns = await recordFailedRun(log, now);
  log.error(
    {
      failure,
      unit: target.unit,
      applyUrl: target.applyUrl,
      failedRuns,
      escalationRuns: ESCALATION_RUNS,
    },
    "Apply-link probe failed — AppFolio may have changed its rental application URL structure",
  );
  if (failedRuns < ESCALATION_RUNS) return;

  await alertOncePerDay(log, now, {
    unit: target.unit,
    applyUrl: target.applyUrl,
    detail: failure,
    failedRuns,
  });
}

/**
 * Start the periodic apply-link watchdog. Production only — dev and test
 * runs would probe the live AppFolio database and generate noise. Kicks off
 * an immediate probe, then repeats every CHECK_INTERVAL_MS.
 */
export function startApplyLinkCheck(log: Logger = defaultLogger): void {
  if (process.env.NODE_ENV !== "production") return;
  if (process.env.APPLY_LINK_CHECK_DISABLED === "1") {
    log.warn("Apply-link watchdog disabled via APPLY_LINK_CHECK_DISABLED=1");
    return;
  }
  void checkApplyLinkOnce(log);
  const timer = setInterval(() => void checkApplyLinkOnce(log), CHECK_INTERVAL_MS);
  timer.unref?.();
  log.info(
    { intervalHours: CHECK_INTERVAL_MS / 3_600_000, escalationRuns: ESCALATION_RUNS },
    "Apply-link watchdog started",
  );
}

/** Test-only: clear the per-process fallback dedupe state. */
export function __resetApplyLinkCheckForTests(): void {
  dailyClaim.reset();
  consecutiveFailedRuns = 0;
  heartbeat.reset();
}
