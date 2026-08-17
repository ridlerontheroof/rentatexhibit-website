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
import { HERO_SLIDES } from '../pages/Home';
import { galleryImages } from '../data/gallery';
import { ALL_BLOG_ARTICLES } from '../data/blogArticles';
import { lifeAtExhibitVideo, matterportTours } from '../data/virtualTours';

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

// --- Data-driven images: entries rendered via arrays, not literal src. -----
// The call-site scan above skips dynamic src (src={slide.src}), so images fed
// from data arrays (HERO_SLIDES, galleryImages) would ship blurry with no
// test failure. This checks every entry against the manifest's largest rung
// at its known rendered sizes.

/** Core largest-rung check for a known src + sizes pair (data-driven images). */
export function checkImageRung(src: string, sizes: string, where: string): string | null {
  const meta = IMAGE_MANIFEST[src];
  if (!meta) {
    return `${where}: ${src} is not in the image manifest, so SmartImg renders a plain un-optimized <img>.`;
  }
  const renderedCssPx = resolveSizes(sizes, DESKTOP_VIEWPORT_CSS_PX);
  const neededDevicePx = renderedCssPx * DESKTOP_DPR;
  const largestRung = Math.max(...meta.variants.map((v) => v.w));
  if (largestRung * BLUR_SHORTFALL >= neededDevicePx) return null;
  if (KNOWN_SMALL_ORIGINALS.has(src) && largestRung >= meta.width) return null;
  return (
    `${where}: ${src} renders at sizes="${sizes}" (~${Math.round(renderedCssPx)}px CSS at a ` +
    `${DESKTOP_VIEWPORT_CSS_PX}px viewport, ~${Math.round(neededDevicePx)} device px at ` +
    `${DESKTOP_DPR}x DPR) but its largest manifest rung is only ${largestRung}w, so it ` +
    `renders soft/blurry on large screens. Fix: regenerate a larger rung via ` +
    `scripts/optimize-images.mjs (source a bigger original in images-src/ if the current ` +
    `one is only ${meta.width}px wide), or replace the photo.`
  );
}

/** The sizes attribute a component actually passes at a dynamic-src SmartImg
 *  call site, so the data-driven checks below can never drift from the code. */
