import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { IMAGE_MANIFEST } from './imageManifest';

// Verifies that every static image the site references actually exists under
// public/images/, and that no orphan files linger there unreferenced.
// Floor-plan renderings (/images/floor-plans/) are covered separately by
// floorPlans.test.ts, so they are excluded here.

const ROOT = join(__dirname, '..', '..');
const SRC_DIR = join(ROOT, 'src');
const PUBLIC_DIR = join(ROOT, 'public');
const IMAGES_DIR = join(PUBLIC_DIR, 'images');

const SOURCE_EXTS = new Set(['.ts', '.tsx', '.css', '.html']);
const IMAGE_PATH_RE = /\/images\/[A-Za-z0-9_@%./-]+\.(?:png|jpe?g|webp|gif|svg|avif)/g;

/** Recursively list files under dir, skipping generated/test noise. */
function listFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === 'node_modules' || name === 'dist') continue;
      out.push(...listFiles(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

/** Strip JS/TS comments so doc examples (e.g. "/images/foo.jpg") don't count. */
function stripComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

/** All /images/... paths referenced by app source (src/** + index.html). */
function collectReferencedPaths(): Map<string, Set<string>> {
  const refs = new Map<string, Set<string>>(); // path -> referencing files
  const sources = [
    ...listFiles(SRC_DIR).filter((f) => SOURCE_EXTS.has(f.slice(f.lastIndexOf('.')))),
    join(ROOT, 'index.html'),
  ].filter((f) => !f.endsWith('.test.ts'));

  for (const file of sources) {
    const text = stripComments(readFileSync(file, 'utf8'));
    for (const match of text.match(IMAGE_PATH_RE) ?? []) {
      if (!refs.has(match)) refs.set(match, new Set());
      refs.get(match)!.add(relative(ROOT, file));
    }
  }
  return refs;
}

const referenced = collectReferencedPaths();

describe('site-wide static images', () => {
  it('finds a meaningful number of image references (regex sanity check)', () => {
    expect(referenced.size).toBeGreaterThan(20);
  });

  it('every image path referenced in source exists under public/', () => {
    const missing: string[] = [];
    for (const [path, files] of referenced) {
      if (path.startsWith('/images/floor-plans/')) continue; // covered by floorPlans.test.ts
      if (!existsSync(join(PUBLIC_DIR, path))) {
        missing.push(`${path} (referenced by ${[...files].join(', ')})`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('every IMAGE_MANIFEST original and WebP variant exists under public/', () => {
    const missing: string[] = [];
    for (const [original, meta] of Object.entries(IMAGE_MANIFEST)) {
      if (!existsSync(join(PUBLIC_DIR, original))) missing.push(original);
      for (const v of meta.variants) {
        if (!existsSync(join(PUBLIC_DIR, v.src))) missing.push(v.src);
      }
    }
    expect(missing).toEqual([]);
  });

  it('no orphan files sit in public/images that nothing references', () => {
    // Union of everything legitimately referenced: source refs, manifest
    // originals, and manifest-generated WebP variants.
    const known = new Set<string>(referenced.keys());
    for (const [original, meta] of Object.entries(IMAGE_MANIFEST)) {
      known.add(original);
      for (const v of meta.variants) known.add(v.src);
    }

    const orphans = listFiles(IMAGES_DIR)
      .map((f) => '/' + relative(PUBLIC_DIR, f).split('\\').join('/'))
      .filter((p) => !p.startsWith('/images/floor-plans/')) // covered by floorPlans.test.ts
      .filter((p) => /\.(?:png|jpe?g|webp|gif|svg|avif)$/i.test(p)) // ignore non-image files (e.g. optimizer's CSV report)
      .filter((p) => !known.has(p));

    expect(orphans).toEqual([]);
  });
});
