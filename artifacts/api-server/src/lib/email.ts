import { logger } from "./logger";
import { allowProspectConfirmation } from "./emailThrottle";
import { sendRawEmail, SENDER_EMAIL, warnIfUnconfigured } from "./mailer";
import {
  renderLeadNotification,
  renderProspectConfirmation,
  renderSeedStaleAlert,
} from "./emailTemplates";
import {
  EMAIL_LOGO_BASE64,
  EMAIL_LOGO_CONTENT_ID,
  EMAIL_LOGO_MIME,
} from "./emailLogo";

/**
 * The leasing inbox that should be notified whenever a new lead comes in.
 * Configurable via env so it can be pointed elsewhere without a code change,
 * but defaults to the leasing team's shared inbox.
 */
const LEASING_INBOX_EMAIL =
  process.env.LEASING_INBOX_EMAIL ?? "exhibit@highlandptrs.com";

/** Shape of the data we need to build a lead notification email. */
export interface LeadNotification {
  type: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string | null;
  preferredDate: string | null;
  createdAt: Date;
  /**
   * Apartment number the tour lead named, when it came through the
   * "Request a Showing" fallback form (units without a posted AppFolio
   * listing). Not persisted on the leads table, so retry re-sends omit it.
   */
  unit?: string | null;
}

/**
 * Strip carriage-return and line-feed characters from any string that will be
 * interpolated into an RFC 2822 header field. This prevents header-injection
 * attacks where a malicious input could inject extra headers or recipients.
 */
function sanitizeHeaderValue(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\r\n\x00]/g, "");
}

/** RFC 2047 encode a header value so unicode names/subjects survive transit. */
function encodeHeader(value: string): string {
  // Always sanitize first — strip control chars that could escape the header.
  const safe = sanitizeHeaderValue(value);
  // Only apply RFC 2047 encoding when non-ASCII characters are present.
  if (/^[\x20-\x7E]*$/.test(safe)) return safe;
  return `=?UTF-8?B?${Buffer.from(safe, "utf-8").toString("base64")}?=`;
}

/**
 * Assemble the MIME body shared by every branded email:
 * multipart/related wrapping (a) a multipart/alternative text+HTML pair and
 * (b) the white wordmark PNG attached inline via Content-ID, so the header
 * logo renders in every client with no external hosting or image download.
 */
function buildMimeBody(
  boundaryPrefix: string,
  textBody: string,
  htmlBody: string,
): { contentType: string; body: string } {
  const stamp = Date.now().toString(36);
  const related = `${boundaryPrefix}_rel_${stamp}`;
  const alternative = `${boundaryPrefix}_alt_${stamp}`;

  const body = [
    `--${related}`,
    `Content-Type: multipart/alternative; boundary="${alternative}"`,
    "",
    `--${alternative}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(textBody, "utf-8").toString("base64"),
    `--${alternative}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(htmlBody, "utf-8").toString("base64"),
    `--${alternative}--`,
    `--${related}`,
    `Content-Type: ${EMAIL_LOGO_MIME}; name="exhibit-logo.png"`,
    "Content-Transfer-Encoding: base64",
    `Content-ID: <${EMAIL_LOGO_CONTENT_ID}>`,
    `Content-Disposition: inline; filename="exhibit-logo.png"`,
    "",
    EMAIL_LOGO_BASE64,
    `--${related}--`,
    "",
  ].join("\r\n");

  return {
    contentType: `multipart/related; boundary="${related}"; type="multipart/alternative"`,
    body,
  };
}

function buildRawMessage(lead: LeadNotification): string {
  const fullName = `${lead.firstName} ${lead.lastName}`.trim();
  const { subject, html: htmlBody, text: textBody } = renderLeadNotification(lead);

  const { contentType, body } = buildMimeBody("lead", textBody, htmlBody);
  const headers = [
    `From: ${encodeHeader(PROPERTY_NAME)} <${SENDER_EMAIL}>`,
    `To: ${LEASING_INBOX_EMAIL}`,
    // Let the leasing team reply straight back to the prospect.
    `Reply-To: ${encodeHeader(fullName)} <${sanitizeHeaderValue(lead.email)}>`,
    `Subject: ${encodeHeader(subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: ${contentType}`,
  ].join("\r\n");

  // Full RFC 2822 message; the SMTP transport sends it as-is.
  return `${headers}\r\n\r\n${body}`;
}

