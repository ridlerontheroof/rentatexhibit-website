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

const run = promisify(execFile);
const root = path.resolve(__dirname, '..', '..');
const scriptPath = path.join(root, 'scripts', 'generate-og-cards.mjs');
const committedDir = path.join(root, 'public', 'images', 'og');

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
