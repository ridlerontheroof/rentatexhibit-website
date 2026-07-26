import { createHash } from 'node:crypto';
import { existsSync, promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

// Task: sitemap <lastmod> must reflect when each page's CONTENT changed, not
// when the site was last built. The prerenderer derives each date from a
// committed content-hash → date map (src/data/sitemapLastmod.json): a page's
// entry only moves to a new date when its content hash changes.
//
// The hash is sha256 over the page's markdown twin (dist/public/<path>.md) —
// build-stamp free, so a rebuild without content changes reproduces the same
// hash. This suite proves that invariant against the current dist:
//   - every sitemap URL's lastmod equals its map entry;
//   - every map hash equals a fresh hash of the committed dist's twin, so a
//     rebuild of this exact content CANNOT move any lastmod;
//   - map keys and sitemap URLs cover each other exactly (no stale entries).

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const publicDir = path.join(root, 'dist', 'public');

const mdPathFor = (routePath: string) =>
  routePath === '/'
    ? path.join(publicDir, 'index.md')
    : path.join(publicDir, `${routePath.replace(/^\//, '')}.md`);

let sitemapEntries: Array<{ path: string; lastmod: string }> = [];
let lastmodMap: Record<string, { hash: string; lastmod: string }> = {};

// Skip (not fail) without a COMPLETE build: precompress writes index.html.br
// LAST in the build chain, so its presence marks a settled dist/public.
const hasCompleteBuild = existsSync(path.join(publicDir, 'index.html.br'));

beforeAll(async () => {
  if (!hasCompleteBuild) return;
  const xml = await fs.readFile(path.join(publicDir, 'sitemap.xml'), 'utf8');
  sitemapEntries = [...xml.matchAll(/<loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod>/g)].map(
    (m) => ({
      path: new URL(m[1]).pathname.replace(/\/$/, '') || '/',
      lastmod: m[2],
    }),
  );
  lastmodMap = JSON.parse(
    await fs.readFile(path.join(root, 'src', 'data', 'sitemapLastmod.json'), 'utf8'),
  );
});

describe.skipIf(!hasCompleteBuild)('sitemap lastmod (content-derived, dist/public)', () => {
  it('the sitemap has URLs and every one carries a well-formed lastmod', () => {
    expect(sitemapEntries.length).toBeGreaterThan(20);
    for (const e of sitemapEntries) {
      expect(e.lastmod, `${e.path}: lastmod "${e.lastmod}"`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('map keys and sitemap URLs match exactly (no stale or missing entries)', () => {
    const sitemapPaths = sitemapEntries.map((e) => e.path).sort();
    const mapPaths = Object.keys(lastmodMap).sort();
    expect(sitemapPaths).toEqual(mapPaths);
  });

  it('every sitemap lastmod equals its committed map entry', () => {
    const wrong = sitemapEntries
      .filter((e) => lastmodMap[e.path]?.lastmod !== e.lastmod)
      .map((e) => `${e.path}: sitemap ${e.lastmod} vs map ${lastmodMap[e.path]?.lastmod}`);
    expect(wrong, wrong.join('\n')).toEqual([]);
  });

  it('rebuilding without content changes cannot move any lastmod (map hash === twin hash)', async () => {
    // The prerenderer keeps a page's prior date exactly when the fresh twin
    // hash equals the committed one. If every committed hash matches a fresh
    // hash of the committed dist's twin, a rebuild of this content keeps
    // every date. A mismatch means either a stale dist (rebuild) or a
    // non-deterministic twin (a real bug — e.g. a build timestamp leaked
    // into page content).
    const wrong: string[] = [];
    for (const [p, entry] of Object.entries(lastmodMap)) {
      const md = await fs.readFile(mdPathFor(p), 'utf8');
      const fresh = createHash('sha256').update(md).digest('hex');
      if (fresh !== entry.hash) wrong.push(`${p}: map hash != hash of dist twin`);
    }
    expect(
      wrong,
      `stale dist or non-deterministic page content — run \`pnpm run build\`:\n${wrong.join('\n')}`,
    ).toEqual([]);
  });
});
