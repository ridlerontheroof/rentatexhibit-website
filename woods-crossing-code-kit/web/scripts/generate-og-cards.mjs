// Build-tool: regenerate the 1200x630 social share cards in public/images/og/.
// Property-specific page slugs, photos, and taglines live in og-cards-property.mjs.
//
// Each PAGE_SEO path with a page-specific og:image maps to a source photo in
// images-src/ plus a short tagline. The recipe (matching the original ad-hoc
// ImageMagick cards):
//   1. resize/crop the photo to fill 1200x630 (per-card gravity/offset)
//   2. overlay a full-height linear gradient, transparent at the top to
//      ~75% black at the bottom
//   3. composite the white wordmark (public/images/<OG_LOGO_FILENAME>,
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
// WOODS-CROSSING: all property-specific page slugs, source photos, and taglines
// live in og-cards-property.mjs. Edit that file — do not add property content here.
import { CARDS } from './og-cards-property.mjs';

const run = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcesDir = path.join(root, 'images-src');
// WOODS-CROSSING: replace with your property's white wordmark SVG filename in public/images/.
// Maps to the first entry of property-config brand.logoAssets (the white/light variant).
const LOGO_FILENAME = process.env.OG_LOGO_FILENAME || 'property-logo-white.svg';
const logoPath = path.join(root, 'public', 'images', LOGO_FILENAME);

const W = 1200;
const H = 630;
const MARGIN_X = 44; // left margin for logo + tagline
const LOGO_WIDTH = 270; // rendered wordmark width
const LOGO_Y = 424; // top of wordmark
const TAGLINE_Y = 505; // tagline baseline
const TAGLINE_POINTSIZE = 27; // px at ImageMagick default 72dpi
const GRADIENT_MAX_OPACITY = 0.75; // black at the very bottom
const FONT = 'DejaVu-Sans';

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
