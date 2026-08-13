import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import type { Logger } from "pino";
import { logger as defaultLogger } from "./logger";
import { announceWatchdogStarted } from "./startupSummary";
import { createDailyClaim } from "./dailyClaim";
import { createDailyHeartbeat, createDailyInfoGate } from "./dailyHeartbeat";
import { mailerConfigured } from "./mailer";
import { sendShowingSchedulerAlert } from "./email";
import { resolveTourUnitListableUid } from "./appfolio";

/**
 * Watchdog for the dedicated "Tour" unit (see lib/tourUnit.ts).
 *
 * The /schedule-a-tour "No specific apartment" path books showings against a
 * hidden AppFolio unit that the showings route resolves via the reserved
 * TOUR token. If the leasing team renames or deletes that unit — or its
 * unit-directory row stops matching TOUR_UNIT_NAMES — the route answers
 * 404 `unit_not_listed` and the page quietly degrades to the plain-lead
 * fallback: visitors lose day/time picking, nothing errors, and the only
 * trace is a log line nobody watches. This watchdog makes that loud.
 *
 * Every run re-resolves the TOUR token through resolveTourUnitListableUid
 * (the exact resolver the route uses, including its cache and stale-serve
 * behavior — so the probe reflects what real visitors experience, and a
 * transient AppFolio report failure with a cached UID correctly reads as
 * healthy). A null resolution means the general-tour path is degraded
 * right now.
 *
 * A single failed run never alerts: the resolver deliberately does not
 * negative-cache (the team may be mid-rename), so consecutive failing runs
 * are counted in the shared `email_throttle_counters` table (mirroring the
 * showing-scheduler watchdog) so restarts can't reset the clock. Once the
 * streak reaches ESCALATION_RUNS the watchdog emails the alert inbox — at
 * most one email per UTC day, cluster-wide via the shared daily claim with
 * a per-process in-memory fallback. Production only.
 */

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // hourly — one cached report lookup

/**
 * Delay before the startup run. Deployment log ingestion drops the first
 * ~25s of a fresh container's stdout; an immediate run risks reporting
 * "Tour-unit check passed" into the void AND consuming the once-per-day
 * info gate (the 2026-08-12 publish's line survived only by luck of a
 * slow resolver call; same rationale as gtmCheck/redirectCheck).
 */
const STARTUP_DELAY_MS = 60 * 1000;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Consecutive failing runs before the sustained-failure alert. At the
 * hourly interval, 3 runs ≈ three hours of general tours being degraded —
 * long enough to skip a deliberate quick rename, short enough that the
 * leasing team hears the same day.
 */
export const ESCALATION_RUNS = 3;

/** Shared-table key holding the persisted consecutive-failure count. */
const FAILURE_COUNTER_KEY = "tourunit:failed-runs";

const dailyClaim = createDailyClaim({
  prefix: "tourunit",
  claimFailedMessage:
    "Tour-unit alert database claim failed; falling back to in-memory dedupe",
});

// The check is hourly; logging every healthy run at info would add ~24
// near-identical lines a day, so only the first pass of each UTC day is
// promoted to info (deployment logs are INFO+) and the rest stay debug.
const passInfoGate = createDailyInfoGate();

const heartbeat = createDailyHeartbeat({
  outcomes: ["healthy", "failed"] as const,
  message: 'Tour-unit watchdog heartbeat — still verifying the hidden "Tour" unit resolves',
  extraFields: { intervalHours: CHECK_INTERVAL_MS / 3_600_000 },
});

/**
 * Per-process mirror of the consecutive-failure count; the authoritative
 * count is persisted in the shared table so a restart mid-outage cannot
 * reset the escalation clock.
 */
let consecutiveFailedRuns = 0;

/** Injectable dependency so tests can drive the check without network. */
export interface TourUnitCheckDeps {
  /** Resolve the TOUR token to a listable UID, or null when unresolved. */
  resolveTourUid(): Promise<string | null>;
}

const defaultDeps: TourUnitCheckDeps = {
  resolveTourUid: () => resolveTourUnitListableUid(),
};

