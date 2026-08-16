import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import type { Logger } from "pino";
import { createDailyClaim } from "./dailyClaim";
import { mailerConfigured } from "./mailer";
import { sendShowingSchedulerAlert } from "./email";

/**
 * Real-visitor escalation for the slot-loading step of the showing scheduler.
 *
 * The 2026-08-04 incident (17:46–17:50 UTC): four consecutive visitors got a
 * 502 from GET /showings/slots and were routed to the "we've got your
 * request" fallback. The leads were captured, but nobody was told that
 * online self-booking was effectively down — the existing alarms did not
 * cover this path:
 *
 *   - slots_degraded (showingFormatAlert) fires only when AppFolio RETURNS
 *     slots that all fail to parse; here the availabilities call itself
 *     errored (502/timeout), so no response ever reached the parser.
 *   - the live-traffic escalation (showingLiveFailureAlert) counts only
 *     guest-card and booking failures — steps the hourly probe cannot touch.
 *     The probe DOES cover the anonymous slot fetch, but it runs hourly:
 *     a burst of real-visitor failures between probe runs stays silent.
 *
 * This module counts genuine slot-fetch failures (the route's catch path —
 * never invalid-unit 400s or unlisted-unit 404s, which are normal traffic)
 * in a sliding window. When SLOTS_FAILURE_THRESHOLD failures land within
 * SLOTS_FAILURE_WINDOW_MS, one alert email goes out naming the window and
 * the failure count, throttled to at most once per UTC day via the shared
 * claim table. A single transient failure never alerts.
 *
 * Cluster note: every failure is persisted as its own row in the shared
 * `email_throttle_counters` table, with `expires_at` set to the failure's
 * own timestamp plus the window — so "still inside the trailing window" is
 * exactly `expires_at >= now`, to the millisecond. Autoscale replicas
 * splitting the traffic reach the threshold together, restarts cannot reset
 * the count, and a failure even one millisecond older than the window can
 * never contribute. Expired rows are swept on every bump, so the table
 * cannot accumulate stale entries. The in-memory timestamps are the
 * fallback when the database is down.
 * Everything is best-effort and fire-and-forget: a database or mail outage
 * must never affect a visitor's request.
 */

/** Sliding window within which repeated slot-fetch failures escalate. */
export const SLOTS_FAILURE_WINDOW_MS = 10 * 60 * 1000;

/**
 * Failures within the window before alerting. Three visitors inside ten
 * minutes all failing to load slots is no longer plausibly one AppFolio blip.
 */
export const SLOTS_FAILURE_THRESHOLD = 3;

/** Shared-table key prefix; each failure event appends its timestamp + a nonce. */
const SLOTS_COUNTER_PREFIX = "showingscheduler:slots-failed";

/**
 * Once-per-UTC-day dedupe, independent of the other showing-scheduler claims
 * (probe, live-traffic, format-drift) — they are different signals and each
 * may need to fire on the same bad day.
 */
const dailyClaim = createDailyClaim({
  prefix: "showingscheduler-slots",
  claimFailedMessage:
    "Showing slots-failure alert database claim failed; falling back to in-memory dedupe",
});

/** In-memory failure timestamps (ms), oldest first — fallback + window naming. */
let failureTimes: number[] = [];

/** The most recent failure details, newest last, for the alert body. */
let recentFailures: string[] = [];

function pruneWindow(now: number): void {
  const cutoff = now - SLOTS_FAILURE_WINDOW_MS;
  let i = 0;
  while (i < failureTimes.length && failureTimes[i] < cutoff) i++;
  if (i > 0) failureTimes = failureTimes.slice(i);
}

/**
 * Persist this failure as its own event row and return the exact number of
 * failures inside the trailing window, across all replicas.
 *
 * Each row's `expires_at` is the failure's own timestamp plus the window,
 * so a row is inside the trailing window iff `expires_at >= now` — exact to
 * the millisecond, with no bucket rounding. The event timestamp + a nonce
 * in the key make every row unique (no upsert races between replicas), and
 * expired rows under this prefix are deleted on every bump so the table
 * cannot grow. Throws when the database is unreachable.
 */
async function bumpFailureShared(now: number): Promise<number> {
  const nowDate = new Date(now);
  // Sweep rows that fell out of the window; keyed to this prefix only.
  await db.execute(sql`
    DELETE FROM email_throttle_counters
    WHERE key LIKE ${`${SLOTS_COUNTER_PREFIX}:%`} AND expires_at < ${nowDate}
  `);
  await db.execute(sql`
    INSERT INTO email_throttle_counters (key, count, expires_at)
    VALUES (${`${SLOTS_COUNTER_PREFIX}:${now}:${randomUUID()}`}, 1, ${new Date(now + SLOTS_FAILURE_WINDOW_MS)})
  `);
  const counted = await db.execute(sql`
    SELECT COUNT(*) AS total
    FROM email_throttle_counters
    WHERE key LIKE ${`${SLOTS_COUNTER_PREFIX}:%`} AND expires_at >= ${nowDate}
  `);
  const total = Number(counted.rows[0]?.total);
  return Number.isFinite(total) ? total : 0;
}

/** "17:46 UTC" — window boundary label for the alert body. */
function utcHHMM(ms: number): string {
  return `${new Date(ms).toISOString().slice(11, 16)} UTC`;
}

/**
 * Record a genuine slot-fetch failure for a real visitor (the route's catch
 * path — never visitor-input 400s or unlisted-unit 404s). Alerts via the
 * showing-scheduler email channel once the window threshold is reached, at
 * most once per UTC day. Never throws.
 */
export async function recordSlotsFetchFailure(
  log: Logger,
  now: number,
  opts: { unit: string; message: string },
): Promise<void> {
  pruneWindow(now);
  failureTimes.push(now);
  recentFailures.push(`unit ${opts.unit}: ${opts.message}`);
  if (recentFailures.length > SLOTS_FAILURE_THRESHOLD) {
    recentFailures = recentFailures.slice(-SLOTS_FAILURE_THRESHOLD);
  }

  let windowCount = failureTimes.length;
  try {
    // The shared count spans replicas and restarts; take whichever clock has
    // seen more of the window.
    windowCount = Math.max(windowCount, await bumpFailureShared(now));
  } catch (err) {
    log.error(
      { err },
      "Failed to persist showing slots-failure counter; using in-memory count",
    );
  }

  log.error(
    {
      unit: opts.unit,
      windowFailures: windowCount,
      thresholdFailures: SLOTS_FAILURE_THRESHOLD,
      windowMinutes: SLOTS_FAILURE_WINDOW_MS / 60_000,
    },
    "Real-visitor showing slot fetch failed — counting toward the slots-outage escalation",
  );
  if (windowCount < SLOTS_FAILURE_THRESHOLD) return;

  try {
    if (!(await dailyClaim.claim(log, now))) return;
    if (!mailerConfigured()) return;
    const windowStart = failureTimes[0] ?? now;
    await sendShowingSchedulerAlert({
      reason: "slots_endpoint_failure",
      detail:
        `${windowCount} slot-loading failures between ${utcHHMM(windowStart)} and ${utcHHMM(now)}` +
        ` (window: ${SLOTS_FAILURE_WINDOW_MS / 60_000} minutes). Latest: ${recentFailures.join("; ")}`,
      failedRuns: windowCount,
    });
  } catch (err) {
    log.error({ err }, "Failed to send showing slots-failure alert");
  }
}

/** Test-only: clear the per-process window and dedupe state. */
export function __resetShowingSlotsFailureAlertForTests(): void {
  dailyClaim.reset();
  failureTimes = [];
  recentFailures = [];
}
