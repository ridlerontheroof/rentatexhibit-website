// Static scan of every <SmartImg> call site in src/, catching images that
// render small but download big. SmartImg silently defaults to sizes="100vw",
// so a call site that omits sizes — or renders in a fixed small box while
// claiming a huge sizes — makes phones download files far larger than the
// rendered element needs. logo-sizes.test.tsx guards the header/footer logo
// specifically; this scan guards every other (and future) SmartImg usage.
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { resolveSizes } from '../lib/resolveSizes';
import { IMAGE_MANIFEST } from '../data/imageManifest';

const SRC_ROOT = join(__dirname, '..');
const PHONE_VIEWPORT_CSS_PX = 390;
const DESKTOP_VIEWPORT_CSS_PX = 1440;
// A fixed CSS width at/below this is a "small" render (a thumbnail, tile,
// logo, or side-rail card — not a hero/banner).
const SMALL_RENDER_PX = 400;
// Allow sizes to claim a bit more than the box (borders, safety margin).
const TOLERANCE = 1.25;

interface CallSite {
  file: string; // path relative to src/
  line: number;
  attrs: string; // raw JSX attribute text
}

function walkTsxFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walkTsxFiles(full, out);
    else if (/\.tsx$/.test(name) && !/\.test\.tsx$/.test(name)) out.push(full);
  }
  return out;
}

/** Find every <SmartImg ...> opening tag in a source string. */
export function findSmartImgCallSites(source: string, file: string): CallSite[] {
  const sites: CallSite[] = [];
  const re = /<SmartImg\b([\s\S]*?)\/?>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    const line = source.slice(0, m.index).split('\n').length;
    sites.push({ file, line, attrs: m[1] });
  }
  return sites;
}

function getStringAttr(attrs: string, name: string): string | undefined {
  const m = attrs.match(new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`));
  return m?.[1];
}

function hasAttr(attrs: string, name: string): boolean {
  return new RegExp(`\\b${name}\\s*=`).test(attrs);
}

/**
 * Infer a fixed small rendered CSS width (px) from Tailwind classes, or
 * undefined when the element is fluid (w-full etc.) or not provably small.
 * Handles: w-N (N*4px), w-[Npx], max-w-[Npx], and h-N + w-auto (width
 * derived from the manifest aspect ratio when src is a literal).
 */
export function inferFixedSmallWidth(attrs: string): number | undefined {
  const className = getStringAttr(attrs, 'className') ?? '';
  const widths: number[] = [];
  for (const m of className.matchAll(/(?:^|\s)w-(\d+)(?:\s|$)/g)) widths.push(Number(m[1]) * 4);
  for (const m of className.matchAll(/(?:^|\s)(?:max-)?w-\[(\d+(?:\.\d+)?)px\]/g))
    widths.push(Number(m[1]));
  if (/(?:^|\s)w-auto(?:\s|$)/.test(className)) {
    const h = className.match(/(?:^|\s)h-(\d+)(?:\s|$)/);
    const src = getStringAttr(attrs, 'src');
    const meta = src ? IMAGE_MANIFEST[src] : undefined;
    if (h && meta) widths.push(Number(h[1]) * 4 * (meta.width / meta.height));
  }
  if (widths.length === 0) return undefined;
  const w = Math.min(...widths);
  return w <= SMALL_RENDER_PX ? w : undefined;
}

/** Returns a human-readable violation for a call site, or null if it's fine. */
export function checkCallSite(site: CallSite): string | null {
  const where = `${site.file}:${site.line} <SmartImg src=${getStringAttr(site.attrs, 'src') ?? '{dynamic}'}>`;
  if (!hasAttr(site.attrs, 'sizes')) {
    return (
      `${where} has no sizes attribute, so SmartImg falls back to sizes="100vw" ` +
      `and phones download a full-viewport-width file regardless of rendered size. ` +
      `Fix: pass a sizes attribute matching the element's rendered CSS width ` +
      `(e.g. sizes="200px" for a fixed box, or media-conditioned vw values for fluid grids).`
    );
  }
  const sizes = getStringAttr(site.attrs, 'sizes');
  if (sizes === undefined) return null; // dynamic sizes expression — assume intentional

  const smallWidth = inferFixedSmallWidth(site.attrs);
  if (smallWidth === undefined) return null; // fluid/large element — 100vw-ish sizes is legit

  for (const viewport of [PHONE_VIEWPORT_CSS_PX, DESKTOP_VIEWPORT_CSS_PX]) {
    const claimed = resolveSizes(sizes, viewport);
    if (claimed > smallWidth * TOLERANCE) {
      return (
        `${where} renders in a fixed ~${Math.round(smallWidth)}px-wide box (from its className) ` +
        `but sizes="${sizes}" claims ${Math.round(claimed)}px at a ${viewport}px viewport, ` +
        `so browsers download a much larger file than needed. ` +
        `Fix: set sizes to match the rendered width, e.g. sizes="${Math.round(smallWidth)}px".`
      );
    }
  }
  return null;
}

