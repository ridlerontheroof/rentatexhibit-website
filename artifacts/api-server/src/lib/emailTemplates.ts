/**
 * Branded HTML + plain-text email templates for Exhibit on Superior.
 *
 * Design system extracted from the website:
 *   - Gold accent  #b39a5f on near-black #121212, warm off-white content.
 *   - Barlow Semi Condensed typography intent → email-safe condensed stack.
 *   - Uppercase, letter-spaced headings; polished but approachable tone.
 *
 * Email-client constraints honored throughout:
 *   - Table-based layout, all styles inline, no external CSS or web fonts.
 *   - Solid bgcolor attributes + inline colors so dark mode can't invert
 *     text into invisibility (Gmail/Outlook dark mode keeps explicit colors
 *     readable; the dark header stays dark, the light card stays light).
 *   - Logo is hosted on the production site with an absolute URL and a
 *     styled alt text so blocked images still show the wordmark.
 *   - Every template has a plain-text counterpart (multipart/alternative is
 *     assembled by the caller in email.ts).
 */

import type { LeadNotification } from "./email";
import { EMAIL_LOGO_CONTENT_ID } from "./emailLogo";

// ---------------------------------------------------------------------------
// Brand tokens
// ---------------------------------------------------------------------------

export const BRAND = {
  gold: "#b39a5f",
  nearBlack: "#121212",
  charcoal: "#1e1e1e",
  paper: "#faf8f4",
  card: "#ffffff",
  ink: "#26241f",
  inkSoft: "#5d584e",
  rule: "#e6e0d3",
  /** Condensed email-safe stack approximating Barlow Semi Condensed. */
  font: "'Barlow Semi Condensed','Arial Narrow',Arial,Helvetica,sans-serif",
  siteUrl: "https://www.rentatexhibit.com",
  /**
   * White wordmark referenced by Content-ID; the PNG itself is attached
   * inline by email.ts (multipart/related), so the header logo renders
   * without any external hosting or image download.
   */
  logoUrl: `cid:${EMAIL_LOGO_CONTENT_ID}`,
  propertyName: "Exhibit on Superior",
  phone: "312-450-0635",
  email: "exhibit@highlandptrs.com",
  address: "165 W Superior St, Chicago, IL 60654",
} as const;

const LINKS = {
  floorPlans: `${BRAND.siteUrl}/available-units`,
  availability: `${BRAND.siteUrl}/available-units`,
  tour: `${BRAND.siteUrl}/schedule-a-tour`,
  contact: `${BRAND.siteUrl}/contact-us`,
} as const;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------------------------------------------------------------------------
// Shared layout pieces
// ---------------------------------------------------------------------------

function headingStyle(size: number, color: string): string {
  return `margin:0;font-family:${BRAND.font};font-size:${size}px;line-height:1.3;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:${color};`;
}

const BODY_TEXT = `margin:0 0 16px;font-family:${BRAND.font};font-size:16px;line-height:1.6;color:${BRAND.ink};`;

function goldButton(href: string, label: string): string {
  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 4px;"><tr>` +
    `<td bgcolor="${BRAND.gold}" style="border-radius:2px;">` +
    `<a href="${href}" style="display:inline-block;padding:13px 30px;font-family:${BRAND.font};font-size:14px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#121212;text-decoration:none;">${label}</a>` +
    `</td></tr></table>`
  );
}

function textLink(href: string, label: string): string {
  return `<a href="${href}" style="color:${BRAND.gold};text-decoration:underline;">${label}</a>`;
}

/**
 * Wrap rendered content in the shared branded shell: dark wordmark header,
 * white content card, contact + address footer.
 */
export function renderEmailShell(opts: {
  /** Hidden inbox preview snippet. */
  preheader: string;
  /** Small gold kicker line above the heading. */
  kicker: string;
  /** Uppercase heading of the content card. */
  heading: string;
  /** Inner HTML of the content card (already-escaped/trusted markup). */
  bodyHtml: string;
}): string {
  const { preheader, kicker, heading, bodyHtml } = opts;
  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(BRAND.propertyName)}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.paper};" bgcolor="${BRAND.paper}">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${BRAND.paper}" style="background-color:${BRAND.paper};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;">

<!-- Header: wordmark on near-black -->
<tr><td bgcolor="${BRAND.nearBlack}" align="center" style="background-color:${BRAND.nearBlack};padding:28px 24px;border-top:3px solid ${BRAND.gold};">
<a href="${BRAND.siteUrl}" style="text-decoration:none;">
<img src="${BRAND.logoUrl}" width="220" height="56" alt="EXHIBIT ON SUPERIOR" style="display:block;border:0;width:220px;height:auto;font-family:${BRAND.font};font-size:20px;letter-spacing:6px;color:#ffffff;">
</a>
</td></tr>

