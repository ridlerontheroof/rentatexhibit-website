/**
 * Generates the leasing-team questionnaire: one fill-in document listing every
 * fact the website currently defers with "confirm with the leasing team".
 * When leasing returns answers, the site gets trued up (see project task
 * "Replace 'ask the leasing team' answers with real figures").
 *
 * The item list below is hand-audited from the live deferral spots in:
 *   src/data/seo.ts (FAQ answers), and the Fees, Parking & Transportation,
 *   Application Guide, Apartment Guide, Pet Friendly, and Amenities pages.
 * Each item records the exact visitor-facing question and where it appears,
 * so answers map 1:1 back onto the site.
 *
 * Outputs (docs/leasing-questionnaire/):
 *   - leasing-questionnaire.md    editable version (email/Google Docs friendly)
 *   - leasing-questionnaire.html  branded print source
 *   - Exhibit-Leasing-Facts-Questionnaire.pdf  (printed via headless Chromium)
 *
 * Run on demand:
 *   pnpm --filter @workspace/exhibit-on-superior exec tsx scripts/generate-leasing-questionnaire.ts
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

interface Item {
  /** The question exactly as site visitors see it (or the page copy that defers). */
  question: string;
  /** What leasing needs to provide. */
  need: string;
  /** Where it appears on the site. */
  where: string;
}

interface Topic {
  title: string;
  intro?: string;
  items: Item[];
}

