// WOODS-CROSSING: Replace all taglines in the CARDS map below with your property's
// page taglines and photo references. This entire CARDS map is Exhibit-specific.
// Build-tool: regenerate the 1200x630 social share cards in public/images/og/.
//
// Each PAGE_SEO path with a page-specific og:image maps to a source photo in
// images-src/ plus a short tagline. The recipe (matching the original ad-hoc
// ImageMagick cards):
//   1. resize/crop the photo to fill 1200x630 (per-card gravity/offset)
//   2. overlay a full-height linear gradient, transparent at the top to
//      ~75% black at the bottom
//   3. composite the white wordmark (public/images/exhibit-logo-white.svg,
//      280px wide) at 44px from the left
//   4. draw the tagline underneath in DejaVu Sans ~38px white, same margin
//
// Usage:
//   node scripts/generate-og-cards.mjs            # regenerate all cards
//   node scripts/generate-og-cards.mjs home faq   # regenerate specific cards
//   node scripts/generate-og-cards.mjs --out /tmp/og  # write elsewhere (preview)
//
// Deterministic: same inputs always produce the same cards. Requires
// ImageMagick (`magick`) and the DejaVu fonts (both present in the workspace).
//
// After regenerating cards with changed artwork, bump OG_CARD_VERSION in
// src/data/seo.ts and run `node scripts/stamp-og-cards.mjs` — the freshness
// guard (src/data/og-cards-freshness.test.ts) fails if card bytes change
// without a matching version bump.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcesDir = path.join(root, 'images-src');
const logoPath = path.join(root, 'public', 'images', 'exhibit-logo-white.svg');

const W = 1200;
const H = 630;
const MARGIN_X = 44; // left margin for logo + tagline
const LOGO_WIDTH = 270; // rendered wordmark width
const LOGO_Y = 424; // top of wordmark
const TAGLINE_Y = 505; // tagline baseline
const TAGLINE_POINTSIZE = 27; // px at ImageMagick default 72dpi
const GRADIENT_MAX_OPACITY = 0.75; // black at the very bottom
const FONT = 'DejaVu-Sans';

// page (filename in public/images/og/, matching PAGE_SEO ogImage) ->
//   src: source photo in images-src/
//   tagline: single line drawn under the wordmark
//   gravity: crop anchor when the photo overflows 1200x630 (default center)
//
// Exported so the fact-drift guard (src/data/faq-knowledge-alignment.test.ts)
// can cross-check every tagline against the Knowledge Center corpus — a stale
// price/distance baked into a share card must fail the test suite.
export const CARDS = {
  home: {
    src: 'image-057-dji-20230620092900-0153-d-oaedvz.jpg',
    tagline: 'WOODS-CROSSING: replace with your neighborhood/address tagline', // WOODS-CROSSING: replace
    gravity: 'west',
    offsetX: 189,
  },
  'available-units': {
    src: 'image-010-full-floor-amenity-deck-overlooking-the-city-and.jpg',
    tagline: 'Apartments available now — live pricing & move-in dates',
    gravity: 'south',
  },
  'floor-plans': {
    src: 'image-014-exhibit-living-room-n5xrna.jpg',
    tagline: 'Studio, 1, 2 & 3 bedroom homes in River North',
    gravity: 'south',
  },
  'photo-gallery': {
    src: 'image-057-dji-20230620092900-0153-d-oaedvz.jpg',
    tagline: 'See life at Exhibit on Superior',
    gravity: 'west',
    offsetX: 189,
  },
  'virtual-tour': {
    src: 'image-014-exhibit-living-room-n5xrna.jpg',
    tagline: 'Tour Exhibit on Superior from anywhere',
    gravity: 'south',
  },
  amenities: {
    src: 'image-013-20170808-0861-n4esrp.jpg',
    tagline: 'A full floor of amenities above River North',
    gravity: 'south',
  },
  'pet-friendly': {
    src: 'image-080-gettyimages-1386939001-lrrzhc.jpg',
    tagline: 'Pet-friendly living in River North',
    gravity: 'north',
  },
  neighborhood: {
    src: 'image-082-bt7b3562-adimkf.jpg',
    tagline: 'In the heart of River North, Chicago',
  },
  'apartment-guide': {
    src: 'image-014-exhibit-living-room-n5xrna.jpg',
    tagline: 'Layouts, finishes & skyline views',
  },
  fees: {
    src: 'image-009-34-southeast-levwhc.jpg',
    tagline: 'Fees, utilities & leasing costs',
  },
  'parking-transportation': {
    src: 'image-055-dji-20230620092832-0149-d-yrh5eg.jpg',
    tagline: 'Getting around from River North',
  },
  'application-guide': {
    src: 'image-015-work-spaces-with-blazing-fast-wifi-access-lzfatq.jpg',
    tagline: 'How to apply, step by step',
  },
  faq: {
    src: 'image-010-full-floor-amenity-deck-overlooking-the-city-and.jpg',
    tagline: 'Your questions, answered',
  },
  knowledge: {
    src: 'image-015-work-spaces-with-blazing-fast-wifi-access-lzfatq.jpg',
    tagline: 'Renter questions, fact-first answers',
  },
  'contact-us': {
    src: 'image-070-012417-6535-gpdv36.jpg',
    tagline: 'Get in touch with our leasing team',
  },
  'map-directions': {
    src: 'image-082-bt7b3562-adimkf.jpg',
    tagline: 'WOODS-CROSSING: replace with your address tagline', // WOODS-CROSSING: replace
  },
  residents: {
    src: 'image-067-tech-lounge-with-charging-station-and-kitchen-gh.jpg',
    tagline: 'Resident services and community at Exhibit',
  },
  'schedule-a-tour': {
    src: 'image-017-012417-6521-i8yuom.jpg',
    tagline: 'Schedule your tour of Exhibit on Superior',
  },
  reviews: {
    src: 'image-018-lounge-with-fireplace-and-big-screen-tv-ymvrom.jpg',
    tagline: 'See what residents say about Exhibit',
  },
  about: {
    src: 'image-009-34-southeast-levwhc.jpg',
    tagline: 'A 34-story luxury tower in River North, Chicago',
    gravity: 'south',
  },
  'luxury-apartments-river-north': {
    src: 'image-009-34-southeast-levwhc.jpg',
    tagline: 'Luxury apartments in River North, Chicago',
    gravity: 'south',
  },
  'studio-apartments-river-north': {
    src: 'image-014-exhibit-living-room-n5xrna.jpg',
    tagline: 'Studio apartments in River North, Chicago',
    gravity: 'south',
  },
  'convertible-apartments-river-north': {
    src: 'image-015-work-spaces-with-blazing-fast-wifi-access-lzfatq.jpg',
    tagline: 'Convertible apartments in River North, Chicago',
  },
  'one-bedroom-apartments-river-north': {
    src: 'image-017-012417-6521-i8yuom.jpg',
    tagline: '1-bedroom apartments in River North, Chicago',
  },
  'two-bedroom-apartments-river-north': {
    src: 'image-011-20170808-0713-n8k48b.jpg',
    tagline: '2-bedroom apartments in River North, Chicago',
  },
  'three-bedroom-apartments-river-north': {
    src: 'image-057-dji-20230620092900-0153-d-oaedvz.jpg',
    tagline: '3-bedroom penthouses in River North, Chicago',
    gravity: 'west',
    offsetX: 189,
  },
  'apartments-near-northwestern-memorial': {
    src: 'image-082-bt7b3562-adimkf.jpg',
    tagline: 'About 0.6 miles from Northwestern Memorial',
  },
  'apartments-near-merchandise-mart': {
    src: 'image-055-dji-20230620092832-0149-d-yrh5eg.jpg',
    tagline: 'About 0.5 miles from the Merchandise Mart',
  },
  'apartments-near-the-loop': {
    src: 'image-057-dji-20230620092900-0153-d-oaedvz.jpg',
    tagline: 'One L stop from the Loop, River North',
    gravity: 'west',
    offsetX: 189,
  },
};

