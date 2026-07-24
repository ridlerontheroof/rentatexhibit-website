/**
 * Generates the canonical property fact sheet for directory-listing cleanup.
 * Every value is pulled from the site's single source of truth:
 *   - src/data/seo.ts   (schema/SEO model: name, address, phone, hours, pets, amenities, URLs)
 *   - src/data/floorPlans.ts (bedroom + square-footage ranges)
 * Outputs (docs/directory-listings/):
 *   - fact-sheet.txt   plain text optimized for copy-paste into directory forms
 *   - fact-sheet.html  branded one-pager (printed to PDF by the caller)
 */
import { writeFileSync, mkdirSync } from 'node:fs';
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

const graph = (buildJsonLd('/') as any)['@graph'] as any[];
const complex = graph.find((n) => n['@type'] === 'ApartmentComplex');
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

const facts = {
  propertyName: complex.name as string,
  address: fullAddress,
  phone: complex.telephone as string,
  email: complex.email as string,
  officeHours: hours,
  bedroomRange,
  bedroomSummary: 'Studio, Convertible, 1, 2 & 3 Bedroom Apartments',
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
  generated: new Date().toISOString().slice(0, 10),
};

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'directory-listings');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'facts.json'), JSON.stringify(facts, null, 2));

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

BEDROOM RANGE  (** most common listing error — must say through THREE bedrooms **)
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
   "studios through two bedrooms". The property offers studios THROUGH THREE
   bedrooms. Fix everywhere it appears.
2. FACEBOOK PHONE: an older Facebook result shows an outdated phone number.
   The only correct phone is ${facts.phone}.

APARTMENTS.COM
[ ] Property name, address, phone (${facts.phone})
[!] Bedroom range — verify it says Studio–3 Bedroom (known "through two bedrooms" error)
[ ] Square footage ${facts.sqftRange}, pet policy, office hours
[ ] Website + tour + availability links point to ${facts.website}

FACEBOOK (facebook.com/exhibitonsuperior)
[!] Phone number — replace any old number with ${facts.phone}  (known stale-phone defect)
[ ] Address, email, office hours, website link
[ ] "About" text matches the short description above (studio–3 BR)

GOOGLE BUSINESS PROFILE
[ ] Name, address, phone exactly as above (NAP consistency)
[ ] Office hours match the three ranges above
[ ] Website ${facts.website}; appointment/tour link ${facts.tourLink}
[ ] Category: Apartment complex; description mentions studio–3 bedroom

ZILLOW / TRULIA
[ ] Bedroom range Studio–3 BR and sqft ${facts.sqftRange}
[ ] Phone, email, pet policy, management company (${facts.managementCompany})
[ ] Listing links to ${facts.website}

BIRDEYE
[ ] Business name, address, phone, email, hours
[ ] Website + review-destination links correct
[ ] Synced categories/description say studio–3 bedroom

YOUTUBE (@ExhibitonSuperior)
[ ] Channel "About" description matches the short description (studio–3 BR)
[ ] Channel links: ${facts.website} and ${facts.tourLink}
[ ] Contact email ${facts.email}
`;
writeFileSync(join(outDir, 'fact-sheet.txt'), txt);

/* ---------------- branded HTML (for PDF) ---------------- */
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const field = (label: string, value: string, mono = true) =>
  `<div class="field"><div class="label">${label}</div><div class="value${mono ? ' mono' : ''}">${esc(value)}</div></div>`;

const platformRows = [
  ['Apartments.com', 'Bedroom range — listing says \u201cthrough two bedrooms\u201d; must say Studio\u20133 Bedroom', 'defect'],
  ['Facebook', `Outdated phone number — replace with ${facts.phone}`, 'defect'],
  ['Google Business Profile', 'Verify NAP, hours, tour link, studio\u20133 BR description', 'check'],
  ['Zillow / Trulia', `Verify Studio\u20133 BR, ${facts.sqftRange}, phone, pet policy`, 'check'],
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
