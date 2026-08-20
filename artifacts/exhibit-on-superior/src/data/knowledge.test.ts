import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import {
  KNOWLEDGE_ARTICLES,
  KNOWLEDGE_CATEGORIES,
  KNOWLEDGE_REVIEW_MAX_AGE_DAYS,
  KNOWLEDGE_REVIEWED_DATE,
  knowledgeArticle,
  knowledgeDescription,
  knowledgeJsonLd,
  knowledgeOgImage,
  knowledgePath,
  knowledgeTitle,
  buildKnowledgeSeoModel,
  reviewAgeDays,
  staleKnowledgeReviewDates,
  wordCount,
} from './knowledge';
import { PAGE_SEO } from './seo';
import { linkifyText } from './blogLinkifier';
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

  it('every article carries at least 300 words of core content (thin-content floor)', () => {
    // The 2026-07-26 squirrelscan audit flagged ~70 /knowledge pages under
    // 300 words as thin content. Core content = question + answer + section
    // headings/paragraphs (the page adds byline/related/links on top), so a
    // 300-word core keeps the rendered page comfortably above the floor.
    for (const a of KNOWLEDGE_ARTICLES) {
      let words = wordCount(a.question) + wordCount(a.answer);
      for (const s of a.sections) {
        if (s.heading) words += wordCount(s.heading);
        for (const p of s.paragraphs) words += wordCount(p);
      }
      expect(words, `${a.slug} core content is ${words} words (<300 = thin)`).toBeGreaterThanOrEqual(
        300,
      );
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

  it('every article receives at least 2 inbound related links (no orphaned articles)', () => {
    const inbound = new Map<string, number>(KNOWLEDGE_ARTICLES.map((a) => [a.slug, 0]));
    for (const a of KNOWLEDGE_ARTICLES) {
      for (const r of a.related) {
        if (r !== a.slug) inbound.set(r, (inbound.get(r) ?? 0) + 1);
      }
    }
    const underLinked = [...inbound.entries()]
      .filter(([, count]) => count < 2)
      .map(([slug, count]) => `${slug} (${count} inbound)`);
    expect(
      underLinked,
      `Under-linked knowledge articles — each slug must appear in at least 2 other articles' related arrays or Google treats it as buried: ${underLinked.join(', ')}`,
    ).toEqual([]);
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

  it('mapped in-prose links are unique per article and point at real routes', () => {
    for (const a of KNOWLEDGE_ARTICLES) {
      // Mirror KnowledgeArticle: one shared set covers every section
      // paragraph and prevents repeated destinations within the article.
      const usedDests = new Set<string>();
      const linked = a.sections.flatMap((s) => s.paragraphs).flatMap((text) =>
        linkifyText(text, usedDests, knowledgePath(a.slug)).filter((segment) => segment.href),
      );
      const hrefs = linked.map((segment) => segment.href!);

      expect(
        new Set(hrefs).size,
        `${a.slug} repeats an in-prose destination; links should appear once per article`,
      ).toBe(hrefs.length);
      for (const href of hrefs) {
        expect(SITE_ROUTES.has(href), `${a.slug} -> unknown in-prose route ${href}`).toBe(true);
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

  it('rendered page titles stay within ~65 chars (Bing "Title too long" guard)', () => {
    // Bing's site scan (2026-07-28) flagged knowledge titles of 73+ chars as
    // "Title too long" while leaving a live 69-char title alone, so Bing's
    // effective threshold sits somewhere in the 70–72 range. Guard at 70.
    // The question drives the <title> (via knowledgeTitle, which may append a
    // brand suffix), H1, FAQ JSON-LD, llms.txt, and .md twins — so guard the
    // final rendered title, not just the raw question.
    for (const a of KNOWLEDGE_ARTICLES) {
      const title = knowledgeTitle(a);
      expect(
        title.length,
        `${a.slug} title "${title}" is ${title.length} chars (>70 risks Bing's title-too-long warning)`,
      ).toBeLessThanOrEqual(70);
    }
  });

  it('descriptions fit meta-description length', () => {
    for (const a of KNOWLEDGE_ARTICLES) {
      expect(knowledgeDescription(a).length, a.slug).toBeLessThanOrEqual(160);
    }
  });

  it('descriptions meet the 150-char minimum and contain no mid-sentence ellipsis', () => {
    for (const a of KNOWLEDGE_ARTICLES) {
      const desc = knowledgeDescription(a);
      expect(desc.length, `${a.slug} description too short (${desc.length} chars)`).toBeGreaterThanOrEqual(150);
      // An ellipsis followed by whitespace+capital letter means a tail was
      // appended after truncation, producing a broken snippet.
      expect(desc, `${a.slug} description has mid-sentence ellipsis`).not.toMatch(/\u2026\s+[A-Z]/);
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

  it('review dates are valid ISO dates, not in the future', () => {
    const isoRe = /^\d{4}-\d{2}-\d{2}$/;
    const dates: Array<[string, string]> = [
      ['KNOWLEDGE_REVIEWED_DATE', KNOWLEDGE_REVIEWED_DATE],
      ...KNOWLEDGE_ARTICLES.filter((a) => a.updated).map(
        (a): [string, string] => [a.slug, a.updated!],
      ),
    ];
    for (const [label, date] of dates) {
      expect(date, `${label} review date must be YYYY-MM-DD`).toMatch(isoRe);
      expect(Number.isNaN(Date.parse(`${date}T00:00:00Z`)), `${label}: unparseable ${date}`).toBe(false);
      expect(reviewAgeDays(date, Date.now()), `${label}: review date ${date} is in the future`).toBeGreaterThanOrEqual(0);
    }
  });

  it(`no review date is older than ${KNOWLEDGE_REVIEW_MAX_AGE_DAYS} days (freshness guard)`, () => {
    // AI answer engines weigh the visible "Reviewed by" byline and the
    // dateModified JSON-LD as freshness signals. When this fails, the
    // leasing team re-verifies the flagged content and bumps the date —
    // the procedure is documented at KNOWLEDGE_REVIEW_MAX_AGE_DAYS in
    // knowledge.ts.
    const stale = staleKnowledgeReviewDates(Date.now());
    expect(
      stale,
      `Expired Knowledge Center review dates (> ${KNOWLEDGE_REVIEW_MAX_AGE_DAYS} days old). ` +
        `Re-verify the content, then bump the date(s) — see the bump procedure at ` +
        `KNOWLEDGE_REVIEW_MAX_AGE_DAYS in src/data/knowledge.ts. Stale: ` +
        stale.map((s) => `${s.label} — ${s.date} (${s.ageDays} days old)`).join('; '),
    ).toEqual([]);
  });

  it('staleKnowledgeReviewDates flags the site-wide date once it ages out', () => {
    const past = Date.parse(`${KNOWLEDGE_REVIEWED_DATE}T00:00:00Z`);
    const dayMs = 86_400_000;
    expect(staleKnowledgeReviewDates(past + KNOWLEDGE_REVIEW_MAX_AGE_DAYS * dayMs)).toEqual([]);
    const stale = staleKnowledgeReviewDates(past + (KNOWLEDGE_REVIEW_MAX_AGE_DAYS + 1) * dayMs);
    expect(stale.length).toBeGreaterThanOrEqual(1);
    expect(stale[0].label).toContain('site-wide');
    expect(stale[0].date).toBe(KNOWLEDGE_REVIEWED_DATE);
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

// ---------------------------------------------------------------------------
// knowledgeQuestions.ts (lightweight slug → question index used by
// KnowledgeLinks so site-wide pages don't bundle the full article content)
// must stay in exact sync with the articles.
// ---------------------------------------------------------------------------
describe('per-category og:image and JSON-LD image consistency', () => {
  it('every KnowledgeCategory maps to a non-empty OG image URL', () => {
    // Grab one article per category and verify knowledgeOgImage returns a URL.
    const byCategory = new Map(
      KNOWLEDGE_CATEGORIES.map((c) => [c, KNOWLEDGE_ARTICLES.find((a) => a.category === c)!]),
    );
    for (const [cat, article] of byCategory) {
      expect(article, `no article found for category "${cat}"`).toBeDefined();
      const url = knowledgeOgImage(article);
      expect(url, `${cat} → empty OG URL`).toBeTruthy();
      expect(url, `${cat} → OG URL must start with https://`).toMatch(/^https:\/\//);
    }
  });

  it('og:image in page metas matches primaryImageOfPage and image in JSON-LD for every category', () => {
    const byCategory = new Map(
      KNOWLEDGE_CATEGORIES.map((c) => [c, KNOWLEDGE_ARTICLES.find((a) => a.category === c)!]),
    );
    for (const [cat, article] of byCategory) {
      if (!article) continue;
      const model = buildKnowledgeSeoModel(article);
      const ogImageMeta = model.metas.find((m) => 'property' in m && m.property === 'og:image');
      const twitterImageMeta = model.metas.find((m) => 'name' in m && m.name === 'twitter:image');
      const jsonLd = model.jsonLd[0] as Record<string, unknown>;
      const graph = (jsonLd['@graph'] as Record<string, unknown>[]) ?? [];
      const webPage = graph.find((n) => {
        const t = n['@type'];
        return Array.isArray(t) ? t.includes('WebPage') : t === 'WebPage';
      });
      const expectedImg = knowledgeOgImage(article);
      expect(ogImageMeta && 'content' in ogImageMeta ? ogImageMeta.content : null,
        `${cat} og:image mismatch`).toBe(expectedImg);
      expect(twitterImageMeta && 'content' in twitterImageMeta ? twitterImageMeta.content : null,
        `${cat} twitter:image mismatch`).toBe(expectedImg);
      expect(webPage?.['primaryImageOfPage'], `${cat} primaryImageOfPage mismatch`).toBe(expectedImg);
      expect(webPage?.['image'], `${cat} image mismatch`).toBe(expectedImg);
    }
  });
});

// ---------------------------------------------------------------------------
import { KNOWLEDGE_QUESTIONS } from './knowledgeQuestions';

describe('knowledgeQuestions index', () => {
  it('contains exactly the article slugs with matching question text', () => {
    const fromArticles = Object.fromEntries(
      KNOWLEDGE_ARTICLES.map((a) => [a.slug, a.question]),
    );
    expect(KNOWLEDGE_QUESTIONS).toEqual(fromArticles);
  });
});
