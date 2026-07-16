import { db, leadsTable } from "@workspace/db";
import { and, asc, gt, isNull, lt } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { logger } from "./logger";
import { sendLeadNotification } from "./email";

/**
 * Durable backstop for lead notifications.
 *
 * The request path sends the leasing-team notification fire-and-forget and
 * stamps `notified_at` only on success. If the process restarts mid-send, the
 * mail connector has a transient outage, or the post-response stamp fails,
 * the lead stays saved but the leasing team is never told. This sweeper
 * periodically picks up that backlog (`notified_at IS NULL`) and retries.
 *
 * Semantics:
 * - Idempotence: a lead is only retried while `notified_at` is NULL; the stamp
 *   is written before the next sweep can run (sweeps never overlap).
 * - Grace period: leads younger than GRACE_MS are skipped so the sweep never
 *   races the in-flight request-path send (which would double-email the team).
 * - Retry budget: leads older than MAX_AGE_MS are abandoned (still visible for
 *   audit via their NULL notified_at) so a permanently failing send can't spam
 *   the log forever.
 * - Backoff: the interval itself is the backoff (one attempt per lead per
 *   sweep); a hard cap per sweep bounds work under a large backlog.
 */
const SWEEP_INTERVAL_MS = 5 * 60 * 1000; // every 5 minutes
const GRACE_MS = 2 * 60 * 1000; // don't race the request-path send
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // give up after 7 days
const MAX_PER_SWEEP = 25;

let sweeping = false;

/** One sweep over the un-notified backlog. Exported for tests. */
export async function sweepUnnotifiedLeads(now = new Date()): Promise<void> {
  if (sweeping) return;
  sweeping = true;
  try {
    const newestEligible = new Date(now.getTime() - GRACE_MS);
    const oldestEligible = new Date(now.getTime() - MAX_AGE_MS);

    const backlog = await db
      .select()
      .from(leadsTable)
      .where(
        and(
          isNull(leadsTable.notifiedAt),
          lt(leadsTable.createdAt, newestEligible),
          gt(leadsTable.createdAt, oldestEligible),
        ),
      )
      .orderBy(asc(leadsTable.createdAt))
      .limit(MAX_PER_SWEEP);

    if (backlog.length === 0) return;

    logger.warn(
      { count: backlog.length },
      "Retrying lead notifications that were never delivered",
    );

    for (const row of backlog) {
      const sent = await sendLeadNotification({
        type: row.type,
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        phone: row.phone,
        message: row.message,
        preferredDate: row.preferredDate,
        createdAt: row.createdAt,
      });
      if (!sent) continue; // try again next sweep

      try {
        // Conditional stamp: only fills a still-NULL notified_at, so if
        // another instance already recorded a send we don't overwrite its
        // timestamp. Affected-row detection tells us whether we won the race.
        const stamped = await db
          .update(leadsTable)
          .set({ notifiedAt: new Date() })
          .where(and(eq(leadsTable.id, row.id), isNull(leadsTable.notifiedAt)))
          .returning({ id: leadsTable.id });
        if (stamped.length > 0) {
          logger.info({ leadId: row.id }, "Recovered undelivered lead notification");
        } else {
          logger.warn(
            { leadId: row.id },
            "Lead notification retried but another instance had already stamped it",
          );
        }
      } catch (err) {
        logger.error(
          { err, leadId: row.id },
          "Retried lead notification but failed to stamp notifiedAt",
        );
      }
    }
  } catch (err) {
    logger.error({ err }, "Lead notification retry sweep failed");
  } finally {
    sweeping = false;
  }
}

/** Start the periodic sweeper. Call once from the server entrypoint. */
export function startLeadNotificationRetry(): NodeJS.Timeout {
  // Run one sweep shortly after boot to recover anything dropped by a restart,
  // then on the regular interval.
  setTimeout(() => void sweepUnnotifiedLeads(), 15 * 1000);
  const timer = setInterval(() => void sweepUnnotifiedLeads(), SWEEP_INTERVAL_MS);
  timer.unref(); // never keep the process alive just for the sweeper
  return timer;
}