<!-- Content card -->
<tr><td bgcolor="${BRAND.card}" style="background-color:${BRAND.card};padding:36px 36px 28px;">
<p style="margin:0 0 6px;font-family:${BRAND.font};font-size:12px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:${BRAND.gold};">${escapeHtml(kicker)}</p>
<h1 style="${headingStyle(22, BRAND.ink)}margin-bottom:18px;">${escapeHtml(heading)}</h1>
${bodyHtml}
</td></tr>

<!-- Contact block -->
<tr><td bgcolor="${BRAND.card}" style="background-color:${BRAND.card};padding:0 36px 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="border-top:1px solid ${BRAND.rule};padding-top:20px;">
<p style="margin:0 0 8px;font-family:${BRAND.font};font-size:12px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:${BRAND.inkSoft};">The Leasing Team</p>
<p style="margin:0;font-family:${BRAND.font};font-size:15px;line-height:1.7;color:${BRAND.ink};">
${textLink(`tel:${BRAND.phone}`, BRAND.phone)}<br>
${textLink(`mailto:${BRAND.email}`, BRAND.email)}<br>
${escapeHtml(BRAND.address)}
</p>
</td></tr></table>
</td></tr>

<!-- Footer on near-black -->
<tr><td bgcolor="${BRAND.nearBlack}" align="center" style="background-color:${BRAND.nearBlack};padding:22px 24px;">
<p style="margin:0 0 6px;font-family:${BRAND.font};font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.gold};">${escapeHtml(BRAND.propertyName)}</p>
<p style="margin:0 0 6px;font-family:${BRAND.font};font-size:12px;line-height:1.6;color:#b9b3a6;">${escapeHtml(BRAND.address)}</p>
<p style="margin:0;font-family:${BRAND.font};font-size:12px;line-height:1.6;color:#8d8779;"><a href="${BRAND.siteUrl}" style="color:#b9b3a6;text-decoration:underline;">rentatexhibit.com</a></p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

/** Shared plain-text footer for every email. */
const TEXT_FOOTER = [
  "—",
  `${BRAND.propertyName} Leasing Team`,
  BRAND.phone,
  BRAND.email,
  BRAND.address,
  BRAND.siteUrl,
].join("\n");

// ---------------------------------------------------------------------------
// Prospect confirmation (contact + tour)
// ---------------------------------------------------------------------------

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

function firstNameOf(lead: LeadNotification): string {
  return lead.firstName.trim();
}

