import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import {
  KNOWLEDGE_ARTICLES,
  KNOWLEDGE_CATEGORIES,
  knowledgeArticle,
  knowledgeDescription,
  knowledgeJsonLd,
  wordCount,
} from './knowledge';
import { PAGE_SEO } from './seo';
// @ts-expect-error — plain-Node script module without type declarations
import { loadKnowledgeArticles } from '../../scripts/lib/knowledge-slugs.mjs';

const SITE_ROUTES = new Set(Object.keys(PAGE_SEO));

describe('knowledge center content rules', () => {
  it('ships at least 50 articles (task target 50–100)', () => {
    expect(KNOWLEDGE_ARTICLES.length).toBeGreaterThanOrEqual(50);
    expect(KNOWLEDGE_ARTICLES.length).toBeLessThanOrEqual(100);
  });

  it('every answer is under 100 words and non-trivial', () => {
    for (const a of KNOWLEDGE_ARTICLES) {
      const words = wordCount(a.answer);
      expect(words, `${a.slug} answer is ${words} words`).toBeLessThan(100);
      expect(words, `${a.slug} answer too short`).toBeGreaterThanOrEqual(15);
    }
  });

  it('slugs are unique and URL-safe', () => {
    const slugs = KNOWLEDGE_ARTICLES.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('every category is populated and every article uses a known category', () => {
    const used = new Set(KNOWLEDGE_ARTICLES.map((a) => a.category));
    for (const c of KNOWLEDGE_CATEGORIES) expect(used, `empty category ${c}`).toContain(c);
    for (const a of KNOWLEDGE_ARTICLES) expect(KNOWLEDGE_CATEGORIES).toContain(a.category);
  });

  it('related slugs resolve and never self-reference', () => {
    for (const a of KNOWLEDGE_ARTICLES) {
      expect(a.related.length, `${a.slug} needs related questions`).toBeGreaterThanOrEqual(2);
      for (const r of a.related) {
        expect(knowledgeArticle(r), `${a.slug} -> unknown related slug ${r}`).toBeDefined();
        expect(r).not.toBe(a.slug);
      }
    }
  });

  it('site links point at real routes', () => {
    for (const a of KNOWLEDGE_ARTICLES) {
      expect(a.links.length, `${a.slug} needs site links`).toBeGreaterThanOrEqual(2);
      for (const l of a.links) {
        // Deep links may carry a query string (e.g. /available-units?ada=1);
        // the path portion must still be a real route.
        const path = l.href.split('?')[0];
        expect(SITE_ROUTES.has(path), `${a.slug} -> unknown route ${l.href}`).toBe(true);
      }
    }
  });

  it('external links are valid https URLs with non-empty labels', () => {
    for (const a of KNOWLEDGE_ARTICLES) {
      for (const l of a.externalLinks ?? []) {
        expect(l.label.trim().length, `${a.slug} external link needs a label`).toBeGreaterThan(0);
        expect(l.href.startsWith('https://'), `${a.slug} -> non-https external link ${l.href}`).toBe(
          true,
        );
        const parsed = (() => {
          try {
            return new URL(l.href);
          } catch {
            return undefined;
          }
        })();
        expect(parsed, `${a.slug} -> unparseable external link ${l.href}`).toBeDefined();
        expect(parsed?.hostname.includes('.'), `${a.slug} -> suspicious host in ${l.href}`).toBe(
          true,
        );
      }
    }
  });

  it('descriptions fit meta-description length', () => {
    for (const a of KNOWLEDGE_ARTICLES) {
      expect(knowledgeDescription(a).length, a.slug).toBeLessThanOrEqual(160);
    }
  });

  it('JSON-LD carries FAQPage + 3-level breadcrumb per article', () => {
    for (const a of KNOWLEDGE_ARTICLES) {
      const graph = knowledgeJsonLd(a)['@graph'] as Array<Record<string, any>>;
      const faq = graph.find((n) => n['@type'] === 'FAQPage');
      expect(faq?.mainEntity?.[0]?.name).toBe(a.question);
      expect(faq?.mainEntity?.[0]?.acceptedAnswer?.text).toBe(a.answer);
      const crumbs = graph.find((n) => n['@type'] === 'BreadcrumbList');
      expect(crumbs?.itemListElement).toHaveLength(3);
    }
  });

  it('no marketing filler phrases in knowledge copy', () => {
    const banned = [/resort-style/i, /luxury living/i, /world-class/i, /!\s/];
    for (const a of KNOWLEDGE_ARTICLES) {
      const text = [a.answer, ...a.sections.flatMap((s) => s.paragraphs)].join(' ');
      for (const b of banned) {
        expect(b.test(text), `${a.slug} contains banned phrase ${b}`).toBe(false);
      }
    }
  });

  it('script slug parser matches the TS article list exactly, in order', async () => {
    const parsed: Array<{ slug: string; question: string }> = await loadKnowledgeArticles();
    expect(parsed.map((a) => a.slug)).toEqual(KNOWLEDGE_ARTICLES.map((a) => a.slug));
    expect(parsed.map((a) => a.question)).toEqual(KNOWLEDGE_ARTICLES.map((a) => a.question));
  });

  it('every KnowledgeLinks slug used in page components resolves', () => {
    const pagesDir = path.resolve(__dirname, '../pages');
    for (const file of readdirSync(pagesDir)) {
      if (!file.endsWith('.tsx')) continue;
      const src = readFileSync(path.join(pagesDir, file), 'utf8');
      const m = src.match(/<KnowledgeLinks[\s\S]*?slugs=\{\[([\s\S]*?)\]\}/g) ?? [];
      for (const block of m) {
        for (const [, slug] of block.matchAll(/'([a-z0-9-]+)'/g)) {
          expect(knowledgeArticle(slug), `${file} links unknown slug ${slug}`).toBeDefined();
        }
      }
    }
  });
});
