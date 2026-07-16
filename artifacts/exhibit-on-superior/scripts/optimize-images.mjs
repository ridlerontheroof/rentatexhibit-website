// Build-tool: convert public/images JPEGs to WebP + AVIF with responsive width
// variants, and emit src/data/imageManifest.ts (dimensions + variant list)
// consumed by <SmartImg>. Floor-plan sheets are already WebP and are skipped.
//
// Idempotent: re-running only regenerates missing/outdated outputs.
// Usage: node scripts/optimize-images.mjs
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const imagesDir = path.join(root, 'public', 'images');
const manifestPath = path.join(root, 'src', 'data', 'imageManifest.ts');

const QUALITY = '78';
// Per-stem WebP quality overrides for unusually detail-heavy photos whose
// variants blow past the ~300KB peer norm at the default quality. Slightly
// lower quality is visually indistinguishable but cuts page weight sharply.
const QUALITY_OVERRIDES = {
  'image-077-20170808-0721-c60hfw': '68',
  'image-059-20170808-0852-sw1ncm': '70',
  'image-055-dji-20230620092832-0149-d-yrh5eg': '70',
  'image-058-20170808-0843-ymrdpp': '70',
  'image-056-20170808-0721-c60hfw': '70',
  'image-054-20170808-0677-qicu1y': '70',
  'image-073-30-south-kis7bz': '70',
};
// AVIF quality (0-100 magick scale). ~60 lands at similar visual quality to
// WebP q78 while typically 20-40% smaller.
const AVIF_QUALITY = '60';
const AVIF_QUALITY_OVERRIDES = Object.fromEntries(Object.keys(QUALITY_OVERRIDES).map((k) => [k, '50']));
// When an AVIF comes out >= its WebP twin (typical for flat logos/graphics),
// retry at progressively lower quality; if it still doesn't win at the floor,
// drop the AVIF rung entirely so browsers never fetch the larger file.
const AVIF_RETRY_STEP = 10;
const AVIF_QUALITY_FLOOR = 30;
// Responsive rungs. The largest rung also caps the "full" WebP — nothing on
// the site renders wider than ~2000 CSS px.
const WIDTHS = [800, 1280, 2000];
// Extra small rungs for images that render far below the smallest global rung
// (e.g. the header/footer logo displays at ~140 CSS px, so a 320w rung covers
// 2x-DPR phones at a fraction of the 800w file size). Applied to any stem
// matching one of these patterns.
const SMALL_RUNG_PATTERNS = [/logo/i];
const SMALL_WIDTHS = [320];

const files = (await fs.readdir(imagesDir)).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort();

/** @type {Record<string, { width: number; height: number; variants: { src: string; w: number }[] }>} */
const manifest = {};

for (const file of files) {
  const abs = path.join(imagesDir, file);
  const { stdout } = await run('magick', ['identify', '-format', '%w %h', abs]);
  const [width, height] = stdout.trim().split(' ').map(Number);
  const stem = file.replace(/\.(jpe?g|png)$/i, '');

  // Rungs strictly below the source width, plus the source width itself capped
  // at the largest rung (nothing renders wider than that).
  const baseWidths = SMALL_RUNG_PATTERNS.some((re) => re.test(stem)) ? [...SMALL_WIDTHS, ...WIDTHS] : WIDTHS;
  const rungs = [
    ...new Set([...baseWidths.filter((w) => w < width), Math.min(width, WIDTHS[WIDTHS.length - 1])]),
  ].sort((a, b) => a - b);

  const variants = [];
  for (const target of rungs) {
    const outputs = [
      { ext: 'webp', quality: QUALITY_OVERRIDES[stem] ?? QUALITY },
      { ext: 'avif', quality: AVIF_QUALITY_OVERRIDES[stem] ?? AVIF_QUALITY },
    ];
    const entry = { w: target };
    for (const { ext, quality } of outputs) {
      const outName = `${stem}-${target}w.${ext}`;
      const out = path.join(imagesDir, outName);
      let need = true;
      try {
        const [srcStat, outStat] = await Promise.all([fs.stat(abs), fs.stat(out)]);
        need = outStat.mtimeMs < srcStat.mtimeMs;
      } catch {
        need = true;
      }
      if (need) {
        await run('magick', [abs, '-auto-orient', '-resize', `${target}x>`, '-quality', quality, out]);
      }
      entry[ext === 'webp' ? 'src' : 'avif'] = `/images/${outName}`;
    }

    // AVIF must beat WebP or it doesn't ship: re-encode at lower quality
    // until it wins; drop the rung if it never does.
    const webpPath = path.join(imagesDir, `${stem}-${target}w.webp`);
    const avifPath = path.join(imagesDir, `${stem}-${target}w.avif`);
    let webpSize = (await fs.stat(webpPath)).size;
    let avifSize = (await fs.stat(avifPath)).size;
    if (avifSize >= webpSize) {
      let q = Number(AVIF_QUALITY_OVERRIDES[stem] ?? AVIF_QUALITY);
      while (avifSize >= webpSize && q - AVIF_RETRY_STEP >= AVIF_QUALITY_FLOOR) {
        q -= AVIF_RETRY_STEP;
        await run('magick', [abs, '-auto-orient', '-resize', `${target}x>`, '-quality', String(q), avifPath]);
        avifSize = (await fs.stat(avifPath)).size;
      }
      if (avifSize >= webpSize) {
        console.warn(
          `AVIF never beat WebP for ${stem} @${target}w (${avifSize} vs ${webpSize} bytes); dropping AVIF rung.`,
        );
        await fs.rm(avifPath, { force: true });
        delete entry.avif;
      } else {
        console.warn(`Re-encoded ${stem} @${target}w AVIF at q${q} to beat WebP (${avifSize} vs ${webpSize} bytes).`);
      }
    }

    variants.push({ src: entry.src, avif: entry.avif, w: entry.w });
    if (target === width) break; // original narrower than this rung; stop
  }
  // Deduplicate rungs that collapsed to the same width
  const seen = new Set();
  const unique = variants.filter((v) => !seen.has(v.w) && seen.add(v.w));

  manifest[`/images/${file}`] = { width, height, variants: unique };
}

const header = `// AUTO-GENERATED by scripts/optimize-images.mjs — do not edit by hand.
// Maps original image paths to intrinsic dimensions + generated WebP/AVIF variants.

export interface ImageVariant {
  src: string;
  /** Absent when the AVIF encode couldn't beat the WebP twin's size. */
  avif?: string;
  w: number;
}

export interface ImageMeta {
  width: number;
  height: number;
  variants: ImageVariant[];
}

export const IMAGE_MANIFEST: Record<string, ImageMeta> = `;

await fs.writeFile(manifestPath, header + JSON.stringify(manifest, null, 2) + ';\n', 'utf8');
console.log(`Optimized ${files.length} images; manifest written to ${path.relative(root, manifestPath)}.`);

// Prune orphaned generated variants: *-NNNw.webp/.avif files on disk that no
// manifest entry references (left behind by renamed/removed source photos).
const referenced = new Set();
for (const meta of Object.values(manifest)) {
  for (const v of meta.variants) {
    referenced.add(path.basename(v.src));
    if (v.avif) referenced.add(path.basename(v.avif));
  }
}
const orphans = (await fs.readdir(imagesDir)).filter((f) => /-\d+w\.(webp|avif)$/.test(f) && !referenced.has(f));
for (const f of orphans) {
  await fs.rm(path.join(imagesDir, f), { force: true });
  console.warn(`Pruned orphaned variant ${f}`);
}
if (orphans.length) console.log(`Pruned ${orphans.length} orphaned variant file(s).`);
