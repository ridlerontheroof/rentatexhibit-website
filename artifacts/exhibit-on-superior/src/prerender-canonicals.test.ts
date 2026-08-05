import { promises as fs, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
// @ts-expect-error -- plain .mjs helper shared with scripts/prerender.mjs
import { computeSeoSourceHash, SEO_SOURCE_HASH_FILE } from '../scripts/seo-source-hash.mjs';

// Task: make sure a template regression can never reintroduce a shared
// canonical. Bing Webmaster Tools once flagged "large number of pages
// pointing to the same canonical URL (http://rentatexhibit.com/)" — a relic
// of the pre-prerender SPA era, when every deep route served the homepage
// head (and with it the homepage canonical). That defect class is exactly
// one template bug away from returning, so this guard walks EVERY
// prerendered page in dist/public and fails the suite unless:
//
//   - every page ships exactly one <link rel="canonical">;
//   - every INDEXABLE page's canonical is self-referencing (equals its own
//     https://www URL, no trailing slash);
//   - no two indexable pages share a canonical;
//   - noindex pages (legacy-redirect stubs, 404, rented units) may point
//     their canonical at another page — that's the redirect-stub design —
//     but the target must be the site origin or an indexable page's own
//     canonical, never a dangling or off-site URL.

// Kept in sync with entry-server's SITE_URL by the self-referencing check
// itself: if the prerenderer ever emitted a different origin, every page
// would fail the "canonical matches its own URL" assertion below.
const SITE_URL = 'https://www.rentatexhibit.com';

const here = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(here, '..', 'dist', 'public');

interface PageCanonical {
  /** Path of the page relative to dist/public, e.g. "amenities/index.html". */
  page: string;
  /** The page's own canonical URL: SITE_URL + route path, no trailing slash. */
  expectedUrl: string;
  /** All <link rel="canonical"> hrefs found in the head. */
  canonicals: string[];
  indexable: boolean;
}

async function collectIndexHtml(dir: string): Promise<string[]> {
  const out: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await collectIndexHtml(full)));
    else if (entry.isFile() && entry.name === 'index.html') out.push(full);
  }
  return out;
}

/** SITE_URL + route path for a dist-relative index.html location. */
function expectedUrlFor(relPage: string): string {
  const dir = path.dirname(relPage);
  return dir === '.' ? `${SITE_URL}/` : `${SITE_URL}/${dir.split(path.sep).join('/')}`;
}

function canonicalHrefs(head: string): string[] {
  // Both attribute orders, same as the prerenderer's other head guards.
  return [
    ...head.matchAll(
      /<link\s+(?:rel="canonical"\s+href="([^"]*)"|href="([^"]*)"\s+rel="canonical")/gi,
    ),
  ].map((m) => m[1] ?? m[2] ?? '');
}

function robotsContent(head: string): string {
  const m = head.match(
    /<meta\s+(?:name="robots"\s+content="([^"]*)"|content="([^"]*)"\s+name="robots")/i,
  );
  return (m?.[1] ?? m?.[2] ?? '').toLowerCase();
}

let pages: PageCanonical[] = [];

// Skip (not fail) without a COMPLETE build: precompress writes index.html.br
// LAST in the build chain, so its presence marks a settled dist/public.
// Validation runs this suite concurrently with the prepublish rebuild, which
// wipes dist mid-flight — grading a half-built dist gives spurious failures.
const hasCompleteBuild = existsSync(path.join(publicDir, 'index.html.br'));

beforeAll(async () => {
  if (!hasCompleteBuild) return;
  const files = await collectIndexHtml(publicDir);
  pages = await Promise.all(
    files.map(async (file) => {
      const html = await fs.readFile(file, 'utf8');
      const headEnd = html.indexOf('</head>');
      const head = headEnd === -1 ? html : html.slice(0, headEnd);
      const relPage = path.relative(publicDir, file);
      return {
        page: relPage,
        expectedUrl: expectedUrlFor(relPage),
        canonicals: canonicalHrefs(head),
        indexable: !robotsContent(head).includes('noindex'),
      };
    }),
  );
});

