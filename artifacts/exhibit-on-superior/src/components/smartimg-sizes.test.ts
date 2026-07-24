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
