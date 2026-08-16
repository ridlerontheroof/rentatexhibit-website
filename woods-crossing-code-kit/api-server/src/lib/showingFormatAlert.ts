import type { Logger } from "pino";
import { createDailyClaim } from "./dailyClaim";
import { mailerConfigured } from "./mailer";
import { sendShowingSchedulerAlert } from "./email";
import { allSlotsDropped, type ShowingAvailabilities } from "./showings";

/**
 * Loud alarm for the "AppFolio slot format drifted again" failure mode.
 *
 * In 2026-07 AppFolio silently switched its availabilities feed from
 * "YYYY/MM/DD HH:mm" wall times to ISO-8601-with-offset, and the normalizer
 * dropped EVERY slot for weeks — the page showed "no online showing times"
 * while openings existed, and nothing logged, heartbeat, or emailed. The
 * parser now accepts both formats, but if AppFolio drifts a THIRD time the
 * same silent outage would recur. This module makes that condition loud:
 *
 *  - error log (deploy-log visible) every time it is observed,
 *  - a `slots_degraded` heartbeat outcome recorded by the caller,
 *  - an alert email to the leasing inbox (revenue-path outage — mirrors the
 *    fee-copy contradiction alert), at most once per UTC day, cluster-wide
 *    via the shared daily claim with a per-process in-memory fallback.
 *
 * Best-effort: never throws, so a mail or DB outage can't take down the
 * slots route that detected the problem.
 */

const dailyClaim = createDailyClaim({
  prefix: "slotformat",
  claimFailedMessage:
    "Slot-format drift alert database claim failed; falling back to in-memory dedupe",
});

/**
 * Check one normalized availabilities result for the all-dropped condition.
 * Returns true when it fired (caller records the `slots_degraded` heartbeat
 * outcome); logs loudly and emails (once/day) as a side effect.
 */
export function detectSlotFormatDrift(
  log: Logger,
  now: number,
  availabilities: Pick<ShowingAvailabilities, "rawTimeslotCount" | "acceptedSlotCount">,
  context: Record<string, unknown> = {},
): boolean {
  if (!allSlotsDropped(availabilities)) return false;
  log.error(
    {
      ...context,
      rawTimeslotCount: availabilities.rawTimeslotCount,
      acceptedSlotCount: availabilities.acceptedSlotCount,
    },
    "AppFolio slot format unrecognized — every slot dropped; online self-booking is down",
  );
  void alertOncePerDay(log, now, availabilities.rawTimeslotCount);
  return true;
}

async function alertOncePerDay(log: Logger, now: number, rawCount: number): Promise<void> {
  try {
    if (!(await dailyClaim.claim(log, now))) return;
    if (!mailerConfigured()) return;
    await sendShowingSchedulerAlert({
      reason: "slot_format_drift",
      detail:
        `AppFolio's availabilities response contained ${rawCount} raw timeslot(s), ` +
        "but none matched a format the website's parser recognizes (legacy " +
        '"YYYY/MM/DD HH:mm" wall time or ISO-8601 with offset). Every slot was ' +
        "dropped, so the schedule-showing page shows no bookable times.",
      failedRuns: 0,
    });
  } catch (err) {
    log.error({ err }, "Failed to send slot-format drift alert");
  }
}

const nearTermClaim = createDailyClaim({
  prefix: "neartermskip",
  claimFailedMessage:
    "Near-term-skip alert database claim failed; falling back to in-memory dedupe",
});

/**
 * Loud alarm for the "jump-ahead nearly skipped open near-term days" failure
 * mode (2026-07-29: the page offered 8/1 while AppFolio's hosted page had
 * open times on 7/30 and 7/31). The pipeline now self-recovers — the days
 * ARE served — but AppFolio contradicting its own first_available_date must
 * never be invisible again: error log, `slots_recovered` heartbeat outcome
 * (recorded by the caller), and a once-per-UTC-day alert email.
 */
export function detectNearTermSkip(
  log: Logger,
  now: number,
  availabilities: Pick<ShowingAvailabilities, "nearTermRecovery">,
  context: Record<string, unknown> = {},
): boolean {
  const recovery = availabilities.nearTermRecovery;
  if (!recovery) return false;
  log.error(
    {
      ...context,
      mode: recovery.mode,
      firstAvailableDate: recovery.firstAvailableDate,
      recoveredDates: recovery.recoveredDates,
    },
    "AppFolio availabilities contradiction — near-term days with open slots were hidden behind first_available_date; recovered and served",
  );
  void alertNearTermOncePerDay(log, now, recovery);
  return true;
}

async function alertNearTermOncePerDay(
  log: Logger,
  now: number,
  recovery: NonNullable<ShowingAvailabilities["nearTermRecovery"]>,
): Promise<void> {
  try {
    if (!(await nearTermClaim.claim(log, now))) return;
    if (!mailerConfigured()) return;
    await sendShowingSchedulerAlert({
      reason: "near_term_skip",
      detail:
        `AppFolio's availabilities feed reported an empty window and pointed to ${recovery.firstAvailableDate} ` +
        `as the first available date, but open slots actually existed on ${recovery.recoveredDates.join(", ")} ` +
        `(caught by the ${recovery.mode === "recheck" ? "no-hint re-check" : "day-early jump window"}). ` +
        "The website recovered and displayed those days automatically this time.",
      failedRuns: 0,
    });
  } catch (err) {
    log.error({ err }, "Failed to send near-term-skip alert");
  }
}

/** Test-only: clear the per-process fallback dedupe state. */
export function __resetSlotFormatAlertForTests(): void {
  dailyClaim.reset();
  nearTermClaim.reset();
}
