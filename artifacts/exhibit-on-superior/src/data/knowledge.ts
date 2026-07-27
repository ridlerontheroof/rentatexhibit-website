// Knowledge Center (/knowledge): answer-first Q&A article system.
//
// Each article is one renter question answered in under 100 words first
// (the format AI assistants retrieve and cite), then expanded detail, then
// related questions and site links. Articles are pure content data in
// knowledgeArticles.ts; this module holds the types, helpers, and the shared
// head/JSON-LD builder used by BOTH the client <Seo model> and the build-time
// prerenderer (entry-server.tsx) so they can never drift.
//
// Accuracy rule (same as the rest of the site): every fact comes from live
// listing data, the leasing-approved questionnaire, or already-published page
// copy. Anything unconfirmed is deferred to the leasing office — no guesses.
import {
  SITE_URL,
  WEBSITE_NODE,
  ORGANIZATION_NODE,
  APARTMENT_COMPLEX_NODE,
  type SeoModel,
  type SeoMeta,
  DEFAULT_OG_IMAGE,
} from './seo';
import { KNOWLEDGE_ARTICLES } from './knowledgeArticles';

export { KNOWLEDGE_ARTICLES };

/** Browsable hub categories, in display order. */
export const KNOWLEDGE_CATEGORIES = [
  'Pricing & Fees',
  'Apartments & Floor Plans',
  'Amenities',
  'Pets',
  'Parking & Transportation',
  'Leasing & Applications',
  'Utilities',
  'Neighborhood',
  'Building & Services',
] as const;

export type KnowledgeCategory = (typeof KNOWLEDGE_CATEGORIES)[number];

export interface KnowledgeSection {
  /** Optional H2 above the paragraph(s). */
  heading?: string;
  /** Plain-text paragraphs (no markup). */
  paragraphs: string[];
}

export interface KnowledgeArticle {
  /** URL slug under /knowledge/, e.g. "how-much-does-parking-cost". */
  slug: string;
  /** The single question — rendered as the H1 and the <title> lead. */
  question: string;
  category: KnowledgeCategory;
  /** Direct answer, UNDER 100 WORDS, rendered first (enforced by test). */
  answer: string;
  /** Expanded detail below the answer. */
  sections: KnowledgeSection[];
  /** Slugs of related questions (rendered as "Related questions"). */
  related: string[];
  /** Internal site pages to continue to, e.g. { label, href: "/fees" }. */
  links: { label: string; href: string }[];
  /**
   * External resources (full https:// URLs), rendered after the internal
   * links with rel="noopener" in a new tab. Tests enforce https:// URLs
   * that parse, with non-empty labels (offline format check only).
   */
  externalLinks?: { label: string; href: string }[];
  /** Meta description (defaults to the answer, trimmed). */
  description?: string;
  /**
   * True for fact-heavy articles (pricing, fees, specials, application
   * requirements, utility charges, office hours, lease terms) whose facts
   * can drift over time. Renders the shared CHANGEABLE_FACTS_NOTE footer
   * under the article body — one flag instead of hand-pasting the sentence
   * into dozens of answers.
   */
  changeableFacts?: boolean;
  /**
   * ISO date (YYYY-MM-DD) the leasing team last reviewed/updated this
   * article. Defaults to KNOWLEDGE_REVIEWED_DATE; set per-article when a
   * single answer is re-verified later. Drives the visible byline and the
   * dateModified/lastReviewed fields in the article JSON-LD.
   */
  updated?: string;
}

/**
 * Site-wide default review date for knowledge articles: the last time the
 * leasing team reviewed the full answer set. Bump when the content is
 * re-verified in bulk; per-article `updated` overrides for later edits.
 */
export const KNOWLEDGE_REVIEWED_DATE = '2026-07-26';

