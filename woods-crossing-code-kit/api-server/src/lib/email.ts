import { logger } from "./logger";
import { allowProspectConfirmation } from "./emailThrottle";
import { sendRawEmail, SENDER_EMAIL, warnIfUnconfigured } from "./mailer";
import {
  renderLeadNotification,
  renderProspectConfirmation,
  renderSeedStaleAlert,
  renderGeneralTourConfirmation,
  // PROPERTY CONFIG: import implemented alert renderers from emailTemplates.ts
} from "./emailTemplates";
import {
  EMAIL_LOGO_BASE64,
  EMAIL_LOGO_CONTENT_ID,
  EMAIL_LOGO_MIME,
} from "./emailLogo";

/**
 * The leasing inbox that receives new lead notifications.
 * PROPERTY CONFIG: set LEASING_INBOX_EMAIL to the leasing team inbox.
 */
const LEASING_INBOX_EMAIL =
  process.env.LEASING_INBOX_EMAIL ?? "leasing@example.invalid";

/**
 * Recipient for operational alerts (stale seed, rented-check failures, etc.).
 * PROPERTY CONFIG: set SEED_ALERT_EMAIL to the approved operations inbox.
 */
const SEED_ALERT_EMAIL =
  process.env.SEED_ALERT_EMAIL ?? "ops@example.invalid";

/**
 * The from-name shown on all emails from this property.
 * Set via PROPERTY_NAME env var (property-config property.name).
 */
const _PROPERTY_NAME = process.env.PROPERTY_NAME?.trim();
if (!_PROPERTY_NAME) {
  throw new Error(
    "PROPERTY_NAME env var is required but not set. " +
    "Set it to your property's display name (property.name from property-config.json).",
  );
}
const PROPERTY_NAME = _PROPERTY_NAME;

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
  unit?: string | null;
  source?: string | null;
}

/**
 * Strip carriage-return and line-feed characters from any string that will be
 * interpolated into an RFC 2822 header field. Prevents header-injection attacks.
 */
function sanitizeHeaderValue(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\r\n\x00]/g, "");
}

/** RFC 2047 encode a header value so unicode names/subjects survive transit. */
function encodeHeader(value: string): string {
  const safe = sanitizeHeaderValue(value);
  if (/^[\x20-\x7E]*$/.test(safe)) return safe;
  return `=?UTF-8?B?${Buffer.from(safe, "utf-8").toString("base64")}?=`;
}

/**
 * Assemble the MIME body shared by every branded email:
 * multipart/related wrapping (a) a multipart/alternative text+HTML pair and
 * (b) the property wordmark PNG attached inline via Content-ID.
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
    `Content-Type: ${EMAIL_LOGO_MIME}; name="property-logo.png"`,
    "Content-Transfer-Encoding: base64",
    `Content-ID: <${EMAIL_LOGO_CONTENT_ID}>`,
    `Content-Disposition: inline; filename="property-logo.png"`,
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
    `Reply-To: ${encodeHeader(fullName)} <${sanitizeHeaderValue(lead.email)}>`,
    `Subject: ${encodeHeader(subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: ${contentType}`,
  ].join("\r\n");
  return `${headers}\r\n\r\n${body}`;
}

function buildProspectConfirmationMessage(lead: LeadNotification): string {
  const fullName = `${lead.firstName} ${lead.lastName}`.trim();
  const { subject, html: htmlBody, text: textBody } = renderProspectConfirmation(lead);
  const { contentType, body } = buildMimeBody("confirm", textBody, htmlBody);
  const headers = [
    `To: ${encodeHeader(fullName)} <${sanitizeHeaderValue(lead.email)}>`,
    `From: ${encodeHeader(PROPERTY_NAME)} <${SENDER_EMAIL}>`,
    `Reply-To: ${encodeHeader(PROPERTY_NAME)} <${LEASING_INBOX_EMAIL}>`,
    `Subject: ${encodeHeader(subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: ${contentType}`,
  ].join("\r\n");
  return `${headers}\r\n\r\n${body}`;
}

export async function sendProspectConfirmation(lead: LeadNotification): Promise<void> {
  if (!(await allowProspectConfirmation(lead.email))) return;
  try {
    warnIfUnconfigured();
    await sendRawEmail(buildProspectConfirmationMessage(lead), sanitizeHeaderValue(lead.email));
    logger.info({ leadType: lead.type }, "Sent prospect confirmation email");
  } catch (err) {
    logger.error({ err }, "Error sending prospect confirmation email");
  }
}

export async function sendGeneralTourConfirmation(opts: {
  firstName: string;
  lastName: string;
  email: string;
  slotTime: string;
}): Promise<void> {
  if (!(await allowProspectConfirmation(opts.email))) return;
  try {
    warnIfUnconfigured();
    const fullName = `${opts.firstName} ${opts.lastName}`.trim();
    const { subject, html: htmlBody, text: textBody } = renderGeneralTourConfirmation(opts);
    const { contentType, body } = buildMimeBody("tourconfirm", textBody, htmlBody);
    const headers = [
      `To: ${encodeHeader(fullName)} <${sanitizeHeaderValue(opts.email)}>`,
      `From: ${encodeHeader(PROPERTY_NAME)} <${SENDER_EMAIL}>`,
      `Reply-To: ${encodeHeader(PROPERTY_NAME)} <${LEASING_INBOX_EMAIL}>`,
      `Subject: ${encodeHeader(subject)}`,
      "MIME-Version: 1.0",
      `Content-Type: ${contentType}`,
    ].join("\r\n");
    await sendRawEmail(`${headers}\r\n\r\n${body}`, sanitizeHeaderValue(opts.email));
    logger.info({ slotTime: opts.slotTime }, "Sent general-tour booking confirmation email");
  } catch (err) {
    logger.error({ err }, "Error sending general-tour booking confirmation email");
  }
}

/**
 * Send a notification email to the leasing team about a new lead.
 * Returns true when the notification was sent successfully.
 */
