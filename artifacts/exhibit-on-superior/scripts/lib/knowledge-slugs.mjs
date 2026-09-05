// Shared parser for Knowledge Center article slugs/questions.
//
// scripts run plain Node (no TS loader), so we parse the pure-data
// src/data/knowledgeArticles.ts with a regex. Every article literal starts
// with `slug:` immediately followed by `question:` (enforced authoring
// format). To catch a partial parse if that format ever drifts, the parsed
// count is validated against an exact count of article object literals
// (occurrences of a `slug:` property in the file) — not a loose minimum.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ARTICLES_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'src',
  'data',
  'knowledgeArticles.ts',
);

/**
 * Parse all knowledge articles ({ slug, question }) from knowledgeArticles.ts.
 * Throws if the number of parsed articles does not exactly match the number
 * of article object literals in the data file.
 */
export async function loadKnowledgeArticles() {
  const raw = await readFile(ARTICLES_PATH, 'utf8');
  // Strip /* ... */ block comments first: unpublished articles may be parked
  // in block comments and must not be parsed as published articles.
  const src = raw.replace(/\/\*[\s\S]*?\*\//g, '');

  const articles = [];
  const re = /slug:\s*'([^']+)',\s*\n\s*question:\s*'((?:[^'\\]|\\.)*)',/g;
  for (let m; (m = re.exec(src)); ) {
    articles.push({ slug: m[1], question: m[2].replace(/\\'/g, "'") });
  }

  // Exact expected count: every article object literal has exactly one
  // `slug:` property (KnowledgeArticle has no nested `slug` fields), so
  // counting `slug:` occurrences counts article literals.
  const expected = (src.match(/(^|\n)\s*slug:\s*/g) || []).length;

  if (articles.length !== expected) {
    throw new Error(
      `Parsed ${articles.length} knowledge articles but knowledgeArticles.ts contains ${expected} article object literals — the slug/question parser in scripts/lib/knowledge-slugs.mjs is out of sync with the data file's authoring format.`,
    );
  }
  if (expected === 0) {
    throw new Error('No article object literals found in knowledgeArticles.ts — wrong file or format changed.');
  }
  return articles;
}

/** Parse just the article slugs, with the same exact-count validation. */
export async function loadKnowledgeSlugs() {
  return (await loadKnowledgeArticles()).map((a) => a.slug);
}