/**
 * Freshness threshold: an article's effective review date (per-article
 * `updated`, else KNOWLEDGE_REVIEWED_DATE) older than this many days counts
 * as EXPIRED. The suite test in knowledge.test.ts fails past this threshold
 * so a publish can't quietly ship stale "Reviewed by" bylines, and the
 * production knowledge watchdog (api-server knowledgeCheck.ts — keep its
 * REVIEW_MAX_AGE_DAYS in sync) warns in deployment logs even without a
 * rebuild.
 *
 * HOW THE LEASING TEAM BUMPS THE DATE after re-verifying content:
 *   1. Re-read the articles (or the subset that changed) against current
 *      leasing facts — pricing page, fee schedule, policies.
 *   2. Bulk re-verification: set KNOWLEDGE_REVIEWED_DATE above to today's
 *      date (YYYY-MM-DD). Single-article fix: set that article's `updated`
 *      field in knowledgeArticles.ts instead.
 *   3. Publish. The byline, dateModified/lastReviewed JSON-LD, and this
 *      freshness guard all read the same value, so nothing else changes.
 */
export const KNOWLEDGE_REVIEW_MAX_AGE_DAYS = 120;

/** Age in whole days of an ISO YYYY-MM-DD date at `now` (UTC midnights). */
export function reviewAgeDays(dateIso: string, now: number): number {
  return Math.floor((now - Date.parse(`${dateIso}T00:00:00Z`)) / 86_400_000);
}

/**
 * All stale review dates at `now`: the site-wide default (when expired, it
 * covers every article without an override) plus any expired per-article
 * overrides. Empty array = everything fresh.
 */
export function staleKnowledgeReviewDates(
  now: number,
): Array<{ label: string; date: string; ageDays: number }> {
  const stale: Array<{ label: string; date: string; ageDays: number }> = [];
  const siteAge = reviewAgeDays(KNOWLEDGE_REVIEWED_DATE, now);
  if (siteAge > KNOWLEDGE_REVIEW_MAX_AGE_DAYS) {
    const covered = KNOWLEDGE_ARTICLES.filter((a) => !a.updated).length;
    stale.push({
      label: `site-wide KNOWLEDGE_REVIEWED_DATE (covers ${covered} articles)`,
      date: KNOWLEDGE_REVIEWED_DATE,
      ageDays: siteAge,
    });
  }
  for (const a of KNOWLEDGE_ARTICLES) {
    if (!a.updated) continue;
    const age = reviewAgeDays(a.updated, now);
    if (age > KNOWLEDGE_REVIEW_MAX_AGE_DAYS) {
      stale.push({ label: a.slug, date: a.updated, ageDays: age });
    }
  }
  return stale;
}

/**
 * Standard qualifier footer for articles flagged `changeableFacts`. Split so
 * the page can render "Available Units page" as a real link while tests and
 * any structured-data consumer can use the single joined sentence.
 */
export const CHANGEABLE_FACTS_NOTE_PARTS = {
  before: 'Pricing, availability, fees, and leasing policies may change. Current unit-specific information appears on the ',
  linkLabel: 'Available Units page',
  linkHref: '/available-units',
  after: '.',
} as const;

export const CHANGEABLE_FACTS_NOTE = `${CHANGEABLE_FACTS_NOTE_PARTS.before}${CHANGEABLE_FACTS_NOTE_PARTS.linkLabel}${CHANGEABLE_FACTS_NOTE_PARTS.after}`;

export function knowledgeUpdated(a: KnowledgeArticle): string {
  return a.updated ?? KNOWLEDGE_REVIEWED_DATE;
}

/** "July 26, 2026" — human-readable form of the review date for the byline. */
export function knowledgeUpdatedDisplay(a: KnowledgeArticle): string {
  const [y, m, d] = knowledgeUpdated(a).split('-').map(Number);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${months[m - 1]} ${d}, ${y}`;
}

export function knowledgePath(slug: string): string {
  return `/knowledge/${slug}`;
}

export const KNOWLEDGE_PATHS: string[] = KNOWLEDGE_ARTICLES.map((a) => knowledgePath(a.slug));

const bySlug = new Map(KNOWLEDGE_ARTICLES.map((a) => [a.slug, a]));

export function knowledgeArticle(slug: string): KnowledgeArticle | undefined {
  return bySlug.get(slug);
}

export function articlesInCategory(category: KnowledgeCategory): KnowledgeArticle[] {
  return KNOWLEDGE_ARTICLES.filter((a) => a.category === category);
}

function truncate(text: string, max = 158): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' '))}\u2026`;
}

