// Copy-quality guard: renter-facing prose must never ship the
// missing-space-after-period defect ("steps away.Start your day").
//
// Scans:
//   1. Knowledge Center article strings (KNOWLEDGE_ARTICLES, walked deeply).
//   2. Page SEO copy (PAGE_SEO titles/descriptions/FAQ answers).
//   3. Raw source of renter-facing pages (src/pages/*.tsx, excluding tests) —
//      JSX prose lives inline there.
//
// The pattern is a lowercase letter, a period, then an uppercase letter with
// no space ("away.Start"). Legit tokens (URLs, domains, file names,
// identifiers) rarely match because domains/extensions are lowercase; any
// that do belong in the allowlist below.
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { KNOWLEDGE_ARTICLES } from './knowledgeArticles';
import { PAGE_SEO } from './seo';

const MISSING_SPACE = /[a-z]\.[A-Z][a-z]/g;

// Exact substrings that legitimately match the pattern (none today; add
// sparingly — e.g. product names or domains with capitalized path segments).
const ALLOWLIST: string[] = [];

function violations(text: string): string[] {
  const hits: string[] = [];
  for (const match of text.matchAll(MISSING_SPACE)) {
    const context = text.slice(Math.max(0, match.index - 30), match.index + 30);
    if (ALLOWLIST.some((ok) => context.includes(ok))) continue;
    hits.push(context.replace(/\s+/g, ' '));
  }
  return hits;
}

/** Recursively collect every string value in a data structure. */
function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => collectStrings(v, out));
  else if (value && typeof value === 'object') {
    Object.values(value).forEach((v) => collectStrings(v, out));
  }
  return out;
}

describe('renter-facing copy quality: no missing space after a period', () => {
  it('Knowledge Center article copy is clean', () => {
    const bad = collectStrings(KNOWLEDGE_ARTICLES).flatMap(violations);
    expect(bad, `missing space after period near: ${bad.join(' | ')}`).toEqual([]);
  });

  it('page SEO copy (titles, descriptions, FAQ answers) is clean', () => {
    const bad = collectStrings(PAGE_SEO).flatMap(violations);
    expect(bad, `missing space after period near: ${bad.join(' | ')}`).toEqual([]);
  });

  it('page source prose (src/pages) is clean', () => {
    const pagesDir = join(__dirname, '..', 'pages');
    const files = readdirSync(pagesDir).filter(
      (f) => f.endsWith('.tsx') && !f.includes('.test.'),
    );
    const bad: string[] = [];
    for (const file of files) {
      const source = readFileSync(join(pagesDir, file), 'utf8');
      for (const hit of violations(source)) bad.push(`${file}: ${hit}`);
    }
    expect(bad, `missing space after period near: ${bad.join(' | ')}`).toEqual([]);
  });
});
