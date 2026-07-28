import type { Logger } from "pino";
import { createDailyClaim } from "./dailyClaim";
import { mailerConfigured } from "./mailer";
import { sendGuestCardFailureAlert } from "./email";

/**
 * Leasing alert for AppFolio guest-card push failures on accepted leads.
 *
 * The guest-card push (routes/leads.ts) is fire-and-forget: an AppFolio
 * rejection — live verification showed the endpoint returns an empty-body
 * 422 for creation-time validation failures (unusual characters in a name,
 * non-real email domains) — only produced a server log line. The lead is
 * still saved and emailed, but it silently never reaches AppFolio's lead
 * queue, so the leasing team wouldn't know to enter the prospect manually.
 *
 * This module emails the leasing inbox with the lead's details when a push
 * fails, throttled to at most one email per lead per UTC day (retries or
 * duplicate submissions of the same lead can't spam the inbox), enforced
 * cluster-wide via the shared daily claim in `email_throttle_counters` with
 * a per-process in-memory fallback. Everything is best-effort and
 * fire-and-forget: a database or mail outage must never affect the
 * visitor's request (which has already been answered).
 *
 * Note: unlike the showing live-failure escalation (which watches for
 * *endpoint drift* via consecutive-failure streaks), this alert fires on
 * the FIRST failure — a single rejected applicant is already a lost lead
 * the team needs to act on.
 */

/**
 * Once-per-UTC-day dedupe, keyed per lead so each distinct rejected
 * applicant gets their own alert (leads are rare; the details are the
 * point), while retries of the same lead the same day stay silent.
 */
const dailyClaim = createDailyClaim({
  prefix: "guestcardfail",
  claimFailedMessage:
    "Guest-card failure alert database claim failed; falling back to in-memory dedupe",
});

export interface GuestCardFailureDetails {
  leadId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  unit: string;
  /** Sanitized visit source, or null when it's just the site default. */
  source: string | null;
  /** The thrown error's message (createGuestCard includes status + body). */
  errorMessage: string;
}

/**
 * Report a failed AppFolio guest-card push for an accepted lead. Emails the
 * leasing inbox with the lead's details, at most once per lead per UTC day.
 * Never throws; call fire-and-forget from routes.
 */
export async function reportGuestCardFailure(
  log: Logger,
  now: number,
  details: GuestCardFailureDetails,
): Promise<void> {
  try {
    const claimed = await dailyClaim.claim(log, now, {
      subKey: `lead-${details.leadId}`,
      logFields: { leadId: details.leadId, unit: details.unit },
    });
    if (!claimed) return;
    if (!mailerConfigured()) {
      log.warn(
        { leadId: details.leadId, unit: details.unit },
        "Guest-card push failed but the mailer is not configured; no alert sent",
      );
      return;
    }
    await sendGuestCardFailureAlert({
      name: `${details.firstName} ${details.lastName}`.trim(),
      email: details.email,
      phone: details.phone,
      unit: details.unit,
      source: details.source,
      detail: details.errorMessage,
    });
  } catch (err) {
    log.error(
      { err, leadId: details.leadId, unit: details.unit },
      "Failed to send guest-card rejection alert",
    );
  }
}

/** Test-only: clear the per-process fallback dedupe state. */
export function __resetGuestCardAlertForTests(): void {
  dailyClaim.reset();
}
