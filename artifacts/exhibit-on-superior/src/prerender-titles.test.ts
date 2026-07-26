import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
// @ts-expect-error -- plain .mjs helper shared with scripts/prerender.mjs
import { computeSeoSourceHash, SEO_SOURCE_HASH_FILE } from '../scripts/seo-source-hash.mjs';

// Task: keep every page's search-result title from getting truncated too.
//
// Companion to prerender-meta-descriptions.test.ts. Google cuts <title>
// text longer than ~60 characters mid-word (and often rewrites duplicated
// or double-branded titles wholesale). This guard walks EVERY prerendered
// page in dist/public and fails the suite if a future page or data change
// ships an over-long, empty, or duplicated title — regardless of which
// data module produced it.
//
// Contract per prerendered index.html:
//   - every page must ship a non-empty <title>;
//   - titles must fit in 65 characters (decoded), unless the page is
//     explicitly allowlisted below;
//   - indexable pages (no `noindex` robots meta) must not share a title.
//     Noindex pages (legacy-redirect shells, 404) may share the bare brand
//     title — they never appear in search results.

const MAX_TITLE_LENGTH = 65;

// Intentional exceptions: knowledge Q&A pages whose title IS the article's
// question (also its H1 — see knowledgeTitle() in src/data/knowledge.ts).
// These four questions can't be shortened without losing meaning; Google
// shows the leading part, which is the meaningful part. Anything new that
// runs long must either be reworded or consciously added here.
const OVERLONG_ALLOWLIST = new Set<string>([
  'knowledge/what-utility-fee-covers/index.html', // 73-char question names the exact fee
  'knowledge/utility-fee-by-floor-plan/index.html', // 83-char question names fee + scope
  'knowledge/whats-near-superior-and-wells/index.html', // intersection query + brand suffix
  'knowledge/resident-portal/index.html', // 73-char question covers rent + maintenance
]);

const here = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(here, '..', 'dist', 'public');

interface PageHead {
  /** Path of the page relative to dist/public, e.g. "knowledge/index.html". */
  page: string;
  /** Decoded <title> content, or null when the tag is absent. */
  title: string | null;
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

/** Minimal decode for the entities the prerenderer escapes into text. */
function decodeEntities(value: string): string {
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&#x27;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&');
}

function titleContent(head: string): string | null {
  const m = head.match(/<title>([^<]*)<\/title>/i);
  if (!m) return null;
  return decodeEntities(m[1]);
}

function metaContent(head: string, name: string): string | null {
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
        title: titleContent(head),
        indexable: !(robots ?? '').toLowerCase().includes('noindex'),
      };
    }),
  );
});

// Skip (not fail) without a COMPLETE build: precompress writes index.html.br
// LAST in the build chain, so its presence marks a settled dist/public.
// Validation runs this suite concurrently with the prepublish rebuild, which
// wipes dist mid-flight — grading a half-built dist gives spurious failures.
import { existsSync } from 'node:fs';
const hasCompleteBuild = existsSync(path.join(publicDir, 'index.html.br'));

describe.skipIf(!hasCompleteBuild)('prerendered page titles (dist/public)', () => {
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
    // the whole suite with long-dead titles). The prerenderer stamps a hash of
    // the head-affecting sources; refuse to grade a dist built from others.
    const artifactRoot = path.resolve(here, '..');
    let raw: string;
    try {
      raw = await fs.readFile(path.join(artifactRoot, 'dist', SEO_SOURCE_HASH_FILE), 'utf8');
    } catch (err) {
      // Completion validation runs this suite concurrently with the
      // prepublish rebuild, which rewrites dist/ in stages — there are
      // windows where the stamp is gone while a previous build's
      // index.html.br still exists (this exact window failed a validation
      // run). Every current build path writes the stamp, so a missing stamp
      // always means a rebuild is in flight: skip rather than fail on a
      // mid-rebuild snapshot. A *mismatched* stamp (stale complete dist) is
      // still graded below.
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
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

  it('every page has a non-empty <title>', () => {
    const missing = pages.filter((p) => !(p.title ?? '').trim()).map((p) => p.page);
    expect(missing, `pages missing a <title>:\n${missing.join('\n')}`).toEqual([]);
  });

  it(`no page ships a title over ${MAX_TITLE_LENGTH} characters (unless allowlisted)`, () => {
    const overlong = pages
      .filter((p) => (p.title ?? '').length > MAX_TITLE_LENGTH && !OVERLONG_ALLOWLIST.has(p.page))
      .map((p) => `${p.page} (${(p.title as string).length} chars): ${p.title}`);
    expect(
      overlong,
      `titles Google would truncate mid-word (reword, or allowlist with a reason):\n${overlong.join('\n')}`,
    ).toEqual([]);
  });

  it('allowlisted pages still exist (prune stale allowlist entries)', () => {
    const known = new Set(pages.map((p) => p.page));
    const stale = [...OVERLONG_ALLOWLIST].filter((p) => !known.has(p));
    expect(stale, `allowlist entries with no matching page:\n${stale.join('\n')}`).toEqual([]);
  });

  it('no two indexable pages share the same title', () => {
    const byTitle = new Map<string, string[]>();
    for (const p of pages) {
      const t = (p.title ?? '').trim();
      if (!p.indexable || !t) continue;
      byTitle.set(t, [...(byTitle.get(t) ?? []), p.page]);
    }
    const duplicated = [...byTitle.entries()]
      .filter(([, pgs]) => pgs.length > 1)
      .map(([t, pgs]) => `${pgs.join(', ')} → "${t}"`);
    expect(duplicated, `duplicated titles:\n${duplicated.join('\n')}`).toEqual([]);
  });
});
