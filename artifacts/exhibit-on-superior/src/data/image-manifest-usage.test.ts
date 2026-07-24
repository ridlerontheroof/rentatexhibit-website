// Guards against dead photos re-accumulating: every entry in the
// auto-generated IMAGE_MANIFEST must be referenced by at least one real
// source file (src/** or index.html), excluding the manifest itself and
// test files. An unreferenced entry means an original is sitting in
// images-src/ generating WebP/AVIF variants that no page ever shows —
// delete the source photo and rerun scripts/optimize-images.mjs.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { IMAGE_MANIFEST } from './imageManifest';

const root = path.resolve(import.meta.dirname, '..', '..');
const srcDir = path.join(root, 'src');

function collectFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) {
      collectFiles(full, out);
      continue;
    }
    if (!/\.(ts|tsx|css|html)$/.test(name)) continue;
    if (/\.test\.(ts|tsx)$/.test(name)) continue;
    if (full === path.join(srcDir, 'data', 'imageManifest.ts')) continue;
    out.push(full);
  }
  return out;
}

describe('IMAGE_MANIFEST entries are referenced by source files', () => {
  it('flags manifest entries no page references', () => {
    const haystack = [...collectFiles(srcDir), path.join(root, 'index.html')]
      .map((f) => readFileSync(f, 'utf8'))
      .join('\n');
    const unused = Object.keys(IMAGE_MANIFEST).filter((key) => {
      // Match by stem so both "/images/foo.jpg" and variant paths count.
      const stem = path.basename(key).replace(/\.[a-z]+$/i, '');
      return !haystack.includes(stem);
    });
    expect(
      unused,
      `manifest entries no source file references — delete the originals from images-src/ and rerun scripts/optimize-images.mjs: ${unused.join(', ')}`,
    ).toEqual([]);
  });
});
