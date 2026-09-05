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

  if (lead.type === "apply") {
    const unit = lead.unit?.trim() || null;
    const subject = unit
      ? `Your application for Apartment ${unit} at Exhibit on Superior`
      : "Your application at Exhibit on Superior";
    const preheader =
      "You're on our radar — finish your secure online application whenever you're ready.";

    const bodyHtml =
      `<p style="${BODY_TEXT}">${escapeHtml(greeting)}</p>` +
      `<p style="${BODY_TEXT}">Thanks for starting your application${
        unit ? ` for <strong style="color:${BRAND.ink};">Apartment ${escapeHtml(unit)}</strong>` : ""
      } at Exhibit on Superior. The application itself is completed on our secure online leasing system &mdash; if you didn&rsquo;t finish it in one sitting, you can pick it back up from the residence&rsquo;s listing at any time.</p>` +
      goldButton(LINKS.availability, "Return to Available Residences") +
      `<p style="margin:16px 0 0;font-family:${BRAND.font};font-size:15px;line-height:1.8;color:${BRAND.inkSoft};">Questions about qualifying, fees, or timing? Our leasing team is happy to help &mdash; just reply to this email or call ${escapeHtml(BRAND.phone)}.</p>`;

    const text = [
      greeting,
      "",
      `Thanks for starting your application${unit ? ` for Apartment ${unit}` : ""} at Exhibit on Superior. The application itself is completed on our secure online leasing system — if you didn't finish it in one sitting, you can pick it back up from the residence's listing at any time.`,
      "",
      `Return to available residences: ${LINKS.availability}`,
      "",
      `Questions about qualifying, fees, or timing? Reply to this email or call ${BRAND.phone}.`,
      "",
      TEXT_FOOTER,
    ].join("\n");

    return {
      subject,
      html: renderEmailShell({
        preheader,
        kicker: "Application Started",
        heading: "You're on your way",
        bodyHtml,
      }),
      text,
    };
  }

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
// General-tour booking confirmation (site-sent Exhibit branding)
// ---------------------------------------------------------------------------

/** "YYYY/MM/DD HH:mm" wall time → { dateLabel, timeLabel } for prospect copy. */
export function slotTimeLabels(slotTime: string): { dateLabel: string; timeLabel: string } {
  const [datePart, timePart] = slotTime.split(" ");
  const [y, m, d] = datePart.split("/").map(Number);
  const dateLabel = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
  const [h, mi] = timePart.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return { dateLabel, timeLabel: `${hour12}:${String(mi).padStart(2, "0")} ${period}` };
}

/**
 * Exhibit-branded confirmation for a general ("No specific apartment") tour
 * booked through the site's scheduler. AppFolio's own auto-emails for this
 * path carry the Highland corporate template (verified live 2026-07-30), so
 * the site sends the property-branded confirmation itself.
 */
