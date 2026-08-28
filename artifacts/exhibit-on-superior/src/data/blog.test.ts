// Guard suite for the /blog content engine — mirrors knowledge.test.ts, plus
// the draft-gating invariant that keeps AI-generated drafts out of the build.
import { describe, expect, it } from 'vitest';
import {
  BLOG_ARTICLES,
  blogArticle,
  blogAuthor,
  blogDescription,
  blogJsonLd,
  blogPath,
  blogTitle,
  blogWordCount,
  buildBlogSeoModel,
  type BlogArticle,
} from './blog';
import { ALL_BLOG_ARTICLES } from './blogArticles';
import { BLOG_AUTHORS, blogAuthorNodeId } from './blogAuthors';
import { CLUSTER_PLAN, PLANNED_SLUGS } from './blogClusterPlan';
import { linkifyText } from './blogLinkifier';
import { IMAGE_MANIFEST } from './imageManifest';
import { PAGE_SEO } from './seo';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

describe('blog draft gating', () => {
  it('BLOG_ARTICLES excludes every draft article', () => {
    const drafts = BLOG_ARTICLES.filter((a) => a.draft);
    expect(drafts, 'draft articles must never reach the published set').toEqual([]);
  });

  it('every published article is drawn from ALL_BLOG_ARTICLES', () => {
    const all = new Set(ALL_BLOG_ARTICLES.map((a) => a.slug));
    for (const a of BLOG_ARTICLES) expect(all.has(a.slug)).toBe(true);
  });

  it('there is at least one published article', () => {
    expect(BLOG_ARTICLES.length).toBeGreaterThan(0);
  });
});

describe('blog article structure', () => {
  it('slugs are unique and URL-safe', () => {
    const seen = new Set<string>();
    for (const a of ALL_BLOG_ARTICLES) {
      expect(a.slug, `slug not URL-safe: ${a.slug}`).toMatch(SLUG_RE);
      expect(seen.has(a.slug), `duplicate slug: ${a.slug}`).toBe(false);
      seen.add(a.slug);
    }
  });

  it('summaries are a self-contained 40–60 words', () => {
    for (const a of BLOG_ARTICLES) {
      const n = blogWordCount(a.summary);
      expect(n, `${a.slug} summary is ${n} words (need 40–60)`).toBeGreaterThanOrEqual(40);
      expect(n, `${a.slug} summary is ${n} words (need 40–60)`).toBeLessThanOrEqual(60);
    }
  });

  it('body carries at least 300 words of core content', () => {
    for (const a of BLOG_ARTICLES) {
      const body = a.sections
        .flatMap((s) => [...(s.paragraphs ?? []), ...(s.list ?? [])])
        .join(' ');
      expect(blogWordCount(body), `${a.slug} body too thin`).toBeGreaterThanOrEqual(300);
    }
  });

  it('exactly one H1 (title) and descriptive H2 sections', () => {
    for (const a of BLOG_ARTICLES) {
      expect(a.title.length, `${a.slug} title missing`).toBeGreaterThan(0);
      expect(a.sections.length, `${a.slug} needs H2 sections`).toBeGreaterThanOrEqual(3);
      for (const s of a.sections) {
        if (s.heading !== undefined) expect(s.heading.length).toBeGreaterThan(0);
      }
    }
  });

  it('titles render under the ~65-char display cap', () => {
    for (const a of BLOG_ARTICLES) {
      expect(blogTitle(a).length, `${a.slug} rendered <title> too long`).toBeLessThanOrEqual(65);
    }
  });

  it('meta descriptions sit in the 150–160 char band', () => {
    for (const a of BLOG_ARTICLES) {
      const d = blogDescription(a);
      expect(d.length, `${a.slug} description ${d.length} chars: "${d}"`).toBeGreaterThanOrEqual(150);
      expect(d.length, `${a.slug} description ${d.length} chars: "${d}"`).toBeLessThanOrEqual(160);
    }
  });

  it('published/updated are ISO dates, not in the future, updated >= published', () => {
    const today = new Date().toISOString().slice(0, 10);
    for (const a of BLOG_ARTICLES) {
      expect(a.published, `${a.slug} published`).toMatch(ISO_RE);
      expect(a.updated, `${a.slug} updated`).toMatch(ISO_RE);
      expect(a.published <= today, `${a.slug} published in the future`).toBe(true);
      expect(a.updated <= today, `${a.slug} updated in the future`).toBe(true);
      expect(a.updated >= a.published, `${a.slug} updated before published`).toBe(true);
    }
  });
});

