// Build-tool: regenerate 1200×630 landscape OG share cards for every floor-plan
// landing page, saving them to public/images/og/floor-plans/{slug}.jpg.
//
// The portrait detail images (1500×1941) cannot be used directly as og:image —
// social platforms (Facebook, LinkedIn, X, iMessage) expect a 1.91:1 landscape
// image and crop portrait images to a thin center strip. This script composites
// each floor-plan diagram onto a branded 1200×630 canvas so the share card
// shows the full plan layout alongside the plan specs.
//
// Layout (1200×630 canvas):
//   Left 530px  — dark navy background (#1c2236); logo + type label + sqft + floor phrase
//   Right 650px — white panel (620×590px) holding the scaled floor-plan diagram
//
// Usage:
//   node scripts/generate-floor-plan-og-cards.mjs             # all 34 plans
//   node scripts/generate-floor-plan-og-cards.mjs <slug> ...  # specific plan(s)
//   node scripts/generate-floor-plan-og-cards.mjs --out /tmp  # write elsewhere
//
// After regenerating, bump OG_CARD_VERSION in src/data/seo.ts and run
// node scripts/stamp-og-cards.mjs to refresh the cache-buster stamp.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const floorPlansImgDir = path.join(root, 'public', 'images', 'floor-plans');
const logoPath = path.join(root, 'public', 'images', 'exhibit-logo-white.svg');

const W = 1200;
const H = 630;

// Panel geometry
const PANEL_X = 540;          // left edge of white floor-plan panel
const PANEL_W = 640;          // white panel width
const PANEL_H = 590;          // white panel height
const PANEL_MARGIN_Y = 20;    // vertical margin to center panel within 630px canvas

// Text geometry (left column)
const TEXT_X = 44;
const TYPE_Y = 200;           // plan type label baseline (e.g. "2 Bed / 2 Bath")
const SQFT_Y = 250;           // sqft line baseline
const FLOOR_Y = 290;          // floor range baseline
const LOGO_Y = 420;           // logo top-left y
const LOGO_W = 240;           // logo rendered width

// Font sizes (ImageMagick pointsize ~ CSS px at 72 DPI)
const TYPE_PT = 36;
const SQFT_PT = 26;
const FLOOR_PT = 20;

// Brand colours
const BG_COLOR = '#1c2236';
const TYPE_COLOR = 'white';
const SQFT_COLOR = '#8fa0bc';
const FLOOR_COLOR = '#6b7c9a';