export function renderProspectConfirmation(lead: LeadNotification): RenderedEmail {
  const name = firstNameOf(lead);
  const greeting = name ? `Hi ${name},` : "Hello,";
  const isTour = lead.type === "tour";
  const when = lead.preferredDate?.trim() || null;

  if (isTour) {
    const unit = lead.unit?.trim() || null;
    const subject = when
      ? `Your tour request for ${when}`
      : "Your tour request at Exhibit on Superior";
    const preheader = when
      ? `We received your tour request for ${when} — the leasing team will confirm your time shortly.`
      : "We received your tour request — the leasing team will confirm your time shortly.";

    const bodyHtml =
      `<p style="${BODY_TEXT}">${escapeHtml(greeting)}</p>` +
      `<p style="${BODY_TEXT}">Thanks for requesting a tour of Exhibit on Superior. ${
        unit
          ? `We have your request for <strong style="color:${BRAND.ink};">Apartment ${escapeHtml(unit)}</strong>${
              when
                ? ` &mdash; <strong style="color:${BRAND.ink};">${escapeHtml(when)}</strong>`
                : ""
            }.</p><p style="${BODY_TEXT}">A member of our leasing team will reach out within one business day to confirm your showing time.`
          : `${
              when
                ? `We have your request for <strong style="color:${BRAND.ink};">${escapeHtml(when)}</strong>.`
                : "We have your request."
            }</p><p style="${BODY_TEXT}"><strong style="color:${BRAND.ink};">One step left to lock it in:</strong> pick the residence you&rsquo;d like to see and choose your time right from its listing. The time you book there goes straight onto our calendar &mdash; attached to that exact home &mdash; and becomes your confirmed tour.`
      }</p>` +
      (unit
        ? ""
        : goldButton(LINKS.availability, "Pick Your Unit &amp; Confirm Your Tour") +
          `<p style="margin:16px 0 16px;font-family:${BRAND.font};font-size:15px;line-height:1.8;color:${BRAND.inkSoft};">Rather not choose? Sit tight &mdash; a member of our leasing team will reach out within one business day to confirm your time.</p>`) +
      `<p style="${BODY_TEXT}">What to expect: your tour takes about 15 minutes and covers the residences you&rsquo;re interested in and the full amenity floor. Have questions ready &mdash; we like them.</p>` +
      `<p style="margin:16px 0 0;font-family:${BRAND.font};font-size:15px;line-height:1.8;color:${BRAND.inkSoft};">Before your visit: ${textLink(LINKS.floorPlans, "browse floor plans")} or ${textLink(`${BRAND.siteUrl}/virtual-tour`, "preview homes on a virtual tour")}.</p>`;

    const text = [
      greeting,
      "",
      `Thanks for requesting a tour of Exhibit on Superior.${
        unit
          ? ` We have your request for Apartment ${unit}${when ? ` — ${when}` : ""}.`
          : when
            ? ` We have your request for ${when}.`
            : " We have your request."
      }`,
      "",
      ...(unit
        ? [
            "A member of our leasing team will reach out within one business day to confirm your showing time.",
            "",
          ]
        : [
            "One step left to lock it in: pick the residence you'd like to see and choose your time right from its listing. The time you book there goes straight onto our calendar — attached to that exact home — and becomes your confirmed tour.",
            "",
            `Pick your unit & confirm your tour: ${LINKS.availability}`,
            "",
            "Rather not choose? Sit tight — a member of our leasing team will reach out within one business day to confirm your time.",
            "",
          ]),
      "What to expect: your tour takes about 15 minutes and covers the residences you're interested in and the full amenity floor.",
      "",
      `Before your visit — floor plans: ${LINKS.floorPlans} · virtual tours: ${BRAND.siteUrl}/virtual-tour`,
      "",
      TEXT_FOOTER,
    ].join("\n");

    return {
      subject,
      html: renderEmailShell({
        preheader,
        kicker: "Tour Request Received",
        heading: "We'll see you soon",
        bodyHtml,
      }),
      text,
    };
  }

  // Contact form confirmation
  const subject = "We received your message";
  const preheader =
    "Thanks for reaching out to Exhibit on Superior — we'll be in touch within one business day.";

  // Conversion funnel: one primary CTA into Available Units, where each
  // listing's own tour button routes the prospect straight into the leasing
  // system (PMS/CRM) already attached to a specific residence.
  const bodyHtml =
    `<p style="${BODY_TEXT}">${escapeHtml(greeting)}</p>` +
    `<p style="${BODY_TEXT}">Thanks for reaching out to Exhibit on Superior. Your message is with our leasing team, and we&rsquo;ll be in touch within one business day.</p>` +
    `<p style="${BODY_TEXT}">Don&rsquo;t want to wait? Every available residence is listed with live pricing, photos, and move-in dates &mdash; find the one that fits and schedule your tour right from its listing. It&rsquo;s the fastest way to lock in a time.</p>` +
    goldButton(LINKS.availability, "Browse Units &amp; Book a Tour") +
    `<p style="margin:16px 0 0;font-family:${BRAND.font};font-size:15px;line-height:1.8;color:${BRAND.inkSoft};">While you&rsquo;re there: ${textLink(`${BRAND.siteUrl}/amenities`, "explore the amenity floor")} or ${textLink(`${BRAND.siteUrl}/virtual-tour`, "preview homes on a virtual tour")}.</p>`;

  const text = [
    greeting,
    "",
    "Thanks for reaching out to Exhibit on Superior. Your message is with our leasing team, and we'll be in touch within one business day.",
    "",
    "Don't want to wait? Every available residence is listed with live pricing, photos, and move-in dates — find the one that fits and schedule your tour right from its listing. It's the fastest way to lock in a time.",
    "",
    `Browse units & book a tour: ${LINKS.availability}`,
    "",
    `Also worth a look — amenities: ${BRAND.siteUrl}/amenities · virtual tours: ${BRAND.siteUrl}/virtual-tour`,
    "",
    TEXT_FOOTER,
  ].join("\n");

  return {
    subject,
    html: renderEmailShell({
      preheader,
      kicker: "Message Received",
      heading: "Thanks for reaching out",
      bodyHtml,
    }),
    text,
  };
}

// ---------------------------------------------------------------------------
// Leasing-team lead notification
// ---------------------------------------------------------------------------

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

/** Human-readable submission time in the property's timezone. */
function formatSubmitted(date: Date): string {
  return (
    date.toLocaleString("en-US", {
      timeZone: "America/Chicago",
      dateStyle: "medium",
      timeStyle: "short",
    }) + " CT"
  );
}

/**
 * Operational alert: the build-time baked availability seed shipped with the
 * running instance is older than its max age, so cold starts no longer answer
 * instantly. Sent to the leasing inbox so someone triggers a redeploy.
 */
