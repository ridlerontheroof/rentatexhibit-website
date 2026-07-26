// Shared helper: combined sha256 over the committed share cards in
// public/images/og/. Used by the version stamp (scripts/stamp-og-cards.mjs)
// and the freshness guard (src/data/og-cards-freshness.test.ts) so both sides
// hash exactly the same way: every *.jpg in the directory, sorted by name,
// each contributing its filename + raw bytes.
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

export async function hashOgCards(dir) {
  const files = (await fs.readdir(dir)).filter((f) => f.endsWith('.jpg')).sort();
  const hash = createHash('sha256');
  for (const file of files) {
    hash.update(file);
    hash.update(await fs.readFile(path.join(dir, file)));
  }
  return hash.digest('hex');
}