// ─── Plan manifest ────────────────────────────────────────────────────────────
// Derived from src/data/floorPlans.ts + src/data/floorPlanPages.ts.
// Each entry: slug -> { id, typeLabel, sqft, sqftMin, floorLabel, floors }
// The id maps to public/images/floor-plans/{id}-detail.webp.
// The slug maps to the landing-page URL and becomes the output filename.
export const FLOOR_PLAN_CARDS = {
  'two-bedroom-one-bath-821-sf':           { id: 'unit-5-floor-2',        typeLabel: '2 Bed / 1 Bath',        sqft: 821,  sqftMin: 821,  floorLabel: '2',    floors: [2] },
  'one-bedroom-one-bath-619-sf':           { id: 'unit-6-floor-2',        typeLabel: '1 Bed / 1 Bath',        sqft: 619,  sqftMin: 619,  floorLabel: '2',    floors: [2] },
  'one-bedroom-one-bath-630-sf':           { id: 'unit-7-floor-2',        typeLabel: '1 Bed / 1 Bath',        sqft: 630,  sqftMin: 630,  floorLabel: '2',    floors: [2] },
  'two-bedroom-two-bath-1003-sf':          { id: 'unit-8-floor-2',        typeLabel: '2 Bed / 2 Bath',        sqft: 1003, sqftMin: 1003, floorLabel: '2',    floors: [2] },
  'two-bedroom-two-bath-929-sf':           { id: 'unit-9-floor-2',        typeLabel: '2 Bed / 2 Bath',        sqft: 929,  sqftMin: 929,  floorLabel: '2',    floors: [2] },
  'two-bedroom-two-bath-935-sf':           { id: 'unit-10-floor-2',       typeLabel: '2 Bed / 2 Bath',        sqft: 935,  sqftMin: 935,  floorLabel: '2',    floors: [2] },
  'two-bedroom-two-bath-1135-sf':          { id: 'unit-1-floor-3',        typeLabel: '2 Bed / 2 Bath',        sqft: 1135, sqftMin: 1135, floorLabel: '3',    floors: [3] },
  'studio-448-sf':                         { id: 'unit-2-floor-3',        typeLabel: 'Studio',                sqft: 448,  sqftMin: 448,  floorLabel: '3',    floors: [3] },
  'one-bedroom-one-bath-656-sf':           { id: 'unit-3-floors-3-4m',    typeLabel: '1 Bed / 1 Bath',        sqft: 656,  sqftMin: 656,  floorLabel: '3-4M', floors: [3, 4, 4.5] },
  'two-bedroom-two-bath-1079-sf':          { id: 'unit-4-floor-3',        typeLabel: '2 Bed / 2 Bath',        sqft: 1079, sqftMin: 1079, floorLabel: '3',    floors: [3] },
  'one-bedroom-one-bath-768-sf':           { id: 'unit-1-floors-4-4m',    typeLabel: '1 Bed / 1 Bath',        sqft: 768,  sqftMin: 768,  floorLabel: '4-4M', floors: [4, 4.5] },
  'one-bedroom-one-bath-628-sf':           { id: 'unit-2-floors-4-4m',    typeLabel: '1 Bed / 1 Bath',        sqft: 628,  sqftMin: 628,  floorLabel: '4-4M', floors: [4, 4.5] },
  'two-bedroom-two-bath-1026-sf':          { id: 'unit-4-floor-4',        typeLabel: '2 Bed / 2 Bath',        sqft: 1026, sqftMin: 1026, floorLabel: '4',    floors: [4] },
  'two-bedroom-two-bath-1052-sf':          { id: 'unit-4-floor-4m',       typeLabel: '2 Bed / 2 Bath',        sqft: 1052, sqftMin: 1052, floorLabel: '4M',   floors: [4.5] },
  'two-bedroom-two-bath-899-sf':           { id: 'unit-1-floors-6-29',    typeLabel: '2 Bed / 2 Bath',        sqft: 899,  sqftMin: 899,  floorLabel: '6-29', floors: null },
  'convertible-554-sf':                    { id: 'unit-2-floors-6-29',    typeLabel: 'Convertible',           sqft: 554,  sqftMin: 554,  floorLabel: '6-29', floors: null },
  'studio-484-sf':                         { id: 'unit-3-floors-6-29',    typeLabel: 'Studio',                sqft: 484,  sqftMin: 484,  floorLabel: '6-29', floors: null },
  'two-bedroom-den-two-bath-983-sf':       { id: 'unit-4-floors-6-29',    typeLabel: '2 Bed + Den / 2 Bath',  sqft: 983,  sqftMin: 983,  floorLabel: '6-29', floors: null },
  'jr-convertible-450-sf':                 { id: 'unit-5-floors-6-29',    typeLabel: 'Jr. Convertible',       sqft: 450,  sqftMin: 450,  floorLabel: '6-29', floors: null },
  'two-bedroom-one-bath-769-776-sf':             { id: 'unit-6-floors-6-29', typeLabel: '2 Bed / 1 Bath',    sqft: 776,  sqftMin: 769,  floorLabel: '6-29', floors: null },
  'one-bedroom-one-bath-665-sf':           { id: 'unit-7-floors-6-16',    typeLabel: '1 Bed / 1 Bath',        sqft: 665,  sqftMin: 665,  floorLabel: '6-16', floors: null },
  'one-bedroom-one-bath-645-sf':           { id: 'unit-8-floors-6-29',    typeLabel: '1 Bed / 1 Bath',        sqft: 645,  sqftMin: 645,  floorLabel: '6-29', floors: null },
  'two-bedroom-one-bath-779-sf-floors-6-29': { id: 'unit-9-floors-6-29', typeLabel: '2 Bed / 1 Bath',        sqft: 779,  sqftMin: 779,  floorLabel: '6-29', floors: null },
  'jr-convertible-478-sf-floors-6-29':    { id: 'unit-10-floors-6-29',   typeLabel: 'Jr. Convertible',       sqft: 478,  sqftMin: 478,  floorLabel: '6-29', floors: null },
  'three-bedroom-three-bath-1455-sf':      { id: 'unit-1-floors-30-34',   typeLabel: '3 Bed / 3 Bath',        sqft: 1455, sqftMin: 1455, floorLabel: '30-34', floors: null },
  'three-bedroom-three-bath-1528-sf':      { id: 'unit-2-floors-30-34',   typeLabel: '3 Bed / 3 Bath',        sqft: 1528, sqftMin: 1528, floorLabel: '30-34', floors: null },
  'jr-convertible-456-sf':                 { id: 'unit-3-floors-30-34',   typeLabel: 'Jr. Convertible',       sqft: 456,  sqftMin: 456,  floorLabel: '30-34', floors: null },
  'two-bedroom-one-bath-767-sf':           { id: 'unit-4-floors-30-34',   typeLabel: '2 Bed / 1 Bath',        sqft: 767,  sqftMin: 767,  floorLabel: '30-34', floors: null },
  'one-bedroom-one-bath-669-sf-floors-30-34': { id: 'unit-5-floors-30-34', typeLabel: '1 Bed / 1 Bath',      sqft: 669,  sqftMin: 669,  floorLabel: '30-34', floors: null },
  'one-bedroom-one-bath-651-sf':           { id: 'unit-6-floors-30-34',   typeLabel: '1 Bed / 1 Bath',        sqft: 651,  sqftMin: 651,  floorLabel: '30-34', floors: null },
  'two-bedroom-one-bath-779-sf-floors-30-34': { id: 'unit-7-floors-30-34', typeLabel: '2 Bed / 1 Bath',      sqft: 779,  sqftMin: 779,  floorLabel: '30-34', floors: null },
  'jr-convertible-478-sf-floors-30-34':   { id: 'unit-8-floors-30-34',   typeLabel: 'Jr. Convertible',       sqft: 478,  sqftMin: 478,  floorLabel: '30-34', floors: null },
  'one-bedroom-one-bath-672-sf':           { id: 'unit-7-floors-22-29',   typeLabel: '1 Bed / 1 Bath',        sqft: 672,  sqftMin: 672,  floorLabel: '22-29', floors: null },
  'one-bedroom-one-bath-669-sf-floors-17-21': { id: 'unit-7-floors-17-21', typeLabel: '1 Bed / 1 Bath',      sqft: 669,  sqftMin: 669,  floorLabel: '17-21', floors: null },
};

