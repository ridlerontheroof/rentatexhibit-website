import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import { logger } from "./logger";

/**
 * Dedicated Gmail SMTP transport for the Exhibit website.
 *
 * The site sends as its own Google Workspace account (leasingexhibit@) using a
 * Gmail app password, so it does not depend on the Replit Gmail connector
 * (which is a single shared credential tied to another app's account).
 *
 * Configuration:
 *   - GMAIL_SMTP_USER      the sending account (defaults to the property's
 *                          dedicated sender address)
 *   - GMAIL_APP_PASSWORD   16-character Google app password (Replit Secret)
 */
export const SENDER_EMAIL =
  process.env.GMAIL_SMTP_USER ?? "leasingexhibit@highlandptrs.com";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!pass) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: SENDER_EMAIL, pass },
    });
  }
  return transporter;
}

/** True when SMTP credentials are configured and sending is possible. */
export function mailerConfigured(): boolean {
  return Boolean(process.env.GMAIL_APP_PASSWORD);
}

/**
 * Send a fully-built RFC 2822 message (headers + body) as the sender account.
 * The message must already include To/Subject/etc; the SMTP envelope sender is
 * always the authenticated account. Throws on failure so callers can decide
 * whether the failure should be recorded (lead-notification retry) or
 * swallowed (best-effort confirmations).
 */
export async function sendRawEmail(raw: string, to: string): Promise<void> {
  const t = getTransporter();
  if (!t) {
    throw new Error(
      "Email is not configured: GMAIL_APP_PASSWORD secret is missing",
    );
  }
  // With `raw`, nodemailer does not parse recipients out of the headers — the
  // SMTP envelope must be provided explicitly.
  const options: Mail.Options = {
    raw,
    envelope: { from: SENDER_EMAIL, to: [to] },
  };
  await t.sendMail(options);
}

/** Log-once helper so a missing credential is loud but not spammy. */
let warnedUnconfigured = false;
export function warnIfUnconfigured(): void {
  if (!mailerConfigured() && !warnedUnconfigured) {
    warnedUnconfigured = true;
    logger.warn(
      "GMAIL_APP_PASSWORD is not set — outgoing email is disabled until the secret is provided",
    );
  }
}
