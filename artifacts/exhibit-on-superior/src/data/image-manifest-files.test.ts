// Guards against manifest drift: every WebP/AVIF variant listed in the
// auto-generated IMAGE_MANIFEST must actually exist under public/images.
// If a re-export deletes or renames variant files without regenerating the
// manifest, this fails before visitors see broken photos.
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { IMAGE_MANIFEST } from './imageManifest';

const publicDir = path.resolve(import.meta.dirname, '..', '..', 'public');

/** Resolve a manifest src like "/images/foo-800w.webp" to a disk path. */
const toDisk = (src: string) => path.join(publicDir, src.replace(/^\//, ''));

const entries = Object.entries(IMAGE_MANIFEST);

describe('IMAGE_MANIFEST files exist on disk', () => {
  it('has at least one entry', () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it.each(entries)('%s: every variant file exists', (_original, meta) => {
    const missing: string[] = [];
    for (const variant of meta.variants) {
      if (!existsSync(toDisk(variant.src))) missing.push(variant.src);
      if (variant.avif && !existsSync(toDisk(variant.avif))) missing.push(variant.avif);
    }
    expect(missing, `missing files: ${missing.join(', ')}`).toEqual([]);
  });

  it.each(entries)('%s: widths are strictly ascending', (_original, meta) => {
    const widths = meta.variants.map((v) => v.w);
    const sorted = [...new Set(widths)].sort((a, b) => a - b);
    expect(widths).toEqual(sorted);
  });

  // The reverse guard: renamed/removed source photos must not leave orphaned
  // generated variants (*-NNNw.webp / *-NNNw.avif) shipping in every deploy.
  // `node scripts/optimize-images.mjs` also prunes these automatically.
  it('has no orphaned generated variants on disk', () => {
    const referenced = new Set<string>();
    for (const [, meta] of entries) {
      for (const variant of meta.variants) {
        referenced.add(path.basename(variant.src));
        if (variant.avif) referenced.add(path.basename(variant.avif));
      }
    }
    const orphans = readdirSync(path.join(publicDir, 'images')).filter(
      (file) => /-\d+w\.(webp|avif)$/.test(file) && !referenced.has(file),
    );
    expect(
      orphans,
      `orphaned variant files in public/images (delete them or rerun scripts/optimize-images.mjs): ${orphans.join(', ')}`,
    ).toEqual([]);
  });
});