async function generateCard(page, spec, outDir) {
  const srcPath = path.join(sourcesDir, spec.src);
  await fs.access(srcPath); // fail loudly if the source photo is missing
  const outPath = path.join(outDir, `${page}.jpg`);

  // 1. fill-crop the photo to 1200x630
  const cropArgs =
    spec.offsetX != null
      ? ['-resize', `x${H}`, '-crop', `${W}x${H}+${spec.offsetX}+0`, '+repage']
      : [
          '-resize', `${W}x${H}^`,
          '-gravity', spec.gravity ?? 'center',
          '-extent', `${W}x${H}`,
        ];

  const gradientTo = `rgba(0,0,0,${GRADIENT_MAX_OPACITY})`;
  await run('magick', [
    srcPath,
    ...cropArgs,
    // 2. full-height darkening gradient (transparent top -> 75% black bottom)
    '(', '-size', `${W}x${H}`, `gradient:rgba(0,0,0,0)-${gradientTo}`, ')',
    '-gravity', 'northwest',
    '-compose', 'over', '-composite',
    // 3. white wordmark
    '(', '-background', 'none', logoPath, '-resize', `${LOGO_WIDTH}x`, ')',
    '-geometry', `+${MARGIN_X}+${LOGO_Y}`,
    '-composite',
    // 4. tagline
    '-font', FONT,
    '-pointsize', String(TAGLINE_POINTSIZE),
    '-fill', 'white',
    '-annotate', `+${MARGIN_X}+${TAGLINE_Y}`, spec.tagline,
    '-quality', '90',
    // Hard size ceiling: ImageMagick binary-searches quality down until the
    // JPEG fits. Keeps every og/*.jpg under the site-wide ~200 KB image budget.
    '-define', 'jpeg:extent=190kb',
    '-strip',
    outPath,
  ]);
  return outPath;
}

async function main() {
  const args = process.argv.slice(2);
  let outDir = path.join(root, 'public', 'images', 'og');
  const outIdx = args.indexOf('--out');
  if (outIdx !== -1) {
    outDir = path.resolve(args[outIdx + 1] ?? '');
    args.splice(outIdx, 2);
  }
  const pages = args.length > 0 ? args : Object.keys(CARDS);
  const unknown = pages.filter((p) => !CARDS[p]);
  if (unknown.length > 0) {
    console.error(`Unknown card(s): ${unknown.join(', ')}`);
    console.error(`Known cards: ${Object.keys(CARDS).join(', ')}`);
    process.exit(1);
  }
  await fs.mkdir(outDir, { recursive: true });
  for (const page of pages) {
    const out = await generateCard(page, CARDS[page], outDir);
    console.log(`generated ${path.relative(root, out)}`);
  }
}

// Only run as a CLI; importing this module (e.g. from the test suite) must not
// regenerate cards.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