const TOPICS: Topic[] = [
  {
    title: 'Fees & Costs',
    intro:
      'Already verified from listings (no answer needed): application fee $60\u2013$75 per unit; water, sewer, trash & gas included with rent.',
    items: [
      {
        question: 'What fees are required in addition to rent?',
        need: 'Administrative fee amount (if any)',
        where: 'Fees & Leasing Costs page \u2014 FAQ',
      },
      {
        question: 'What fees are required in addition to rent?',
        need: 'Security deposit and/or move-in fee amount',
        where: 'Fees & Leasing Costs page \u2014 "Everything Else" section',
      },
      {
        question: 'Are utilities included?',
        need: 'How electricity is billed (direct with ComEd? third-party?)',
        where: 'Fees & Leasing Costs page \u2014 FAQ',
      },
      {
        question: 'Are utilities included?',
        need: 'Internet options: available providers, any building package or required provider, typical cost',
        where: 'Fees & Leasing Costs page \u2014 FAQ',
      },
      {
        question: 'Is storage or accessibility information available?',
        need: 'On-site storage: available? monthly cost? waitlist?',
        where: 'Apartment Guide + Fees pages',
      },
      {
        question: 'Does Exhibit offer move-in specials?',
        need: 'Current specials policy \u2014 do you want specials published on the site, and if so, the current offer',
        where: 'Fees & Leasing Costs page \u2014 FAQ',
      },
      {
        question: 'What fees are required in addition to rent?',
        need: 'Any other mandatory charges (amenity fee, technology fee, trash/valet fee, etc.)',
        where: 'Fees & Leasing Costs page',
      },
    ],
  },
  {
    title: 'Parking & Transportation',
    items: [
      {
        question: 'Does Exhibit On Superior have on-site parking?',
        need: 'Garage on site? Attached or nearby? Number of spaces / waitlist status',
        where: 'Parking & Transportation page \u2014 FAQ',
      },
      {
        question: 'How much is parking?',
        need: 'Monthly parking rate (and reserved vs unreserved pricing if applicable)',
        where: 'Fees page FAQ + Parking & Transportation page',
      },
      {
        question: '(site copy defers all parking details)',
        need: 'EV charging: available? how many chargers? cost?',
        where: 'Parking & Transportation page',
      },
      {
        question: '(site copy defers all parking details)',
        need: 'Guest parking options',
        where: 'Parking & Transportation page',
      },
      {
        question: '(site copy defers all parking details)',
        need: 'Bike storage: bike room? cost? capacity?',
        where: 'Parking & Transportation page',
      },
    ],
  },
  {
    title: 'Pets',
    intro:
      'Already verified (no answer needed): cats & dogs welcome; max 2 pets; registration with management and Dog Rider acknowledgement required.',
    items: [
      {
        question: 'What are the pet fees?',
        need: 'One-time pet fee amount',
        where: 'Pet Friendly page \u2014 FAQ',
      },
      {
        question: 'What are the pet fees?',
        need: 'Pet deposit amount (if separate from the fee)',
        where: 'Pet Friendly page \u2014 FAQ',
      },
      {
        question: 'What are the pet fees?',
        need: 'Monthly pet rent per pet',
        where: 'Pet Friendly page \u2014 FAQ',
      },
      {
        question: 'Should renters confirm current pet rules?',
        need: 'Restricted breeds list (or "no breed restrictions")',
        where: 'Pet Friendly page \u2014 policy list',
      },
      {
        question: 'Should renters confirm current pet rules?',
        need: 'Weight limit (or "no weight limit")',
        where: 'Pet Friendly page \u2014 policy list',
      },
    ],
  },
  {
    title: 'Application & Qualification',
    items: [
      {
        question: 'What income is required to qualify?',
        need: 'Income requirement (e.g. monthly income \u2265 3\u00d7 rent) and acceptable proof',
        where: 'Application Guide \u2014 FAQ',
      },
      {
        question: 'What income is required to qualify?',
        need: 'Credit screening: minimum score or criteria, and what causes denial',
        where: 'Application Guide \u2014 Qualification & Screening',
      },
      {
        question: 'Are guarantors accepted?',
        need: 'Guarantor/co-signer policy (accepted? income multiple? services like TheGuarantors?)',
        where: 'Application Guide \u2014 FAQ',
      },
      {
        question: '(not yet answered on site)',
        need: 'International applicants: process without US credit history / SSN',
        where: 'Application Guide',
      },
      {
        question: 'How long does approval take?',
        need: 'Typical approval timeline (e.g. 2\u20133 business days)',
        where: 'Application Guide \u2014 FAQ',
      },
      {
        question: 'What lease terms are available?',
        need: 'Offered lease terms (e.g. 6\u201318 months) and any short-term premium',
        where: 'Application Guide \u2014 FAQ',
      },
      {
        question: 'What should I have ready to apply?',
        need: 'Exact documents required with an application',
        where: 'Application Guide \u2014 FAQ',
      },
      {
        question: '(not yet answered on site)',
        need: 'Occupancy limits per apartment size',
        where: 'Application Guide',
      },
      {
        question: '(not yet answered on site)',
        need: "Renters insurance: required? minimum liability? must the property be listed as interested party?",
        where: 'Application Guide / Fees page',
      },
    ],
  },
  {
    title: 'Apartments',
    items: [
      {
        question: 'Are furnished apartments available?',
        need: 'Furnished options (or partner like Landing/Blueground), or confirm "unfurnished only"',
        where: 'Apartment Guide \u2014 FAQ',
      },
      {
        question: 'Which units have balconies?',
        need: 'Which floor plans / stacks include private balconies',
        where: 'Apartment Guide \u2014 FAQ + features list',
      },
      {
        question: 'Is storage or accessibility information available?',
        need: 'Accessible/ADA unit details: which plans, roll-in showers, etc.',
        where: 'Apartment Guide \u2014 FAQ',
      },
    ],
  },
  {
    title: 'Amenities & Services',
    items: [
      {
        question: 'Is there a 24-hour concierge?',
        need: 'Front desk / concierge: 24-hour? staffed hours?',
        where: 'Amenities page \u2014 FAQ',
      },
      {
        question: '(site copy defers hours)',
        need: 'Amenity floor hours (fitness center, pool, lounges)',
        where: 'Amenities page \u2014 Access & Hours',
      },
      {
        question: '(site copy defers reservations)',
        need: 'Reservation rules for private dining room, party suite, training rooms \u2014 and guest rules',
        where: 'Amenities page \u2014 Access & Hours',
      },
      {
        question: '(not yet answered on site)',
        need: 'Seasonal restrictions (outdoor pool deck, hot tub, grilling stations season/hours)',
        where: 'Amenities page',
      },
    ],
  },
];