export function renderSeedStaleAlert(opts: {
  seedUpdatedAt: string | null;
  seedAgeHours: number | null;
  maxAgeHours: number;
}): RenderedEmail {
  const { seedUpdatedAt, seedAgeHours, maxAgeHours } = opts;
  const subject = "Website alert: availability snapshot is out of date";
  const ageLine =
    seedAgeHours !== null
      ? `The snapshot baked into the current website build is about ${seedAgeHours} hours old (limit: ${maxAgeHours} hours).`
      : `The snapshot baked into the current website build is past its ${maxAgeHours}-hour limit.`;
  const dataLine = seedUpdatedAt
    ? `Its data was last refreshed ${escapeHtml(seedUpdatedAt)}.`
    : "";

  const html =
    `<p style="${BODY_TEXT}">${escapeHtml(ageLine)} ${dataLine}</p>` +
    `<p style="${BODY_TEXT}">Visitors still see live availability, but the very first visitor after a quiet period now waits on a slow first load instead of getting an instant answer.</p>` +
    `<p style="${BODY_TEXT}"><strong>What to do:</strong> republish the website. Each publish refreshes the baked snapshot automatically — no other action is needed. This alert is sent at most once per running instance.</p>`;

  const text = [
    ageLine,
    seedUpdatedAt ? `Its data was last refreshed ${seedUpdatedAt}.` : "",
    "",
    "Visitors still see live availability, but the very first visitor after a quiet period now waits on a slow first load instead of getting an instant answer.",
    "",
    "What to do: republish the website. Each publish refreshes the baked snapshot automatically — no other action is needed.",
    "This alert is sent at most once per running instance.",
    "",
    TEXT_FOOTER,
  ]
    .filter((line, i, arr) => !(line === "" && arr[i - 1] === ""))
    .join("\n");

  const htmlShell = renderEmailShell({
    preheader: "The baked availability snapshot is out of date — republish the website.",
    kicker: "Website Alert",
    heading: "Availability Snapshot Out of Date",
    bodyHtml: html,
  });

  return { subject, html: htmlShell, text };
}

export function renderLeadNotification(lead: LeadNotification): RenderedEmail {
  const fullName = `${lead.firstName} ${lead.lastName}`.trim();
  const typeLabel = leadTypeLabel(lead.type);
  const subject = `New ${typeLabel.toLowerCase()} lead: ${fullName}`;

  const rows: Array<[string, string | null, string | null]> = [
    ["Type", typeLabel, null],
    ["Name", fullName, null],
    ["Email", lead.email, `mailto:${lead.email}`],
    ["Phone", lead.phone, `tel:${lead.phone}`],
    ["Preferred date", lead.preferredDate, null],
    ["Message", lead.message, null],
    ["Submitted", formatSubmitted(lead.createdAt), null],
  ];

  const htmlRows = rows
    .map(([label, value, href]) => {
      const display = value?.trim() ? escapeHtml(value) : "&mdash;";
      const cell = href && value?.trim()
        ? `<a href="${escapeHtml(href)}" style="color:${BRAND.gold};text-decoration:underline;">${display}</a>`
        : display;
      return (
        `<tr>` +
        `<td style="padding:9px 16px 9px 0;font-family:${BRAND.font};font-size:13px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:${BRAND.inkSoft};vertical-align:top;white-space:nowrap;border-bottom:1px solid ${BRAND.rule};">${escapeHtml(label)}</td>` +
        `<td style="padding:9px 0;font-family:${BRAND.font};font-size:15px;line-height:1.5;color:${BRAND.ink};vertical-align:top;border-bottom:1px solid ${BRAND.rule};">${cell}</td>` +
        `</tr>`
      );
    })
    .join("");

  const replySubject = encodeURIComponent(`Re: your ${typeLabel.toLowerCase()} inquiry — Exhibit on Superior`);
  const bodyHtml =
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 0 20px;">${htmlRows}</table>` +
    goldButton(`mailto:${lead.email}?subject=${replySubject}`, "Reply to Prospect") +
    `<p style="margin:12px 0 0;font-family:${BRAND.font};font-size:13px;line-height:1.5;color:${BRAND.inkSoft};">Replying to this email also goes straight to the prospect.</p>`;

  const text = [
    ...rows.map(([label, value]) => `${label}: ${value?.trim() ? value : "—"}`),
    "",
    `Reply to the prospect: ${lead.email}`,
    "",
    TEXT_FOOTER,
  ].join("\n");

  return {
    subject,
    html: renderEmailShell({
      preheader: `${fullName} — ${typeLabel}${lead.preferredDate ? ` · ${lead.preferredDate}` : ""}`,
      kicker: "New Lead",
      heading: typeLabel === "Schedule a tour" ? "New tour request" : "New inquiry",
      bodyHtml,
    }),
    text,
  };
}
