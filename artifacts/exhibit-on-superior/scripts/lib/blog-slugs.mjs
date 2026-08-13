// Shared parser for blog article slugs (plain Node, no TS loader).
//
// Same approach as knowledge-slugs.mjs: parse the pure-data blogArticles.ts
// with a regex. Every article literal starts with `slug:` immediately followed
// by `title:` (enforced authoring format). Draft articles (draft: true) are
// excluded — only PUBLISHED slugs are returned, matching BLOG_ARTICLES, so the
// artifact.toml rewrite parity guard and any generation tooling agree on the
// published set. The parsed count is validated against the exact number of
// article object literals to catch a partial parse if the format drifts.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ARTICLES_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'src',
  'data',
  'blogArticles.ts',
);

/**
 * Parse all blog articles ({ slug, title, draft }) from blogArticles.ts.
 * Throws if the number of parsed articles does not exactly match the number
 * of article object literals in the data file.
 */
export async function loadBlogArticles() {
  const raw = await readFile(ARTICLES_PATH, 'utf8');
  // Strip /* ... */ block comments (parked/unpublished articles live there).
  const src = raw.replace(/\/\*[\s\S]*?\*\//g, '');

  const articles = [];
  // Match `slug: '...'` then `title: '...'`, then look ahead in the same
  // object literal for an optional `draft: true`.
  const re = /slug:\s*'([^']+)',\s*\n\s*title:\s*'((?:[^'\\]|\\.)*)',([\s\S]*?)(?=\n\s{2}\{|\n\];)/g;
  for (let m; (m = re.exec(src)); ) {
    const body = m[3] ?? '';
    articles.push({
      slug: m[1],
      title: m[2].replace(/\\'/g, "'"),
      draft: /\bdraft:\s*true\b/.test(body),
    });
  }

  const expected = (src.match(/(^|\n)\s*slug:\s*/g) || []).length;
  if (articles.length !== expected) {
    throw new Error(
      `Parsed ${articles.length} blog articles but blogArticles.ts contains ${expected} article object literals — the parser in scripts/lib/blog-slugs.mjs is out of sync with the data file's authoring format.`,
    );
  }
  if (expected === 0) {
    throw new Error('No article object literals found in blogArticles.ts — wrong file or format changed.');
  }
  return articles;
}

/** Published (non-draft) blog slugs — matches BLOG_ARTICLES. */
export async function loadPublishedBlogSlugs() {
  return (await loadBlogArticles()).filter((a) => !a.draft).map((a) => a.slug);
}