// --- Inverse guard: renders big but only ships a small (blurry) file. -----
// An image whose sizes claims a large width (e.g. 50vw on desktop) but whose
// manifest only has a small largest rung (e.g. 400w) renders soft/blurry on
// large screens: the browser wants a big file but the biggest one available
// is far smaller than the rendered element.
const DESKTOP_DPR = 2;
// The largest rung may be somewhat smaller than the ideal device-px width
// before blur is noticeable; only flag "meaningful" shortfalls.
const BLUR_SHORTFALL = 1.5;
// Legacy photos whose ORIGINAL file (in images-src/) is itself small, so no
// larger rung can be regenerated — only replacing the source photo helps.
// Each entry is verified below to still be genuinely source-limited: if a
// bigger original lands and the manifest is regenerated, the entry must be
// removed so the guard re-arms for that image.
// An "original" wider than this is big enough to regenerate useful rungs
// from, so it never belongs on the allowlist.
const SMALL_ORIGINAL_MAX_PX = 400;
export const KNOWN_SMALL_ORIGINALS = new Set<string>([]);

/** Returns a violation when the call site renders wider than its manifest's
 *  largest rung can sharply cover at a desktop viewport, or null if fine. */
export function checkLargestRung(site: CallSite): string | null {
  const src = getStringAttr(site.attrs, 'src');
  if (!src) return null; // dynamic src — cannot resolve a manifest entry statically
  const meta = IMAGE_MANIFEST[src];
  if (!meta) return null; // unmanifested src is caught elsewhere (SmartImg renders plain img)
  const sizes = getStringAttr(site.attrs, 'sizes');
  if (sizes === undefined) return null; // missing/dynamic sizes handled by checkCallSite

  const renderedCssPx = Math.min(
    resolveSizes(sizes, DESKTOP_VIEWPORT_CSS_PX),
    inferFixedSmallWidth(site.attrs) ?? Infinity,
  );
  const neededDevicePx = renderedCssPx * DESKTOP_DPR;
  const largestRung = Math.max(...meta.variants.map((v) => v.w));
  if (largestRung * BLUR_SHORTFALL >= neededDevicePx) return null;
  // Source-limited legacy photo: manifest already ships the full original and
  // the allowlist below verifies that claim. Only a better photo can fix it.
  if (KNOWN_SMALL_ORIGINALS.has(src) && largestRung >= meta.width) return null;

  const where = `${site.file}:${site.line} <SmartImg src=${src}>`;
  return (
    `${where} claims sizes="${sizes}" (~${Math.round(renderedCssPx)}px CSS at a ` +
    `${DESKTOP_VIEWPORT_CSS_PX}px viewport, ~${Math.round(neededDevicePx)} device px at ` +
    `${DESKTOP_DPR}x DPR) but the manifest's largest rung for this image is only ` +
    `${largestRung}w, so it renders soft/blurry on large screens. ` +
    `Fix: regenerate a larger rung via scripts/optimize-images.mjs (source a bigger ` +
    `original in images-src/ if the current one is only ${meta.width}px wide), or ` +
    `shrink sizes to match what the image can sharply cover.`
  );
}

