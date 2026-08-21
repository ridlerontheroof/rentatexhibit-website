/**
 * Generates the canonical property fact sheet for directory-listing cleanup.
 * Every value is pulled from the site's single source of truth:
 *   - src/data/seo.ts   (schema/SEO model: name, address, phone, hours, pets, amenities, URLs)
 *   - src/data/floorPlans.ts (bedroom + square-footage ranges)
 * Outputs (docs/directory-listings/):
 *   - fact-sheet.txt   plain text optimized for copy-paste into directory forms
 *   - fact-sheet.html  branded one-pager (printed to PDF by the caller)
 *
 * Freshness contract (runs automatically at the end of `pnpm build`):
 *   - facts.json / fact-sheet.txt / fact-sheet.html are always rewritten from the
 *     live schema model, so they can never go stale. The `generated` date is only
 *     bumped when the facts actually change, keeping rebuilds diff-free.
 *   - The PDF's freshness is enforced by hash: fact-sheet.pdf.hash records the
 *     facts hash the PDF was printed from. When the facts change, the script
 *     first tries to reprint the PDF itself with a headless Chromium
 *     (CHROME_BIN / PATH / Playwright browser caches / nix store) and updates
 *     the hash automatically. Only if no browser is available does the build
 *     FAIL with instructions to print fact-sheet.html manually and re-run
 *     with --accept-pdf.
 *   - Deployment builds (REPLIT_DEPLOYMENT=1 / CI=true) never fail on a stale
 *     PDF: they compile committed code, the deploy image may not ship a
 *     browser, and the PDF is a docs artifact, not part of the served site.
 *     There a stale PDF logs a loud warning and the publish continues.
 *     Freshness is enforced in the workspace, where a browser exists and the
 *     reprinted PDF gets committed.
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// @ts-ignore - importing app TS modules directly via tsx
import { SITE_URL, TOUR_URL, AVAILABILITY_URL } from '../src/data/seo';
// tsx can import the module, but the nodes aren't exported; re-read fields we need
// directly from the JSON-LD builder to guarantee they can't drift.
// @ts-ignore
import { buildJsonLd } from '../src/data/seo';
// @ts-ignore
import { plans, SQFT_MIN, SQFT_MAX, CATEGORIES } from '../src/data/floorPlans';
// @ts-ignore
import { bedroomRangePhrases } from '../src/data/factSheetPhrases';

const graph = (buildJsonLd('/') as any)['@graph'] as any[];
const complex = graph.find((n) => ([] as string[]).concat(n['@type'] ?? []).includes('ApartmentComplex'));
const org = graph.find((n) => n['@type'] === 'Organization');
if (!complex || !org) throw new Error('ApartmentComplex/Organization node not found in JSON-LD graph');

const addr = complex.address;
const fullAddress = `${addr.streetAddress}, ${addr.addressLocality}, ${addr.addressRegion} ${addr.postalCode}`;

const DAY_SHORT: Record<string, string> = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu',
  Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
};
function fmtTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const am = h < 12;
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}${m ? `:${String(m).padStart(2, '0')}` : ''} ${am ? 'AM' : 'PM'}`;
}
const hours: string[] = complex.openingHoursSpecification.map((s: any) => {
  const days: string[] = s.dayOfWeek;
  const label =
    days.length > 1 ? `${DAY_SHORT[days[0]]}\u2013${DAY_SHORT[days[days.length - 1]]}` : DAY_SHORT[days[0]];
  return `${label}: ${fmtTime(s.opens)} \u2013 ${fmtTime(s.closes)}`;
});

const beds = new Set(plans.map((p: any) => p.category));
const bedroomRange = CATEGORIES.filter((c: any) => beds.has(c.id))
  .map((c: any) => c.label)
  .join(', ');
const amenities: string[] = complex.amenityFeature.map((a: any) => a.name);

// Directory-listing phrasing (summary + every checklist range phrase like
// "Studio–3 Bedroom", "studio–3 BR", "studios THROUGH THREE bedrooms") is
// derived from the same CATEGORIES list as bedroomRange — see the tested
// src/data/factSheetPhrases.ts — so a new (or retired) plan category can
// never leave the printed sheet or its checklist advertising a stale mix.
const {
  summaryWords,
  rangeTitle,
  rangeBRTitle,
  rangeBRLower,
  rangeLower,
  throughStart,
  throughSpoken,
  throughNoun,
} = bedroomRangePhrases(beds);
const bedroomSummary = `${
  summaryWords.length > 1
    ? `${summaryWords.slice(0, -1).join(', ')} & ${summaryWords[summaryWords.length - 1]}`
    : summaryWords[0]
} Bedroom Apartments`;

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'directory-listings');
mkdirSync(outDir, { recursive: true });

// Stable hash of every fact EXCEPT the generated date, so the date itself
// never makes the sheet look changed.
const coreFacts = {
  propertyName: complex.name as string,
  address: fullAddress,
  phone: complex.telephone as string,
  // Email lives on the Organization node (ApartmentComplex can't carry
  // `email` in core schema.org vocabulary — see data/seo.ts).
  email: org.email as string,
  officeHours: hours,
  bedroomRange,
  bedroomSummary,
  sqftRange: `${SQFT_MIN}\u2013${SQFT_MAX} sq ft`,
  petPolicy: complex.petsAllowed as string,
  managementCompany: org.name as string,
  website: SITE_URL as string,
  tourLink: TOUR_URL as string,
  availabilityLink: AVAILABILITY_URL as string,
  mapLink: complex.hasMap as string,
  description: complex.description as string,
  socialProfiles: complex.sameAs as string[],
  amenities,
};

const factsHash = createHash('sha256').update(JSON.stringify(coreFacts)).digest('hex');

// Only bump the generated date when the facts actually changed, so a rebuild
// with unchanged facts produces byte-identical output (no spurious diffs).
const factsJsonPath = join(outDir, 'facts.json');
let generated = new Date().toISOString().slice(0, 10);
if (existsSync(factsJsonPath)) {
  try {
    const prev = JSON.parse(readFileSync(factsJsonPath, 'utf8'));
    if (prev.factsHash === factsHash && typeof prev.generated === 'string') generated = prev.generated;
  } catch {
    /* unreadable previous file — regenerate with today's date */
  }
}