/**
 * Persist one more consecutive failing run in the shared table and return
 * the new total. Throws when the database is unreachable — the caller
 * falls back to the per-process mirror.
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

/** Clear the persisted failure counter after a healthy run. */
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
      "Failed to persist tour-unit failure counter; using in-memory count",
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
      "Failed to clear persisted tour-unit failure counter after a healthy run",
    );
  }
}

async function alertOncePerDay(
  log: Logger,
  now: number,
  opts: { detail: string; failedRuns: number },
): Promise<void> {
  try {
    if (!(await dailyClaim.claim(log, now))) return;
    if (!mailerConfigured()) return;
    await sendShowingSchedulerAlert({
      reason: "tour_unit_unresolved",
      detail: opts.detail,
      failedRuns: opts.failedRuns,
    });
  } catch (err) {
    log.error({ err }, "Failed to send tour-unit unresolved alert");
  }
}

/**
 * Run one TOUR-resolution check and alert (once/day) on a sustained
 * failure. Exported for tests. Best-effort: never throws, so a network or
 * mail outage can't crash the interval.
 */
export async function checkTourUnitOnce(
  log: Logger = defaultLogger,
  now: number = Date.now(),
  deps: TourUnitCheckDeps = defaultDeps,
): Promise<void> {
  let uid: string | null;
  let failureDetail: string;
  try {
    uid = await deps.resolveTourUid();
    failureDetail =
      'The AppFolio unit directory has no row whose unit name matches the configured tour-unit names, and no previously resolved UID is cached — the reserved TOUR token now answers "unit not listed" and general tours fall back to a plain contact request.';
  } catch (err) {
    // The real resolver never throws (it stale-serves or returns null), but
    // an injected/test dependency might; treat it like an unresolved run.
    uid = null;
    failureDetail = `TOUR resolution threw: ${(err as Error).message}`;
  }

  // --- Healthy run ----------------------------------------------------------
  if (uid) {
    log[passInfoGate.shouldInfo(now) ? "info" : "debug"](
      { tourUid: uid },
      "Tour-unit check passed — TOUR token resolves",
    );
    heartbeat.record(log, now, "healthy");
    await recordRecoveredRun(log);
    return;
  }

  // --- Failed run: escalate only when sustained ----------------------------
  heartbeat.record(log, now, "failed");
  const failedRuns = await recordFailedRun(log, now);
  log.error(
    { failedRuns, escalationRuns: ESCALATION_RUNS },
    'The hidden "Tour" unit no longer resolves — the schedule-a-tour general path is degraded to the plain-lead fallback',
  );
  if (failedRuns < ESCALATION_RUNS) return;

  await alertOncePerDay(log, now, { detail: failureDetail, failedRuns });
}

/**
 * Start the periodic tour-unit watchdog. Production only — dev and test
 * runs would query the live AppFolio database and generate noise. Runs the
 * first check STARTUP_DELAY_MS after boot (keeps its outcome — and the
 * daily info gate — out of the dropped early-stdout window), then repeats
 * every CHECK_INTERVAL_MS.
 */
export function startTourUnitCheck(log: Logger = defaultLogger): void {
  if (process.env.NODE_ENV !== "production") return;
  const startupTimer = setTimeout(() => void checkTourUnitOnce(log), STARTUP_DELAY_MS);
  startupTimer.unref?.();
  const timer = setInterval(() => void checkTourUnitOnce(log), CHECK_INTERVAL_MS);
  timer.unref?.();
  log.info(
    {
      intervalHours: CHECK_INTERVAL_MS / 3_600_000,
      escalationRuns: ESCALATION_RUNS,
      startupDelaySeconds: STARTUP_DELAY_MS / 1000,
    },
    "Tour-unit watchdog started",
  );
  announceWatchdogStarted("tour-unit");
}

/** Test-only: clear the per-process fallback dedupe state. */
export function __resetTourUnitCheckForTests(): void {
  dailyClaim.reset();
  consecutiveFailedRuns = 0;
  heartbeat.reset();
  passInfoGate.reset();
}