describe.skipIf(!hasCompleteBuild)('prerendered canonicals (dist/public)', () => {
  it('the prerendered output exists and covers the whole site', () => {
    // If this collapses, the walks below would silently pass on nothing.
    expect(pages.length).toBeGreaterThan(20);
    expect(pages.some((p) => p.page === 'index.html')).toBe(true);
    expect(pages.some((p) => p.page.startsWith('available-units/'))).toBe(true);
    expect(pages.some((p) => p.page.startsWith('knowledge/'))).toBe(true);
  });

  it('the prerendered output was built from the current SEO sources', async (ctx) => {
    // A stale dist would grade canonicals an older model produced. The
    // prerenderer stamps a hash of the head-affecting sources; refuse to
    // grade a dist built from others. A MISSING stamp always means a rebuild
    // is in flight (every current build path writes it) — skip, don't fail.
    const artifactRoot = path.resolve(here, '..');
    let raw: string;
    try {
      raw = await fs.readFile(path.join(artifactRoot, 'dist', SEO_SOURCE_HASH_FILE), 'utf8');
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        ctx.skip();
        return;
      }
      throw err;
    }
    expect(
      raw.trim(),
      'dist/public is stale relative to the SEO sources — run `pnpm run build` and re-run this suite',
    ).toBe(await computeSeoSourceHash(artifactRoot));
  });

  it('every indexable page ships exactly one canonical link', () => {
    // Noindex pages may omit the canonical entirely (404 stubs do) but must
    // never ship more than one.
    const bad = pages
      .filter((p) => (p.indexable ? p.canonicals.length !== 1 : p.canonicals.length > 1))
      .map((p) => `${p.page}: ${p.canonicals.length} canonical links`);
    expect(bad, `pages with a wrong canonical count:\n${bad.join('\n')}`).toEqual([]);
  });

  it("every indexable page's canonical is self-referencing", () => {
    const bad = pages
      .filter((p) => p.indexable && p.canonicals[0] !== p.expectedUrl)
      .map((p) => `${p.page}: canonical "${p.canonicals[0]}" ≠ own URL "${p.expectedUrl}"`);
    expect(
      bad,
      `indexable pages whose canonical is not their own URL (the exact defect Bing flagged):\n${bad.join('\n')}`,
    ).toEqual([]);
  });

  it('no two indexable pages share a canonical', () => {
    const byCanonical = new Map<string, string[]>();
    for (const p of pages) {
      if (!p.indexable || !p.canonicals[0]) continue;
      byCanonical.set(p.canonicals[0], [...(byCanonical.get(p.canonicals[0]) ?? []), p.page]);
    }
    const duplicated = [...byCanonical.entries()]
      .filter(([, pgs]) => pgs.length > 1)
      .map(([url, pgs]) => `${pgs.join(', ')} → ${url}`);
    expect(duplicated, `indexable pages sharing a canonical:\n${duplicated.join('\n')}`).toEqual(
      [],
    );
  });

  it("noindex pages' canonicals are self-referencing or point at real indexable pages", () => {
    // Legacy-redirect stubs and rented-unit pages deliberately point their
    // canonical at their target — but that target must exist on this site.
    // Noindex utility pages (e.g. form endpoints) keep a self-referencing
    // canonical, which is also fine. Anything else is dangling.
    const indexableCanonicals = new Set(pages.filter((p) => p.indexable).map((p) => p.expectedUrl));
    const bad = pages
      .filter(
        (p) =>
          !p.indexable &&
          p.canonicals[0] !== undefined &&
          p.canonicals[0] !== p.expectedUrl &&
          !indexableCanonicals.has(p.canonicals[0]),
      )
      .map((p) => `${p.page}: canonical "${p.canonicals[0]}" is not an indexable page's URL`);
    expect(bad, `noindex pages with dangling canonicals:\n${bad.join('\n')}`).toEqual([]);
  });
});
