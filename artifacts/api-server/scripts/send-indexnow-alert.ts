/**
 * CLI wrapper used by the website's post-publish IndexNow submitter: emails
 * the operational recipient when a submission attempt failed (sitemap fetch
 * error, endpoint rejection, network failure). Reuses the site's existing
 * Gmail SMTP mailer so IndexNow alerts follow the same path as every other
 * operational alert.
 *
 * Usage (from artifacts/api-server, via package script):
 *   pnpm run send:indexnow-alert -- /path/to/alert.json
 *
 * The JSON file must contain: { subject: string, lines: string[] }
 *
 * Exits non-zero when the mailer is unconfigured or the send fails so the
 * caller can log that the alert itself did not go out. This alert is purely
 * informational — the publish has already succeeded regardless.
 */
import { readFileSync } from "node:fs";
import { sendRawEmail, SENDER_EMAIL, warnIfUnconfigured } from "../src/lib/mailer";

// Operational recipient — same default + env override as the other
// operational alerts (stale seed, knowledge check, redirect check).
const ALERT_EMAIL = process.env.SEED_ALERT_EMAIL ?? "ridler@highlandptrs.com";

const file = process.argv[2];
if (!file) {
  console.error("Usage: send-indexnow-alert <alert.json>");
  process.exit(2);
}

const raw = JSON.parse(readFileSync(file, "utf8")) as {
  subject?: unknown;
  lines?: unknown;
};
if (typeof raw.subject !== "string" || raw.subject === "" || !Array.isArray(raw.lines)) {
  console.error(`send-indexnow-alert: ${file} must contain { subject, lines[] }`);
  process.exit(2);
}

warnIfUnconfigured();

const body = (raw.lines as unknown[]).map((l) => String(l)).join("\r\n");
const headers = [
  `From: Exhibit on Superior <${SENDER_EMAIL}>`,
  `To: ${ALERT_EMAIL}`,
  `Subject: ${raw.subject}`,
  "MIME-Version: 1.0",
  'Content-Type: text/plain; charset="UTF-8"',
].join("\r\n");

sendRawEmail(`${headers}\r\n\r\n${body}`, ALERT_EMAIL)
  .then(() => {
    console.log(`IndexNow failure alert sent to ${ALERT_EMAIL}`);
  })
  .catch((err) => {
    console.error("send-indexnow-alert: send failed:", err?.message ?? err);
    process.exit(1);
  });