export function renderGeneralTourConfirmation(opts: {
  firstName: string;
  /** Slot wall time, "YYYY/MM/DD HH:mm" (property-local). */
  slotTime: string;
}): RenderedEmail {
  const name = opts.firstName.trim();
  const greeting = name ? `Hi ${name},` : "Hello,";
  const { dateLabel, timeLabel } = slotTimeLabels(opts.slotTime);
  const when = `${dateLabel} at ${timeLabel}`;

  const subject = `Your tour is booked — ${when}`;
  const preheader = `You're confirmed for ${when} at Exhibit on Superior. We'll meet you in the lobby.`;

  const bodyHtml =
    `<p style="${BODY_TEXT}">${escapeHtml(greeting)}</p>` +
    `<p style="${BODY_TEXT}">Your tour of Exhibit on Superior is booked for <strong style="color:${BRAND.ink};">${escapeHtml(when)}</strong>. It&rsquo;s on our leasing calendar &mdash; no further confirmation needed.</p>` +
    `<p style="${BODY_TEXT}"><strong style="color:${BRAND.ink};">Where to go:</strong> ${escapeHtml(BRAND.address)}. Street parking is available &mdash; come in the front door and let the doorman know you&rsquo;re here for a tour.</p>` +
    `<p style="${BODY_TEXT}">What to expect: your tour takes about 15 minutes and covers the residences you&rsquo;re interested in and the full amenity floor. Have questions ready &mdash; we like them.</p>` +
    goldButton(LINKS.availability, "Browse Available Residences") +
    `<p style="margin:16px 0 0;font-family:${BRAND.font};font-size:15px;line-height:1.8;color:${BRAND.inkSoft};">Need to change or cancel your time? Just reply to this email or call ${escapeHtml(BRAND.phone)}.</p>`;

  const text = [
    greeting,
    "",
    `Your tour of Exhibit on Superior is booked for ${when}. It's on our leasing calendar — no further confirmation needed.`,
    "",
    `Where to go: ${BRAND.address}. Street parking is available — come in the front door and let the doorman know you're here for a tour.`,
    "",
    "What to expect: your tour takes about 15 minutes and covers the residences you're interested in and the full amenity floor.",
    "",
    `Browse available residences: ${LINKS.availability}`,
    "",
    `Need to change or cancel your time? Reply to this email or call ${BRAND.phone}.`,
    "",
    TEXT_FOOTER,
  ].join("\n");

  return {
    subject,
    html: renderEmailShell({
      preheader,
      kicker: "Tour Confirmed",
      heading: "We'll see you soon",
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
    case "apply":
      return "Application started";
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
/**
 * Alert the leasing team that AppFolio listing copy contradicting the
 * published fee policy was detected (and hidden from the website). Quotes
 * the removed text so they can find and fix it in AppFolio.
 */
export function renderFeeCopyAlert(opts: {
  unit: string;
  removed: string[];
}): RenderedEmail {
  const { unit, removed } = opts;
  const subject = `Website alert: Apt. ${unit} listing copy contradicts published fees`;

  const intro = `The AppFolio listing for Apt. ${unit} contains fee wording that contradicts the fee policy published on the website (no pet deposit, no monthly pet rent, $500 admin fee per apartment). The website automatically hid the text below, but it is still live in AppFolio — on the hosted listing page and everywhere the listing syndicates.`;

  const quotesHtml = removed
    .map(
      (text) =>
        `<blockquote style="margin:0 0 12px;padding:10px 14px;border-left:3px solid ${BRAND.gold};background:${BRAND.paper};font-family:${BRAND.font};font-size:15px;line-height:1.5;color:${BRAND.ink};">${escapeHtml(text)}</blockquote>`,
    )
    .join("");

  const html =
    `<p style="${BODY_TEXT}">${escapeHtml(intro)}</p>` +
    `<p style="${BODY_TEXT}"><strong>Removed from the website:</strong></p>` +
    quotesHtml +
    `<p style="${BODY_TEXT}"><strong>What to do:</strong> edit the unit's marketing description / rental terms in AppFolio so the fee wording matches the confirmed policy. Once the source text is fixed, these alerts stop on their own. This alert is sent at most once per day for the same text.</p>`;

  const text = [
    intro,
    "",
    "Removed from the website:",
    ...removed.map((t) => `  > ${t}`),
    "",
    "What to do: edit the unit's marketing description / rental terms in AppFolio so the fee wording matches the confirmed policy. Once the source text is fixed, these alerts stop on their own.",
    "This alert is sent at most once per day for the same text.",
    "",
    TEXT_FOOTER,
  ].join("\n");

  const htmlShell = renderEmailShell({
    preheader: `Apt. ${unit}: AppFolio listing copy contradicts the published fees.`,
    kicker: "Website Alert",
    heading: "Listing Copy Contradicts Published Fees",
    bodyHtml: html,
  });

  return { subject, html: htmlShell, text };
}

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

/**
 * Operational alert: the apex domain (rentatexhibit.com) stopped issuing its
 * 301 redirect to www — usually because a Domain Connect / Entri reconnection
 * silently re-provisioned the apex A record, so the apex is serving the site
 * again and reintroducing the duplicate-host SEO issue.
 */
export function renderApexRedirectAlert(opts: {
  status: number | null;
  location: string | null;
  problem: string;
}): RenderedEmail {
  const { status, location, problem } = opts;
  const subject = "Website alert: rentatexhibit.com apex redirect is broken";

  const observed =
    status === null
      ? "The check could not reach https://rentatexhibit.com at all."
      : `The apex responded with HTTP ${status}${location ? ` and Location "${location}"` : " and no Location header"}, instead of a 301/308 pointing at www.rentatexhibit.com.`;

  const html =
    `<p style="${BODY_TEXT}">${escapeHtml(`The daily check of https://rentatexhibit.com found that the apex domain is no longer redirecting to www.rentatexhibit.com. ${problem}`)}</p>` +
    `<p style="${BODY_TEXT}">${escapeHtml(observed)}</p>` +
    `<p style="${BODY_TEXT}">${escapeHtml("If the apex serves the site directly, Google sees the same pages on two hosts again (duplicate-content risk). The usual cause is the domain being reconnected to the hosting provider via Domain Connect/Entri, which re-adds an apex A record and overrides the Squarespace forwarding rule.")}</p>` +
    `<p style="${BODY_TEXT}"><strong>What to do:</strong> in Squarespace DNS, remove any apex A record (34.111.179.208) and any Domain Connect presets, then re-save the Domain Forwarding rule (301, maintain paths) from rentatexhibit.com to https://www.rentatexhibit.com. This alert is sent at most once per day.</p>`;

  const text = [
    `The daily check of https://rentatexhibit.com found that the apex domain is no longer redirecting to www.rentatexhibit.com. ${problem}`,
    "",
    observed,
    "",
    "If the apex serves the site directly, Google sees the same pages on two hosts again (duplicate-content risk). The usual cause is the domain being reconnected to the hosting provider via Domain Connect/Entri, which re-adds an apex A record and overrides the Squarespace forwarding rule.",
    "",
    "What to do: in Squarespace DNS, remove any apex A record (34.111.179.208) and any Domain Connect presets, then re-save the Domain Forwarding rule (301, maintain paths) from rentatexhibit.com to https://www.rentatexhibit.com.",
    "This alert is sent at most once per day.",
    "",
    TEXT_FOOTER,
  ].join("\n");

  const htmlShell = renderEmailShell({
    preheader: "The apex domain stopped redirecting to www — duplicate-host SEO risk.",
    kicker: "Website Alert",
    heading: "Apex Redirect Is Broken",
    bodyHtml: html,
  });

  return { subject, html: htmlShell, text };
}

/**
 * Operational alert: the production Knowledge Center smoke-check found
 * /knowledge/<slug> pages serving the wrong prerendered HTML (usually the SPA
 * homepage shell after a broken artifact.toml rewrite) or a damaged
 * llms-full.txt. Crawlers then index the homepage instead of the answers.
 */
export function renderKnowledgeCheckAlert(opts: {
  failures: string[];
  checkedCount: number;
}): RenderedEmail {
  const { failures, checkedCount } = opts;
  const subject = "Website alert: Knowledge Center pages are serving the wrong content";

  const intro = `The automatic post-publish check of www.rentatexhibit.com found ${failures.length} problem(s) across ${checkedCount} Knowledge Center checks. Affected pages are likely serving the SPA homepage shell instead of their own prerendered answer, so search engines and AI crawlers see the wrong content.`;
  const remedy =
    "What to do: inspect the [[services.production.rewrites]] /knowledge blocks in the website's artifact.toml, run `pnpm --filter @workspace/exhibit-on-superior run check:knowledge` locally for detail, and re-publish. This alert is sent at most once per day.";

  const html =
    `<p style="${BODY_TEXT}">${escapeHtml(intro)}</p>` +
    `<ul style="${BODY_TEXT}">${failures
      .map((f) => `<li>${escapeHtml(f)}</li>`)
      .join("")}</ul>` +
    `<p style="${BODY_TEXT}"><strong>What to do:</strong> ${escapeHtml(
      "inspect the [[services.production.rewrites]] /knowledge blocks in the website's artifact.toml, run the check:knowledge script locally for detail, and re-publish. This alert is sent at most once per day.",
    )}</p>`;

  const text = [
    intro,
    "",
    ...failures.map((f) => `- ${f}`),
    "",
    remedy,
    "",
    TEXT_FOOTER,
  ].join("\n");

  const htmlShell = renderEmailShell({
    preheader: "Knowledge Center pages are serving the wrong prerendered content.",
    kicker: "Website Alert",
    heading: "Knowledge Center Check Failed",
    bodyHtml: html,
  });

  return { subject, html: htmlShell, text };
}

/**
 * Operational alert: the always-on floor-plan-page check found affected
 * pages serving the SPA homepage shell (or a soft-404) instead of their
 * own prerendered HTML, so search engines see the wrong content.
 */
export function renderFloorPlanCheckAlert(opts: {
  failures: string[];
  checkedCount: number;
}): RenderedEmail {
  const { failures, checkedCount } = opts;
  const subject = "Website alert: floor-plan pages are serving the wrong content";

  const intro = `The automatic post-publish check of www.rentatexhibit.com found ${failures.length} problem(s) across ${checkedCount} floor-plan page checks. Affected pages are likely serving the SPA homepage shell instead of their own prerendered plan page (or an unknown slug is soft-404ing), so search engines see the wrong content.`;
  const remedy =
    "What to do: inspect the [[services.production.rewrites]] /floor-plans blocks in the website's artifact.toml, run `pnpm --filter @workspace/exhibit-on-superior exec node scripts/check-floor-plan-pages.mjs` locally for detail, and re-publish. This alert is sent at most once per day.";

  const html =
    `<p style="${BODY_TEXT}">${escapeHtml(intro)}</p>` +
    `<ul style="${BODY_TEXT}">${failures
      .map((f) => `<li>${escapeHtml(f)}</li>`)
      .join("")}</ul>` +
    `<p style="${BODY_TEXT}"><strong>What to do:</strong> ${escapeHtml(
      "inspect the [[services.production.rewrites]] /floor-plans blocks in the website's artifact.toml, run scripts/check-floor-plan-pages.mjs locally for detail, and re-publish. This alert is sent at most once per day.",
    )}</p>`;

  const text = [
    intro,
    "",
    ...failures.map((f) => `- ${f}`),
    "",
    remedy,
    "",
    TEXT_FOOTER,
  ].join("\n");

  const htmlShell = renderEmailShell({
    preheader: "Floor-plan pages are serving the wrong prerendered content.",
    kicker: "Website Alert",
    heading: "Floor-Plan Page Check Failed",
    bodyHtml: html,
  });

  return { subject, html: htmlShell, text };
}

/**
 * Operational alert: the always-on rented-unit indexability check (the
 * other half of check:postpublish, run from the api-server) found a
 * definitive failure — a rented apartment page may be indexable with a
 * stale price, or the watchdog has been unable to complete for ~a day.
 */
export function renderRentedCheckAlert(opts: {
  summary: string;
  outputTail: string;
}): RenderedEmail {
  const { summary, outputTail } = opts;
  const subject =
    "Website alert: rented-unit indexability check failed on the live site";

  const intro = `The automatic rented-unit indexability check of www.rentatexhibit.com reported a problem: ${summary}`;
  const remedy =
    "What to do: run `pnpm --filter @workspace/exhibit-on-superior run check:rented` from the workspace for full detail, inspect main.tsx's pre-hydration stripping, the Seo component, and UnitDetail's sold-out branch, then re-publish. This alert is sent at most once per day.";

  const tail = outputTail.trim();
  const html =
    `<p style="${BODY_TEXT}">${escapeHtml(intro)}</p>` +
    (tail
      ? `<p style="${BODY_TEXT}"><strong>Check output (tail):</strong></p>` +
        `<pre style="margin:0 0 16px;font-size:12px;line-height:1.5;white-space:pre-wrap;">${escapeHtml(tail)}</pre>`
      : "") +
    `<p style="${BODY_TEXT}"><strong>What to do:</strong> ${escapeHtml(
      "run the check:rented script from the workspace for full detail, inspect the sold-out rendering path, then re-publish. This alert is sent at most once per day.",
    )}</p>`;

  const text = [
    intro,
    "",
    ...(tail ? ["Check output (tail):", tail, ""] : []),
    remedy,
    "",
    TEXT_FOOTER,
  ].join("\n");

  const htmlShell = renderEmailShell({
    preheader: "A rented apartment page may be indexable with stale pricing.",
    kicker: "Website Alert",
    heading: "Rented-Unit Check Failed",
    bodyHtml: html,
  });

  return { subject, html: htmlShell, text };
}

/**
 * Operational alert: the always-on GA4 tracking check (gtmCheck) found the
 * published GTM container missing the GA4 measurement ID — visitor tracking
 * is silently off, exactly the failure that once went unnoticed for weeks.
 */
export function renderGtmCheckAlert(opts: {
  summary: string;
  outputTail: string;
}): RenderedEmail {
  const { summary, outputTail } = opts;
  const subject =
    "Website alert: visitor tracking (GA4) looks OFF — GTM container check failed";

  const intro = `The automatic GA4 tracking check of the published Google Tag Manager container reported a problem: ${summary}`;
  const remedy =
    "What to do: open Google Tag Manager, check that the GA4 configuration tag is present in the container, and publish it again. Then run `pnpm --filter @workspace/exhibit-on-superior run check:gtm` from the workspace to confirm. Until fixed, NO visitor data is being recorded. This alert is sent at most once per day.";

  const tail = outputTail.trim();
  const html =
    `<p style="${BODY_TEXT}">${escapeHtml(intro)}</p>` +
    (tail
      ? `<p style="${BODY_TEXT}"><strong>Check output (tail):</strong></p>` +
        `<pre style="margin:0 0 16px;font-size:12px;line-height:1.5;white-space:pre-wrap;">${escapeHtml(tail)}</pre>`
      : "") +
    `<p style="${BODY_TEXT}"><strong>What to do:</strong> ${escapeHtml(
      "open Google Tag Manager, restore the GA4 tag in the container, publish it, then run check:gtm from the workspace to confirm. Until fixed, no visitor data is being recorded. This alert is sent at most once per day.",
    )}</p>`;

  const text = [
    intro,
    "",
    ...(tail ? ["Check output (tail):", tail, ""] : []),
    remedy,
    "",
    TEXT_FOOTER,
  ].join("\n");

  const htmlShell = renderEmailShell({
    preheader:
      "The published GTM container is missing the GA4 tag — no visitor data is being recorded.",
    kicker: "Website Alert",
    heading: "Visitor Tracking Check Failed",
    bodyHtml: html,
  });

  return { subject, html: htmlShell, text };
}

/**
 * Operational alert: the GA4 visitor-data check (ga4DataCheck) found zero /
 * implausibly-low recorded visitors over the trailing window even though
 * the tag-side check passes — consent mode, a broken GA4 stream, or a data
 * filter is dropping every hit.
 */
export function renderGa4DataAlert(opts: {
  summary: string;
  activeUsers: number | null;
  window: string;
  sessions?: number;
  sightMapEvents?: Record<string, number>;
}): RenderedEmail {
  const { summary, activeUsers, window, sessions, sightMapEvents } = opts;
  const sightMapProblem = summary.includes("SightMap");
  const subject = sightMapProblem
    ? "Website alert: SightMap analytics need attention"
    : "Website alert: real visitors are NOT showing up in Google Analytics";

  const intro = `The automatic GA4 visitor-data check reported a problem: ${summary}`;
  const remedyText =
    "What to do: open Google Analytics for the website's property and check Reports → Realtime while browsing the live site. If your own visit does not appear, review consent-mode settings in Google Tag Manager, the GA4 web data stream, and any data filters on the property. The tag-side check (check:gtm) passing means the container itself still carries the GA4 tag — the problem is downstream of it. This alert is sent at most once per day.";

  const html =
    `<p style="${BODY_TEXT}">${escapeHtml(intro)}</p>` +
    `<p style="${BODY_TEXT}"><strong>Recorded active users (${escapeHtml(window)}):</strong> ${
      activeUsers === null ? "unknown (check could not complete)" : String(activeUsers)
    }</p>` +
    (sessions === undefined
      ? ""
      : `<p style="${BODY_TEXT}"><strong>Sessions:</strong> ${sessions}</p>`) +
    (sightMapEvents
      ? `<p style="${BODY_TEXT}"><strong>SightMap events:</strong> ${escapeHtml(
          Object.entries(sightMapEvents).map(([name, count]) => `${name}=${count}`).join(", "),
        )}</p>`
      : "") +
    `<p style="${BODY_TEXT}"><strong>What to do:</strong> ${escapeHtml(
      "open GA4 Realtime while browsing the live site; if your visit does not appear, review consent mode in GTM, the GA4 web data stream, and property data filters. The container-side check passing means the problem is downstream of the tag. This alert is sent at most once per day.",
    )}</p>`;

  const text = [
    intro,
    "",
    `Recorded active users (${window}): ${activeUsers === null ? "unknown" : activeUsers}`,
    ...(sessions === undefined ? [] : [`Sessions: ${sessions}`]),
    ...(sightMapEvents
      ? [`SightMap events: ${Object.entries(sightMapEvents).map(([name, count]) => `${name}=${count}`).join(", ")}`]
      : []),
    "",
    remedyText,
    "",
    TEXT_FOOTER,
  ].join("\n");

  const htmlShell = renderEmailShell({
    preheader:
      "GA4 recorded ~zero visitors over the trailing window — hits are being dropped after the tag.",
    kicker: "Website Alert",
    heading: "Visitors Missing From Analytics",
    bodyHtml: html,
  });

  return { subject, html: htmlShell, text };
}

/**
 * Operational alert: the always-on legacy-redirect check (redirectCheck)
 * found a legacy URL that no longer answers a single-hop 301 to its mapped
 * target — Google-indexed legacy URLs are soft-404ing into the SPA shell.
 */
export function renderRedirectCheckAlert(opts: {
  summary: string;
  outputTail: string;
}): RenderedEmail {
  const { summary, outputTail } = opts;
  const subject =
    "Website alert: legacy-redirect check failed on the live site";

  const intro = `The automatic legacy-redirect check of www.rentatexhibit.com reported a problem: ${summary}`;
  const remedy =
    "What to do: run `node scripts/check-legacy-redirects.mjs` in the web artifact from the workspace for full detail, inspect the prerendered redirect stubs and their [[services.production.rewrites]] pairs in .replit-artifact/artifact.toml, then re-publish. This alert is sent at most once per day.";

  const tail = outputTail.trim();
  const html =
    `<p style="${BODY_TEXT}">${escapeHtml(intro)}</p>` +
    (tail
      ? `<p style="${BODY_TEXT}"><strong>Check output (tail):</strong></p>` +
        `<pre style="margin:0 0 16px;font-size:12px;line-height:1.5;white-space:pre-wrap;">${escapeHtml(tail)}</pre>`
      : "") +
    `<p style="${BODY_TEXT}"><strong>What to do:</strong> ${escapeHtml(
      "run the check-legacy-redirects script from the workspace for full detail, inspect the redirect stubs and their artifact.toml rewrite pairs, then re-publish. This alert is sent at most once per day.",
    )}</p>`;

  const text = [
    intro,
    "",
    ...(tail ? ["Check output (tail):", tail, ""] : []),
    remedy,
    "",
    TEXT_FOOTER,
  ].join("\n");

  const htmlShell = renderEmailShell({
    preheader:
      "A Google-indexed legacy URL may be soft-404ing instead of redirecting.",
    kicker: "Website Alert",
    heading: "Legacy-Redirect Check Failed",
    bodyHtml: html,
  });

  return { subject, html: htmlShell, text };
}

/**
 * Operational alert: the lead-form bot guard rejected an unusually high
 * number of submissions today. Either a smarter/higher-volume bot is
 * hammering the forms, or a guard bug is rejecting real prospects — both
 * need a human look at the logs.
 */
export function renderBotGuardAlert(opts: {
  rejectedToday: number;
  threshold: number;
  breakdown: string[];
}): RenderedEmail {
  const { rejectedToday, threshold, breakdown } = opts;
  const subject = "Website alert: form spam rejections spiked past the bot guard threshold";

  const intro = `The website's lead-form bot guard has rejected ${rejectedToday} submissions so far today (UTC), past the alert threshold of ${threshold}. This is either a spam campaign hitting the forms harder than usual, or — worse — the guard falsely rejecting real prospects.`;
  const impact =
    "Rejected submissions are silently dropped: nothing is stored, no lead email is sent, and no AppFolio guest card is created. If any of these were real people, they got no follow-up.";
  const remedyText =
    "check the api-server logs for \"Rejected bot lead submission\" / \"Rejected bot showing-contact submission\" lines and their reasons (honeypot vs too_fast). Bursts of honeypot hits are a bot campaign (usually safe to ignore beyond confirming rate limits hold). A spike in too_fast rejections may mean real visitors are being misjudged — compare against inbox volume for the day. This alert is sent at most once per day.";

  const html =
    `<p style="${BODY_TEXT}">${escapeHtml(intro)}</p>` +
    (breakdown.length > 0
      ? `<p style="${BODY_TEXT}"><strong>Breakdown (this server instance):</strong></p>` +
        `<ul style="${BODY_TEXT}">${breakdown
          .map((b) => `<li>${escapeHtml(b)}</li>`)
          .join("")}</ul>`
      : "") +
    `<p style="${BODY_TEXT}">${escapeHtml(impact)}</p>` +
    `<p style="${BODY_TEXT}"><strong>What to do:</strong> ${escapeHtml(remedyText)}</p>`;

  const text = [
    intro,
    "",
    ...(breakdown.length > 0
      ? ["Breakdown (this server instance):", ...breakdown.map((b) => `- ${b}`), ""]
      : []),
    impact,
    "",
    `What to do: ${remedyText}`,
    "",
    TEXT_FOOTER,
  ].join("\n");

  const htmlShell = renderEmailShell({
    preheader: "Bot-guard rejections spiked past the daily alert threshold.",
    kicker: "Website Alert",
    heading: "Form Spam Spike Detected",
    bodyHtml: html,
  });

  return { subject, html: htmlShell, text };
}

/**
 * Leasing alert: a real (guard-passing) applicant's guest card was rejected
 * by AppFolio, so the prospect never reached AppFolio's lead queue. The
 * lead is saved and emailed as usual — this alert exists so the team can
 * enter the prospect into AppFolio manually.
 */
export function renderGuestCardFailureAlert(opts: {
  name: string;
  email: string;
  phone: string;
  unit: string;
  source: string | null;
  detail: string;
}): RenderedEmail {
  const { name, email, phone, unit, source, detail } = opts;
  const subject = `Website alert: AppFolio rejected the guest card for ${name} (Apt. ${unit})`;

  const intro = `A real prospect submitted the website's tour/application form for Apt. ${unit}, but AppFolio rejected the automatic guest-card push — so they are NOT in AppFolio's lead queue. The lead was saved and the usual lead-notification email was still sent.`;
  const remedyText =
    "add this prospect to AppFolio manually (Guest Card / prospect record for the unit below). Rejections are usually creation-time validation — unusual characters in a name, or an email domain AppFolio doesn't accept. This alert is sent at most once per day for the same lead.";

  const rows: [string, string][] = [
    ["Name", name],
    ["Email", email],
    ["Phone", phone],
    ["Apartment", unit],
    ...(source ? ([["Source", source]] as [string, string][]) : []),
  ];

  const detailsHtml =
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;">` +
    rows
      .map(
        ([label, value]) =>
          `<tr><td style="padding:4px 16px 4px 0;font-family:${BRAND.font};font-size:15px;font-weight:600;color:${BRAND.ink};">${escapeHtml(label)}</td>` +
          `<td style="padding:4px 0;font-family:${BRAND.font};font-size:15px;color:${BRAND.ink};">${escapeHtml(value)}</td></tr>`,
      )
      .join("") +
    `</table>`;

  const html =
    `<p style="${BODY_TEXT}">${escapeHtml(intro)}</p>` +
    `<p style="${BODY_TEXT}"><strong>Prospect details:</strong></p>` +
    detailsHtml +
    `<p style="${BODY_TEXT}"><strong>What to do:</strong> ${escapeHtml(remedyText)}</p>` +
    `<p style="${BODY_TEXT}"><strong>Technical detail:</strong> ${escapeHtml(detail)}</p>`;

  const text = [
    intro,
    "",
    "Prospect details:",
    ...rows.map(([label, value]) => `  ${label}: ${value}`),
    "",
    `What to do: ${remedyText}`,
    "",
    `Technical detail: ${detail}`,
    "",
    TEXT_FOOTER,
  ].join("\n");

  const htmlShell = renderEmailShell({
    preheader: `AppFolio rejected the guest card for ${name} — enter them manually.`,
    kicker: "Website Alert",
    heading: "Guest Card Rejected by AppFolio",
    bodyHtml: html,
  });

  return { subject, html: htmlShell, text };
}

/**
 * Operational alert: accepted (guard-passing) form submissions spiked past
 * the daily anomaly threshold — either a genuinely busy leasing day or a
 * smarter bot fully evading the guard and spamming the leasing inbox.
 */
export function renderAcceptedSpikeAlert(opts: {
  acceptedToday: number;
  threshold: number;
  breakdown: string[];
}): RenderedEmail {
  const { acceptedToday, threshold, breakdown } = opts;
  const subject =
    "Website alert: accepted lead volume spiked past the daily anomaly threshold";

  const intro = `The website's lead forms have accepted ${acceptedToday} submissions so far today (UTC), past the anomaly threshold of ${threshold}. Normal days see a handful of leads at most — this is either an unusually busy leasing day, or a smarter bot that fully evades the bot guard and is spamming the leasing inbox.`;
  const impact =
    "Every accepted submission emails the leasing inbox and may create an AppFolio guest card, so a bot slipping past the guard pollutes the real lead queue.";
  const remedyText =
    "open the leasing inbox and skim today's lead notifications. Real prospects have plausible names, emails, and messages; bot floods look templated or gibberish. If it's spam, the bot guard needs tightening (api-server botGuard.ts) — check the logs for what the submissions have in common. If they're real, congratulations, and consider raising the threshold. This alert is sent at most once per day.";

  const html =
    `<p style="${BODY_TEXT}">${escapeHtml(intro)}</p>` +
    (breakdown.length > 0
      ? `<p style="${BODY_TEXT}"><strong>Breakdown (this server instance):</strong></p>` +
        `<ul style="${BODY_TEXT}">${breakdown
          .map((b) => `<li>${escapeHtml(b)}</li>`)
          .join("")}</ul>`
      : "") +
    `<p style="${BODY_TEXT}">${escapeHtml(impact)}</p>` +
    `<p style="${BODY_TEXT}"><strong>What to do:</strong> ${escapeHtml(remedyText)}</p>`;

  const text = [
    intro,
    "",
    ...(breakdown.length > 0
      ? ["Breakdown (this server instance):", ...breakdown.map((b) => `- ${b}`), ""]
      : []),
    impact,
    "",
    `What to do: ${remedyText}`,
    "",
    TEXT_FOOTER,
  ].join("\n");

  const htmlShell = renderEmailShell({
    preheader: "Accepted lead volume spiked past the daily anomaly threshold.",
    kicker: "Website Alert",
    heading: "Accepted Lead Volume Spike",
    bodyHtml: html,
  });

  return { subject, html: htmlShell, text };
}

/**
 * Operational alert: no form submission has been accepted for an unusually
 * long stretch — possible silent form breakage (JS error, broken route,
 * guard false-positives swallowing everyone).
 */
export function renderAcceptedSilenceAlert(opts: {
  hoursSinceLast: number;
  lastAcceptedAt: string | null;
  thresholdHours: number;
}): RenderedEmail {
  const { hoursSinceLast, lastAcceptedAt, thresholdHours } = opts;
  const subject =
    "Website alert: no lead form submission accepted in an unusually long time";

  const lastSeen = lastAcceptedAt
    ? `The last accepted submission was around ${lastAcceptedAt} (UTC).`
    : "No accepted submission has been recorded since tracking began on this deployment.";
  const intro = `The website has not accepted a single lead-form or showing-request submission in about ${Math.floor(hoursSinceLast)} hours — past the ${thresholdHours}-hour silence threshold. ${lastSeen} This may just be a quiet stretch, but it can also mean the forms are silently broken: a frontend error blocking submits, a broken API route, or the bot guard falsely rejecting everyone.`;
  const remedyText =
    "submit a test lead through the live site's contact form and confirm it arrives in the leasing inbox. If it doesn't, check the api-server logs for errors and for \"Rejected bot\" lines (guard false positives), and check the browser console on the form pages. This alert is sent at most once per day while the silence continues.";

  const html =
    `<p style="${BODY_TEXT}">${escapeHtml(intro)}</p>` +
    `<p style="${BODY_TEXT}"><strong>What to do:</strong> ${escapeHtml(remedyText)}</p>`;

  const text = [intro, "", `What to do: ${remedyText}`, "", TEXT_FOOTER].join(
    "\n",
  );

  const htmlShell = renderEmailShell({
    preheader: "No lead form submission accepted in an unusually long time.",
    kicker: "Website Alert",
    heading: "Lead Forms Gone Quiet",
    bodyHtml: html,
  });

  return { subject, html: htmlShell, text };
}

/**
 * Operational alert: the automatic probe of AppFolio's unofficial showing
 * scheduler endpoints found a sustained failure (endpoints changed, CSRF or
 * captcha added) or identity verification switched on. Visitors still land
 * safely on the lead-capture / hosted-page fallback, but the branded
 * booking flow is broken until someone investigates.
 */
export function renderShowingSchedulerAlert(opts: {
  reason: "idv_enabled" | "sustained_failure" | "live_traffic_failure" | "slots_endpoint_failure" | "slot_format_drift" | "near_term_skip" | "tour_unit_unresolved";
  detail: string;
  failedRuns: number;
}): RenderedEmail {
  const { reason, detail, failedRuns } = opts;
  const subject =
    reason === "idv_enabled"
      ? "Website alert: AppFolio identity verification now blocks the showing scheduler"
      : reason === "live_traffic_failure"
        ? "Website alert: real visitors' showing bookings keep failing"
        : reason === "slots_endpoint_failure"
        ? "Website alert: visitors can't see live tour times — the slot feed keeps erroring"
        : reason === "slot_format_drift"
          ? "Website alert: online showing times are not displaying — AppFolio changed its slot format"
          : reason === "near_term_skip"
            ? "Website alert: AppFolio's showing feed hid near-term tour days (auto-recovered)"
            : reason === "tour_unit_unresolved"
              ? 'Website alert: the hidden "Tour" unit is missing from AppFolio — general tour booking is degraded'
              : "Website alert: the online showing scheduler probe keeps failing";

  const intro =
    reason === "idv_enabled"
      ? "The automatic probe of AppFolio's showing scheduler found that identity verification (IDV) is now enabled for the listings database. Branded booking on the website requires a Persona ID check the site cannot proxy, so every visitor who tries to book is being handed off to AppFolio's hosted page instead."
      : reason === "live_traffic_failure"
        ? `${failedRuns} real visitors' showing requests in a row have failed at the AppFolio guest-card or booking step, with zero successes in between — this is no longer a single blip or one unlucky visitor. If the failures below say "status 422" with an empty body, this is AppFolio's spam protection on new prospect records: after a burst of new guest cards from the website (typically rapid test submissions), AppFolio temporarily rejects ALL new-prospect creations regardless of the visitor's details, while repeat inquiries from known prospects still go through. It wears off on its own (verified live 2026-08-04). Any other status suggests AppFolio changed the guest-card or booking endpoints the website's flow replicates (the hourly probe covers only the anonymous slot-fetch and IDV endpoints, so it may still look green).`
        : reason === "slots_endpoint_failure"
        ? `Real visitors repeatedly failed to load live showing times: ${failedRuns} slot-loading requests errored within a short window (details below name the window and count). Each of those visitors saw the "we've got your request" fallback instead of the live calendar, so online self-booking was effectively down for them — their contact requests were still captured, but nobody could pick a time. This means AppFolio's availabilities endpoint itself was erroring or timing out (a 502/timeout, not a format problem — a format drift has its own alert), and the hourly probe may have looked green between runs.`
        : reason === "slot_format_drift"
          ? "AppFolio is sending showing time slots in a format the website no longer recognizes: every slot it sent was dropped, so the schedule-showing page is showing \"no online showing times\" even though openings exist. Visitors cannot self-book until the website's slot parser is updated to AppFolio's new format."
          : reason === "near_term_skip"
            ? "AppFolio's availabilities feed contradicted itself: it reported an empty showing window and suggested a later first-available date, while open near-term slots actually existed. The website caught the contradiction, recovered the hidden days, and displayed them to visitors — no action was lost this time."
          : reason === "tour_unit_unresolved"
            ? `The website can no longer find the hidden "Tour" unit in AppFolio's unit directory (${failedRuns} checks in a row). That unit is what powers day-and-time picking for visitors who choose "No specific apartment" on the schedule-a-tour page — without it, those visitors silently drop to a plain contact-form request with no calendar.`
            : `The automatic probe of AppFolio's showing scheduler has now failed ${failedRuns} runs in a row — this is no longer a transient blip. AppFolio has likely changed the unofficial endpoints the website's booking flow replicates (new paths, CSRF tokens, or captcha).`;

  const impact =
    "Visitors are not stranded: the schedule-showing page falls back to standard lead capture plus a link to AppFolio's hosted booking page. But the Exhibit-branded flow is broken until this is investigated.";

  const remedy =
    reason === "idv_enabled"
      ? "What to do: confirm with the leasing team whether IDV was enabled intentionally. If it was, the branded scheduler should stay in hosted-page mode; if not, disable IDV in AppFolio's showing settings. This alert is sent at most once per day."
      : reason === "near_term_skip"
        ? "What to do: nothing is broken for visitors right now — the site self-recovered. But if this alert repeats daily, AppFolio's find_first_available_date behavior has changed for good and the showing client should be reviewed. This alert is sent at most once per day."
        : reason === "slot_format_drift"
        ? "What to do: this needs a website-side code fix — compare the raw availabilities response from AppFolio's hosted \"Schedule a Showing\" page against the site's slot parser and update it to accept the new format. Until then, expect tour requests to arrive as standard leads instead of self-booked showings. This alert is sent at most once per day."
        : reason === "tour_unit_unresolved"
          ? 'What to do: check AppFolio for a unit named "Tour" (or "General Tour") at the property. If it was renamed, either rename it back or update the website\'s TOUR_UNIT_NAMES setting to match; if it was deleted, recreate it (not posted to the website) so general tours can book showing times again. This alert is sent at most once per day.'
          : reason === "slots_endpoint_failure"
            ? "What to do: check whether AppFolio's hosted \"Schedule a Showing\" page loads time slots right now. If the hosted page also fails, it is an AppFolio outage — no website fix needed, but expect tour requests to arrive as standard leads until it recovers. If the hosted page works, AppFolio likely changed its availabilities endpoint; compare its requests (browser dev tools) against the site's showing client and update the client to match. This alert is sent at most once per day."
          : reason === "live_traffic_failure"
            ? "What to do: for 422-with-empty-body failures, stop submitting test bookings and wait — the throttle clears on its own, and real prospects were still captured as standard leads. For any other failure, open AppFolio's hosted \"Schedule a Showing\" page with browser dev tools and compare its requests against the site's showing client (availabilities, guest card, booking), then update the client to match. This alert is sent at most once per day."
            : "What to do: open AppFolio's hosted \"Schedule a Showing\" page with browser dev tools and compare its requests against the site's showing client (availabilities, guest card, booking). Update the client to match, or leave the page on its fallback until fixed. This alert is sent at most once per day.";

  const detailLabel =
    reason === "live_traffic_failure" ? "Latest failures" : "Latest probe detail";

  const html =
    `<p style="${BODY_TEXT}">${escapeHtml(intro)}</p>` +
    `<p style="${BODY_TEXT}"><strong>${detailLabel}:</strong> ${escapeHtml(detail)}</p>` +
    `<p style="${BODY_TEXT}">${escapeHtml(impact)}</p>` +
    `<p style="${BODY_TEXT}"><strong>What to do:</strong> ${escapeHtml(remedy.replace(/^What to do: /, ""))}</p>`;

  const text = [
    intro,
    "",
    `${detailLabel}: ${detail}`,
    "",
    impact,
    "",
    remedy,
    "",
    TEXT_FOOTER,
  ].join("\n");

  const htmlShell = renderEmailShell({
    preheader:
      reason === "idv_enabled"
        ? "AppFolio identity verification now blocks branded showing booking."
        : reason === "live_traffic_failure"
          ? "Real visitors' showing bookings keep failing against AppFolio."
          : reason === "slot_format_drift"
            ? "Every AppFolio showing slot is being dropped — visitors can't self-book."
            : reason === "near_term_skip"
              ? "AppFolio hid open near-term tour days; the site auto-recovered them."
              : reason === "tour_unit_unresolved"
                ? 'The hidden "Tour" unit stopped resolving — general tours lost time picking.'
                : "The online showing scheduler's AppFolio probe keeps failing.",
    kicker: "Website Alert",
    heading:
      reason === "idv_enabled"
        ? "Showing Scheduler Blocked by IDV"
        : reason === "live_traffic_failure"
          ? "Visitor Showing Bookings Failing"
          : reason === "slot_format_drift"
            ? "Online Showing Times Not Displaying"
            : reason === "near_term_skip"
              ? "Near-Term Tour Days Hidden by AppFolio"
              : reason === "tour_unit_unresolved"
                ? "General Tour Booking Degraded"
                : "Showing Scheduler Probe Failing",
    bodyHtml: html,
  });

  return { subject, html: htmlShell, text };
}

/**
 * Leasing alert: the derived AppFolio online rental application URL for a
 * posted unit keeps answering 4xx/5xx — AppFolio has likely changed its
 * application URL structure, so the site's "Start Application" hand-off is
 * a dead link until the derivation is updated.
 */
export function renderApplyLinkAlert(opts: {
  unit: string;
  applyUrl: string;
  detail: string;
  failedRuns: number;
}): RenderedEmail {
  const { unit, applyUrl, detail, failedRuns } = opts;
  const subject =
    "Website alert: the online rental application link appears broken";

  const intro = `The automatic check of the online rental application hand-off has now failed ${failedRuns} runs in a row — this is no longer a transient blip. The website derives each posted unit's "Apply Now" link from its AppFolio listing, and that derived link (probed against Apt. ${unit}) is not answering the way a working application page should. AppFolio may have changed its application URL structure.`;

  const impact =
    "Until this is fixed, applicants who click \"Start Application\" or \"Apply Now\" on the website may land on a dead AppFolio page instead of the application form. Anyone who calls or emails can still be sent AppFolio's hosted listing page, where the Apply button always reflects the current URL structure.";

  const remedy =
    "What to do: open the unit's AppFolio listing page, click its own Apply button, and compare that URL with the link below. If AppFolio changed the pattern, the website's apply-link derivation needs a matching code update. This alert is sent at most once per day.";

  const html =
    `<p style="${BODY_TEXT}">${escapeHtml(intro)}</p>` +
    `<p style="${BODY_TEXT}"><strong>Probed link:</strong> ${escapeHtml(applyUrl)}</p>` +
    `<p style="${BODY_TEXT}"><strong>Latest probe detail:</strong> ${escapeHtml(detail)}</p>` +
    `<p style="${BODY_TEXT}">${escapeHtml(impact)}</p>` +
    `<p style="${BODY_TEXT}"><strong>What to do:</strong> ${escapeHtml(remedy.replace(/^What to do: /, ""))}</p>`;

  const text = [
    intro,
    "",
    `Probed link: ${applyUrl}`,
    `Latest probe detail: ${detail}`,
    "",
    impact,
    "",
    remedy,
    "",
    TEXT_FOOTER,
  ].join("\n");

  const htmlShell = renderEmailShell({
    preheader:
      "The website's Apply Now hand-off to AppFolio may be a dead link.",
    kicker: "Website Alert",
    heading: "Online Application Link Broken",
    bodyHtml: html,
  });

  return { subject, html: htmlShell, text };
}

export function renderLeadNotification(lead: LeadNotification): RenderedEmail {
  const fullName = `${lead.firstName} ${lead.lastName}`.trim();
  const typeLabel = leadTypeLabel(lead.type);
  const subject = `New ${typeLabel.toLowerCase()} lead: ${fullName}`;

  const smsConsentLabel =
    lead.smsConsent === true
      ? "✓ Opted in"
      : lead.smsConsent === false
        ? "✗ Declined"
        : null;

  const rows: Array<[string, string | null, string | null]> = [
    ["Type", typeLabel, null],
    ["Name", fullName, null],
    ["Email", lead.email, `mailto:${lead.email}`],
    ["Phone", lead.phone, `tel:${lead.phone}`],
    ["Preferred date", lead.preferredDate, null],
    ["Message", lead.message, null],
    // SMS consent — only shown when the checkbox was presented to this lead;
    // omitted for older leads and flows that don't collect consent.
    ...(lead.smsConsent != null ? ([["SMS consent", smsConsentLabel, null]] as Array<[string, string | null, string | null]>) : []),
    // Campaign attribution (e.g. "Website (GoogleAds-SpringPromo)") — only present
    // when the visit carried UTM tags, so default-source leads are unchanged.
    ...(lead.source ? ([["Source", lead.source, null]] as Array<[string, string | null, string | null]>) : []),
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

/**
 * Review note: the AI article drafter added a new `draft: true` blog guide to
 * the website code and it is waiting for a human editor. This email is purely
 * informational — it is never publish authority. Publishing stays a reviewed
 * code change (flip the draft flag + add the artifact.toml rewrite pair).
 */
export function renderBlogDraftReviewNote(opts: {
  slug: string;
  title: string;
  targetQuery: string;
  authorName: string;
  summary: string;
  wordCount: number;
  /** Published article that must gain the inbound `related` link at publish time. */
  inboundHostSlug?: string;
}): RenderedEmail {
  const { slug, title, targetQuery, authorName, summary, wordCount, inboundHostSlug } = opts;
  const subject = `Blog draft ready for review: ${title}`;

  const publishEdits = inboundHostSlug
    ? `To publish, a developer makes all three edits (the build fails if any is missed): remove \`draft: true\`, add "${slug}" to the related list of the "${inboundHostSlug}" article, and add the /blog rewrite pair in artifact.toml. The exact steps are also written in a comment above the draft itself.`
    : "To publish: a developer removes `draft: true`, adds the inbound related link named in the comment above the draft, and adds the /blog rewrite pair in artifact.toml. The build fails if any edit is missed.";

  const steps = [
    `Read the full draft in the attached ${slug}.txt (the same text lives in the website code at src/data/blogArticles.ts).`,
    "Check every fact, fee, and claim. You can mark up the attached file and email it back to the team — a developer then applies those edits to the code entry. Replying with an edited file never publishes anything by itself.",
    publishEdits,
    "Not worth publishing? The draft can simply be deleted — it is invisible to visitors either way.",
  ];

  const html =
    `<p style="${BODY_TEXT}">The article drafter wrote a new blog guide and parked it as an <strong>unpublished draft</strong> for your review. Nothing is live — drafts never appear on the website until a person publishes them.</p>` +
    `<p style="${BODY_TEXT}"><strong>Title:</strong> ${escapeHtml(title)}<br>` +
    `<strong>Slug:</strong> /blog/${escapeHtml(slug)}<br>` +
    `<strong>Target search:</strong> ${escapeHtml(targetQuery)}<br>` +
    `<strong>Byline:</strong> ${escapeHtml(authorName)}<br>` +
    `<strong>Length:</strong> about ${wordCount} words</p>` +
    `<p style="${BODY_TEXT}"><strong>Draft summary:</strong> ${escapeHtml(summary)}</p>` +
    `<p style="${BODY_TEXT}"><strong>Next steps:</strong></p>` +
    `<ol>${steps.map((s) => `<li style="${BODY_TEXT}">${escapeHtml(s)}</li>`).join("")}</ol>` +
    `<p style="${BODY_TEXT}">Reminder: this email is a heads-up only. It cannot publish anything, and replying to it does not publish anything.</p>`;

  const text = [
    "The article drafter wrote a new blog guide and parked it as an unpublished draft for your review.",
    "Nothing is live — drafts never appear on the website until a person publishes them.",
    "",
    `Title: ${title}`,
    `Slug: /blog/${slug}`,
    `Target search: ${targetQuery}`,
    `Byline: ${authorName}`,
    `Length: about ${wordCount} words`,
    "",
    `Draft summary: ${summary}`,
    "",
    "Next steps:",
    ...steps.map((s, i) => `${i + 1}. ${s}`),
    "",
    "Reminder: this email is a heads-up only. It cannot publish anything, and replying to it does not publish anything.",
    "",
    TEXT_FOOTER,
  ].join("\n");

  return {
    subject,
    html: renderEmailShell({
      preheader: `New unpublished blog draft awaiting review: ${title}`,
      kicker: "Blog Draft",
      heading: "New Draft Awaiting Review",
      bodyHtml: html,
    }),
    text,
  };
}

// ---------------------------------------------------------------------------
// Weekly SEO digest (seoWeeklyDigest watchdog)
// ---------------------------------------------------------------------------

/** Row shapes mirrored from seoWeeklyDigest.ts (kept structural to avoid a cycle). */
export interface SeoDigestMoverRow {
  key: string;
  currentClicks: number;
  previousClicks: number;
  currentImpressions: number;
  previousImpressions: number;
  position: number;
}

export interface SeoDigestNearWinnerRow {
  query: string;
  impressions: number;
  clicks: number;
  position: number;
}

export interface SeoDigestBlogRow {
  url: string;
  currentClicks: number;
  previousClicks: number;
  currentImpressions: number;
  previousImpressions: number;
  position: number;
}

export interface SeoDigestGa4Row {
  pagePath: string;
  currentUsers: number;
  previousUsers: number;
}

export interface SeoDigestBlogReminderRow {
  /** draft: true articles awaiting review — publish these before drafting new ones. */
  pendingDrafts: { slug: string; title: string }[];
  /** Next planned-but-unwritten guide; null when the cluster plan is exhausted. */
  nextUp: {
    slug: string;
    workingTitle: string;
    targetQuery: string;
    pillarTitle: string;
  } | null;
  queueRemaining: number;
  publishedCount: number;
  plannedTotal: number;
  /** Refresh mode: weakest published guide from this week's digest data. */
  refreshCandidate: {
    url: string;
    currentClicks: number;
    previousClicks: number;
    currentImpressions: number;
    previousImpressions: number;
    position: number;
  } | null;
  /** Refresh-mode fallback when no blog stats exist this week. */
  refreshNearWinner: { query: string; impressions: number; clicks: number; position: number } | null;
}

export interface SeoDigestEmailData {
  windows: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  };
  siteUrl: string;
  risingQueries: SeoDigestMoverRow[];
  fallingQueries: SeoDigestMoverRow[];
  risingPages: SeoDigestMoverRow[];
  fallingPages: SeoDigestMoverRow[];
  nearWinners: SeoDigestNearWinnerRow[];
  blogPages: SeoDigestBlogRow[];
  ga4Risers: SeoDigestGa4Row[] | null;
  ga4Fallers: SeoDigestGa4Row[] | null;
  notes: string[];
  blogReminder: SeoDigestBlogReminderRow;
}

const TABLE_STYLE =
  "width:100%;border-collapse:collapse;margin:0 0 20px;font-size:13px;line-height:1.5;";
const TH_STYLE =
  "text-align:left;padding:6px 8px;border-bottom:2px solid #d8d2c6;font-weight:600;white-space:nowrap;";
const TD_STYLE = "padding:6px 8px;border-bottom:1px solid #eee9df;vertical-align:top;";
const TD_NUM = `${TD_STYLE}text-align:right;white-space:nowrap;`;

function fmtDelta(current: number, previous: number): string {
  const d = current - previous;
  if (d > 0) return `+${d}`;
  return String(d);
}

function shortPage(key: string): string {
  return key.replace(/^https?:\/\/[^/]+/, "") || "/";
}

function moverTableHtml(title: string, rows: SeoDigestMoverRow[], isPage: boolean): string {
  if (rows.length === 0) {
    return `<p style="${BODY_TEXT}"><strong>${escapeHtml(title)}:</strong> no week-over-week movement recorded.</p>`;
  }
  const body = rows
    .map(
      (r) =>
        `<tr><td style="${TD_STYLE}">${escapeHtml(isPage ? shortPage(r.key) : r.key)}</td>` +
        `<td style="${TD_NUM}">${r.previousClicks} → ${r.currentClicks} (${fmtDelta(r.currentClicks, r.previousClicks)})</td>` +
        `<td style="${TD_NUM}">${r.previousImpressions} → ${r.currentImpressions}</td>` +
        `<td style="${TD_NUM}">${r.position ? r.position.toFixed(1) : "—"}</td></tr>`,
    )
    .join("");
  return (
    `<p style="${BODY_TEXT}margin-bottom:6px;"><strong>${escapeHtml(title)}</strong></p>` +
    `<table style="${TABLE_STYLE}"><tr>` +
    `<th style="${TH_STYLE}">${isPage ? "Page" : "Query"}</th>` +
    `<th style="${TH_STYLE}text-align:right;">Clicks (prev → now)</th>` +
    `<th style="${TH_STYLE}text-align:right;">Impressions</th>` +
    `<th style="${TH_STYLE}text-align:right;">Avg pos</th></tr>${body}</table>`
  );
}

function moverTableText(title: string, rows: SeoDigestMoverRow[], isPage: boolean): string[] {
  if (rows.length === 0) return [`${title}: no week-over-week movement recorded.`, ""];
  return [
    `${title}:`,
    ...rows.map(
      (r) =>
        `  - ${isPage ? shortPage(r.key) : r.key} — clicks ${r.previousClicks} → ${r.currentClicks} (${fmtDelta(r.currentClicks, r.previousClicks)}), impressions ${r.previousImpressions} → ${r.currentImpressions}, avg pos ${r.position ? r.position.toFixed(1) : "n/a"}`,
    ),
    "",
  ];
}

/**
 * The weekly SEO movers digest sent to the leasing inbox: rising/falling
 * queries and pages week-over-week, near-winner queries at position 8–20,
 * per-blog-article search stats, and GA4 page movers when available.
 */
export function renderSeoWeeklyDigest(data: SeoDigestEmailData): RenderedEmail {
  const { windows } = data;
  const subject = `Weekly search digest: movers & near-winners (${windows.current.start} – ${windows.current.end})`;

  const intro = `Here is the automatic weekly search digest for ${BRAND.propertyName}. It compares Google Search Console data for ${windows.current.start} – ${windows.current.end} against the previous week (${windows.previous.start} – ${windows.previous.end}).`;

  let html = `<p style="${BODY_TEXT}">${escapeHtml(intro)}</p>`;
  const text: string[] = [intro, ""];

  // "Next guide up" — the weekly blog-cadence reminder.
  {
    const r = data.blogReminder;
    const lines: string[] = [];
    if (r.pendingDrafts.length > 0) {
      lines.push(
        `Review & publish these drafted guides first (${r.pendingDrafts.length} pending review): ` +
          r.pendingDrafts.map((d) => `"${d.title}" (${d.slug})`).join("; ") +
          ".",
      );
    }
    if (r.nextUp) {
      lines.push(
        `${r.pendingDrafts.length > 0 ? "After those, the next" : "The next"} guide to draft is ` +
          `"${r.nextUp.workingTitle}" (/blog/${r.nextUp.slug}), targeting "${r.nextUp.targetQuery}" ` +
          `in the "${r.nextUp.pillarTitle}" cluster. ${r.queueRemaining} more planned guide${r.queueRemaining === 1 ? "" : "s"} after it ` +
          `(${r.publishedCount} of ${r.plannedTotal} published).`,
      );
    } else if (r.pendingDrafts.length === 0) {
      lines.push(
        `The cluster plan is fully published (${r.publishedCount} of ${r.plannedTotal} guides) — switch to refresh mode this week.`,
      );
      if (r.refreshCandidate) {
        const c = r.refreshCandidate;
        lines.push(
          `Best refresh candidate: ${shortPage(c.url)} — clicks ${c.previousClicks} → ${c.currentClicks}, ` +
            `impressions ${c.previousImpressions} → ${c.currentImpressions}, avg pos ${c.position ? c.position.toFixed(1) : "n/a"}. ` +
            `Update its facts, tighten the intro answer, and add internal links.`,
        );
      } else if (r.refreshNearWinner) {
        const w = r.refreshNearWinner;
        lines.push(
          `No blog search stats this week — instead, refresh the page behind the top near-winner query ` +
            `"${w.query}" (${w.impressions} impressions, avg pos ${w.position.toFixed(1)}).`,
        );
      } else {
        lines.push(
          "No blog stats or near-winner queries this week — pick the oldest published guide and refresh it.",
        );
      }
    }
    html +=
      `<div style="background:#f6f3ec;border:1px solid #d8d2c6;border-radius:8px;padding:14px 16px;margin:0 0 20px;">` +
      `<p style="${BODY_TEXT}margin:0 0 6px;"><strong>Next guide up — weekly blog cadence</strong></p>` +
      lines.map((l) => `<p style="${BODY_TEXT}margin:0 0 6px;">${escapeHtml(l)}</p>`).join("") +
      `</div>`;
    text.push("Next guide up — weekly blog cadence:", ...lines.map((l) => `  ${l}`), "");
  }

  html += moverTableHtml("Rising queries", data.risingQueries, false);
  html += moverTableHtml("Falling queries", data.fallingQueries, false);
  html += moverTableHtml("Rising pages", data.risingPages, true);
  html += moverTableHtml("Falling pages", data.fallingPages, true);
  text.push(...moverTableText("Rising queries", data.risingQueries, false));
  text.push(...moverTableText("Falling queries", data.fallingQueries, false));
  text.push(...moverTableText("Rising pages", data.risingPages, true));
  text.push(...moverTableText("Falling pages", data.fallingPages, true));

  // Near-winners
  if (data.nearWinners.length === 0) {
    html += `<p style="${BODY_TEXT}"><strong>Near-winners (position 8–20):</strong> none met the impressions threshold this week.</p>`;
    text.push("Near-winners (position 8–20): none met the impressions threshold this week.", "");
  } else {
    const rows = data.nearWinners
      .map(
        (r) =>
          `<tr><td style="${TD_STYLE}">${escapeHtml(r.query)}</td>` +
          `<td style="${TD_NUM}">${r.impressions}</td>` +
          `<td style="${TD_NUM}">${r.clicks}</td>` +
          `<td style="${TD_NUM}">${r.position.toFixed(1)}</td></tr>`,
      )
      .join("");
    html +=
      `<p style="${BODY_TEXT}margin-bottom:6px;"><strong>Near-winners — queries at position 8–20</strong> (a content refresh could push these to page one)</p>` +
      `<table style="${TABLE_STYLE}"><tr><th style="${TH_STYLE}">Query</th><th style="${TH_STYLE}text-align:right;">Impressions</th><th style="${TH_STYLE}text-align:right;">Clicks</th><th style="${TH_STYLE}text-align:right;">Avg pos</th></tr>${rows}</table>`;
    text.push(
      "Near-winners — queries at position 8–20 (a content refresh could push these to page one):",
      ...data.nearWinners.map(
        (r) =>
          `  - "${r.query}" — ${r.impressions} impressions, ${r.clicks} clicks, avg pos ${r.position.toFixed(1)}`,
      ),
      "",
    );
  }

  // Blog articles
  if (data.blogPages.length > 0) {
    const rows = data.blogPages
      .map(
        (r) =>
          `<tr><td style="${TD_STYLE}"><a href="${escapeHtml(r.url)}" style="color:${BRAND.gold};">${escapeHtml(shortPage(r.url))}</a></td>` +
          `<td style="${TD_NUM}">${r.previousClicks} → ${r.currentClicks}</td>` +
          `<td style="${TD_NUM}">${r.previousImpressions} → ${r.currentImpressions}</td>` +
          `<td style="${TD_NUM}">${r.position ? r.position.toFixed(1) : "—"}</td></tr>`,
      )
      .join("");
    html +=
      `<p style="${BODY_TEXT}margin-bottom:6px;"><strong>Blog guides</strong> (watch for decay — a guide whose clicks slide two weeks running is due a refresh)</p>` +
      `<table style="${TABLE_STYLE}"><tr><th style="${TH_STYLE}">Article</th><th style="${TH_STYLE}text-align:right;">Clicks (prev → now)</th><th style="${TH_STYLE}text-align:right;">Impressions</th><th style="${TH_STYLE}text-align:right;">Avg pos</th></tr>${rows}</table>`;
    text.push(
      "Blog guides (watch for decay):",
      ...data.blogPages.map(
        (r) =>
          `  - ${r.url} — clicks ${r.previousClicks} → ${r.currentClicks}, impressions ${r.previousImpressions} → ${r.currentImpressions}, avg pos ${r.position ? r.position.toFixed(1) : "n/a"}`,
      ),
      "",
    );
  }

  // GA4 movers
  if (data.ga4Risers !== null && data.ga4Fallers !== null) {
    const ga4Line = (r: SeoDigestGa4Row) =>
      `${shortPage(r.pagePath)} — visitors ${r.previousUsers} → ${r.currentUsers}`;
    const list = (title: string, rows: SeoDigestGa4Row[]) =>
      rows.length === 0
        ? `<p style="${BODY_TEXT}"><strong>${escapeHtml(title)}:</strong> none.</p>`
        : `<p style="${BODY_TEXT}margin-bottom:6px;"><strong>${escapeHtml(title)}</strong></p><table style="${TABLE_STYLE}">${rows
            .map(
              (r) =>
                `<tr><td style="${TD_STYLE}">${escapeHtml(shortPage(r.pagePath))}</td><td style="${TD_NUM}">${r.previousUsers} → ${r.currentUsers} (${fmtDelta(r.currentUsers, r.previousUsers)})</td></tr>`,
            )
            .join("")}</table>`;
    html += list("GA4 pages gaining visitors", data.ga4Risers);
    html += list("GA4 pages losing visitors", data.ga4Fallers);
    text.push(
      "GA4 pages gaining visitors:",
      ...(data.ga4Risers.length ? data.ga4Risers.map((r) => `  - ${ga4Line(r)}`) : ["  (none)"]),
      "",
      "GA4 pages losing visitors:",
      ...(data.ga4Fallers.length ? data.ga4Fallers.map((r) => `  - ${ga4Line(r)}`) : ["  (none)"]),
      "",
    );
  }

  if (data.notes.length > 0) {
    html += `<p style="${BODY_TEXT}"><strong>Notes:</strong> ${data.notes.map((n) => escapeHtml(n)).join(" ")}</p>`;
    text.push("Notes:", ...data.notes.map((n) => `  - ${n}`), "");
  }

  const outro =
    "This digest is sent automatically once a week. Windows end three days back because Search Console data lags ~2–3 days.";
  html += `<p style="${BODY_TEXT}font-size:13px;color:#8a8377;">${escapeHtml(outro)}</p>`;
  text.push(outro, "", TEXT_FOOTER);

  const htmlShell = renderEmailShell({
    preheader: `Search movers for ${windows.current.start} – ${windows.current.end}: rising, falling, and near-winner queries.`,
    kicker: "Weekly Search Digest",
    heading: "Search Movers & Near-Winners",
    bodyHtml: html,
  });

  return { subject, html: htmlShell, text: text.join("\n") };
}

/**
 * Operational alert: the weekly SEO digest could not read Search Console —
 * either the service account was never granted access (403 until the owner
 * adds it in Search Console), the Search Console API is not enabled in the
 * GCP project, or the check has failed repeatedly.
 *
 * `gscReason` distinguishes the two 403 cases so the alert gives the exact
 * remediation steps:
 *   - "SERVICE_DISABLED" → the Google Search Console API is off in the GCP
 *     project; the owner must enable it in Google Cloud Console.
 *   - "PERMISSION_DENIED" (default) → the service account is not added as a
 *     user on the Search Console property.
 */
export function renderSeoDigestFailureAlert(opts: {
  serviceAccountEmail: string;
  siteUrl: string;
  detail: string;
  gscReason?: "SERVICE_DISABLED" | "PERMISSION_DENIED";
}): RenderedEmail {
  const { serviceAccountEmail, siteUrl, detail, gscReason } = opts;
  const subject = "Website alert: the weekly search digest could not read Search Console";

  const intro = `The automatic weekly search digest could not pull data from Google Search Console for ${siteUrl}. ${detail}`;

  let remedyText: string;
  let remedyHtml: string;
  if (gscReason === "SERVICE_DISABLED") {
    const gcpUrl = `https://console.developers.google.com/apis/api/searchconsole.googleapis.com/overview`;
    remedyText =
      `What to do: the Google Search Console API is not enabled in the service account's GCP project. ` +
      `Open Google Cloud Console → APIs & Services → Enable APIs → search for "Google Search Console API" and enable it, ` +
      `or go directly to ${gcpUrl}. ` +
      `The service account email is ${serviceAccountEmail}. Once enabled, the digest retries automatically (this alert is sent at most once per week).`;
    remedyHtml =
      `<p style="${BODY_TEXT}"><strong>What to do:</strong> The Google Search Console API is not enabled ` +
      `in the GCP project that owns this service account (${escapeHtml(serviceAccountEmail)}). ` +
      `Enable it in Google Cloud Console → APIs &amp; Services → Enable APIs, or ` +
      `<a href="${escapeHtml(gcpUrl)}" style="color:#0066cc">open the API directly</a>. ` +
      `The digest retries automatically; this alert is sent at most once per week.</p>`;
  } else {
    remedyText =
      `What to do: open Google Search Console for the property (${siteUrl}), go to Settings → Users and permissions, ` +
      `and add ${serviceAccountEmail} with at least "Restricted" (read) access. ` +
      `If the site is verified as a different property type, set the GSC_SITE_URL environment variable to the exact property ` +
      `(e.g. "sc-domain:rentatexhibit.com" or "https://www.rentatexhibit.com/"). ` +
      `The digest retries automatically; this alert is sent at most once per week.`;
    remedyHtml =
      `<p style="${BODY_TEXT}"><strong>What to do:</strong> ${escapeHtml(
        `open Google Search Console for ${siteUrl}, go to Settings → Users and permissions, and add ${serviceAccountEmail} with at least "Restricted" (read) access. If the site is verified as a different property type, set GSC_SITE_URL to the exact property. The digest retries automatically; this alert is sent at most once per week.`,
      )}</p>`;
  }

  const html = `<p style="${BODY_TEXT}">${escapeHtml(intro)}</p>` + remedyHtml;
  const text = [intro, "", remedyText, "", TEXT_FOOTER].join("\n");

  const htmlShell = renderEmailShell({
    preheader:
      gscReason === "SERVICE_DISABLED"
        ? "Enable the Google Search Console API in the GCP project to resume the weekly digest."
        : "The weekly search digest needs Search Console access granted to the service account.",
    kicker: "Website Alert",
    heading: "Search Digest Needs Access",
    bodyHtml: html,
  });

  return { subject, html: htmlShell, text };
}

/**
 * Operational alert: a real visitor's browser reported a CSP violation —
 * the enforced policy blocked something the live site tried to load or run
 * (the classic cause: a GTM Custom HTML tag published after the prepublish
 * CSP check passed). Deduped per violation signature per day by the caller
 * (cspReportAlert).
 */
export function renderCspViolationAlert(opts: {
  effectiveDirective: string;
  blockedUri: string;
  documentUri: string;
  sourceFile: string | null;
  scriptSample: string | null;
  disposition: string | null;
}): RenderedEmail {
  const { effectiveDirective, blockedUri, documentUri, sourceFile, scriptSample, disposition } =
    opts;
  const subject =
    "Website alert: a visitor's browser blocked something the site needs (CSP violation)";

  const enforced = disposition !== "report";
  const intro = enforced
    ? `A real visitor's browser reported that the site's Content-Security-Policy blocked a resource. Whatever was blocked did NOT load or run for that visitor — if it is something the site needs (analytics, maps, a tag-manager script), it is silently broken in production right now.`
    : `A real visitor's browser reported a Content-Security-Policy violation in report-only mode. Nothing was blocked yet, but the same load WOULD be blocked once the policy is enforced.`;

  const details: Array<[string, string]> = [
    ["Directive", effectiveDirective],
    ["Blocked", blockedUri],
    ["Page", documentUri],
  ];
  if (sourceFile) details.push(["Triggered by", sourceFile]);
  if (scriptSample) details.push(["Script sample", scriptSample]);

  const remedyText =
    'reproduce on the live site with the browser console open (the violation is logged there verbatim). If the blocked resource is legitimate — most often a newly published GTM Custom HTML tag — add its hash or host to the CSP in the web server (server/index.mjs) and republish; the prepublish check:csp run prints the exact hash to add. If it is NOT something the site should load, treat it as an injection attempt doing exactly what the policy is for. Further identical reports are deduped: this signature emails at most once per day.';

  const html =
    `<p style="${BODY_TEXT}">${escapeHtml(intro)}</p>` +
    `<ul style="${BODY_TEXT}">${details
      .map(([k, v]) => `<li><strong>${escapeHtml(k)}:</strong> ${escapeHtml(v)}</li>`)
      .join("")}</ul>` +
    `<p style="${BODY_TEXT}"><strong>What to do:</strong> ${escapeHtml(remedyText)}</p>`;

  const text = [
    intro,
    "",
    ...details.map(([k, v]) => `- ${k}: ${v}`),
    "",
    `What to do: ${remedyText}`,
    "",
    TEXT_FOOTER,
  ].join("\n");

  const htmlShell = renderEmailShell({
    preheader: "A visitor's browser blocked a resource under the site's security policy.",
    kicker: "Website Alert",
    heading: "Security Policy Blocked A Resource",
    bodyHtml: html,
  });

  return { subject, html: htmlShell, text };
}

/**
 * Operational alert: the always-on starting-price watchdog (startingPriceCheck)
 * found that the homepage's baked "Apartments currently start at $X,XXX"
 * figure no longer matches the live /api/availability minimum — the homepage
 * is advertising a stale rent to prospective renters and to search engines.
 */
export function renderWatchdogRosterAlert(opts: {
  missing: string[];
  deploymentLogsUrl: string;
}): RenderedEmail {
  const { missing, deploymentLogsUrl } = opts;
  const subject =
    missing.length === 1
      ? `Website alert: watchdog "${missing[0]}" did not start after the last publish`
      : `Website alert: ${missing.length} watchdogs did not start after the last publish`;

  const intro =
    `${missing.length === 1 ? "One watchdog" : `${missing.length} watchdogs`} that should be running on the live server ` +
    `did not register after the last publish. Each watchdog is a background health-check; a missing one means its ` +
    `monitoring is silently off — possibly because the watchdog hit a kill switch, a missing env var, or crashed at startup.`;

  const remedy =
    `What to do: open the api-server deployment logs (${deploymentLogsUrl}) and look for the watchdog's own ` +
    `"… watchdog started" line. If it never appears, check for an early-return condition (NODE_ENV guard, missing ` +
    `env var, or an unhandled exception in the start* function). The EXPECTED_WATCHDOGS list in ` +
    `api-server/src/lib/startupSummary.ts is the source of truth. This alert is sent at most once per day.`;

  const html =
    `<p style="${BODY_TEXT}">${escapeHtml(intro)}</p>` +
    `<p style="${BODY_TEXT}"><strong>Missing watchdog${missing.length === 1 ? "" : "s"}:</strong></p>` +
    `<ul style="${BODY_TEXT}">${missing.map((n) => `<li>${escapeHtml(n)}</li>`).join("")}</ul>` +
    `<p style="${BODY_TEXT}"><strong>What to do:</strong> open the ` +
    `<a href="${escapeHtml(deploymentLogsUrl)}" style="color:#8b6f47;">api-server deployment logs</a> ` +
    `and look for the watchdog's "… watchdog started" line. If it never appears, check for a ` +
    `NODE_ENV guard, missing env var, or unhandled exception in the start* function. ` +
    `EXPECTED_WATCHDOGS in api-server/src/lib/startupSummary.ts is the source of truth. ` +
    `This alert is sent at most once per day.</p>`;

  const text = [
    intro,
    "",
    `Missing watchdog${missing.length === 1 ? "" : "s"}:`,
    ...missing.map((n) => `- ${n}`),
    "",
    remedy,
    "",
    TEXT_FOOTER,
  ].join("\n");

  const htmlShell = renderEmailShell({
    preheader: `${missing.length === 1 ? `Watchdog "${missing[0]}"` : `${missing.length} watchdogs`} did not start after the last publish.`,
    kicker: "Website Alert",
    heading: `Watchdog${missing.length === 1 ? "" : "s"} Missing After Publish`,
    bodyHtml: html,
  });

  return { subject, html: htmlShell, text };
}
export function renderStartingPriceCheckAlert(opts: {
  failures: string[];
}): RenderedEmail {
  const { failures } = opts;
  const subject =
    "Website alert: homepage is showing a stale starting rent — re-publish needed";

  const intro =
    `The automatic post-publish check of www.rentatexhibit.com found ${failures.length} starting-price mismatch(es). ` +
    "The homepage's baked \"Apartments currently start at $X,XXX\" figure does not match the live availability feed — " +
    "prospective renters (and search engines) are seeing a stale minimum rent.";
  const remedy =
    "What to do: re-publish the website after the next availability sync (or trigger a manual sync) to bake the current minimum rent into the homepage. " +
    "Run `pnpm --filter @workspace/exhibit-on-superior run check:starting-price` from the workspace to confirm after the publish. " +
    "This alert is sent at most once per day.";

  const html =
    `<p style="${BODY_TEXT}">${escapeHtml(intro)}</p>` +
    `<ul style="${BODY_TEXT}">${failures
      .map((f) => `<li>${escapeHtml(f)}</li>`)
      .join("")}</ul>` +
    `<p style="${BODY_TEXT}"><strong>What to do:</strong> ${escapeHtml(
      "re-publish the website after the next availability sync to bake the current minimum rent. " +
        "Run check:starting-price from the workspace to confirm after the publish. " +
        "This alert is sent at most once per day.",
    )}</p>`;

  const text = [
    intro,
    "",
    ...failures.map((f) => `- ${f}`),
    "",
    remedy,
    "",
    TEXT_FOOTER,
  ].join("\n");

  const htmlShell = renderEmailShell({
    preheader:
      "The homepage is showing a stale starting rent — re-publish to correct it.",
    kicker: "Website Alert",
    heading: "Starting Rent Mismatch Detected",
    bodyHtml: html,
  });

  return { subject, html: htmlShell, text };
}
