import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import { logger } from "./logger";

/**
 * Gmail SMTP transport for the property website.
 *
 * The site sends as its own Google Workspace account using a Gmail app
 * password, so it does not depend on the Replit Gmail connector.
 *
 * Configuration:
 *   - GMAIL_SMTP_USER      the sending account (env var)
 *   - GMAIL_APP_PASSWORD   16-character Google app password (Replit Secret)
 *
 * WOODS-CROSSING: create a dedicated Google Workspace account for the property
 * (e.g. leasingwoodscrossing@yourdomain.com), generate an app password in
 * Google Account → Security → 2-Step Verification → App passwords, and store
 * it as the GMAIL_APP_PASSWORD Replit Secret.
 * Set GMAIL_SMTP_USER env var to the sending account address.
 */

// WOODS-CROSSING: replace with your property's dedicated sender email address
export const SENDER_EMAIL =
  process.env.GMAIL_SMTP_USER ?? "leasingexhibit@highlandptrs.com"; // WOODS-CROSSING: update default

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
 * whether the failure should be recorded or swallowed.
 */
export async function sendRawEmail(raw: string, to: string): Promise<void> {
  const t = getTransporter();
  if (!t) {
    throw new Error(
      "Email is not configured: GMAIL_APP_PASSWORD secret is missing",
    );
  }
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
