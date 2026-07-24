/**
 * Send all branded email samples to a test address for dark-mode review.
 *
 * Usage (from artifacts/api-server):
 *   npx esbuild scripts/send-test-emails.ts --bundle --platform=node --format=esm \
 *     --outfile=/tmp/send-test-emails.mjs && node /tmp/send-test-emails.mjs
 *
 * Reads GMAIL_APP_PASSWORD from the environment (Replit Secret).
 * All five variants are sent to TEST_EMAIL (overridable via env).
 */
import nodemailer from "nodemailer";
import {
  renderLeadNotification,
  renderProspectConfirmation,
  BRAND,
} from "../src/lib/emailTemplates";
import {
  EMAIL_LOGO_BASE64,
  EMAIL_LOGO_CONTENT_ID,
  EMAIL_LOGO_MIME,
} from "../src/lib/emailLogo";

const SENDER_EMAIL = process.env.GMAIL_SMTP_USER ?? "leasingexhibit@highlandptrs.com";
const TEST_EMAIL = process.env.TEST_EMAIL ?? "ridler@highlandptrs.com";

const pass = process.env.GMAIL_APP_PASSWORD;
if (!pass) {
  console.error("GMAIL_APP_PASSWORD secret is not set — aborting.");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: { user: SENDER_EMAIL, pass },
});

function sanitize(v: string): string {
  // eslint-disable-next-line no-control-regex
  return v.replace(/[\r\n\x00]/g, "");
}

function encodeHeader(v: string): string {
  const safe = sanitize(v);
  if (/^[\x20-\x7E]*$/.test(safe)) return safe;
  return `=?UTF-8?B?${Buffer.from(safe, "utf-8").toString("base64")}?=`;
}

function buildMimeBody(prefix: string, text: string, html: string): { contentType: string; body: string } {
  const stamp = Date.now().toString(36);
  const related = `${prefix}_rel_${stamp}`;
  const alternative = `${prefix}_alt_${stamp}`;
  const body = [
    `--${related}`,
    `Content-Type: multipart/alternative; boundary="${alternative}"`,
    "",
    `--${alternative}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(text, "utf-8").toString("base64"),
    `--${alternative}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(html, "utf-8").toString("base64"),
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
  return { contentType: `multipart/related; boundary="${related}"; type="multipart/alternative"`, body };
}

async function send(label: string, subject: string, html: string, text: string, from: string, to: string) {
  const { contentType, body } = buildMimeBody("test", text, html);
  const headers = [
    `From: ${encodeHeader(BRAND.propertyName)} <${SENDER_EMAIL}>`,
    `To: ${to}`,
    `Subject: ${encodeHeader(`[TEST: ${label}] ${subject}`)}`,
    "MIME-Version: 1.0",
    `Content-Type: ${contentType}`,
  ].join("\r\n");
  const raw = `${headers}\r\n\r\n${body}`;
  await transporter.sendMail({ raw, envelope: { from: SENDER_EMAIL, to: [to] } });
  console.log(`✓ sent [${label}] → ${to}`);
}

const contactLead = {
  type: "contact",
  firstName: "Maya",
  lastName: "Rodriguez",
  email: "maya.rodriguez@example.com",
  phone: "312-555-0187",
  message: "Hi — I'm interested in a 1-bedroom with a balcony for a September move-in.",
  preferredDate: null,
  createdAt: new Date("2026-07-24T15:30:00Z"),
};

const tourLead = {
  type: "tour",
  firstName: "Daniel",
  lastName: "O'Brien",
  email: "daniel.obrien@example.com",
  phone: "773-555-0142",
  message: "Would love to see the penthouse-level 2-bedrooms.",
  preferredDate: "Saturday, August 1 at 11:00 AM",
  createdAt: new Date("2026-07-24T16:05:00Z"),
};

const samples: Array<{ label: string; rendered: { subject: string; html: string; text: string } }> = [
  { label: "1/5 Prospect: contact confirmation", rendered: renderProspectConfirmation(contactLead) },
  { label: "2/5 Prospect: tour confirmation (with date)", rendered: renderProspectConfirmation(tourLead) },
  { label: "3/5 Prospect: tour confirmation (specific unit 0606)", rendered: renderProspectConfirmation({ ...tourLead, unit: "0606" }) },
  { label: "4/5 Leasing: lead notification (contact)", rendered: renderLeadNotification(contactLead) },
  { label: "5/5 Leasing: lead notification (tour)", rendered: renderLeadNotification(tourLead) },
];

(async () => {
  console.log(`Sending ${samples.length} test emails to ${TEST_EMAIL} …\n`);
  for (const { label, rendered } of samples) {
    await send(label, rendered.subject, rendered.html, rendered.text, SENDER_EMAIL, TEST_EMAIL);
    // Brief pause so Gmail doesn't rate-limit
    await new Promise(r => setTimeout(r, 800));
  }
  console.log("\nAll done. Check your inbox (and spam folder) in Gmail and Apple Mail.");
})();
