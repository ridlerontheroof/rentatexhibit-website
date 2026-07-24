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
// Original source photos live outside public/ so they never ship in the
// published bundle — browsers only download the generated WebP/AVIF variants.
const SOURCES_DIR = join(ROOT, 'images-src');

/** Resolve an /images/... path to its on-disk file: published copy if it
 *  ships, otherwise the relocated source in images-src/. */
function resolveImagePath(p: string): string | null {
  const shipped = join(PUBLIC_DIR, p);
  if (existsSync(shipped)) return shipped;
  const source = join(SOURCES_DIR, p.replace(/^\/images\//, ''));
  return existsSync(source) ? source : null;
}

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

/** Parse real pixel dimensions from a PNG/JPEG/WebP file header. */
function readImageDimensions(file: string): { width: number; height: number } | null {
  const buf = readFileSync(file);

  // PNG: IHDR width/height at fixed offsets 16..24.
  if (buf.length >= 24 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }

  // JPEG: walk markers until a SOFn frame header (contains height then width).
  if (buf.length >= 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let off = 2;
    while (off + 9 < buf.length) {
      if (buf[off] !== 0xff) return null; // corrupt marker stream
      const marker = buf[off + 1];
      if (marker === 0xff) {
        off += 1; // fill byte
        continue;
      }
      // Standalone markers without a length segment.
      if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
        off += 2;
        continue;
      }
      const len = buf.readUInt16BE(off + 2);
      const isSOF =
        marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
      if (isSOF) {
        return { height: buf.readUInt16BE(off + 5), width: buf.readUInt16BE(off + 7) };
      }
      off += 2 + len;
    }
    return null;
  }

  // AVIF: ISOBMFF container; primary item dimensions live in the first 'ispe'
  // (image spatial extents) property box: fourcc, 4-byte version/flags, then
  // uint32 BE width and height.
  if (buf.length >= 12 && buf.toString('ascii', 4, 8) === 'ftyp' && buf.toString('ascii', 8, 12) === 'avif') {
    const idx = buf.indexOf('ispe', 0, 'ascii');
    if (idx !== -1 && idx + 16 <= buf.length) {
      return { width: buf.readUInt32BE(idx + 8), height: buf.readUInt32BE(idx + 12) };
    }
    return null;
  }

  // WebP: RIFF container with VP8 (lossy), VP8L (lossless), or VP8X (extended).
  if (
    buf.length >= 30 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  ) {
    const fourcc = buf.toString('ascii', 12, 16);
    if (fourcc === 'VP8 ') {
      // Lossy: frame tag at 20, sync code 9D 01 2A, then 14-bit width/height.
      if (buf[23] === 0x9d && buf[24] === 0x01 && buf[25] === 0x2a) {
        return {
          width: buf.readUInt16LE(26) & 0x3fff,
          height: buf.readUInt16LE(28) & 0x3fff,
        };
      }
      return null;
    }
    if (fourcc === 'VP8L') {
      if (buf[20] !== 0x2f) return null; // signature byte
      const bits = buf.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    if (fourcc === 'VP8X') {
      // 24-bit little-endian canvas width/height minus one at offsets 24 and 27.
      const width = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16));
      const height = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16));
      return { width, height };
    }
    return null;
  }

  return null;
}

const referenced = collectReferencedPaths();