// Q&A titles are the question itself. Most questions already name the
// property, so appending "| Exhibit On Superior Chicago" double-branded
// every title and pushed all of them past Google's ~60-character display
// limit (guarded by src/prerender-titles.test.ts). Only questions that
// don't mention the property get a short brand suffix.
export function knowledgeTitle(a: KnowledgeArticle): string {
  if (a.question.includes('Exhibit On Superior')) return a.question;
  return `${a.question} | Exhibit On Superior`;
}

export function knowledgeDescription(a: KnowledgeArticle): string {
  return truncate(a.description ?? a.answer);
}

/** Self-contained FAQPage + WebPage + Breadcrumb @graph for one article. */
export function knowledgeJsonLd(a: KnowledgeArticle): Record<string, unknown> {
  const canonical = `${SITE_URL}${knowledgePath(a.slug)}`;

  // Author/publisher attribution + freshness date (E-E-A-T / AEO signals),
  // mirrored by the visible byline block in pages/KnowledgeArticle.tsx.
  // The author/reviewer is the Organization node itself (the on-site leasing
  // team IS the organization's editorial voice) — referencing it by @id keeps
  // the graph free of duplicate half-filled Organization nodes, which the
  // recommended-properties validator would flag on every article.
  const author = { '@id': `${SITE_URL}#organization` };

  const webPage = {
    '@type': 'WebPage',
    '@id': `${canonical}#webpage`,
    url: canonical,
    name: knowledgeTitle(a),
    description: knowledgeDescription(a),
    isPartOf: { '@id': `${SITE_URL}#website` },
    about: { '@id': `${SITE_URL}#apartmentcomplex` },
    author,
    publisher: { '@id': `${SITE_URL}#organization` },
    dateModified: knowledgeUpdated(a),
    lastReviewed: knowledgeUpdated(a),
    reviewedBy: author,
    breadcrumb: { '@id': `${canonical}#breadcrumb` },
  };

  const breadcrumb = {
    '@type': 'BreadcrumbList',
    '@id': `${canonical}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Exhibit On Superior', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Knowledge Center', item: `${SITE_URL}/knowledge` },
      { '@type': 'ListItem', position: 3, name: a.question, item: canonical },
    ],
  };

  const faqPage = {
    '@type': 'FAQPage',
    '@id': `${canonical}#faq`,
    mainEntity: [
      {
        '@type': 'Question',
        name: a.question,
        acceptedAnswer: { '@type': 'Answer', text: a.answer },
      },
    ],
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [
      // Base entities re-emitted in full so each article's graph resolves every
      // internal @id on its own (same pattern as per-unit pages).
      WEBSITE_NODE,
      ORGANIZATION_NODE,
      APARTMENT_COMPLEX_NODE,
      webPage,
      breadcrumb,
      faqPage,
    ],
  };
}

/** Full head-tag model for an article page (client <Seo model> + prerenderer). */
export function buildKnowledgeSeoModel(a: KnowledgeArticle): SeoModel {
  const title = knowledgeTitle(a);
  const description = knowledgeDescription(a);
  const canonical = `${SITE_URL}${knowledgePath(a.slug)}`;
  const ogImage = DEFAULT_OG_IMAGE;

  const metas: SeoMeta[] = [
    { name: 'description', content: description },
    { name: 'robots', content: 'index, follow, max-image-preview:large' },
    { property: 'og:locale', content: 'en_US' },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'Exhibit On Superior' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: canonical },
    { property: 'og:image', content: ogImage },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: ogImage },
  ];

  return { title, canonical, metas, jsonLd: [knowledgeJsonLd(a)] };
}

/** Word count used by the under-100-words answer rule (test-enforced). */
export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
