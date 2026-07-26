// Fingerprint of every source file that feeds the prerendered <head> output
// (titles, meta descriptions, JSON-LD). The prerenderer stamps this hash into
// dist/seo-source-hash.txt; the prerender-titles and prerender-meta-descriptions
// test suites recompute it and fail with a "rebuild" message when the committed
// build lags the source — a stale dist once failed both suites with head
// output the current SEO model no longer produces.
//
// Shared between scripts/prerender.mjs (writer) and the vitest suites (readers)
// so the two sides can never hash a different file set.
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

/** Files under `dir` (recursive), sorted, matching the extension list. */
async function collectFiles(dir, exts) {
  const out = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out; // absent directory hashes as empty, not as a crash
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await collectFiles(full, exts)));
    else if (entry.isFile() && exts.some((e) => entry.name.endsWith(e))) out.push(full);
  }
  return out.sort();
}

export const SEO_SOURCE_HASH_FILE = 'seo-source-hash.txt';

/**
 * sha256 over the head-affecting sources, keyed by artifact root.
 * Covers the shared SEO/data modules, the SSR entry, and the prerenderer
 * itself — the full pipeline between source and dist/public head tags.
 */
export async function computeSeoSourceHash(artifactRoot) {
  const dataFiles = await collectFiles(path.join(artifactRoot, 'src', 'data'), [
    '.ts',
    '.tsx',
    '.json',
  ]);
  const files = [
    ...dataFiles.filter(
      (f) =>
        !f.endsWith('.test.ts') &&
        !f.endsWith('.test.tsx') &&
        // The availability snapshot is refetched by every build (its committed
        // copy intentionally lags); dist↔snapshot consistency has its own
        // prerender guard, so it must not poison this source fingerprint.
        !f.endsWith('availabilitySnapshot.json'),
    ),
    path.join(artifactRoot, 'src', 'entry-server.tsx'),
    path.join(artifactRoot, 'scripts', 'prerender.mjs'),
  ];
  const hash = createHash('sha256');
  for (const file of files) {
    hash.update(path.relative(artifactRoot, file));
    hash.update('\0');
    hash.update(await fs.readFile(file));
    hash.update('\0');
  }
  return hash.digest('hex');
}
