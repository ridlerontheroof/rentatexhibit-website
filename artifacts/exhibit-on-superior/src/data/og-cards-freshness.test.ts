// Guard: the committed share cards in public/images/og/ must match what
// scripts/generate-og-cards.mjs produces from its CARDS map today.
//
// The tagline-drift guard (faq-knowledge-alignment.test.ts) only checks the
// *map*; if someone fixes a tagline (or a source photo changes) without
// rerunning the generator, the shipped JPG still shows the stale artwork and
// nothing else fails. The generator is deterministic (same inputs -> same
// bytes), so we regenerate every card into a temp dir and byte-compare.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// @ts-expect-error -- plain .mjs build script, no types
import { CARDS } from '../../scripts/generate-og-cards.mjs';
// @ts-expect-error -- plain .mjs helper, no types
import { hashOgCards } from '../../scripts/lib/og-cards-hash.mjs';
import { OG_CARD_VERSION } from './seo';
import stamp from './og-cards-stamp.json';

const run = promisify(execFile);
const root = path.resolve(__dirname, '..', '..');
const scriptPath = path.join(root, 'scripts', 'generate-og-cards.mjs');
const committedDir = path.join(root, 'public', 'images', 'og');
const defaultCardPath = path.join(root, 'public', 'images', 'og-card.jpg');

const pages = Object.keys(CARDS as Record<string, unknown>);
let tmpDir: string;

beforeAll(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'og-cards-check-'));
  // Regenerate every card from the map (deterministic; ~7s for all 17).
  await run('node', [scriptPath, '--out', tmpDir], { timeout: 120_000 });
}, 150_000);

afterAll(async () => {
  if (tmpDir) await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('OG share cards are regenerated from the current map', () => {
  it('has a committed JPG for every entry in CARDS, and no orphans', async () => {
    const committed = (await fs.readdir(committedDir)).filter((f) => f.endsWith('.jpg'));
    const missing = pages.filter((p) => !committed.includes(`${p}.jpg`));
    const orphans = committed.filter((f) => !pages.includes(f.replace(/\.jpg$/, '')));
    expect(missing, `CARDS pages with no committed card — run: node scripts/generate-og-cards.mjs ${missing.join(' ')}`).toEqual([]);
    expect(orphans, 'committed og/*.jpg with no CARDS entry — delete them or add a map entry').toEqual([]);
  });

  it('every committed card byte-matches a fresh regeneration', async () => {
    const stale: string[] = [];
    for (const page of pages) {
      const [fresh, committed] = await Promise.all([
        fs.readFile(path.join(tmpDir, `${page}.jpg`)),
        fs.readFile(path.join(committedDir, `${page}.jpg`)).catch(() => null),
      ]);
      if (!committed || !fresh.equals(committed)) stale.push(page);
    }
    expect(
      stale,
      `Stale share card(s): the committed JPG no longer matches the CARDS map ` +
        `(tagline/photo changed without regenerating, or the JPG was hand-edited).\n` +
        `Fix by rerunning: node scripts/generate-og-cards.mjs ${stale.join(' ')}\n` +
        `then commit the updated public/images/og/*.jpg files.`,
    ).toEqual([]);
  });
});

describe('OG_CARD_VERSION cache-buster moves with the card bytes', () => {
  // Social scrapers (Facebook, LinkedIn, iMessage) cache og:image by URL for
  // weeks. The cards ship under ?v=OG_CARD_VERSION, so any change to the
  // committed og/*.jpg bytes MUST be accompanied by a version bump or the old
  // artwork keeps being served. The stamp (src/data/og-cards-stamp.json,
  // written by scripts/stamp-og-cards.mjs) ties a hash of the committed bytes
  // to the version they shipped under; the stamp script itself refuses to
  // restamp changed bytes without a version bump.

  it('the stamped version matches OG_CARD_VERSION in seo.ts', () => {
    expect(
      stamp.ogCardVersion,
      `og-cards-stamp.json is stamped at v${stamp.ogCardVersion} but seo.ts has ` +
        `OG_CARD_VERSION=${OG_CARD_VERSION}. After bumping the version, rerun: ` +
        `node scripts/stamp-og-cards.mjs`,
    ).toBe(OG_CARD_VERSION);
  });

  it('the committed card bytes match the stamped hash', async () => {
    const current = await hashOgCards(committedDir, [defaultCardPath]);
    expect(
      current,
      `share-card bytes (public/images/og/*.jpg or public/images/og-card.jpg) changed without a cache-buster bump — ` +
        `social networks would keep showing the old artwork.\n` +
        `Fix: bump OG_CARD_VERSION in src/data/seo.ts, run ` +
        `node scripts/stamp-og-cards.mjs, and commit seo.ts + og-cards-stamp.json ` +
        `together with the updated cards.`,
    ).toBe(stamp.cardsHash);
  });
});