describe('site-wide static images', () => {
  it('finds a meaningful number of image references (regex sanity check)', () => {
    expect(referenced.size).toBeGreaterThan(20);
  });

  it('every image path referenced in source exists on disk (public/ or images-src/)', () => {
    // Manifest keys reference original photos that live in images-src/; the
    // published bundle only contains their generated variants.
    const missing: string[] = [];
    for (const [path, files] of referenced) {
      if (path.startsWith('/images/floor-plans/')) continue; // covered by floorPlans.test.ts
      if (!resolveImagePath(path)) {
        missing.push(`${path} (referenced by ${[...files].join(', ')})`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('every IMAGE_MANIFEST original exists on disk and every WebP/AVIF variant under public/', () => {
    const missing: string[] = [];
    for (const [original, meta] of Object.entries(IMAGE_MANIFEST)) {
      if (!resolveImagePath(original)) missing.push(original);
      for (const v of meta.variants) {
        if (!existsSync(join(PUBLIC_DIR, v.src))) missing.push(v.src);
        if (v.avif && !existsSync(join(PUBLIC_DIR, v.avif))) missing.push(v.avif);
      }
    }
    expect(missing).toEqual([]);
  });

  it('every image file is non-empty and has a valid header for its format', () => {
    // Validate every image actually shipped under public/images (excluding
    // floor plans, which floorPlans.test.ts covers) — this catches corrupted
    // exports regardless of how the file is referenced.
    const bad: string[] = [];
    const files = listFiles(IMAGES_DIR)
      .map((f) => '/' + relative(PUBLIC_DIR, f).split('\\').join('/'))
      .filter((p) => !p.startsWith('/images/floor-plans/'))
      .filter((p) => /\.(?:png|jpe?g|webp|avif)$/i.test(p));

    expect(files.length).toBeGreaterThan(20); // sanity: we are actually checking things

    for (const p of files) {
      const buf = readFileSync(join(PUBLIC_DIR, p));
      if (buf.length === 0) {
        bad.push(`${p} (empty file)`);
        continue;
      }
      const ext = p.slice(p.lastIndexOf('.') + 1).toLowerCase();
      if (ext === 'avif') {
        if (
          buf.length < 12 ||
          buf.toString('ascii', 4, 8) !== 'ftyp' ||
          buf.toString('ascii', 8, 12) !== 'avif'
        ) {
          bad.push(`${p} (invalid AVIF header)`);
        }
      } else if (ext === 'webp') {
        if (
          buf.length < 12 ||
          buf.toString('ascii', 0, 4) !== 'RIFF' ||
          buf.toString('ascii', 8, 12) !== 'WEBP'
        ) {
          bad.push(`${p} (invalid WebP header)`);
        }
      } else if (ext === 'jpg' || ext === 'jpeg') {
        if (buf.length < 2 || buf[0] !== 0xff || buf[1] !== 0xd8) {
          bad.push(`${p} (invalid JPEG header)`);
        }
      } else if (ext === 'png') {
        const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
        if (buf.length < 8 || !sig.every((b, i) => buf[i] === b)) {
          bad.push(`${p} (invalid PNG signature)`);
        }
      }
    }
    expect(bad, `corrupted or empty images: ${bad.join(', ')}`).toEqual([]);
  }, 30_000); // full-disk image scan can exceed the 5s default under parallel test load

  it('every IMAGE_MANIFEST entry matches the real pixel dimensions on disk', () => {
    // Manifest dimensions reserve layout space; if a re-exported image drifts
    // from the recorded size, pages jump or images render stretched.
    const bad: string[] = [];

    for (const [original, meta] of Object.entries(IMAGE_MANIFEST)) {
      const file = resolveImagePath(original);
      if (!file) {
        bad.push(`${original} (source file not found)`);
        continue;
      }
      const dims = readImageDimensions(file);
      if (!dims) {
        bad.push(`${original} (could not read dimensions)`);
      } else if (dims.width !== meta.width || dims.height !== meta.height) {
        bad.push(
          `${original} (manifest says ${meta.width}x${meta.height}, file is ${dims.width}x${dims.height})`,
        );
      }

      for (const v of meta.variants) {
        for (const variantPath of v.avif ? [v.src, v.avif] : [v.src]) {
          const vDims = readImageDimensions(join(PUBLIC_DIR, variantPath));
          if (!vDims) {
            bad.push(`${variantPath} (could not read dimensions)`);
            continue;
          }
          if (vDims.width !== v.w) {
            bad.push(`${variantPath} (manifest says width ${v.w}, file is ${vDims.width}x${vDims.height})`);
          }
          // Variants must preserve the original's aspect ratio (±1px rounding).
          const expectedH = Math.round((v.w * meta.height) / meta.width);
          if (Math.abs(vDims.height - expectedH) > 1) {
            bad.push(
              `${variantPath} (expected height ~${expectedH} for width ${v.w} at ${meta.width}x${meta.height} aspect, file is ${vDims.width}x${vDims.height})`,
            );
          }
        }
      }
    }

    expect(bad, `manifest/file dimension mismatches:\n${bad.join('\n')}`).toEqual([]);
  });

  it('every image stays under its byte budget for its format and pixel size', () => {
    // Guards against a bloated re-export (e.g. a 10MB WebP) silently shipping.
    // Budgets scale with pixel area (bytes-per-pixel), so larger width tiers
    // get proportionally larger budgets. Current worst offenders sit around
    // 0.29 B/px (WebP) and 0.35 B/px (JPEG); the caps below leave headroom for
    // normal re-exports while catching order-of-magnitude regressions.
    const BYTES_PER_PIXEL_BUDGET: Record<string, number> = {
      avif: 0.45,
      webp: 0.45,
      jpg: 0.6,
      jpeg: 0.6,
      png: 1.0, // only logos today; PNG photos would be a mistake anyway
    };
    const MIN_BUDGET_BYTES = 30 * 1024; // container/metadata floor for tiny images
    const HARD_CAP_BYTES = 1024 * 1024; // nothing on this site justifies >1MB

    const files = listFiles(IMAGES_DIR)
      .map((f) => '/' + relative(PUBLIC_DIR, f).split('\\').join('/'))
      .filter((p) => !p.startsWith('/images/floor-plans/')) // covered by floorPlans.test.ts
      .filter((p) => /\.(?:png|jpe?g|webp|avif)$/i.test(p));

    expect(files.length).toBeGreaterThan(20); // sanity: we are actually checking things

    const fmtKB = (bytes: number) => `${(bytes / 1024).toFixed(1)}KB`;
    const over: string[] = [];

    for (const p of files) {
      const full = join(PUBLIC_DIR, p);
      const size = statSync(full).size;
      const ext = p.slice(p.lastIndexOf('.') + 1).toLowerCase();
      const dims = readImageDimensions(full);
      if (!dims) {
        over.push(`${p} (could not read dimensions to compute budget)`);
        continue;
      }
      const budget = Math.min(
        HARD_CAP_BYTES,
        Math.max(MIN_BUDGET_BYTES, Math.ceil(dims.width * dims.height * BYTES_PER_PIXEL_BUDGET[ext])),
      );
      if (size > budget) {
        over.push(
          `${p} is ${fmtKB(size)}, over its ${fmtKB(budget)} budget ` +
            `(${dims.width}x${dims.height} ${ext} @ ${BYTES_PER_PIXEL_BUDGET[ext]} B/px, hard cap ${fmtKB(HARD_CAP_BYTES)})`,
        );
      }
    }

    expect(over, `oversized images:\n${over.join('\n')}`).toEqual([]);
  });

  it('every shipped AVIF variant is smaller than its WebP twin', () => {
    // Modern browsers pick AVIF from <picture> when offered; if an AVIF rung
    // came out larger than its WebP twin, they'd fetch MORE bytes, not fewer.
    // The optimizer re-encodes or drops such rungs — this catches regressions.
    const larger: string[] = [];
    for (const meta of Object.values(IMAGE_MANIFEST)) {
      for (const v of meta.variants) {
        if (!v.avif) continue; // rung intentionally dropped by the optimizer
        const avifSize = statSync(join(PUBLIC_DIR, v.avif)).size;
        const webpSize = statSync(join(PUBLIC_DIR, v.src)).size;
        if (avifSize >= webpSize) {
          larger.push(`${v.avif} (${avifSize}B) >= ${v.src} (${webpSize}B)`);
        }
      }
    }
    expect(larger, `AVIF variants not smaller than WebP:\n${larger.join('\n')}`).toEqual([]);
  });

  it('no orphan files sit in public/images that nothing references', () => {
    // Union of everything legitimately referenced: source refs, manifest
    // originals, and manifest-generated WebP variants.
    const known = new Set<string>(referenced.keys());
    for (const [original, meta] of Object.entries(IMAGE_MANIFEST)) {
      known.add(original);
      for (const v of meta.variants) {
        known.add(v.src);
        if (v.avif) known.add(v.avif);
      }
    }

    const orphans = listFiles(IMAGES_DIR)
      .map((f) => '/' + relative(PUBLIC_DIR, f).split('\\').join('/'))
      .filter((p) => !p.startsWith('/images/floor-plans/')) // covered by floorPlans.test.ts
      // Referenced externally by the API server's branded lead emails
      // (artifacts/api-server/src/lib/emailTemplates.ts BRAND.logoUrl), not by
      // web source code — hosted here so email clients load an absolute URL.
      .filter((p) => !p.startsWith('/images/email/'))
      .filter((p) => /\.(?:png|jpe?g|webp|gif|svg|avif)$/i.test(p)) // ignore non-image files (e.g. optimizer's CSV report)
      .filter((p) => !known.has(p));

    expect(orphans).toEqual([]);
  });
});
