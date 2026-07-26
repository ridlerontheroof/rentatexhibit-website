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
   * links with rel="noopener" in a new tab. Not route-validated by tests.
   */
  externalLinks?: { label: string; href: string }[];
  /** Meta description (defaults to the answer, trimmed). */
  description?: string;
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

export function knowledgeTitle(a: KnowledgeArticle): string {
  return `${a.question} | Exhibit On Superior Chicago`;
}

export function knowledgeDescription(a: KnowledgeArticle): string {
  return truncate(a.description ?? a.answer);
}

/** Self-contained FAQPage + WebPage + Breadcrumb @graph for one article. */
export function knowledgeJsonLd(a: KnowledgeArticle): Record<string, unknown> {
  const canonical = `${SITE_URL}${knowledgePath(a.slug)}`;

  const webPage = {
    '@type': 'WebPage',
    '@id': `${canonical}#webpage`,
    url: canonical,
    name: knowledgeTitle(a),
    description: knowledgeDescription(a),
    isPartOf: { '@id': `${SITE_URL}#website` },
    about: { '@id': `${SITE_URL}#apartmentcomplex` },
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
  const ogImage = `${SITE_URL}/images/og-card.jpg`;

  const metas: SeoMeta[] = [
    { name: 'description', content: description },
    { name: 'robots', content: 'index, follow' },
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
