/**
 * One-time (re)generator for src/data/unitMap.json — the committed,
 * structured form of the user-provided unit map spreadsheet.
 * Pass your property's unit map XLSX as the first argument or set UNIT_MAP_XLSX.
 *
 * Per the data-module convention, facts are never hand-copied into JSX:
 * this script converts the spreadsheet once into JSON; src/data/unitMap.ts
 * types it and src/data/planFacts.ts aggregates it per floor-plan page.
 *
 * Run: node scripts/generate-unit-map.mjs path/to/YOUR_UNIT_MAP.xlsx
 *
 * No dependencies: a minimal ZIP reader (xlsx is a zip of XML) using
 * node:zlib inflateRawSync.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename as path_basename } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
// WOODS-CROSSING: pass your unit-map spreadsheet as the first argument, or set
// UNIT_MAP_XLSX env var to its path. This is a per-property data input file.
// No default is provided — the Exhibit spreadsheet is not shipped with the kit.
// Example: node scripts/generate-unit-map.mjs attached_assets/YOUR_UNIT_MAP.xlsx
const XLSX =
  process.argv[2] ??
  process.env.UNIT_MAP_XLSX?.trim() ??
  (() => { throw new Error(
    'No unit-map spreadsheet provided. Pass the path as the first argument or set UNIT_MAP_XLSX env var.',
  ); })();
const OUT = join(here, '../src/data/unitMap.json');

// --- minimal zip: read entries via the central directory -------------------
function zipEntries(buf) {
  const entries = new Map();
  // Locate End Of Central Directory (no zip64 needed for this file).
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('EOCD not found — not a zip?');
  const count = buf.readUInt16LE(eocd + 10);
  let off = buf.readUInt32LE(eocd + 16);
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(off) !== 0x02014b50) throw new Error('bad central dir');
    const method = buf.readUInt16LE(off + 10);
    const csize = buf.readUInt32LE(off + 20);
    const nameLen = buf.readUInt16LE(off + 28);
    const extraLen = buf.readUInt16LE(off + 30);
    const commentLen = buf.readUInt16LE(off + 32);
    const lho = buf.readUInt32LE(off + 42);
    const name = buf.toString('utf8', off + 46, off + 46 + nameLen);
    // Local header: skip its own (possibly different) name/extra lengths.
    const lNameLen = buf.readUInt16LE(lho + 26);
    const lExtraLen = buf.readUInt16LE(lho + 28);
    const dataStart = lho + 30 + lNameLen + lExtraLen;
    const raw = buf.subarray(dataStart, dataStart + csize);
    entries.set(name, method === 8 ? inflateRawSync(raw) : Buffer.from(raw));
    off += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

// --- minimal sheet parsing (regex on the XML; values are simple) -----------
const zip = zipEntries(readFileSync(XLSX));
const sharedXml = zip.get('xl/sharedStrings.xml').toString('utf8');
const shared = [...sharedXml.matchAll(/<si>(.*?)<\/si>/gs)].map((m) =>
  [...m[1].matchAll(/<t[^>]*>(.*?)<\/t>/gs)]
    .map((t) => t[1])
    .join('')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&'),
);

const sheetXml = zip.get('xl/worksheets/sheet1.xml').toString('utf8');
const rows = [];
for (const rowM of sheetXml.matchAll(/<row[^>]*>(.*?)<\/row>/gs)) {
  const cells = {};
  for (const cM of rowM[1].matchAll(/<c r="([A-Z]+)\d+"([^>]*)>(?:.*?<v>(.*?)<\/v>)?/gs)) {
    const [, col, attrs, v] = cM;
    cells[col] = attrs.includes('t="s"') && v !== undefined ? shared[Number(v)] : (v ?? '');
  }
  rows.push(cells);
}

const cols = Object.keys(rows[0]).sort((a, b) => a.length - b.length || (a < b ? -1 : 1));
const header = cols.map((c) => rows[0][c]);
const col = (name) => cols[header.indexOf(name)];

const yn = (v) => v === 'Yes';
// The spreadsheet numbers the "4M" mezzanine as floor 5 ("501"–"504") and
// prints unit numbers unpadded ("205"). The site/AppFolio convention has NO
// floor 5: normalize to the canonical forms used everywhere else ("0205",
// "04M01", floor "4M") so unit keys line up with floorPlans.ts/ada.ts.
const normFloor = (f) => (f === '5' ? '4M' : f);
const normUnit = (unit, floor) => {
  const line = unit.slice(-2);
  return floor === '5' ? `04M${line}` : unit.padStart(4, '0');
};
const units = rows.slice(1).map((r) => {
  const g = (name) => r[col(name)] ?? '';
  return {
    unit: normUnit(g('unit_number'), g('floor')),
    floor: normFloor(g('floor')),
    line: Number(g('unit_line')),
    band: g('building_band'),
    layout: g('layout'),
    category: g('category'),
    beds: Number(g('beds')),
    baths: Number(g('baths')),
    den: g('den') === '1',
    sqft: Number(g('square_feet')),
    planId: g('plan_id'),
    facing: g('facing_direction'),
    balcony: yn(g('balcony_shown')),
    balconyException: yn(g('balcony_exception')),
    inHomeWd: yn(g('in_home_wd_shown')),
    kitchenIsland: yn(g('kitchen_island_shown')),
    foyer: yn(g('foyer_shown')),
    openLivingDining: yn(g('open_living_dining_shown')),
    sleepingAlcove: yn(g('sleeping_alcove_shown')),
    openStudioLayout: yn(g('open_studio_layout_shown')),
    splitBedroom: yn(g('split_bedroom_layout_shown')),
    dedicatedDen: yn(g('dedicated_den_shown')),
    visualNotes: g('visual_notes'),
    typeA: yn(g('type_a_designated')),
    accessibilityCode: g('accessibility_matrix_code'),
    accessibilityDisclaimerRequired: yn(g('accessibility_disclaimer_required')),
  };
});

writeFileSync(OUT, JSON.stringify({ source: path_basename(XLSX), units }, null, 1) + '\n');
console.log(`Wrote ${units.length} units -> ${OUT}`);
