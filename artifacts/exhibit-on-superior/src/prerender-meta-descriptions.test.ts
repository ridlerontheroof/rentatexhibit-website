import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
// @ts-expect-error -- plain .mjs helper shared with scripts/prerender.mjs
import { computeSeoSourceHash, SEO_SOURCE_HASH_FILE } from '../scripts/seo-source-hash.mjs';

// Task: keep every page's search snippet from getting cut off mid-sentence.
//
// An audit found meta descriptions over 160 characters (unit pages, the
// /knowledge hub) that Google truncated mid-sentence; they were fixed by hand.
// This guard walks EVERY prerendered page in dist/public and fails the suite
// if a future page or data change reintroduces an over-long, empty, or
// duplicated description — regardless of which data module produced it.
//
// Contract per prerendered index.html:
//   - indexable pages (no `noindex` robots meta) must carry a non-empty
//     <meta name="description"> of at most 160 characters, unique across all
//     indexable pages;
//   - noindex pages may omit the description, but if they ship one it must
//     still fit in 160 characters (they can become indexable later).

const MAX_DESCRIPTION_LENGTH = 160;

const here = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(here, '..', 'dist', 'public');

interface PageHead {
  /** Path of the page relative to dist/public, e.g. "knowledge/index.html". */
  page: string;
  /** Decoded description content, or null when the meta tag is absent. */
  description: string | null;
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

/** Minimal decode for the entities the prerenderer escapes into attributes. */
function decodeEntities(value: string): string {
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&#x27;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&');
}

function metaContent(head: string, name: string): string | null {
  // Attribute order is stable in the prerendered output (name before
  // content), but accept either order to survive renderer changes.
  const re = new RegExp(
    `<meta\\s+(?:name="${name}"\\s+content="([^"]*)"|content="([^"]*)"\\s+name="${name}")`,
    'i',
  );
  const m = head.match(re);
  if (!m) return null;
  return decodeEntities(m[1] ?? m[2] ?? '');
}

let pages: PageHead[] = [];

beforeAll(async () => {
  const files = await collectIndexHtml(publicDir);
  pages = await Promise.all(
    files.map(async (file) => {
      const html = await fs.readFile(file, 'utf8');
      const headEnd = html.indexOf('</head>');
      const head = headEnd === -1 ? html : html.slice(0, headEnd);
      const robots = metaContent(head, 'robots');
      return {
        page: path.relative(publicDir, file),
        description: metaContent(head, 'description'),
        indexable: !(robots ?? '').toLowerCase().includes('noindex'),
      };
    }),
  );
});

describe('prerendered meta descriptions (dist/public)', () => {
  it('the prerendered output exists and covers the whole site', () => {
    // A handful of static pages plus per-unit and knowledge pages — if this
    // collapses, the walk below would silently pass on nothing.
    expect(pages.length).toBeGreaterThan(20);
    expect(pages.some((p) => p.page === 'index.html')).toBe(true);
    expect(pages.some((p) => p.page.startsWith('available-units/'))).toBe(true);
    expect(pages.some((p) => p.page.startsWith('knowledge/'))).toBe(true);
  });

  it('the prerendered output was built from the current SEO sources', async (ctx) => {
    // A stale dist grades head tags an older model produced (this once failed
    // the whole suite with ~260-char unit descriptions the current model no
    // longer emits). The prerenderer stamps a hash of the head-affecting
    // sources; refuse to grade a dist built from others.
    const artifactRoot = path.resolve(here, '..');
    let raw: string;
    try {
      raw = await fs.readFile(path.join(artifactRoot, 'dist', SEO_SOURCE_HASH_FILE), 'utf8');
    } catch (err) {
      // Completion validation runs this suite concurrently with the
      // prepublish rebuild, which wipes dist/ before rewriting it. If the
      // hash stamp is gone AND the build's last output (index.html.br, since
      // precompress runs LAST) is also missing, a rebuild is in flight —
      // skip rather than fail on a mid-rebuild snapshot. A missing stamp
      // next to a completed build is still a real failure.
      const buildComplete = await fs
        .access(path.join(publicDir, 'index.html.br'))
        .then(() => true)
        .catch(() => false);
      if ((err as NodeJS.ErrnoException).code === 'ENOENT' && !buildComplete) {
        ctx.skip();
        return;
      }
      throw err;
    }
    const stamped = raw.trim();
    const current = await computeSeoSourceHash(artifactRoot);
    expect(
      stamped,
      'dist/public is stale relative to the SEO sources — run `pnpm run build` and re-run this suite',
    ).toBe(current);
  });

  it('every indexable page has a non-empty meta description', () => {
    const missing = pages
      .filter((p) => p.indexable && !(p.description ?? '').trim())
      .map((p) => p.page);
    expect(missing, `indexable pages missing a description:\n${missing.join('\n')}`).toEqual([]);
  });

  it(`no page ships a description over ${MAX_DESCRIPTION_LENGTH} characters`, () => {
    const overlong = pages
      .filter((p) => (p.description ?? '').length > MAX_DESCRIPTION_LENGTH)
      .map((p) => `${p.page} (${(p.description as string).length} chars): ${p.description}`);
    expect(
      overlong,
      `descriptions Google would truncate mid-sentence:\n${overlong.join('\n')}`,
    ).toEqual([]);
  });

  it('no two indexable pages share the same description', () => {
    const byDescription = new Map<string, string[]>();
    for (const p of pages) {
      const d = (p.description ?? '').trim();
      if (!p.indexable || !d) continue;
      byDescription.set(d, [...(byDescription.get(d) ?? []), p.page]);
    }
    const duplicated = [...byDescription.entries()]
      .filter(([, pgs]) => pgs.length > 1)
      .map(([d, pgs]) => `${pgs.join(', ')} → "${d}"`);
    expect(duplicated, `duplicated descriptions:\n${duplicated.join('\n')}`).toEqual([]);
  });
});
