// Build-tool: stamp the current share-card bytes against OG_CARD_VERSION.
//
// Facebook/LinkedIn/iMessage cache og:image previews by URL, so every artwork
// change must ship under a new ?v=N URL (OG_CARD_VERSION in src/data/seo.ts).
// This script records a hash of the committed public/images/og/*.jpg bytes
// alongside the version in src/data/og-cards-stamp.json; the guard in
// src/data/og-cards-freshness.test.ts fails whenever the committed bytes no
// longer match the stamp, so card bytes can never change silently.
//
// Crucially, the stamp can only move forward together with a version bump:
// if the card bytes changed but OG_CARD_VERSION is still the stamped version,
// this script refuses to restamp and tells you to bump the version first.
//
// Usage (after regenerating cards):
//   1. bump OG_CARD_VERSION in src/data/seo.ts
//   2. node scripts/stamp-og-cards.mjs
//   3. commit the updated og/*.jpg + seo.ts + og-cards-stamp.json together
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hashOgCards } from './lib/og-cards-hash.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ogDir = path.join(root, 'public', 'images', 'og');
const seoPath = path.join(root, 'src', 'data', 'seo.ts');
const stampPath = path.join(root, 'src', 'data', 'og-cards-stamp.json');

/** Parse OG_CARD_VERSION out of src/data/seo.ts without a TS toolchain. */
export async function readOgCardVersion() {
  const src = await fs.readFile(seoPath, 'utf8');
  const m = src.match(/export const OG_CARD_VERSION\s*=\s*(\d+)/);
  if (!m) throw new Error(`Could not find OG_CARD_VERSION in ${seoPath}`);
  return Number(m[1]);
}

async function main() {
  const [version, cardsHash] = await Promise.all([readOgCardVersion(), hashOgCards(ogDir)]);

  let previous = null;
  try {
    previous = JSON.parse(await fs.readFile(stampPath, 'utf8'));
  } catch {
    // no stamp yet — first run
  }

  if (previous && previous.cardsHash !== cardsHash && previous.ogCardVersion === version) {
    console.error(
      `Share-card bytes changed but OG_CARD_VERSION is still ${version}.\n` +
        `Social scrapers cache og:image by URL — without a version bump they keep\n` +
        `serving the old artwork for weeks. Bump OG_CARD_VERSION in src/data/seo.ts,\n` +
        `then rerun this script.`,
    );
    process.exit(1);
  }

  if (previous && previous.cardsHash === cardsHash && previous.ogCardVersion === version) {
    console.log(`Stamp already current (v${version}).`);
    return;
  }

  await fs.writeFile(stampPath, `${JSON.stringify({ ogCardVersion: version, cardsHash }, null, 2)}\n`);
  console.log(`Stamped og cards at v${version} (${cardsHash.slice(0, 12)}…).`);
}

// Only run as a CLI; importing (e.g. from the test suite) must not restamp.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