describe('every SmartImg call site declares an honest sizes attribute', () => {
  const files = walkTsxFiles(SRC_ROOT);
  const sites = files.flatMap((f) =>
    findSmartImgCallSites(readFileSync(f, 'utf8'), relative(SRC_ROOT, f)),
  );

  it('finds SmartImg call sites to scan (scan is not silently broken)', () => {
    expect(sites.length).toBeGreaterThanOrEqual(10);
  });

  it('no call site omits sizes or over-claims width for a small render', () => {
    const violations = sites.map(checkCallSite).filter((v): v is string => v !== null);
    expect(violations, `\n${violations.join('\n\n')}\n`).toEqual([]);
  });

  it('no call site renders wider than its manifest largest rung can sharply cover', () => {
    const violations = sites.map(checkLargestRung).filter((v): v is string => v !== null);
    expect(violations, `\n${violations.join('\n\n')}\n`).toEqual([]);
  });
});

describe('the largest-rung guard catches big renders shipping small files', () => {
  // Once source-limited at 400px, image-009 now has a 1200px original and a
  // 1200w largest rung, so it passes on its own merits (no allowlist entry).
  const smallSrc = '/images/image-009-34-southeast-levwhc.jpg';

  it('flags a full-width desktop render backed only by a 1000w rung', () => {
    // image-004 has a 1000px original / 1000w largest rung and is NOT on the
    // small-originals allowlist, so a 100vw claim (2880 device px) must flag.
    const [site] = findSmartImgCallSites(
      `<SmartImg src="/images/image-004-012417-5732-pu4fo5.jpg" alt="x" sizes="100vw" className="w-full" />`,
      'synthetic.tsx',
    );
    const violation = checkLargestRung(site);
    expect(violation).toMatch(/largest rung for this image is only 1000w/);
    expect(violation).toMatch(/synthetic\.tsx:1/);
    expect(violation).toMatch(/optimize-images\.mjs/);
  });

  it('passes a half-width render now backed by a 1200w rung, with no allowlist', () => {
    // image-009 used to need the allowlist (400px original); after sourcing a
    // 1200px original it must pass on rung size alone.
    const [site] = findSmartImgCallSites(
      `<SmartImg src="${smallSrc}" alt="x" sizes="(min-width: 1024px) 50vw, 100vw" className="w-full" />`,
      'synthetic.tsx',
    );
    expect(KNOWN_SMALL_ORIGINALS.has(smallSrc)).toBe(false);
    expect(checkLargestRung(site)).toBeNull();
  });

  it('the allowlist suppression path still works for a synthetic small original', () => {
    // Keep the escape hatch tested even while the allowlist is empty: register
    // a fake entry, verify it suppresses, then remove it.
    const fake = '/images/image-004-012417-5732-pu4fo5.jpg'; // 1000px original, 1000w rung
    const [site] = findSmartImgCallSites(
      `<SmartImg src="${fake}" alt="x" sizes="100vw" className="w-full" />`,
      'synthetic.tsx',
    );
    expect(checkLargestRung(site)).not.toBeNull(); // flags without allowlist
    KNOWN_SMALL_ORIGINALS.add(fake);
    try {
      expect(checkLargestRung(site)).toBeNull(); // allowlist suppresses
    } finally {
      KNOWN_SMALL_ORIGINALS.delete(fake);
    }
  });

  it('accepts the same image rendered in an honest small box', () => {
    const [site] = findSmartImgCallSites(
      `<SmartImg src="${smallSrc}" alt="x" sizes="200px" className="w-[200px]" />`,
      'synthetic.tsx',
    );
    expect(checkLargestRung(site)).toBeNull();
  });

  it('accepts a full-width hero backed by a 2000w rung (within tolerance)', () => {
    const [site] = findSmartImgCallSites(
      `<SmartImg src="/images/image-002-gettyimages-1286580777-nvdupq.jpg" alt="x" sizes="100vw" className="w-full" />`,
      'synthetic.tsx',
    );
    expect(checkLargestRung(site)).toBeNull();
  });

  it('uses the fixed box width, not an over-claimed sizes, as the render width', () => {
    // Small fixed box: even with a silly sizes, the element cannot render big,
    // and the over-claim itself is checkCallSite's job.
    const [site] = findSmartImgCallSites(
      `<SmartImg src="${smallSrc}" alt="x" sizes="100vw" className="w-[200px]" />`,
      'synthetic.tsx',
    );
    expect(checkLargestRung(site)).toBeNull();
  });

  it('allowlist entries are all still genuinely source-limited (self-expiring)', () => {
    // If a bigger original is added and the manifest regenerated, the guard
    // must re-arm: the entry has to be removed from KNOWN_SMALL_ORIGINALS.
    const stale = [...KNOWN_SMALL_ORIGINALS].filter((src) => {
      const meta = IMAGE_MANIFEST[src];
      if (!meta) return true; // image gone — remove the dead entry
      const largestRung = Math.max(...meta.variants.map((v) => v.w));
      return largestRung < meta.width || meta.width > SMALL_ORIGINAL_MAX_PX;
    });
    expect(
      stale,
      `\nThese KNOWN_SMALL_ORIGINALS entries are no longer source-limited ` +
        `(a bigger original or rung now exists, or the image was removed) — ` +
        `delete them so the largest-rung guard re-arms:\n${stale.join('\n')}\n`,
    ).toEqual([]);
  });

  it('skips dynamic src and unmanifested images', () => {
    const [dyn] = findSmartImgCallSites(
      `<SmartImg src={photo.src} alt="x" sizes="100vw" className="w-full" />`,
      'synthetic.tsx',
    );
    expect(checkLargestRung(dyn)).toBeNull();
    const [unknown] = findSmartImgCallSites(
      `<SmartImg src="/images/not-in-manifest.jpg" alt="x" sizes="100vw" className="w-full" />`,
      'synthetic.tsx',
    );
    expect(checkLargestRung(unknown)).toBeNull();
  });
});

