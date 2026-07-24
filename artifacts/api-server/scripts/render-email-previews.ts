/**
 * Render sample branded emails to static HTML/TXT files for visual review
 * without submitting a real lead.
 *
 * Usage (from artifacts/api-server):
 *   npx esbuild scripts/render-email-previews.ts --bundle --platform=node --format=esm --outfile=/tmp/render-email-previews.mjs && node /tmp/render-email-previews.mjs
 * (bundling is required because Node's native TS type-stripping cannot
 *  resolve the extensionless imports inside src/lib)
 *
 * Output: artifacts/api-server/email-previews/*.html and *.txt
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  renderLeadNotification,
  renderProspectConfirmation,
} from "../src/lib/emailTemplates";
import {
  EMAIL_LOGO_BASE64,
  EMAIL_LOGO_CONTENT_ID,
  EMAIL_LOGO_MIME,
} from "../src/lib/emailLogo";

/** Browsers can't resolve cid: references, so swap in a data URI for preview. */
function browserPreviewHtml(html: string): string {
  return html.replace(
    `cid:${EMAIL_LOGO_CONTENT_ID}`,
    `data:${EMAIL_LOGO_MIME};base64,${EMAIL_LOGO_BASE64}`,
  );
}

// Relative to the working directory (run from artifacts/api-server) because
// the script executes as a bundle written to /tmp.
const outDir = join(process.cwd(), "email-previews");
mkdirSync(outDir, { recursive: true });

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

const samples = [
  ["confirmation-contact", renderProspectConfirmation(contactLead)],
  ["confirmation-tour", renderProspectConfirmation(tourLead)],
  [
    "confirmation-tour-unit",
    // "Request a Showing" fallback: prospect already named an unlisted unit,
    // so the email skips the book-from-a-listing funnel.
    renderProspectConfirmation({ ...tourLead, unit: "0606" }),
  ],
  ["lead-notification-contact", renderLeadNotification(contactLead)],
  ["lead-notification-tour", renderLeadNotification(tourLead)],
] as const;

for (const [name, rendered] of samples) {
  writeFileSync(join(outDir, `${name}.html`), browserPreviewHtml(rendered.html));
  writeFileSync(
    join(outDir, `${name}.txt`),
    `Subject: ${rendered.subject}\n\n${rendered.text}`,
  );
  console.log(`wrote email-previews/${name}.html (subject: ${rendered.subject})`);
}
