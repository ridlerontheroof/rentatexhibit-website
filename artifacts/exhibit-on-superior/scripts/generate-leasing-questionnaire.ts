/**
 * Generates the phone-team property playbook and follow-up questionnaire.
 *
 * The playbook pulls directly from the site's canonical FAQ, Knowledge Center,
 * fee, office-hours, screening, building-fact, and Walk Score data. This keeps
 * the call-center reference aligned with the published site instead of
 * maintaining a second hand-typed fact sheet.
 *
 * Outputs (docs/leasing-questionnaire/):
 *   - leasing-questionnaire.md
 *   - leasing-questionnaire.html
 *   - Exhibit-Leasing-Phone-Team-Playbook.pdf
 *   - Exhibit-Leasing-Facts-Questionnaire.pdf (compatibility filename)
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FAQ_HUB_TOPICS,
  SITE_URL,
} from '../src/data/seo';
import {
  KNOWLEDGE_ARTICLES,
  KNOWLEDGE_CATEGORIES,
  KNOWLEDGE_REVIEWED_DATE,
  KNOWLEDGE_REVIEW_MAX_AGE_DAYS,
  knowledgeUpdated,
} from '../src/data/knowledge';
import {
  FEE_SUMMARY,
  UTILITY_BUNDLE,
} from '../src/data/fees';
import {
  APPROVAL_WINDOW_DISPLAY,
  CREDIT_SCORE_COSIGNER_MIN,
  CREDIT_SCORE_MIN,
  OFFICE_HOURS_LINES,
  RENTERS_INSURANCE_LLI_DISPLAY,
  SQFT_RANGE_DISPLAY,
  UNIT_TOTAL,
} from '../src/data/propertyFacts';
import {
  WALK_SCORES,
  WALK_SCORE_SOURCE_URL,
  WALK_SCORES_CHECKED,
} from '../src/data/walkScores';
import {
  RESIDENT_INTERNET_FACTS,
  formatInternetMonthlyPrice,
  internetEffectiveNotice,
} from '../src/data/internetFacts';

const GENERATED = new Date().toISOString().slice(0, 10);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'docs', 'leasing-questionnaire');
mkdirSync(outDir, { recursive: true });

const propertyConfig = JSON.parse(
  readFileSync(join(root, 'property-config.json'), 'utf8'),
) as {
  nap: {
    streetAddress: string;
    locality: string;
    region: string;
    postalCode: string;
    phone: string;
    email: string;
  };
  leasing: { applyUrl: string; residentPortalUrl: string };
};

const phoneDisplay = propertyConfig.nap.phone.replace(
  /^\+1(\d{3})(\d{3})(\d{4})$/,
  '$1-$2-$3',
);
const address = `${propertyConfig.nap.streetAddress}, ${propertyConfig.nap.locality}, ${propertyConfig.nap.region} ${propertyConfig.nap.postalCode}`;
const knowledgeCount = KNOWLEDGE_ARTICLES.length;
const faqCount = FAQ_HUB_TOPICS.reduce((sum, topic) => sum + topic.faqs.length, 0);
const changeableCount = KNOWLEDGE_ARTICLES.filter((article) => article.changeableFacts).length;
const internetNotice = internetEffectiveNotice();
const playbookText = (value: string): string => value;

const quickSlugs = [
  'how-much-is-rent',
  'what-fees-in-addition-to-rent',
  'schedule-a-tour',
  'how-do-i-apply',
  'credit-score-required',
  'lease-terms',
  'full-amenity-list',
  'what-are-pet-fees',
  'how-much-does-parking-cost',
  'front-desk-hours',
  'leasing-office-hours',
  'resident-portal',
];
const bySlug = new Map(KNOWLEDGE_ARTICLES.map((article) => [article.slug, article]));
const quickAnswers = quickSlugs.flatMap((slug) => {
  const article = bySlug.get(slug);
  return article ? [article] : [];
});

const mdLink = (path: string): string =>
  path.startsWith('http') ? path : `${SITE_URL}${path}`;

let md = `# Exhibit On Superior — Phone Team Property Playbook

Generated ${GENERATED} · ${faqCount} website FAQs · ${knowledgeCount} Knowledge Center answers

> **Internal call-team reference.** Use the short answer first, then add detail only when
> the caller needs it. Never guess. Pricing, concessions, available units, move-in dates,
> parking availability, and tour openings can change; verify those live before promising them.

## First 30 Seconds

| Item | Answer |
|---|---|
| Property | Exhibit On Superior |
| Address | ${address} |
| Leasing phone | ${phoneDisplay} |
| Leasing email | ${propertyConfig.nap.email} |
| Website | ${SITE_URL} |
| Live homes and pricing | ${SITE_URL}/available-units |
| Schedule a tour | ${SITE_URL}/schedule-a-tour |
| Apply | ${propertyConfig.leasing.applyUrl} |
| Resident portal | ${propertyConfig.leasing.residentPortalUrl} |
| Building | ${UNIT_TOTAL} residences; ${SQFT_RANGE_DISPLAY} sq ft |

### Leasing office hours
${OFFICE_HOURS_LINES.map((line) => `- ${line}`).join('\n')}

## Answer Safely

- **LIVE:** Always open the Available Units page for rent, specials, unit availability,
  move-in dates, and unit-specific square footage. Do not quote an old screenshot.
- **VERIFY:** Confirm parking/storage availability, lease terms, qualification edge cases,
  accommodations, and seasonal amenity access before making a promise.
- **ESCALATE:** Send legal, fair-housing, reasonable-accommodation, application-denial,
  payment-account, and unresolved resident matters to the on-site team.
- **EMERGENCY:** Direct immediate threats to life or safety to 911. Do not diagnose or
  promise maintenance response times.
- **PRIVACY:** Do not request Social Security numbers, payment-card details, passwords,
  or application documents over an ordinary phone call or email.

## Most-Asked Questions — Call Script

${quickAnswers
  .map(
    (article) => `### ${article.question}

${playbookText(article.answer)}

${article.changeableFacts ? '**Verify live before quoting.** ' : ''}[Full answer](${SITE_URL}/knowledge/${article.slug}) · Reviewed ${knowledgeUpdated(article)}
`,
  )
  .join('\n')}

## Fees at a Glance

| Item | Amount | Frequency | Notes |
|---|---|---|---|
${FEE_SUMMARY.map((fee) => `| ${fee.item} | ${fee.amount} | ${fee.frequency} | ${fee.notes} |`).join('\n')}

### Utility & Service Amenity fee by floor plan

| Floor plan | Size | Monthly fee |
|---|---|---|
${UTILITY_BUNDLE.map((tier) => `| ${tier.type} | ${tier.size} | ${tier.fee} |`).join('\n')}

## Resident Internet — Zentro

> **${internetNotice}**

### New leases

| Floor plan | Monthly price |
|---|---|
${RESIDENT_INTERNET_FACTS.newLeasePricing.map((tier) => `| ${tier.floorPlan} | ${formatInternetMonthlyPrice(tier.monthlyPrice)} |`).join('\n')}

### Existing leases

- Standard monthly price: **${formatInternetMonthlyPrice(RESIDENT_INTERNET_FACTS.existingLease.standardMonthlyPrice)}**
- Price match: ${RESIDENT_INTERNET_FACTS.existingLease.priceMatchPolicy}
- The **${formatInternetMonthlyPrice(RESIDENT_INTERNET_FACTS.existingLease.priceMatchMinimumMonthlyPrice)} price-match minimum** is not the standard price.

### What staff should explain

- Speed: **${RESIDENT_INTERNET_FACTS.service.speed}**.
- ${RESIDENT_INTERNET_FACTS.service.delivery}
- ${RESIDENT_INTERNET_FACTS.service.wifi}

## Application Snapshot

- Standard minimum credit score: **${CREDIT_SCORE_MIN}**
- With a qualified co-signer: **${CREDIT_SCORE_COSIGNER_MIN}+**
- Typical review window: **${APPROVAL_WINDOW_DISPLAY}**
- Required liability-to-landlord coverage before move-in: **${RENTERS_INSURANCE_LLI_DISPLAY}**
- Use the secure online application; never collect sensitive application data by phone.

## Location Snapshot

${WALK_SCORES.map((metric) => `- ${metric.name}: **${metric.score}/100 — ${metric.label}**`).join('\n')}

Scores last checked ${WALK_SCORES_CHECKED}. [Source](${WALK_SCORE_SOURCE_URL})

## Current Website FAQs

${FAQ_HUB_TOPICS.map(
  (topic) => `### ${topic.title}

${topic.faqs
  .map(
    (faq) => `**Q: ${faq.q}**

A: ${playbookText(faq.a)}${faq.knowledgeSlug ? `\n\n[Full answer](${SITE_URL}/knowledge/${faq.knowledgeSlug})` : ''}
`,
  )
  .join('\n')}`,
).join('\n')}

## Complete Knowledge Center

The short answers below are the current published answer set. ${changeableCount} entries are
marked **VERIFY LIVE** because their facts may change. The default content review date is
${KNOWLEDGE_REVIEWED_DATE}; the freshness guard is ${KNOWLEDGE_REVIEW_MAX_AGE_DAYS} days.

${KNOWLEDGE_CATEGORIES.map((category) => {
  const articles = KNOWLEDGE_ARTICLES.filter((article) => article.category === category);
  return `### ${category}

${articles
  .map(
    (article) => `**${article.question}**${article.changeableFacts ? ' — VERIFY LIVE' : ''}

${playbookText(article.answer)}

[Open article](${SITE_URL}/knowledge/${article.slug}) · Reviewed ${knowledgeUpdated(article)}
`,
  )
  .join('\n')}`;
}).join('\n')}

## Call Follow-Up / Leasing Questionnaire

Use this section when the published answer does not resolve the caller's question.

| Field | Notes |
|---|---|
| Date and time | |
| Agent | |
| Caller name | |
| Preferred contact method | |
| Move-in timing | |
| Desired floor plan / unit | |
| Question or request | |
| Answer provided / source checked | |
| Needs on-site follow-up? | Yes / No |
| Assigned to | |
| Follow-up due | |
| Resolution | |

### New or changed property fact

- Question callers are asking:
- Current published answer:
- Confirmed replacement answer:
- Confirmed by:
- Effective date:
- Should this be public on the website? Yes / No

---
Compiled from the current Exhibit FAQ page, Knowledge Center, property configuration,
fee schedule, office-hours constants, application facts, and Walk Score source. For every
linked answer, the live page at ${SITE_URL} remains the publishing reference.
`;

writeFileSync(join(outDir, 'leasing-questionnaire.md'), md);

const esc = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const link = (label: string, href: string): string =>
  `<a href="${esc(mdLink(href))}">${esc(label)}</a>`;

const quickHtml = quickAnswers
  .map(
    (article) => `<article class="qa priority">
      <h3>${esc(article.question)}${article.changeableFacts ? '<span class="badge verify">Verify live</span>' : ''}</h3>
      <p>${esc(playbookText(article.answer))}</p>
      <div class="source">${link('Full answer', `/knowledge/${article.slug}`)} · Reviewed ${esc(knowledgeUpdated(article))}</div>
    </article>`,
  )
  .join('');

const faqHtml = FAQ_HUB_TOPICS.map(
  (topic) => `<section class="topic">
    <h2>${esc(topic.title)}</h2>
    ${topic.faqs
      .map(
        (faq) => `<article class="qa">
          <h3>${esc(faq.q)}</h3>
          <p>${esc(playbookText(faq.a))}</p>
          ${faq.knowledgeSlug ? `<div class="source">${link('Full answer', `/knowledge/${faq.knowledgeSlug}`)}</div>` : ''}
        </article>`,
      )
      .join('')}
  </section>`,
).join('');

const knowledgeHtml = KNOWLEDGE_CATEGORIES.map((category) => {
  const articles = KNOWLEDGE_ARTICLES.filter((article) => article.category === category);
  return `<section class="topic knowledge">
    <h2>${esc(category)}</h2>
    ${articles
      .map(
        (article) => `<article class="qa">
          <h3>${esc(article.question)}${article.changeableFacts ? '<span class="badge verify">Verify live</span>' : ''}</h3>
          <p>${esc(playbookText(article.answer))}</p>
          <div class="source">${link('Open article', `/knowledge/${article.slug}`)} · Reviewed ${esc(knowledgeUpdated(article))}</div>
        </article>`,
      )
      .join('')}
  </section>`;
}).join('');

const feeRows = FEE_SUMMARY.map(
  (fee) => `<tr><td>${esc(fee.item)}</td><td><strong>${esc(fee.amount)}</strong></td><td>${esc(fee.frequency)}</td><td>${esc(fee.notes)}</td></tr>`,
).join('');
const utilityRows = UTILITY_BUNDLE.map(
  (tier) => `<tr><td>${esc(tier.type)}</td><td>${esc(tier.size)}</td><td><strong>${esc(tier.fee)}</strong></td></tr>`,
).join('');
const internetRows = RESIDENT_INTERNET_FACTS.newLeasePricing.map(
  (tier) => `<tr><td>${esc(tier.floorPlan)}</td><td><strong>${esc(formatInternetMonthlyPrice(tier.monthlyPrice))}</strong></td></tr>`,
).join('');

const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Exhibit Phone Team Property Playbook</title>
<style>
@page { size: Letter; margin: .52in .55in .55in; }
* { box-sizing: border-box; }
body { margin: 0; color: #272727; font: 10.2px/1.42 Arial, sans-serif; }
a { color: #7b642c; text-decoration: underline; }
header { border-bottom: 4px solid #b39a5f; margin-bottom: 14px; padding-bottom: 10px; display:flex; justify-content:space-between; align-items:flex-end; }
h1 { margin:0; font-size:22px; line-height:1; text-transform:uppercase; letter-spacing:1.3px; }
h1 em { color:#b39a5f; font-family:Georgia,serif; font-weight:normal; text-transform:none; }
.meta { color:#777; text-align:right; font-size:9px; }
.alert { background:#faf7ef; border:1px solid #ded2b7; border-left:5px solid #b39a5f; padding:9px 11px; margin:9px 0; }
.danger { border-left-color:#9e3939; background:#fff5f3; }
.quick-grid { display:grid; grid-template-columns:1fr 1fr; gap:7px; margin:10px 0 14px; }
.card { border:1px solid #ded8cb; padding:8px 9px; break-inside:avoid; }
.card strong { display:block; color:#8c743a; text-transform:uppercase; font-size:8px; letter-spacing:.8px; margin-bottom:2px; }
h2 { margin:17px 0 6px; padding-bottom:3px; border-bottom:1px solid #cdbb91; color:#8c743a; font-size:14px; text-transform:uppercase; letter-spacing:1.2px; break-after:avoid; }
h3 { margin:0 0 3px; font-size:10.7px; line-height:1.3; }
p { margin:0 0 4px; }
ul { margin:5px 0 10px 18px; padding:0; }
li { margin:2px 0; }
.qa { padding:6px 0 7px; border-bottom:1px solid #ece8df; break-inside:avoid; }
.priority { border:1px solid #dfd5bd; border-left:4px solid #b39a5f; padding:8px 9px; margin:5px 0; }
.source { color:#777; font-size:8.5px; }
.badge { display:inline-block; margin-left:6px; padding:1px 5px; border-radius:8px; font-size:7px; letter-spacing:.5px; text-transform:uppercase; vertical-align:1px; }
.verify { color:#8e301f; background:#fae7df; border:1px solid #e7b9aa; }
table { width:100%; border-collapse:collapse; margin:6px 0 12px; break-inside:auto; }
th { background:#272727; color:white; text-align:left; }
th,td { border:1px solid #ddd7ca; padding:4px 5px; vertical-align:top; }
tr { break-inside:avoid; }
.page-break { break-before:page; }
.form td { height:27px; }
.form td:first-child { width:31%; font-weight:bold; color:#78632f; }
footer { margin-top:16px; border-top:1px solid #ddd; padding-top:5px; color:#888; font-size:8px; }
</style></head><body>
<header><div><h1>Exhibit <em>on</em> Superior</h1><div>Phone Team Property Playbook</div></div><div class="meta">Generated ${GENERATED}<br>${knowledgeCount} Knowledge answers · ${faqCount} FAQs</div></header>
<div class="alert"><strong>Internal call-team reference.</strong> Start with the short answer. Verify live facts before promising them, and never guess.</div>
<div class="quick-grid">
  <div class="card"><strong>Property</strong>${esc(address)}<br>${esc(phoneDisplay)} · ${esc(propertyConfig.nap.email)}</div>
  <div class="card"><strong>Online</strong>${link('Website', SITE_URL)} · ${link('Live units', '/available-units')} · ${link('Tours', '/schedule-a-tour')}</div>
  <div class="card"><strong>Building</strong>${UNIT_TOTAL} residences · ${esc(SQFT_RANGE_DISPLAY)} sq ft</div>
  <div class="card"><strong>Office hours</strong>${OFFICE_HOURS_LINES.map(esc).join('<br>')}</div>
</div>
<h2>Answer Safely</h2>
<ul>
  <li><strong>LIVE:</strong> Open Available Units for rents, specials, availability, move-in dates, and unit-specific facts.</li>
  <li><strong>VERIFY:</strong> Confirm parking/storage availability, lease terms, edge-case qualifications, accommodations, and seasonal access.</li>
  <li><strong>ESCALATE:</strong> Send legal, fair-housing, accommodations, denials, payments, and unresolved resident issues to the on-site team.</li>
  <li><strong>PRIVACY:</strong> Never collect SSNs, payment-card details, passwords, or application documents by ordinary phone or email.</li>
</ul>
<h2>Most-Asked Questions — Call Script</h2>${quickHtml}
<h2>Fees at a Glance</h2>
<table><thead><tr><th>Item</th><th>Amount</th><th>Frequency</th><th>Notes</th></tr></thead><tbody>${feeRows}</tbody></table>
<h2>Utility Fee by Floor Plan</h2>
<table><thead><tr><th>Floor plan</th><th>Size</th><th>Monthly</th></tr></thead><tbody>${utilityRows}</tbody></table>
<section class="internet">
<h2>Resident Internet — Zentro</h2>
<div class="alert danger"><strong>${esc(internetNotice)}</strong></div>
<h3>New leases</h3>
<table><thead><tr><th>Floor plan</th><th>Monthly price</th></tr></thead><tbody>${internetRows}</tbody></table>
<h3>Existing leases</h3>
<ul>
  <li>Standard monthly price: <strong>${esc(formatInternetMonthlyPrice(RESIDENT_INTERNET_FACTS.existingLease.standardMonthlyPrice))}</strong></li>
  <li>${esc(RESIDENT_INTERNET_FACTS.existingLease.priceMatchPolicy)}</li>
  <li>The <strong>${esc(formatInternetMonthlyPrice(RESIDENT_INTERNET_FACTS.existingLease.priceMatchMinimumMonthlyPrice))} price-match minimum</strong> is not the standard price.</li>
</ul>
<h3>What staff should explain</h3>
<p><strong>Speed:</strong> ${esc(RESIDENT_INTERNET_FACTS.service.speed)}. ${esc(RESIDENT_INTERNET_FACTS.service.delivery)} ${esc(RESIDENT_INTERNET_FACTS.service.wifi)}</p>
</section>
<h2>Application Snapshot</h2>
<ul><li>Credit: ${CREDIT_SCORE_MIN}; ${CREDIT_SCORE_COSIGNER_MIN}+ with qualified co-signer</li><li>Typical review: ${esc(APPROVAL_WINDOW_DISPLAY)}</li><li>Liability-to-landlord coverage: ${esc(RENTERS_INSURANCE_LLI_DISPLAY)}</li><li>${link('Secure application', propertyConfig.leasing.applyUrl)} · ${link('Resident portal', propertyConfig.leasing.residentPortalUrl)}</li></ul>
<h2>Location Snapshot</h2>
<ul>${WALK_SCORES.map((metric) => `<li>${esc(metric.name)}: <strong>${metric.score}/100 — ${esc(metric.label)}</strong></li>`).join('')}</ul>
<p class="source">Checked ${esc(WALK_SCORES_CHECKED)} · ${link('Walk Score source', WALK_SCORE_SOURCE_URL)}</p>
<div class="page-break"></div>
<h1>Current Website FAQs</h1><p>${faqCount} answers currently displayed on the FAQ hub.</p>${faqHtml}
<div class="page-break"></div>
<h1>Complete Knowledge Center</h1>
<div class="alert">${knowledgeCount} published answers. <strong>${changeableCount} are marked Verify Live.</strong> Default review date: ${KNOWLEDGE_REVIEWED_DATE}; freshness guard: ${KNOWLEDGE_REVIEW_MAX_AGE_DAYS} days.</div>
${knowledgeHtml}
<div class="page-break"></div>
<h1>Call Follow-Up / Fact Update Form</h1>
<p>Use this only when the published answer does not resolve the caller's question.</p>
<table class="form"><tbody>
${['Date and time','Agent','Caller name','Preferred contact method','Move-in timing','Desired floor plan / unit','Question or request','Answer provided / source checked','Needs on-site follow-up?','Assigned to','Follow-up due','Resolution'].map((label) => `<tr><td>${esc(label)}</td><td></td></tr>`).join('')}
</tbody></table>
<h2>New or Changed Property Fact</h2>
<table class="form"><tbody>
${['Question callers are asking','Current published answer','Confirmed replacement answer','Confirmed by','Effective date','Publish on website?'].map((label) => `<tr><td>${esc(label)}</td><td></td></tr>`).join('')}
</tbody></table>
<footer>Compiled ${GENERATED} from the current Exhibit FAQ page, Knowledge Center, property configuration, fee schedule, application facts, and cited third-party score source.</footer>
</body></html>`;

writeFileSync(join(outDir, 'leasing-questionnaire.html'), html);

function findChromium(): string | null {
  const candidates: string[] = [];
  if (process.env.CHROME_BIN) candidates.push(process.env.CHROME_BIN);
  for (const name of ['chromium', 'chromium-browser', 'google-chrome', 'google-chrome-stable']) {
    const which = spawnSync('which', [name], { encoding: 'utf8' });
    if (which.status === 0 && which.stdout.trim()) candidates.push(which.stdout.trim());
  }
  try {
    for (const entry of readdirSync('/nix/store')) {
      if (!entry.endsWith('-playwright-browsers-chromium')) continue;
      const base = join('/nix/store', entry);
      for (const sub of readdirSync(base)) {
        if (sub.startsWith('chromium-')) candidates.push(join(base, sub, 'chrome-linux', 'chrome'));
      }
    }
  } catch {
    // No nix store browser.
  }
  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    const version = spawnSync(candidate, ['--version'], { encoding: 'utf8', timeout: 15_000 });
    if (version.status === 0) return candidate;
  }
  return null;
}

const chrome = findChromium();
if (!chrome) throw new Error('No headless Chromium found; PDF export cannot continue.');
const pdfPath = join(outDir, 'Exhibit-Leasing-Phone-Team-Playbook.pdf');
const result = spawnSync(
  chrome,
  [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--no-pdf-header-footer',
    `--print-to-pdf=${pdfPath}`,
    join(outDir, 'leasing-questionnaire.html'),
  ],
  { encoding: 'utf8', timeout: 120_000 },
);
const pdf = existsSync(pdfPath) ? readFileSync(pdfPath) : Buffer.alloc(0);
if (result.status !== 0 || pdf.length < 1_000 || pdf.subarray(0, 5).toString() !== '%PDF-') {
  throw new Error(`PDF print failed (exit ${result.status}): ${result.stderr ?? ''}`);
}
copyFileSync(pdfPath, join(outDir, 'Exhibit-Leasing-Facts-Questionnaire.pdf'));
console.log(
  `Generated phone-team playbook: ${faqCount} FAQs, ${knowledgeCount} Knowledge answers, ${changeableCount} verify-live answers.`,
);