const facts = { ...coreFacts, factsHash, generated };
writeFileSync(factsJsonPath, JSON.stringify(facts, null, 2));

/* ---------------- plain text ---------------- */
const txt = `EXHIBIT ON SUPERIOR — CANONICAL PROPERTY FACT SHEET
Generated ${facts.generated} from the website's structured-data source of truth.
Use these EXACT values on every directory listing. If a platform shows anything
different, correct it to match this sheet.

PROPERTY NAME
${facts.propertyName}

ADDRESS
${facts.address}

PHONE
${facts.phone}

EMAIL
${facts.email}

OFFICE HOURS
${facts.officeHours.join('\n')}

BEDROOM RANGE  (** most common listing error — must say through ${throughSpoken}${throughNoun ? ` ${throughNoun}` : ''} **)
${facts.bedroomSummary}

SQUARE FOOTAGE RANGE
${facts.sqftRange}

PET POLICY
${facts.petPolicy}

MANAGEMENT COMPANY
${facts.managementCompany}

WEBSITE
${facts.website}

SCHEDULE A TOUR
${facts.tourLink}

CURRENT AVAILABILITY
${facts.availabilityLink}

GOOGLE MAPS LISTING
${facts.mapLink}

SOCIAL PROFILES
${facts.socialProfiles.join('\n')}

SHORT DESCRIPTION (copy-paste for "About" fields)
${facts.description}

AMENITIES (copy-paste list)
${facts.amenities.map((a) => `- ${a}`).join('\n')}

================================================================
PER-PLATFORM CHECKLIST
Verify every field above on each platform. Known defects are flagged.
================================================================

[!] TOP PRIORITY — KNOWN DEFECTS
1. BEDROOM RANGE: at least one listing (Apartments.com-style copy) says
   "studios through two bedrooms". The property offers ${throughStart} THROUGH ${throughSpoken}
   ${throughNoun ? `${throughNoun}. ` : ''}Fix everywhere it appears.
2. FACEBOOK PHONE: an older Facebook result shows an outdated phone number.
   The only correct phone is ${facts.phone}.

APARTMENTS.COM
[ ] Property name, address, phone (${facts.phone})
[!] Bedroom range — verify it says ${rangeTitle} (known "through two bedrooms" error)
[ ] Square footage ${facts.sqftRange}, pet policy, office hours
[ ] Website + tour + availability links point to ${facts.website}

FACEBOOK (facebook.com/exhibitonsuperior)
[!] Phone number — replace any old number with ${facts.phone}  (known stale-phone defect)
[ ] Address, email, office hours, website link
[ ] "About" text matches the short description above (${rangeBRLower})

GOOGLE BUSINESS PROFILE
[ ] Name, address, phone exactly as above (NAP consistency)
[ ] Office hours match the three ranges above
[ ] Website ${facts.website}; appointment/tour link ${facts.tourLink}
[ ] Category: Apartment complex; description mentions ${rangeLower}

ZILLOW / TRULIA
[ ] Bedroom range ${rangeBRTitle} and sqft ${facts.sqftRange}
[ ] Phone, email, pet policy, management company (${facts.managementCompany})
[ ] Listing links to ${facts.website}

BIRDEYE
[ ] Business name, address, phone, email, hours
[ ] Website + review-destination links correct
[ ] Synced categories/description say ${rangeLower}

YOUTUBE (@ExhibitonSuperior)
[ ] Channel "About" description matches the short description (${rangeBRLower})
[ ] Channel links: ${facts.website} and ${facts.tourLink}
[ ] Contact email ${facts.email}
`;
writeFileSync(join(outDir, 'fact-sheet.txt'), txt);