describe('the scanner itself catches violations (self-test on synthetic code)', () => {
  it('flags a call site with no sizes at all (silent 100vw default)', () => {
    const [site] = findSmartImgCallSites(
      `<SmartImg src="/images/x.jpg" alt="x" className="w-24" />`,
      'synthetic.tsx',
    );
    expect(checkCallSite(site)).toMatch(/no sizes attribute/);
  });

  it('flags a small fixed-width box carrying sizes="100vw"', () => {
    const [site] = findSmartImgCallSites(
      `<SmartImg src="/images/x.jpg" alt="x" sizes="100vw" className="w-[200px] h-full" />`,
      'synthetic.tsx',
    );
    expect(checkCallSite(site)).toMatch(/renders in a fixed ~200px-wide box/);
  });

  it('flags an h-N w-auto element (manifest aspect) with an oversized sizes', () => {
    const logoSrc = '/images/image-001-exhibit-on-superior-logo-color-a7pvg4.png';
    const [site] = findSmartImgCallSites(
      `<SmartImg src="${logoSrc}" alt="x" sizes="100vw" className="h-12 w-auto" />`,
      'synthetic.tsx',
    );
    expect(checkCallSite(site)).toMatch(/renders in a fixed ~\d+px-wide box/);
  });

  it('accepts a fluid full-width element with viewport-based sizes', () => {
    const [site] = findSmartImgCallSites(
      `<SmartImg src="/images/x.jpg" alt="x" sizes="(min-width: 1024px) 25vw, 100vw" className="w-full h-full object-cover" />`,
      'synthetic.tsx',
    );
    expect(checkCallSite(site)).toBeNull();
  });

  it('accepts a small box with an honest px sizes', () => {
    const [site] = findSmartImgCallSites(
      `<SmartImg src="/images/x.jpg" alt="x" sizes="140px" className="w-[140px]" />`,
      'synthetic.tsx',
    );
    expect(checkCallSite(site)).toBeNull();
  });
});