describe('blog E-E-A-T authorship', () => {
  it('every article has a registered author', () => {
    for (const a of BLOG_ARTICLES) {
      expect(BLOG_AUTHORS[a.authorId], `${a.slug} unknown author ${a.authorId}`).toBeTruthy();
      expect(blogAuthor(a).name.length).toBeGreaterThan(0);
    }
  });

  it('cited sources are absolute https URLs', () => {
    for (const a of BLOG_ARTICLES) {
      for (const s of a.sources) {
        expect(s.href, `${a.slug} source not https: ${s.href}`).toMatch(/^https:\/\//);
        expect(s.label.length).toBeGreaterThan(0);
      }
    }
  });

  it('every published article cites at least one source', () => {
    for (const a of BLOG_ARTICLES) {
      expect(a.sources.length, `${a.slug} has no cited sources`).toBeGreaterThanOrEqual(1);
    }
  });

  it('external claims map to a matching citation domain', () => {
    // Claim → required source domain. When article prose asserts a fact owned
    // by a third party, a source from that party's domain must be cited.
    const CLAIM_SOURCES: Array<[RegExp, string, string]> = [
      [/walk score|transit score|bike score/i, 'walkscore.com', 'Walk Score claims'],
      [/\b(cta|brown line|purple line|red line|blue line|orange line|l stop|l station)\b/i, 'transitchicago.com', 'CTA/transit claims'],
      [/\bcomed\b/i, 'comed.com', 'ComEd claims'],
    ];
    for (const a of BLOG_ARTICLES) {
      const prose = [
        a.title,
        a.summary,
        ...a.sections.flatMap((s) => [s.heading ?? '', ...s.paragraphs, ...(s.list ?? [])]),
        ...a.faqs.flatMap((f) => [f.question, f.answer]),
      ].join(' ');
      for (const [claimRe, domain, label] of CLAIM_SOURCES) {
        if (claimRe.test(prose)) {
          const cited = a.sources.some((s) => s.href.includes(domain));
          expect(cited, `${a.slug} makes ${label} but cites no ${domain} source`).toBe(true);
        }
      }
    }
  });
});

describe('blog internal linking (no orphans)', () => {
  const published = new Set(BLOG_ARTICLES.map((a) => a.slug));

  it('keeps prose plain text so the shared linkifier emits clean internal anchors', () => {
    for (const a of ALL_BLOG_ARTICLES) {
      const prose = a.sections.flatMap((s) => [...s.paragraphs, ...(s.list ?? [])]);
      for (const text of prose) {
        expect(
          text,
          `${a.slug} uses Markdown link syntax in plain-text prose; use a natural phrase from blogLinkifier.ts instead`,
        ).not.toMatch(/\[[^\]]+\]\([^)]+\)/);
      }
    }
  });

  it('every published article has at least one in-prose internal link', () => {
    for (const a of ALL_BLOG_ARTICLES) {
      if (a.draft) continue;

      // Mirror BlogArticle: each prose item is linkified independently while
      // destinations remain shared across the full article body.
      const usedDests = new Set<string>();
      const linked = a.sections.flatMap((s) =>
        [...s.paragraphs, ...(s.list ?? [])].flatMap((text) =>
          linkifyText(text, usedDests, blogPath(a.slug)).filter((segment) => segment.href),
        ),
      );

      expect(
        linked.length,
        `${a.slug} has no in-prose internal links; expand BLOG_LINK_PHRASES in blogLinkifier.ts`,
      ).toBeGreaterThan(0);
    }
  });

  it('related links resolve to published articles', () => {
    for (const a of BLOG_ARTICLES) {
      for (const rel of a.related) {
        expect(published.has(rel), `${a.slug} relates to unpublished/unknown ${rel}`).toBe(true);
        expect(rel).not.toBe(a.slug);
      }
    }
  });

  it('every article has at least one inbound related link', () => {
    const inbound = new Map<string, number>();
    for (const a of BLOG_ARTICLES) {
      for (const rel of a.related) inbound.set(rel, (inbound.get(rel) ?? 0) + 1);
    }
    for (const a of BLOG_ARTICLES) {
      expect(inbound.get(a.slug) ?? 0, `${a.slug} is an orphan (no inbound links)`).toBeGreaterThanOrEqual(1);
    }
  });

  it('onward links point at real PAGE_SEO routes', () => {
    const routes = new Set(Object.keys(PAGE_SEO));
    for (const a of BLOG_ARTICLES) {
      expect(a.links.length, `${a.slug} needs onward CTAs`).toBeGreaterThanOrEqual(1);
      for (const l of a.links) {
        expect(routes.has(l.href), `${a.slug} links to non-route ${l.href}`).toBe(true);
      }
    }
  });

  it('every cluster article names a published pillar', () => {
    for (const a of BLOG_ARTICLES.filter((x) => x.role === 'cluster')) {
      const pillar = blogArticle(a.pillar);
      expect(pillar, `${a.slug} pillar ${a.pillar} not published`).toBeTruthy();
      expect(pillar?.role).toBe('pillar');
    }
  });
});