/** Human-readable floor phrase from a floorLabel string. */
function floorPhrase(floorLabel) {
  const single = /^[0-9]+m?$/i.test(floorLabel);
  const label = floorLabel.replace(/-/g, '\u2013');
  return `${single ? 'Floor' : 'Floors'} ${label} \u2022 River North`;
}

/** Sqft label: "769\u2013776 sq ft" or "899 sq ft". */
function sqftLabel(sqft, sqftMin) {
  return sqft === sqftMin
    ? `${sqft.toLocaleString()} sq ft`
    : `${sqftMin.toLocaleString()}\u2013${sqft.toLocaleString()} sq ft`;
}

async function generateCard(slug, spec, outDir) {
  const detailPath = path.join(floorPlansImgDir, `${spec.id}-detail.webp`);
  await fs.access(detailPath); // fail loudly if the source image is missing

  const outPath = path.join(outDir, `${slug}.jpg`);

  // White floor-plan panel dimensions (right side of card)
  const panelW = PANEL_W;
  const panelH = PANEL_H;
  // Max image size to fit inside the panel with a small inset padding
  const imgFit = `${panelW - 20}x${panelH - 20}`;

  const typeText = spec.typeLabel;
  const sqftText = sqftLabel(spec.sqft, spec.sqftMin);
  const floorText = floorPhrase(spec.floorLabel);

  await run('magick', [
    // 1. Dark navy canvas
    '-size', `${W}x${H}`, `xc:${BG_COLOR}`,
    // 2. White floor-plan panel (right side)
    '(', '-size', `${panelW}x${panelH}`, 'xc:white', ')',
    '-gravity', 'northeast',
    '-geometry', `+20+${PANEL_MARGIN_Y}`,
    '-composite',
    // 3. Floor-plan detail image — fit inside panel, keep aspect ratio
    '(',
      detailPath,
      '-background', 'white',
      '-resize', imgFit,
      '-gravity', 'center',
      '-extent', `${panelW - 20}x${panelH - 20}`,
    ')',
    '-gravity', 'northeast',
    '-geometry', `+30+${PANEL_MARGIN_Y + 10}`,
    '-composite',
    // 4. White wordmark (logo) bottom-left
    '(', '-background', 'none', logoPath, '-resize', `${LOGO_W}x`, ')',
    '-gravity', 'northwest',
    '-geometry', `+${TEXT_X}+${LOGO_Y}`,
    '-composite',
    // 5. Plan type label (e.g. "2 Bed / 2 Bath")
    '-font', 'DejaVu-Sans',
    '-pointsize', String(TYPE_PT),
    '-fill', TYPE_COLOR,
    '-gravity', 'northwest',
    '-annotate', `+${TEXT_X}+${TYPE_Y}`, typeText,
    // 6. Sqft line
    '-pointsize', String(SQFT_PT),
    '-fill', SQFT_COLOR,
    '-annotate', `+${TEXT_X}+${SQFT_Y}`, sqftText,
    // 7. Floor range + neighbourhood
    '-pointsize', String(FLOOR_PT),
    '-fill', FLOOR_COLOR,
    '-annotate', `+${TEXT_X}+${FLOOR_Y}`, floorText,
    '-quality', '90',
    '-define', 'jpeg:extent=190kb',
    '-strip',
    outPath,
  ]);
  return outPath;
}

async function main() {
  const args = process.argv.slice(2);
  let outDir = path.join(root, 'public', 'images', 'og', 'floor-plans');
  const outIdx = args.indexOf('--out');
  if (outIdx !== -1) {
    outDir = path.resolve(args[outIdx + 1] ?? '');
    args.splice(outIdx, 2);
  }

  const allSlugs = Object.keys(FLOOR_PLAN_CARDS);
  const slugs = args.length > 0 ? args : allSlugs;

  const unknown = slugs.filter((s) => !FLOOR_PLAN_CARDS[s]);
  if (unknown.length > 0) {
    console.error(`Unknown floor-plan slug(s): ${unknown.join(', ')}`);
    console.error(`Known slugs:\n  ${allSlugs.join('\n  ')}`);
    process.exit(1);
  }

  await fs.mkdir(outDir, { recursive: true });

  for (const slug of slugs) {
    const out = await generateCard(slug, FLOOR_PLAN_CARDS[slug], outDir);
    console.log(`generated ${path.relative(root, out)}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