export async function sendLeadNotification(lead: LeadNotification): Promise<boolean> {
  try {
    warnIfUnconfigured();
    await sendRawEmail(buildRawMessage(lead), LEASING_INBOX_EMAIL);
    logger.info({ leadType: lead.type }, "Sent leasing-team lead notification email");
    return true;
  } catch (err) {
    logger.error({ err }, "Error sending lead notification email");
    return false;
  }
}

function buildAlertMessage(
  boundaryPrefix: string,
  subject: string,
  htmlBody: string,
  textBody: string,
  to: string,
): string {
  const { contentType, body } = buildMimeBody(boundaryPrefix, textBody, htmlBody);
  const headers = [
    `From: ${encodeHeader(PROPERTY_NAME)} <${SENDER_EMAIL}>`,
    `To: ${to}`,
    `Subject: ${encodeHeader(subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: ${contentType}`,
  ].join("\r\n");
  return `${headers}\r\n\r\n${body}`;
}

export async function sendSeedStaleAlert(opts: {
  seedUpdatedAt: string | null;
  seedAgeHours: number | null;
  maxAgeHours: number;
}): Promise<void> {
  warnIfUnconfigured();
  const { subject, html: htmlBody, text: textBody } = renderSeedStaleAlert(opts);
  await sendRawEmail(buildAlertMessage("seedalert", subject, htmlBody, textBody, SEED_ALERT_EMAIL), SEED_ALERT_EMAIL);
  logger.info({ recipient: SEED_ALERT_EMAIL }, "Sent stale availability-seed alert email");
}

async function sendWatchdogAlert(kind: string, values: unknown[]): Promise<void> {
  warnIfUnconfigured();
  const label = kind;
  const subject = `${PROPERTY_NAME}: ${label}`;
  const detail = values.map((value) => {
    try { return JSON.stringify(value); } catch { return String(value); }
  }).join("\n");
  const text = `${label}\n\n${detail || "The watchdog reported a failure."}`;
  const html = `<h1>${label}</h1><pre>${detail.replace(/[&<>]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]!))}</pre>`;
  await sendRawEmail(buildAlertMessage("watchdog", subject, html, text, SEED_ALERT_EMAIL), SEED_ALERT_EMAIL);
  logger.info({ recipient: SEED_ALERT_EMAIL, kind }, "Sent watchdog alert email");
}
export const sendApexRedirectAlert = (...v: unknown[]) => sendWatchdogAlert("Apex redirect alert", v);
export const sendApplyLinkAlert = (...v: unknown[]) => sendWatchdogAlert("Apply link alert", v);
export const sendAcceptedSilenceAlert = (...v: unknown[]) => sendWatchdogAlert("Accepted lead silence alert", v);
export const sendAcceptedSpikeAlert = (...v: unknown[]) => sendWatchdogAlert("Accepted lead spike alert", v);
export const sendBotGuardAlert = (...v: unknown[]) => sendWatchdogAlert("Bot guard alert", v);
export const sendFeeCopyAlert = (...v: unknown[]) => sendWatchdogAlert("Fee copy alert", v);
export const sendFloorPlanCheckAlert = (...v: unknown[]) => sendWatchdogAlert("Floor plan alert", v);
export const sendGa4DataCheckAlert = (...v: unknown[]) => sendWatchdogAlert("GA4 data alert", v);
export const sendGtmCheckAlert = (...v: unknown[]) => sendWatchdogAlert("GTM alert", v);
export const sendGuestCardFailureAlert = (...v: unknown[]) => sendWatchdogAlert("Guest card failure alert", v);
export const sendKnowledgeCheckAlert = (...v: unknown[]) => sendWatchdogAlert("Knowledge alert", v);
export const sendRedirectCheckAlert = (...v: unknown[]) => sendWatchdogAlert("Redirect alert", v);
export const sendRentedCheckAlert = (...v: unknown[]) => sendWatchdogAlert("Rented unit alert", v);
export const sendSeoWeeklyDigest = (...v: unknown[]) => sendWatchdogAlert("SEO weekly digest", v);
export const sendSeoDigestFailureAlert = (...v: unknown[]) => sendWatchdogAlert("SEO digest failure alert", v);
export const sendShowingSchedulerAlert = (...v: unknown[]) => sendWatchdogAlert("Showing scheduler alert", v);