describe('blog JSON-LD', () => {
  it('emits an Article node with author + dates and a self-canonical', () => {
    for (const a of BLOG_ARTICLES) {
      const graph = blogJsonLd(a)['@graph'] as Record<string, unknown>[];
      const article = graph.find(
        (n) => Array.isArray(n['@type']) && (n['@type'] as string[]).includes('Article'),
      );
      expect(article, `${a.slug} missing Article node`).toBeTruthy();
      expect(article?.author).toBeTruthy();
      expect(article?.datePublished).toBe(a.published);
      expect(article?.dateModified).toBe(a.updated);
      const model = buildBlogSeoModel(a);
      expect(model.canonical).toContain(blogPath(a.slug));
    }
  });

  it('articles with FAQs emit a matching FAQPage node', () => {
    for (const a of BLOG_ARTICLES.filter((x) => x.faqs.length)) {
      const graph = blogJsonLd(a)['@graph'] as Record<string, unknown>[];
      const faq = graph.find((n) => n['@type'] === 'FAQPage') as
        | { mainEntity?: unknown[] }
        | undefined;
      expect(faq, `${a.slug} has FAQs but no FAQPage node`).toBeTruthy();
      expect(faq?.mainEntity?.length).toBe(a.faqs.length);
    }
  });

  it('keeps structured author and reviewer names identical to the visible byline', () => {
    for (const a of BLOG_ARTICLES) {
      const author = blogAuthor(a);
      const graph = blogJsonLd(a)['@graph'] as Record<string, unknown>[];
      const article = graph.find(
        (node) => Array.isArray(node['@type']) && (node['@type'] as string[]).includes('Article'),
      ) as { author?: Record<string, unknown>; reviewedBy?: Record<string, unknown> } | undefined;
      const fullAuthor = graph.find((node) => node['@id'] === blogAuthorNodeId(author));

      expect(article?.author?.name, `${a.slug} structured author differs from byline`).toBe(author.name);
      expect(article?.reviewedBy?.name, `${a.slug} structured reviewer differs from byline`).toBe(author.name);
      expect(fullAuthor?.name, `${a.slug} full author node differs from byline`).toBe(author.name);

      if (author.type === 'Organization') {
        expect(fullAuthor?.['@id']).not.toBe('https://www.rentatexhibit.com#organization');
        expect(fullAuthor?.parentOrganization).toEqual({
          '@id': 'https://www.rentatexhibit.com#organization',
        });
      }
    }
  });

  it('breadcrumb is exactly 3 levels (Home / Blog / Title)', () => {
    for (const a of BLOG_ARTICLES) {
      const graph = blogJsonLd(a)['@graph'] as Record<string, unknown>[];
      const bc = graph.find((n) => n['@type'] === 'BreadcrumbList') as
        | { itemListElement?: unknown[] }
        | undefined;
      expect(bc?.itemListElement?.length, `${a.slug} breadcrumb not 3 levels`).toBe(3);
    }
  });
});

