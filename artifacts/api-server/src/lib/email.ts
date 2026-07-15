import { ReplitConnectors } from "@replit/connectors-sdk";
import { logger } from "./logger";

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
}

function leadTypeLabel(type: string): string {
  switch (type) {
    case "contact":
      return "Contact form";
    case "tour":
      return "Schedule a tour";
    default:
      return type;
  }
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildRawMessage(lead: LeadNotification): string {
  const fullName = `${lead.firstName} ${lead.lastName}`.trim();
  const typeLabel = leadTypeLabel(lead.type);
  const subject = `New ${typeLabel.toLowerCase()} lead: ${fullName}`;

  const rows: Array<[string, string | null]> = [
    ["Type", typeLabel],
    ["Name", fullName],
    ["Email", lead.email],
    ["Phone", lead.phone],
    ["Preferred date", lead.preferredDate],
    ["Message", lead.message],
    ["Submitted", lead.createdAt.toISOString()],
  ];

  const textBody = rows
    .map(([label, value]) => `${label}: ${value ?? "—"}`)
    .join("\n");

  const htmlRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 12px 4px 0;font-weight:600;vertical-align:top;">${escapeHtml(
          label,
        )}</td><td style="padding:4px 0;">${escapeHtml(value ?? "—")}</td></tr>`,
    )
    .join("");
  const htmlBody = `<div style="font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;"><h2 style="margin:0 0 12px;">New ${escapeHtml(
    typeLabel.toLowerCase(),
  )} lead</h2><table style="border-collapse:collapse;font-size:14px;">${htmlRows}</table></div>`;

  const boundary = `lead_boundary_${Date.now().toString(36)}`;
  const headers = [
    `To: ${LEASING_INBOX_EMAIL}`,
    // Let the leasing team reply straight back to the prospect.
    `Reply-To: ${encodeHeader(fullName)} <${lead.email}>`,
    `Subject: ${encodeHeader(subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ].join("\r\n");

  const body = [
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(textBody, "utf-8").toString("base64"),
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(htmlBody, "utf-8").toString("base64"),
    `--${boundary}--`,
    "",
  ].join("\r\n");

  const raw = `${headers}\r\n\r\n${body}`;
  // Gmail expects a base64url-encoded RFC 2822 message.
  return Buffer.from(raw, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * The from-name shown to prospects on the confirmation email, and the display
 * name used in the leasing team's replies.
 */
const PROPERTY_NAME = "Exhibit on Superior";

/**
 * Build the subject and body copy for the prospect confirmation email,
 * tailored to the kind of form the prospect submitted.
 */
function buildProspectConfirmationCopy(lead: LeadNotification): {
  subject: string;
  intro: string;
} {
  if (lead.type === "tour") {
    const when = lead.preferredDate?.trim();
    const datePhrase = when ? `for ${when}` : "";
    return {
      subject: "We received your tour request",
      intro: `Your tour request${
        datePhrase ? ` ${datePhrase}` : ""
      } was received — we'll confirm your time soon.`,
    };
  }

  return {
    subject: "Thanks for reaching out",
    intro: "Thanks for reaching out — we'll be in touch within one business day.",
  };
}

/**
 * Build the base64url-encoded RFC 2822 message for the prospect confirmation
 * email. Sent to the address the prospect submitted.
 */
function buildProspectConfirmationMessage(lead: LeadNotification): string {
  const fullName = `${lead.firstName} ${lead.lastName}`.trim();
  const { subject, intro } = buildProspectConfirmationCopy(lead);

  const greeting = lead.firstName.trim() ? `Hi ${lead.firstName.trim()},` : "Hi,";
  const signoff = `— The ${PROPERTY_NAME} team`;

  const textBody = [greeting, "", intro, "", signoff].join("\n");
  const htmlBody = `<div style="font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;font-size:14px;line-height:1.5;"><p style="margin:0 0 12px;">${escapeHtml(
    greeting,
  )}</p><p style="margin:0 0 12px;">${escapeHtml(
    intro,
  )}</p><p style="margin:0;">${escapeHtml(signoff)}</p></div>`;

  const boundary = `confirm_boundary_${Date.now().toString(36)}`;
  const headers = [
    `To: ${encodeHeader(fullName)} <${sanitizeHeaderValue(lead.email)}>`,
    `From: ${encodeHeader(PROPERTY_NAME)} <${LEASING_INBOX_EMAIL}>`,
    `Reply-To: ${encodeHeader(PROPERTY_NAME)} <${LEASING_INBOX_EMAIL}>`,
    `Subject: ${encodeHeader(subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ].join("\r\n");

  const body = [
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(textBody, "utf-8").toString("base64"),
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(htmlBody, "utf-8").toString("base64"),
    `--${boundary}--`,
    "",
  ].join("\r\n");

  const raw = `${headers}\r\n\r\n${body}`;
  return Buffer.from(raw, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Send a confirmation email to the prospect who submitted a lead form.
 *
 * This is best-effort: any failure is logged and swallowed so that a mail
 * outage never blocks or fails the underlying lead insert.
 */
export async function sendProspectConfirmation(lead: LeadNotification): Promise<void> {
  try {
    const connectors = new ReplitConnectors();
    const raw = buildProspectConfirmationMessage(lead);
    const response = await connectors.proxy(
      "google-mail",
      "/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw }),
      },
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      logger.error(
        { status: response.status, detail: detail.slice(0, 500) },
        "Failed to send prospect confirmation email",
      );
      return;
    }

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
export async function sendLeadNotification(
  lead: LeadNotification,
): Promise<boolean> {
  try {
    const connectors = new ReplitConnectors();
    const raw = buildRawMessage(lead);
    const response = await connectors.proxy(
      "google-mail",
      "/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw }),
      },
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      logger.error(
        { status: response.status, detail: detail.slice(0, 500) },
        "Failed to send lead notification email",
      );
      return false;
    }

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