const GENERATED = new Date().toISOString().slice(0, 10);
const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'leasing-questionnaire');
mkdirSync(outDir, { recursive: true });

const totalItems = TOPICS.reduce((n, t) => n + t.items.length, 0);

/* ---------------- markdown (editable / email-friendly) ---------------- */
let md = `# Exhibit On Superior — Leasing Facts Questionnaire

Generated ${GENERATED} · ${totalItems} questions

The website currently answers these renter questions with "confirm with the
leasing team." Fill in whatever is stable policy and we will publish the real
answers on rentatexhibit.com (better for renters, and for Google/AI answer
engines that reward specific facts).

**How to fill this in**
- Write the answer exactly as it should appear publicly.
- If a figure changes per unit or season, give the current range and note "varies".
- **Leave blank** anything that is intentionally case-by-case or should stay unpublished — the site will keep pointing those to the leasing team.
`;

for (const topic of TOPICS) {
  md += `\n## ${topic.title}\n`;
  if (topic.intro) md += `\n> ${topic.intro}\n`;
  let i = 0;
  for (const item of topic.items) {
    i += 1;
    md += `\n**${i}. ${item.need}**\n`;
    md += `   - Visitors currently see: “${item.question}” _(${item.where})_\n`;
    md += `   - Answer:\n\n   \`________________________________________________________________\`\n`;
  }
}
md += `\nReturn to: the website team · Questions? exhibit website project\n`;
writeFileSync(join(outDir, 'leasing-questionnaire.md'), md);