describe('blog copy quality (no marketing filler)', () => {
  // The playbook rejects empty superlatives; keep prose factual.
  const FILLER = [
    'world-class',
    'best-in-class',
    'unparalleled',
    'second to none',
    'nestled',
    'stunning array',
    'plethora',
  ];
  it('no banned filler phrases in article prose', () => {
    for (const a of BLOG_ARTICLES) {
      const prose = [
        a.title,
        a.summary,
        ...a.sections.flatMap((s) => [s.heading ?? '', ...s.paragraphs, ...(s.list ?? [])]),
        ...a.faqs.flatMap((f) => [f.question, f.answer]),
      ]
        .join(' ')
        .toLowerCase();
      for (const bad of FILLER) {
        expect(prose.includes(bad), `${a.slug} contains filler "${bad}"`).toBe(false);
      }
    }
  });

  it('no raw HTML markup in article prose (paragraphs render as plain text)', () => {
    // BlogSection paragraphs/lists/FAQ answers are rendered as React text —
    // any embedded markup would be escaped and shown literally to readers.
    // Internal links belong in the typed `links` array, not inline HTML.
    for (const a of BLOG_ARTICLES) {
      const prose = [
        a.title,
        a.summary,
        ...a.sections.flatMap((s) => [s.heading ?? '', ...s.paragraphs, ...(s.list ?? [])]),
        ...a.faqs.flatMap((f) => [f.question, f.answer]),
      ].join(' ');
      expect(/<[a-z/][^>]*>/i.test(prose), `${a.slug} contains raw HTML markup in prose`).toBe(
        false,
      );
    }
  });

  it('never names the management company in renter-facing prose', () => {
    for (const a of BLOG_ARTICLES) {
      const prose = JSON.stringify(a).toLowerCase();
      expect(prose.includes('highland partners')).toBe(false);
      expect(prose.includes('highland management')).toBe(false);
    }
  });
});

describe('blog cluster plan', () => {
  it('planned slugs are unique and URL-safe', () => {
    const seen = new Set<string>();
    for (const s of PLANNED_SLUGS) {
      expect(s, `plan slug not URL-safe: ${s}`).toMatch(SLUG_RE);
      expect(seen.has(s), `duplicate plan slug: ${s}`).toBe(false);
      seen.add(s);
    }
  });

  it('every published article is covered by the cluster plan', () => {
    const planned = new Set(PLANNED_SLUGS);
    for (const a of BLOG_ARTICLES) {
      expect(planned.has(a.slug), `${a.slug} published but not in the cluster plan`).toBe(true);
    }
  });

  it('cluster briefs name their internal-link targets', () => {
    for (const pillar of CLUSTER_PLAN) {
      for (const c of pillar.clusters) {
        expect(c.internalLinks.length, `${c.slug} brief has no internal-link targets`).toBeGreaterThanOrEqual(1);
      }
    }
  });
});

describe('blog article photos', () => {
  // Applies to ALL articles (drafts included) so a draft can't publish with
  // broken image metadata.
  it('published articles carry 1-2 photos (drafts 0-2) with nonempty alt and caption', () => {
    for (const a of ALL_BLOG_ARTICLES) {
      const images = a.images ?? [];
      // The AI drafter appends drafts without photos; a human picks them at
      // (or before) publish time, so only the published set requires >=1.
      if (!a.draft) {
        expect(images.length, `${a.slug} should have 1-2 photos`).toBeGreaterThanOrEqual(1);
      }
      expect(images.length, `${a.slug} has too many photos`).toBeLessThanOrEqual(2);
      for (const img of images) {
        expect(img.alt.trim(), `${a.slug} photo alt empty`).not.toHaveLength(0);
        expect(img.caption.trim(), `${a.slug} photo caption empty`).not.toHaveLength(0);
        expect(img.alt, `${a.slug} alt must differ from caption`).not.toBe(img.caption);
      }
    }
  });

  it('photo sources are unique within an article and resolve in the image manifest', () => {
    for (const a of ALL_BLOG_ARTICLES) {
      const srcs = (a.images ?? []).map((i) => i.src);
      expect(new Set(srcs).size, `${a.slug} repeats a photo`).toBe(srcs.length);
      for (const src of srcs) {
        expect(
          IMAGE_MANIFEST[src],
          `${a.slug} photo ${src} is not an IMAGE_MANIFEST key — SmartImg would fall back to an unoptimized <img>`,
        ).toBeDefined();
      }
    }
  });

  it('JSON-LD image lists the OG card first, then each article photo as an absolute URL', () => {
    for (const a of BLOG_ARTICLES) {
      const graph = blogJsonLd(a)['@graph'] as Record<string, unknown>[];
      const article = graph.find((n) => Array.isArray(n['@type']) && (n['@type'] as string[]).includes('Article'))!;
      const image = article.image as string | string[];
      const photos = a.images ?? [];
      if (!photos.length) {
        expect(typeof image).toBe('string');
        continue;
      }
      expect(Array.isArray(image)).toBe(true);
      expect((image as string[]).length).toBe(1 + photos.length);
      for (const url of image as string[]) {
        expect(url).toMatch(/^https:\/\//);
      }
    }
  });
});

// Type-only reference so `BlogArticle` import is exercised in strict builds.
export type _BlogArticle = BlogArticle;
