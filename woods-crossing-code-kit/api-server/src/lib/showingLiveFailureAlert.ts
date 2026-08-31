import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import type { Logger } from "pino";
import { createDailyClaim } from "./dailyClaim";
import { mailerConfigured } from "./mailer";
import { sendShowingSchedulerAlert } from "./email";

/**
 * Live-traffic escalation for the property showing scheduler.
 *
 * The watchdog (showingSchedulerCheck.ts) probes only the anonymous halves
 * of the AppFolio flow — the slot fetch and the IDV status endpoint —
 * because probing guest-card creation or booking would create real prospect
 * records and calendar appointments in the leasing team's AppFolio. If
 * AppFolio changes only the guest-card POST or the booking POST, the probe
 * stays green while every real visitor lands on the fallback.
 *
 * This module watches the outcomes the routes already record: each real
 * AppFolio guest-card or booking failure bumps a consecutive-failure streak;
 * any success resets it. One-off failures (a single AppFolio blip, a visitor
 * race) never alert — only a streak of LIVE_ESCALATION_FAILURES consecutive
 * failures with zero successes in between does, via the same email channel
 * as the probe watchdog (sendShowingSchedulerAlert), at most once per UTC
 * day. The routes only report genuine AppFolio call failures here — not
 * visitor-input 400s, unlisted-unit 404s, or slot-taken races, which are
 * normal traffic, not evidence of endpoint drift.
 *
 * Like the watchdog's escalation, the streak is persisted in the shared
 * `email_throttle_counters` table so restarts (or multiple autoscale
 * replicas splitting the traffic) cannot reset the clock, with a
 * per-process in-memory mirror as the fallback when the database is
 * unreachable. Everything here is best-effort and fire-and-forget: a
 * database or mail outage must never affect a visitor's request.
 */

/**
 * Consecutive live failures (zero successes in between) before alerting.
 * Three visitors in a row hitting the fallback is no longer plausibly a
 * transient AppFolio blip or a single unlucky request.
 */
export const LIVE_ESCALATION_FAILURES = 3;

/** Shared-table key holding the persisted consecutive live-failure count. */
const LIVE_FAILURE_COUNTER_KEY = "showingscheduler:live-failed";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Once-per-UTC-day dedupe, independent of the probe watchdog's claim so a
 * live-traffic break still alerts on a day the probe already alerted (they
 * are different signals: the probe covers the anonymous halves, this covers
 * the authenticated halves the probe cannot touch).
 */
const dailyClaim = createDailyClaim({
  prefix: "showingscheduler-live",
  claimFailedMessage:
    "Showing live-failure alert database claim failed; falling back to in-memory dedupe",
});

/** Per-process mirror of the streak; authoritative only when the DB is down. */
let consecutiveLiveFailures = 0;

/** The most recent failure details, newest last, for the alert body. */
let recentFailures: string[] = [];

async function bumpFailureShared(now: number): Promise<number> {
  const expiresAt = new Date(now + 2 * DAY_MS);
  const result = await db.execute(sql`
    INSERT INTO email_throttle_counters (key, count, expires_at)
    VALUES (${LIVE_FAILURE_COUNTER_KEY}, 1, ${expiresAt})
    ON CONFLICT (key) DO UPDATE
      SET count = email_throttle_counters.count + 1,
          expires_at = ${expiresAt}
    RETURNING count
  `);
  const count = Number(result.rows[0]?.count);
  return Number.isFinite(count) ? count : 0;
}

async function resetFailureShared(): Promise<void> {
  await db.execute(sql`
    DELETE FROM email_throttle_counters
    WHERE key = ${LIVE_FAILURE_COUNTER_KEY}
  `);
}

/**
 * Record a successful real-visitor guest-card or booking call. Resets the
 * consecutive-failure streak (shared + in-memory). Never throws.
 */
export async function recordLiveShowingSuccess(log: Logger): Promise<void> {
  const hadStreak = consecutiveLiveFailures > 0;
  consecutiveLiveFailures = 0;
  recentFailures = [];
  try {
    await resetFailureShared();
  } catch (err) {
    // Only worth a log line when there was a streak to clear; the delete is
    // a no-op otherwise and a transient DB error would just be noise.
    if (hadStreak) {
      log.error(
        { err },
        "Failed to clear persisted showing live-failure counter after a success",
      );
    }
  }
}

/**
 * Record a real-visitor guest-card or booking failure (a genuine AppFolio
 * call failure — the routes never report visitor-input errors here). Alerts
 * via the showing-scheduler email channel once the streak is sustained, at
 * most once per UTC day. Never throws.
 */
export async function recordLiveShowingFailure(
  log: Logger,
  now: number,
  opts: { step: "guest card" | "booking"; message: string },
): Promise<void> {
  consecutiveLiveFailures += 1;
  recentFailures.push(`${opts.step} failed: ${opts.message}`);
  if (recentFailures.length > LIVE_ESCALATION_FAILURES) {
    recentFailures = recentFailures.slice(-LIVE_ESCALATION_FAILURES);
  }
  try {
    // The persisted count survives restarts and spans replicas; take
    // whichever clock has been running longer.
    const shared = await bumpFailureShared(now);
    consecutiveLiveFailures = Math.max(consecutiveLiveFailures, shared);
  } catch (err) {
    log.error(
      { err },
      "Failed to persist showing live-failure counter; using in-memory count",
    );
  }

  log.error(
    {
      failedRuns: consecutiveLiveFailures,
      escalationRuns: LIVE_ESCALATION_FAILURES,
      step: opts.step,
    },
    "Real-visitor showing call failed — counting toward the live-traffic escalation",
  );
  if (consecutiveLiveFailures < LIVE_ESCALATION_FAILURES) return;

  try {
    if (!(await dailyClaim.claim(log, now))) return;
    if (!mailerConfigured()) return;
    await sendShowingSchedulerAlert({
      reason: "live_traffic_failure",
      detail: recentFailures.join("; "),
      failedRuns: consecutiveLiveFailures,
    });
  } catch (err) {
    log.error({ err }, "Failed to send showing live-traffic failure alert");
  }
}

/** Test-only: clear the per-process streak and dedupe state. */
export function __resetShowingLiveFailureAlertForTests(): void {
  dailyClaim.reset();
  consecutiveLiveFailures = 0;
  recentFailures = [];
}
