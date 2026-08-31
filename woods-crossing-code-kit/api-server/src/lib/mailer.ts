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
 * PROPERTY CONFIG: create a dedicated Google Workspace account for the property
 * (e.g. leasing-property@yourdomain.example), generate an app password in
 * Google Account → Security → 2-Step Verification → App passwords, and store
 * it as the GMAIL_APP_PASSWORD Replit Secret.
 * Set GMAIL_SMTP_USER env var to the sending account address.
 */

// Read the sender address from GMAIL_SMTP_USER env var.
// Maps to property-config email.senderAddress.
// There is NO fallback — a missing sender must fail loudly rather than
// silently send as the wrong property's mailbox.
const _SENDER_EMAIL = process.env.GMAIL_SMTP_USER?.trim();
if (!_SENDER_EMAIL) {
  throw new Error(
    "GMAIL_SMTP_USER env var is required but not set. " +
    "Set it to your property's dedicated Gmail sender address " +
    "(email.senderAddress from property-config.json). " +
    "Do not fall back to another property's mailbox.",
  );
}
export const SENDER_EMAIL = _SENDER_EMAIL;

let transporter: nodemailer.Transporter | null = null;
let testSender: ((raw: string, to: string) => Promise<void>) | null = null;
export function setMailTransportForTests(sender: ((raw: string, to: string) => Promise<void>) | null): void {
  testSender = sender;
}

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
  if (testSender) return testSender(raw, to);
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