function sizesAtDynamicCallSite(fileRelToSrc: string, srcExpr: string): string {
  const source = readFileSync(join(SRC_ROOT, fileRelToSrc), 'utf8');
  const sites = findSmartImgCallSites(source, fileRelToSrc).filter((s) =>
    new RegExp(`\\bsrc\\s*=\\s*\\{\\s*${srcExpr.replace(/[.[\]()]/g, '\\$&')}`).test(s.attrs),
  );
  expect(sites, `expected exactly one <SmartImg src={${srcExpr}}> in ${fileRelToSrc}`).toHaveLength(1);
  const sizes = getStringAttr(sites[0].attrs, 'sizes');
  expect(sizes, `<SmartImg src={${srcExpr}}> in ${fileRelToSrc} must have a literal sizes`).toBeTruthy();
  return sizes!;
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

  it('flags a full-width desktop render backed only by a 1200w rung', () => {
    // image-012 has a 1200px original / 1200w largest rung and is NOT on the
    // small-originals allowlist, so a 100vw claim (2880 device px) must flag.
    const [site] = findSmartImgCallSites(
      `<SmartImg src="/images/image-012-012417-6415-hgfghu.jpg" alt="x" sizes="100vw" className="w-full" />`,
      'synthetic.tsx',
    );
    const violation = checkLargestRung(site);
    expect(violation).toMatch(/largest rung for this image is only 1200w/);
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
    const fake = "/images/image-012-012417-6415-hgfghu.jpg"; // 1200px original, 1200w rung
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

describe('data-driven hero and gallery images ship sharp largest rungs', () => {
  const heroSizes = sizesAtDynamicCallSite('components/HeroSlider.tsx', 'slide.src');
  const gridSizes = sizesAtDynamicCallSite('pages/PhotoGallery.tsx', 'image.src');
  const lightboxSizes = sizesAtDynamicCallSite(
    'pages/PhotoGallery.tsx',
    'lightboxImages[selectedImage].src',
  );

  it('every HERO_SLIDES entry covers the hero render sharply', () => {
    const violations = HERO_SLIDES.map((s) =>
      checkImageRung(s.src, heroSizes, 'HERO_SLIDES (Home hero)'),
    ).filter((v): v is string => v !== null);
    expect(violations, `\n${violations.join('\n\n')}\n`).toEqual([]);
  });

  it('every blog article photo covers the article column sharply', () => {
    const blogSizes = sizesAtDynamicCallSite('pages/BlogArticle.tsx', 'image.src');
    const violations = ALL_BLOG_ARTICLES.flatMap((a) => a.images ?? [])
      .map((img) => checkImageRung(img.src, blogSizes, 'blog article photos'))
      .filter((v): v is string => v !== null);
    expect(violations, `\n${violations.join('\n\n')}\n`).toEqual([]);
  });

  it('every galleryImages entry covers both the grid and the lightbox sharply', () => {
    const violations = galleryImages
      .flatMap((img) => [
        checkImageRung(img.src, gridSizes, 'galleryImages (gallery grid)'),
        checkImageRung(img.src, lightboxSizes, 'galleryImages (lightbox)'),
      ])
      .filter((v): v is string => v !== null);
    expect(violations, `\n${violations.join('\n\n')}\n`).toEqual([]);
  });

  it('the hero and lightbox render full-width (guard checks the real worst case)', () => {
    // If these renders ever stop being 100vw, the check silently weakens —
    // this assertion forces a conscious review of the data-driven guard.
    expect(resolveSizes(heroSizes, DESKTOP_VIEWPORT_CSS_PX)).toBe(DESKTOP_VIEWPORT_CSS_PX);
    expect(resolveSizes(lightboxSizes, DESKTOP_VIEWPORT_CSS_PX)).toBe(DESKTOP_VIEWPORT_CSS_PX);
  });

  it('self-test: a synthetic undersized entry is flagged', () => {
    // image-012 has a 1200w largest rung — far short of the ~2880 device px a
    // 100vw hero needs — so a hypothetical HERO_SLIDES entry must flag.
    const violation = checkImageRung(
      '/images/image-012-012417-6415-hgfghu.jpg',
      heroSizes,
      'synthetic HERO_SLIDES entry',
    );
    expect(violation).toMatch(/largest manifest rung is only 1200w/);
    expect(violation).toMatch(/synthetic HERO_SLIDES entry/);
  });

  it('self-test: an entry missing from the manifest is flagged', () => {
    expect(checkImageRung('/images/not-in-manifest.jpg', heroSizes, 'synthetic')).toMatch(
      /not in the image manifest/,
    );
  });

  it('self-test: a well-rung entry passes', () => {
    expect(
      checkImageRung('/images/image-002-gettyimages-1286580777-nvdupq.jpg', heroSizes, 'synthetic'),
    ).toBeNull();
  });
});

// --- PageHero images: literal image="..." props across pages feed a dynamic
// <SmartImg src={image}> inside PageHero, so the static call-site scan never
// sees them. Enumerate every <PageHero image="..."> and validate each photo
// against the sizes PageHero actually passes.

interface PageHeroUsage {
  file: string;
  line: number;
  image: string;
}

export function findPageHeroUsages(): PageHeroUsage[] {
  const usages: PageHeroUsage[] = [];
  for (const full of walkTsxFiles(SRC_ROOT)) {
    const source = readFileSync(full, 'utf8');
    const file = relative(SRC_ROOT, full);
    const re = /<PageHero\b([\s\S]*?)\/?>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(source)) !== null) {
      const line = source.slice(0, m.index).split('\n').length;
      const image = getStringAttr(m[1], 'image');
      expect(
        image,
        `${file}:${line} <PageHero> must pass a literal image="..." so the ` +
          `data-driven largest-rung guard can check it`,
      ).toBeTruthy();
      usages.push({ file, line, image: image! });
    }
  }
  return usages;
}

describe('data-driven PageHero images ship sharp largest rungs', () => {
  const pageHeroSizes = sizesAtDynamicCallSite('components/PageHero.tsx', 'image');
  const usages = findPageHeroUsages();

  it('finds PageHero usages to check (scan is not silently broken)', () => {
    expect(usages.length).toBeGreaterThanOrEqual(10);
  });

  it('PageHero renders full-width (guard checks the real worst case)', () => {
    expect(resolveSizes(pageHeroSizes, DESKTOP_VIEWPORT_CSS_PX)).toBe(DESKTOP_VIEWPORT_CSS_PX);
  });

  it('every PageHero image covers the full-width hero render sharply', () => {
    const violations = usages
      .map((u) => checkImageRung(u.image, pageHeroSizes, `${u.file}:${u.line} <PageHero>`))
      .filter((v): v is string => v !== null);
    expect(violations, `\n${violations.join('\n\n')}\n`).toEqual([]);
  });
});

// --- EmbedFacade posters: local click-to-load posters (Matterport tours and
// the Vimeo video) render through a dynamic <SmartImg src={poster}> inside
// EmbedFacade, so the static scan never sees them. Validate every committed
// poster against the sizes EmbedFacade actually passes.

describe('data-driven EmbedFacade posters ship sharp largest rungs', () => {
  const facadeSizes = sizesAtDynamicCallSite('components/EmbedFacade.tsx', 'poster');
  const posters = [
    ...matterportTours.map((t) => ({ src: t.poster, where: `matterportTours "${t.name}"` })),
    { src: lifeAtExhibitVideo.poster, where: 'lifeAtExhibitVideo' },
  ];

  it('every facade poster covers the embed-width render sharply', () => {
    const violations = posters
      .map((p) => checkImageRung(p.src, facadeSizes, `${p.where} EmbedFacade poster`))
      .filter((v): v is string => v !== null);
    expect(violations, `\n${violations.join('\n\n')}\n`).toEqual([]);
  });
});

// --- Completeness: no dynamic-src SmartImg call site may exist outside the
// data-driven checks above. A new src={expr} call site fed by an unchecked
// array would re-open the exact gap that let the hero slides ship blurry, so
// it must fail here until a data-driven check is added for it.

/** Extract the src={...} expression text from a call site, or null for a
 *  literal src="...". */
export function dynamicSrcExpr(attrs: string): string | null {
  if (getStringAttr(attrs, 'src') !== undefined) return null;
  const m = attrs.match(/\bsrc\s*=\s*\{([\s\S]*?)\}/);
  return m ? m[1].trim() : null;
}

describe('every dynamic-src SmartImg call site is covered by a data-driven check', () => {
  // Each entry here MUST correspond to a data-driven describe block above that
  // validates the actual array/prop feeding the call site. Adding an entry
  // without adding the matching check defeats the guard — don't.
  const COVERED_DYNAMIC_CALL_SITES = new Set([
    'components/EmbedFacade.tsx :: poster', // EmbedFacade posters check
    'components/HeroSlider.tsx :: slide.src', // HERO_SLIDES check
    'components/PageHero.tsx :: image', // PageHero usages check
    'pages/BlogArticle.tsx :: image.src', // blog article photos check
    'pages/PhotoGallery.tsx :: image.src', // galleryImages grid check
    'pages/PhotoGallery.tsx :: lightboxImages[selectedImage].src', // lightbox check
  ]);

  it('no dynamic-src call site exists without a data-driven largest-rung check', () => {
    const dynamicSites = walkTsxFiles(SRC_ROOT)
      .flatMap((f) => findSmartImgCallSites(readFileSync(f, 'utf8'), relative(SRC_ROOT, f)))
      .map((s) => ({ ...s, expr: dynamicSrcExpr(s.attrs) }))
      .filter((s): s is CallSite & { expr: string } => s.expr !== null);

    // The known call sites must all still exist (a rename/removal must force a
    // conscious update of the covered list and its data-driven check).
    const found = new Set(dynamicSites.map((s) => `${s.file} :: ${s.expr}`));
    expect([...found].sort()).toEqual([...COVERED_DYNAMIC_CALL_SITES].sort());

    const uncovered = dynamicSites.filter(
      (s) => !COVERED_DYNAMIC_CALL_SITES.has(`${s.file} :: ${s.expr}`),
    );
    expect(
      uncovered.map((s) => `${s.file}:${s.line} <SmartImg src={${s.expr}}>`),
      `\nThese dynamic-src SmartImg call sites have no data-driven largest-rung ` +
        `check, so the arrays feeding them can ship blurry photos with no test ` +
        `failure. Add a check in this file (see the HERO_SLIDES / PageHero / ` +
        `galleryImages blocks) and register the call site in ` +
        `COVERED_DYNAMIC_CALL_SITES.\n`,
    ).toEqual([]);
  });

  it('self-test: the expression extractor sees dynamic src and skips literals', () => {
    const [dyn] = findSmartImgCallSites(
      `<SmartImg src={items[i].photo} alt="x" sizes="100vw" />`,
      'synthetic.tsx',
    );
    expect(dynamicSrcExpr(dyn.attrs)).toBe('items[i].photo');
    const [lit] = findSmartImgCallSites(
      `<SmartImg src="/images/x.jpg" alt="x" sizes="100vw" />`,
      'synthetic.tsx',
    );
    expect(dynamicSrcExpr(lit.attrs)).toBeNull();
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