/* ---------------- branded HTML (print source) ---------------- */
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const topicHtml = TOPICS.map((topic) => {
  const rows = topic.items
    .map(
      (item, i) => `
  <div class="item">
    <div class="q"><span class="num">${i + 1}</span> ${esc(item.need)}</div>
    <div class="meta">Visitors currently see: \u201c${esc(item.question)}\u201d &nbsp;\u2022&nbsp; ${esc(item.where)}</div>
    <div class="answer"><span class="alabel">Answer</span><span class="line"></span></div>
  </div>`,
    )
    .join('');
  return `
<section>
  <h2>${esc(topic.title)}</h2>
  ${topic.intro ? `<div class="verified">\u2713 ${esc(topic.intro)}</div>` : ''}
  ${rows}
</section>`;
}).join('');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  @page { size: Letter; margin: 0.55in 0.6in; }
  * { box-sizing: border-box; margin: 0; }
  body { font-family: 'Barlow Semi Condensed', 'Arial Narrow', sans-serif; color: #333; font-size: 11px; }
  header { border-bottom: 3px solid #b39a5f; padding-bottom: 10px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-end; }
  h1 { font-size: 22px; letter-spacing: 1px; text-transform: uppercase; color: #1c1c1c; }
  h1 span { color: #b39a5f; }
  .sub { font-size: 10px; color: #777; }
  .howto { background: #faf7f0; border: 1px solid #e3d9c2; border-left: 4px solid #b39a5f; padding: 8px 12px; margin-bottom: 12px; font-size: 10px; line-height: 1.5; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; color: #b39a5f; margin: 16px 0 6px; border-bottom: 1px solid #e3d9c2; padding-bottom: 3px; break-after: avoid; }
  .verified { font-size: 9.5px; color: #4a7a4a; background: #f2f8f2; border: 1px solid #cfe3cf; padding: 5px 8px; margin-bottom: 6px; }
  .item { padding: 7px 0 9px; border-bottom: 1px solid #eee; break-inside: avoid; }
  .q { font-size: 11.5px; font-weight: 700; color: #1c1c1c; }
  .num { display: inline-block; min-width: 16px; color: #b39a5f; }
  .meta { font-size: 9px; color: #999; margin: 2px 0 8px 16px; }
  .answer { display: flex; align-items: flex-end; gap: 8px; margin-left: 16px; }
  .alabel { font-size: 8.5px; text-transform: uppercase; letter-spacing: 1px; color: #b39a5f; }
  .line { flex: 1; border-bottom: 1px solid #999; height: 16px; }
  footer { margin-top: 14px; font-size: 8.5px; color: #999; border-top: 1px solid #eee; padding-top: 6px; }
</style></head><body>
<header>
  <div><h1>Exhibit <span>on</span> Superior</h1><div class="sub">Leasing Facts Questionnaire \u2014 ${totalItems} questions the website defers to you</div></div>
  <div class="sub">Generated ${GENERATED}<br>rentatexhibit.com</div>
</header>
<div class="howto"><strong>How to fill this in:</strong> write each answer exactly as it should appear publicly on the website. If a figure varies by unit or season, give the current range and note \u201cvaries.\u201d <strong>Leave blank</strong> anything intentionally case-by-case or that should stay unpublished \u2014 the site will keep directing those questions to the leasing office.</div>
${topicHtml}
<footer>Compiled ${GENERATED} from every \u201cconfirm with the leasing team\u201d answer on rentatexhibit.com. Once returned, the website team publishes the confirmed answers on the Fees, Parking, Pet Policy, Application, Apartment Guide, and Amenities pages.</footer>
</body></html>`;
writeFileSync(join(outDir, 'leasing-questionnaire.html'), html);
console.log(`Wrote leasing-questionnaire.md and .html (${totalItems} items) to`, outDir);

/* ---------------- PDF via headless Chromium ---------------- */
function findChromium(): string | null {
  const candidates: string[] = [];
  if (process.env.CHROME_BIN) candidates.push(process.env.CHROME_BIN);
  for (const name of ['chromium', 'chromium-browser', 'google-chrome', 'google-chrome-stable', 'chrome']) {
    const which = spawnSync('which', [name], { encoding: 'utf8' });
    if (which.status === 0 && which.stdout.trim()) candidates.push(which.stdout.trim());
  }
  const home = process.env.HOME ?? '';
  try {
    for (const entry of readdirSync(join(home, '.cache', 'ms-playwright'))) {
      if (entry.startsWith('chromium-')) candidates.push(join(home, '.cache', 'ms-playwright', entry, 'chrome-linux', 'chrome'));
    }
  } catch { /* absent */ }
  try {
    for (const entry of readdirSync('/nix/store')) {
      if (!entry.endsWith('-playwright-browsers-chromium')) continue;
      const base = join('/nix/store', entry);
      try {
        for (const sub of readdirSync(base)) {
          if (sub.startsWith('chromium-')) candidates.push(join(base, sub, 'chrome-linux', 'chrome'));
        }
      } catch { /* unreadable */ }
    }
  } catch { /* no nix store */ }
  for (const c of candidates) {
    if (!existsSync(c)) continue;
    const v = spawnSync(c, ['--version'], { encoding: 'utf8', timeout: 15_000 });
    if (v.status === 0) return c;
  }
  return null;
}

const pdfPath = join(outDir, 'Exhibit-Leasing-Facts-Questionnaire.pdf');
const chrome = findChromium();
if (!chrome) {
  console.error('No headless Chromium found; open leasing-questionnaire.html and print to PDF manually.');
  process.exit(1);
}
const res = spawnSync(
  chrome,
  ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-pdf-header-footer', `--print-to-pdf=${pdfPath}`, join(outDir, 'leasing-questionnaire.html')],
  { encoding: 'utf8', timeout: 120_000 },
);
const buf = existsSync(pdfPath) ? readFileSync(pdfPath) : Buffer.alloc(0);
if (res.status !== 0 || buf.length < 1000 || buf.subarray(0, 5).toString() !== '%PDF-') {
  console.error(`PDF print failed (exit ${res.status}):\n${res.stderr ?? ''}`);
  process.exit(1);
}
console.log('Printed', pdfPath);