/* ---------------- branded HTML (for PDF) ---------------- */
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const field = (label: string, value: string, mono = true) =>
  `<div class="field"><div class="label">${label}</div><div class="value${mono ? ' mono' : ''}">${esc(value)}</div></div>`;

const platformRows = [
  ['Apartments.com', `Bedroom range — listing says \u201cthrough two bedrooms\u201d; must say ${rangeTitle}`, 'defect'],
  ['Facebook', `Outdated phone number — replace with ${facts.phone}`, 'defect'],
  ['Google Business Profile', `Verify NAP, hours, tour link, ${rangeBRLower} description`, 'check'],
  ['Zillow / Trulia', `Verify ${rangeBRTitle}, ${facts.sqftRange}, phone, pet policy`, 'check'],
  ['Birdeye', 'Verify name/address/phone/hours and synced description', 'check'],
  ['YouTube', 'Verify channel About text, links, and contact email', 'check'],
]
  .map(
    ([p, note, kind]) =>
      `<tr class="${kind}"><td>${p}</td><td>${kind === 'defect' ? '<span class="flag">FIX NOW</span> ' : ''}${esc(note as string)}</td></tr>`,
  )
  .join('');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  @page { size: Letter; margin: 0; }
  * { box-sizing: border-box; margin: 0; }
  body { font-family: 'Barlow Semi Condensed', 'Arial Narrow', sans-serif; color: #333; font-size: 10.5px; }
  .page { width: 8.5in; height: 10.9in; padding: 0.35in 0.55in; overflow: hidden; }
  header { border-bottom: 3px solid #b39a5f; padding-bottom: 10px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-end; }
  h1 { font-size: 24px; letter-spacing: 1px; text-transform: uppercase; color: #1c1c1c; }
  h1 span { color: #b39a5f; }
  .sub { font-size: 10px; color: #777; }
  h2 { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #b39a5f; margin: 10px 0 5px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 20px; }
  .field { padding: 4px 0; border-bottom: 1px solid #eee; }
  .label { font-size: 8.5px; text-transform: uppercase; letter-spacing: 1px; color: #999; }
  .value { font-size: 11.5px; font-weight: 600; color: #1c1c1c; }
  .mono { font-family: 'Courier New', monospace; font-size: 10.5px; }
  .wide { grid-column: 1 / -1; }
  .amenities { columns: 3; font-size: 9px; color: #444; }
  .amenities li { margin-bottom: 2px; break-inside: avoid; }
  .alert { background: #fdf3f2; border: 1px solid #e5b6b0; border-left: 4px solid #c0392b; padding: 8px 10px; margin: 10px 0; font-size: 10px; }
  .alert strong { color: #c0392b; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  td { border-bottom: 1px solid #eee; padding: 5px 8px; vertical-align: top; }
  td:first-child { font-weight: 700; white-space: nowrap; width: 1.7in; }
  tr.defect td { background: #fdf3f2; }
  .flag { background: #c0392b; color: #fff; font-size: 8px; font-weight: 700; padding: 1px 5px; letter-spacing: 1px; border-radius: 2px; }
  footer { margin-top: 8px; font-size: 8.5px; color: #999; border-top: 1px solid #eee; padding-top: 6px; }
</style></head><body><div class="page">
<header>
  <div><h1>Exhibit <span>on</span> Superior</h1><div class="sub">Canonical Property Fact Sheet — for directory &amp; listing cleanup</div></div>
  <div class="sub">Generated ${facts.generated}<br>Source: ${esc(facts.website)}</div>
</header>
<div class="alert"><strong>Use these exact values on every platform.</strong> Answer engines cross-check listings against each other; any mismatch lowers citation confidence. Two known defects are flagged FIX NOW below.</div>
<h2>Core Facts</h2>
<div class="grid">
  ${field('Property name', facts.propertyName, false)}
  ${field('Management company', facts.managementCompany, false)}
  ${field('Address', facts.address)}
  ${field('Phone', facts.phone)}
  ${field('Email', facts.email)}
  ${field('Office hours', facts.officeHours.join('  \u2022  '))}
  ${field('Bedroom range', facts.bedroomSummary, false)}
  ${field('Square footage', facts.sqftRange, false)}
  <div class="field wide">${field('Pet policy', facts.petPolicy, false).replace(/<\/?div[^>]*>/g, (m) => m)}</div>
</div>
<h2>Canonical Links</h2>
<div class="grid">
  ${field('Website', facts.website)}
  ${field('Schedule a tour', facts.tourLink)}
  ${field('Current availability', facts.availabilityLink)}
  ${field('Google Maps listing', facts.mapLink)}
  ${field('Facebook', facts.socialProfiles[0])}
  ${field('Instagram / YouTube', `${facts.socialProfiles[1]}  \u2022  ${facts.socialProfiles[2]}`)}
</div>
<h2>Short Description (for \u201cAbout\u201d fields)</h2>
<div style="font-size:10px; color:#444;">${esc(facts.description)}</div>
<h2>Amenities</h2>
<ul class="amenities">${facts.amenities.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>
<h2>Per-Platform Checklist</h2>
<table>${platformRows}</table>
<footer>All values generated directly from the website's structured-data model (schema.org ApartmentComplex) and floor-plan dataset, so this sheet can never disagree with ${esc(facts.website)}. Regenerate with: pnpm --filter @workspace/exhibit-on-superior exec tsx scripts/generate-fact-sheet.ts</footer>
</div></body></html>`;
writeFileSync(join(outDir, 'fact-sheet.html'), html);
console.log('Wrote facts.json, fact-sheet.txt, fact-sheet.html to', outDir);

/* ---------------- PDF freshness guard ---------------- */
// fact-sheet.pdf.hash records the facts hash the committed PDF was printed
// from. When the facts change, the two hashes diverge and the build fails
// until the PDF is reprinted and re-accepted.
const pdfHashPath = join(outDir, 'fact-sheet.pdf.hash');
const pdfPath = join(outDir, 'Exhibit-On-Superior-Fact-Sheet.pdf');
const acceptPdf = process.argv.includes('--accept-pdf');

// A Replit deployment build compiles from already-committed code, where the
// workspace-side guard has (or should have) kept the PDF fresh. The deploy
// image is not guaranteed to ship a Chromium, and a docs PDF must never block
// a publish — so in deployment builds a missing browser downgrades the hash
// failure to a loud warning instead of exiting non-zero.
// FACT_SHEET_FORCE_NO_BROWSER=1 is a test hook to simulate a browser-less env.
const isDeployBuild = process.env.REPLIT_DEPLOYMENT === '1' || process.env.CI === 'true';
const forceNoBrowser = process.env.FACT_SHEET_FORCE_NO_BROWSER === '1';

/**
 * Locate a headless-capable Chromium/Chrome binary, or null if none exists.
 *
 * `execute=false` only checks for the binary's existence and never runs it.
 * Deployment builders have been observed killing the entire publish build
 * when Chromium is executed (two builds died silently at exactly this point,
 * while one identical build passed) — so deploy builds must NEVER spawn a
 * browser, neither to probe `--version` nor to reprint the PDF.
 */
function findChromium(execute = true): string | null {
  const candidates: string[] = [];
  // 1. Explicit override.
  if (process.env.CHROME_BIN) candidates.push(process.env.CHROME_BIN);
  // 2. Common names on PATH.
  for (const name of ['chromium', 'chromium-browser', 'google-chrome', 'google-chrome-stable', 'chrome']) {
    const which = spawnSync('which', [name], { encoding: 'utf8' });
    if (which.status === 0 && which.stdout.trim()) candidates.push(which.stdout.trim());
  }
  // 3. Playwright browser caches (~/.cache/ms-playwright/chromium-*/chrome-linux/chrome).
  const home = process.env.HOME ?? '';
  for (const cacheDir of [join(home, '.cache', 'ms-playwright')]) {
    try {
      for (const entry of readdirSync(cacheDir)) {
        if (entry.startsWith('chromium-')) candidates.push(join(cacheDir, entry, 'chrome-linux', 'chrome'));
      }
    } catch {
      /* cache dir absent */
    }
  }
  // 4. Nix store playwright-browsers-chromium derivations (present on Replit).
  try {
    for (const entry of readdirSync('/nix/store')) {
      if (!entry.endsWith('-playwright-browsers-chromium')) continue;
      const base = join('/nix/store', entry);
      try {
        for (const sub of readdirSync(base)) {
          if (sub.startsWith('chromium-')) candidates.push(join(base, sub, 'chrome-linux', 'chrome'));
        }
      } catch {
        /* unreadable derivation */
      }
    }
  } catch {
    /* no nix store */
  }
  // Probe candidates with a short timeout and a hard overall budget: a broken
  // chrome binary in a deploy image must never hang the publish build (a
  // deployment build was observed dying silently inside this probe).
  const probeDeadline = Date.now() + 20_000;
  for (const c of candidates) {
    if (Date.now() > probeDeadline) break;
    try {
      if (!existsSync(c)) continue;
      if (!execute) return c; // existence-only check: never run the binary
      const v = spawnSync(c, ['--version'], { encoding: 'utf8', timeout: 5_000, killSignal: 'SIGKILL' });
      if (v.status === 0) return c;
    } catch {
      /* unprobeable candidate */
    }
  }
  return null;
}

/** Print fact-sheet.html to the canonical PDF path. Returns true on success. */
function printPdf(chrome: string): boolean {
  const htmlPath = join(outDir, 'fact-sheet.html');
  const res = spawnSync(
    chrome,
    [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--no-pdf-header-footer',
      `--print-to-pdf=${pdfPath}`,
      htmlPath,
    ],
    { encoding: 'utf8', timeout: 120_000 },
  );
  if (res.status !== 0 || !existsSync(pdfPath)) {
    console.error(`Headless Chromium print failed (exit ${res.status}):\n${res.stderr ?? ''}`);
    return false;
  }
  // Sanity check: output must be a non-trivial PDF.
  const buf = readFileSync(pdfPath);
  if (buf.length < 1000 || buf.subarray(0, 5).toString() !== '%PDF-') {
    console.error('Headless Chromium produced an invalid PDF; leaving hash unrecorded.');
    return false;
  }
  return true;
}

if (acceptPdf) {
  if (!existsSync(pdfPath)) {
    console.error(`--accept-pdf given but ${pdfPath} does not exist.`);
    process.exit(1);
  }
  writeFileSync(pdfHashPath, `${factsHash}\n`);
  console.log('Recorded current facts hash for the PDF (fact-sheet.pdf.hash).');
} else {
  const recorded = existsSync(pdfHashPath) ? readFileSync(pdfHashPath, 'utf8').trim() : null;
  // Deployment builders have also died while merely discovering Chromium
  // (PATH probes plus a /nix/store scan), before any browser was executed.
  // A docs-only PDF must not put the served site at risk, so publish builds
  // skip browser discovery entirely. Workspace builds still locate and use
  // Chromium so stale PDFs are automatically regenerated before publishing.
  const chrome = forceNoBrowser || isDeployBuild ? null : findChromium();
  console.log(
    isDeployBuild
      ? 'Chromium discovery skipped in deployment build (docs PDF cannot block publish).'
      : chrome
        ? `Headless Chromium available for PDF printing: ${chrome}`
        : 'No headless Chromium found in this environment (PDF reprint unavailable here).',
  );
  if (recorded !== factsHash || !existsSync(pdfPath)) {
    // Try to reprint the PDF ourselves with a headless Chromium before
    // bothering a human — but never spawn a browser in a deployment build.
    if (chrome && !isDeployBuild && printPdf(chrome)) {
      writeFileSync(pdfHashPath, `${factsHash}\n`);
      console.log(`Reprinted ${pdfPath} with headless Chromium (${chrome}) and updated fact-sheet.pdf.hash.`);
      process.exit(0);
    }
    if (isDeployBuild) {
      console.warn(
        [
          '',
          'WARNING: FACT SHEET PDF IS STALE and no headless Chromium is available in',
          'this deployment build. NOT failing the publish (the PDF is a docs artifact,',
          'not part of the served site). Reprint it from the workspace, where a',
          'browser exists, by running the site build (or this script) and committing',
          'the refreshed Exhibit-On-Superior-Fact-Sheet.pdf + fact-sheet.pdf.hash.',
          `  expected facts hash: ${factsHash}`,
          `  PDF printed from:    ${recorded ?? '(no fact-sheet.pdf.hash recorded)'}`,
          '',
        ].join('\n'),
      );
      process.exit(0);
    }
    console.error(
      [
        '',
        'FACT SHEET PDF IS STALE: the site facts (src/data/seo.ts / floorPlans.ts) have',
        'changed since Exhibit-On-Superior-Fact-Sheet.pdf was printed, and no headless',
        'Chromium was found to reprint it automatically (set CHROME_BIN to override).',
        '',
        'fact-sheet.txt / fact-sheet.html / facts.json were just regenerated and are',
        'up to date. To fix the PDF:',
        '  1. Open docs/directory-listings/fact-sheet.html in a browser and print it to',
        '     PDF (Letter, no margins) as docs/directory-listings/Exhibit-On-Superior-Fact-Sheet.pdf',
        '  2. Re-run: pnpm --filter @workspace/exhibit-on-superior exec tsx scripts/generate-fact-sheet.ts --accept-pdf',
        '',
        `  expected facts hash: ${factsHash}`,
        `  PDF printed from:    ${recorded ?? '(no fact-sheet.pdf.hash recorded)'}`,
        '',
      ].join('\n'),
    );
    process.exit(1);
  }
  console.log('PDF is up to date with the current site facts.');
}
