import { sql } from "drizzle-orm";
import type { Logger } from "pino";
import { db } from "@workspace/db";
import { createDailyClaim } from "./dailyClaim";
import { mailerConfigured } from "./mailer";
import { logger as defaultLogger } from "./logger";
import { sendWatchdogRosterAlert } from "./email";

/**
 * Claim-gated once-per-UTC-day alert for a missing-watchdog condition detected
 * by check-watchdog-roster.mjs after a publish. The check-watchdog-roster
 * script exits non-zero so the postpublish workflow flags the gap
 * immediately; this module additionally emails the ops inbox so a missing
 * watchdog is caught even when nobody is watching the workflow at publish
 * time.
 *
 * The cluster-wide dailyClaim dedupe (email_throttle_counters table) ensures
 * that a bad deploy restarting repeatedly does not flood the inbox — at most
 * one email per UTC day regardless of how many times check:postpublish runs
 * or how many autoscale replicas are running.
 *
 * The alert is best-effort: a database or mail outage must never affect the
 * check:postpublish exit code.
 */

/** URL of the Replit deployment logs shown in the alert body. */
export const DEPLOYMENT_LOGS_URL =
  process.env.DEPLOYMENT_LOGS_URL ??
  "https://replit.com/@highland/exhibit-on-superior#deployments";

const CLAIM_PREFIX = "watchdog-roster-missing";

const dailyClaim = createDailyClaim({
  prefix: CLAIM_PREFIX,
  claimFailedMessage:
    "Watchdog-roster alert database claim failed; falling back to in-memory dedupe",
});

/**
 * Release the daily claim after an SMTP send failure so the next
 * check:postpublish run can retry instead of silently skipping the day.
 * Best-effort: a DB failure here is logged but not re-thrown.
 */
async function releaseDayClaim(log: Logger, now: number): Promise<void> {
  const day = new Date(now).toISOString().slice(0, 10);
  const key = `${CLAIM_PREFIX}:${day}`;
  try {
    await db.execute(
      sql`DELETE FROM email_throttle_counters WHERE key = ${key}`,
    );
    log.info(
      { key },
      "Released watchdog-roster daily claim after send failure; next run will retry",
    );
  } catch (releaseErr) {
    log.error(
      { err: releaseErr, key },
      "Failed to release watchdog-roster daily claim after send failure",
    );
  }
}

/**
 * Attempt to claim the once-per-day alert slot and — on a successful claim —
 * email the ops inbox listing every missing watchdog name and linking to the
 * deployment logs. Never throws; all errors are logged.
 *
 * @param missing  Names absent from the live /watchdog-roster started set.
 * @param log      Pino logger (defaults to the module logger).
 * @param now      Current epoch ms (injectable for tests).
 */
export async function alertMissingWatchdogs(
  missing: string[],
  log: Logger = defaultLogger,
  now: number = Date.now(),
): Promise<void> {
  if (missing.length === 0) return;

  try {
    if (!(await dailyClaim.claim(log, now))) {
      log.info(
        { missing },
        "Watchdog-roster alert already sent today; skipping duplicate",
      );
      return;
    }
    if (!mailerConfigured()) {
      log.warn(
        { missing },
        "Watchdog-roster alert: mailer not configured, skipping email",
      );
      return;
    }
    try {
      await sendWatchdogRosterAlert({ missing, deploymentLogsUrl: DEPLOYMENT_LOGS_URL });
      log.info({ missing }, "Sent watchdog-roster missing-watchdog alert email");
    } catch (sendErr) {
      log.error({ err: sendErr, missing }, "Failed to send watchdog-roster alert email");
      // Release the claim so the next postpublish run can retry; a transient
      // SMTP outage must not consume the only alert slot for the day.
      await releaseDayClaim(log, now);
    }
  } catch (err) {
    log.error({ err, missing }, "Unexpected error in watchdog-roster alert flow");
  }
}

/** Test-only: clear per-process claim state. */
export function __resetWatchdogRosterAlertForTests(): void {
  dailyClaim.reset();
}