/**
 * The from-name shown to prospects on the confirmation email, and the display
 * name used in the leasing team's replies.
 */
const PROPERTY_NAME = "Exhibit on Superior";

/**
 * Build the base64url-encoded RFC 2822 message for the prospect confirmation
 * email. Sent to the address the prospect submitted.
 */
function buildProspectConfirmationMessage(lead: LeadNotification): string {
  const fullName = `${lead.firstName} ${lead.lastName}`.trim();
  const { subject, html: htmlBody, text: textBody } =
    renderProspectConfirmation(lead);

  const { contentType, body } = buildMimeBody("confirm", textBody, htmlBody);
  const headers = [
    `To: ${encodeHeader(fullName)} <${sanitizeHeaderValue(lead.email)}>`,
    // Sent as the website's dedicated account, but replies go to the leasing
    // team's shared inbox so prospects always reach a human.
    `From: ${encodeHeader(PROPERTY_NAME)} <${SENDER_EMAIL}>`,
    `Reply-To: ${encodeHeader(PROPERTY_NAME)} <${LEASING_INBOX_EMAIL}>`,
    `Subject: ${encodeHeader(subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: ${contentType}`,
  ].join("\r\n");

  // Full RFC 2822 message; the SMTP transport sends it as-is.
  return `${headers}\r\n\r\n${body}`;
}

/**
 * Send a confirmation email to the prospect who submitted a lead form.
 *
 * This is best-effort: any failure is logged and swallowed so that a mail
 * outage never blocks or fails the underlying lead insert.
 */
export async function sendProspectConfirmation(lead: LeadNotification): Promise<void> {
  // Distributed abuse defense: the per-IP limit on the route can be bypassed by
  // rotating IPs, so cap confirmations per recipient and globally before we send
  // anything to the attacker-supplied address. See emailThrottle for details.
  if (!(await allowProspectConfirmation(lead.email))) {
    return;
  }

  try {
    warnIfUnconfigured();
    await sendRawEmail(
      buildProspectConfirmationMessage(lead),
      sanitizeHeaderValue(lead.email),
    );
    logger.info(
      { leadType: lead.type },
      "Sent prospect confirmation email",
    );
  } catch (err) {
    logger.error({ err }, "Error sending prospect confirmation email");
  }
}

/**
 * Send a notification email to the leasing team about a new lead.
 *
 * This is best-effort: any failure is logged and swallowed so that a mail
 * outage never blocks or fails the underlying lead insert.
 *
 * Returns `true` when the notification was sent successfully and `false`
 * otherwise, so the caller can record whether the leasing team was notified.
 */
/**
 * Recipient for operational stale-seed alerts. Separate from the shared
 * leasing inbox so operational noise goes to the person who can redeploy.
 * Configurable via env without a code change.
 */
const SEED_ALERT_EMAIL =
  process.env.SEED_ALERT_EMAIL ?? "ridler@highlandptrs.com";

/**
 * Alert that the baked availability seed shipped with this instance is past
 * its max age. Throws when the mailer is unconfigured or the send fails, so
 * the caller decides how loudly to log.
 */
export async function sendSeedStaleAlert(opts: {
  seedUpdatedAt: string | null;
  seedAgeHours: number | null;
  maxAgeHours: number;
}): Promise<void> {
  warnIfUnconfigured();
  const { subject, html: htmlBody, text: textBody } = renderSeedStaleAlert(opts);
  const { contentType, body } = buildMimeBody("seedalert", textBody, htmlBody);
  const headers = [
    `From: ${encodeHeader(PROPERTY_NAME)} <${SENDER_EMAIL}>`,
    `To: ${SEED_ALERT_EMAIL}`,
    `Subject: ${encodeHeader(subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: ${contentType}`,
  ].join("\r\n");
  await sendRawEmail(`${headers}\r\n\r\n${body}`, SEED_ALERT_EMAIL);
  logger.info(
    { recipient: SEED_ALERT_EMAIL },
    "Sent stale availability-seed alert email",
  );
}

export async function sendLeadNotification(
  lead: LeadNotification,
): Promise<boolean> {
  try {
    warnIfUnconfigured();
    await sendRawEmail(buildRawMessage(lead), LEASING_INBOX_EMAIL);
    logger.info(
      { leasingInbox: LEASING_INBOX_EMAIL, leadType: lead.type },
      "Sent lead notification email",
    );
    return true;
  } catch (err) {
    logger.error({ err }, "Error sending lead notification email");
    return false;
  }
}
