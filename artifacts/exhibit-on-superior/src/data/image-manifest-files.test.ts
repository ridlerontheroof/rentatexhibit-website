// Guards against manifest drift: every WebP/AVIF variant listed in the
// auto-generated IMAGE_MANIFEST must actually exist under public/images.
// If a re-export deletes or renames variant files without regenerating the
// manifest, this fails before visitors see broken photos.
import { existsSync } from 'node:fs';
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
});
