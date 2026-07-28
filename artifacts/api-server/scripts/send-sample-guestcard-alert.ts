/**
 * One-off: send a SAMPLE of the guest-card rejection alert email so a human
 * can review the template. Usage: tsx scripts/send-sample-guestcard-alert.ts <recipient>
 */
import { renderGuestCardFailureAlert } from "../src/lib/emailTemplates";
import { sendRawEmail, SENDER_EMAIL } from "../src/lib/mailer";

const to = process.argv[2];
if (!to) throw new Error("recipient required");

const { subject, html, text } = renderGuestCardFailureAlert({
  name: "Sample Prospect",
  email: "sample.prospect@example.com",
  phone: "(216) 555-0123",
  unit: "0606",
  source: "Website (GoogleAds-SpringPromo)",
  detail: "AppFolio returned HTTP 422 (empty body) — creation-time validation failure",
});

const boundary = "----sample-guestcard-boundary";
const body = [
  `--${boundary}`,
  'Content-Type: text/plain; charset="UTF-8"',
  "Content-Transfer-Encoding: 8bit",
  "",
  text,
  `--${boundary}`,
  'Content-Type: text/html; charset="UTF-8"',
  "Content-Transfer-Encoding: 8bit",
  "",
  html,
  `--${boundary}--`,
  "",
].join("\r\n");

const headers = [
  `From: Exhibit on Superior <${SENDER_EMAIL}>`,
  `To: ${to}`,
  `Subject: [SAMPLE] ${subject}`,
  "MIME-Version: 1.0",
  `Content-Type: multipart/alternative; boundary="${boundary}"`,
].join("\r\n");

await sendRawEmail(`${headers}\r\n\r\n${body}`, to);
console.log(`Sample guest-card alert sent to ${to}`);
