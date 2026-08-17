// Blog (/blog): pillar + cluster guide articles for renters.
//
// Follows the Knowledge Center pattern exactly: articles are pure content
// data (blogArticles.ts), this module holds the types, helpers, and the
// shared head/JSON-LD builder used by BOTH the client <Seo model> and the
// build-time prerenderer (entry-server.tsx) so they can never drift.
//
// Page anatomy (playbook-driven, test-enforced in blog.test.ts):
//   - One H1 (the title), a self-contained 40–60-word summary first (the
//     block AI assistants retrieve and cite), descriptive H2 sections,
//     optional lists, an FAQ block with FAQPage JSON-LD, internal links to
//     the pillar + sibling cluster articles, and unit/floor-plan CTAs.
//   - E-E-A-T: a real author byline (blogAuthors.ts), visible published +
//     updated dates, and cited sources for external claims — all mirrored
//     in the Article JSON-LD.
//
// Accuracy rule (same as the rest of the site): every fact comes from live
// listing data, committed fact modules (propertyFacts, walkScores, commute,
// fees), or already-published page copy. Anything unconfirmed is deferred to
// the leasing office — no guesses.
import {
  SITE_URL,
  WEBSITE_NODE,
  ORGANIZATION_NODE,
  APARTMENT_COMPLEX_NODE,
  type SeoModel,
  type SeoMeta,
  TWITTER_SITE,
  ogCardUrl,
} from './seo';
import { BLOG_AUTHORS, blogAuthorNodeId, type BlogAuthor, type BlogAuthorId } from './blogAuthors';
import { ALL_BLOG_ARTICLES } from './blogArticles';

export interface BlogSection {
  /** Descriptive H2 above the paragraph(s). */
  heading?: string;
  /** Plain-text paragraphs (no markup). */
  paragraphs: string[];
  /** Optional bullet list rendered after the paragraphs. */
  list?: string[];
}

export interface BlogFaq {
  question: string;
  /** Self-contained answer (also emitted as FAQPage JSON-LD). */
  answer: string;
}

export interface BlogImage {
  /** IMAGE_MANIFEST key (original path), e.g. '/images/image-014-….jpg'. */
  src: string;
  /** Descriptive alt text (what the photo shows, for screen readers/SEO). */
  alt: string;
  /** Visible caption rendered under the photo (and in the markdown twin). */
  caption: string;
}

export interface BlogArticle {
  /** URL slug under /blog/, e.g. "living-in-river-north-chicago". */
  slug: string;
  /** The H1. */
  title: string;
  /**
   * <title> tag text (without brand suffix), kept under the ~65-char display
   * limit. The brand suffix is appended only when it fits.
   */
  metaTitle: string;
  /** The search query this article targets (from the cluster plan). */
  targetQuery: string;
  /** 'pillar' anchors a topic cluster; 'cluster' articles link up to it. */
  role: 'pillar' | 'cluster';
  /**
   * Slug of the pillar article this cluster belongs to (pillar articles
   * reference themselves). Drives the hub grouping and internal linking.
   */
  pillar: string;
  authorId: BlogAuthorId;
  /**
   * Answer-first summary, 40–60 words (test-enforced): a self-contained
   * response to the target query, rendered first and cited by AI assistants.
   */
  summary: string;
  sections: BlogSection[];
  /**
   * 0–2 relevant photos with captions (test-enforced). The first renders
   * after the summary, the second mid-article. `src` must be an
   * IMAGE_MANIFEST key so SmartImg serves responsive WebP/AVIF rungs.
   */
  images?: BlogImage[];
  /** FAQ block (rendered + FAQPage JSON-LD). Empty array = no FAQ block. */
  faqs: BlogFaq[];
  /** Slugs of related blog articles (pillar and/or siblings). */
  related: string[];
  /** Internal site pages to continue to (unit/floor-plan CTAs). */
  links: { label: string; href: string }[];
  /**
   * Cited sources for external claims (https:// URLs, rendered visibly in a
   * "Sources" block and required whenever prose cites third-party facts).
   */
  sources: { label: string; href: string }[];
  /** Existing share-card name in public/images/og/ (no new artwork needed). */
  ogCard: string;
  /** Meta description (defaults to the summary, trimmed). */
  description?: string;
  /** ISO date (YYYY-MM-DD) first published. */
  published: string;
  /** ISO date (YYYY-MM-DD) last reviewed/updated. */
  updated: string;
  /**
   * Draft gate: true excludes the article from BLOG_ARTICLES (and therefore
   * from routes, prerender, sitemap, llms.txt, and the hub) until a human
   * reviewer flips it after review. The AI drafting pipeline may ONLY ever
   * write draft articles — publishing is a reviewed code change.
   */
  draft?: boolean;
}

/** Published articles only — the draft gate for every downstream surface. */
export const BLOG_ARTICLES: BlogArticle[] = ALL_BLOG_ARTICLES.filter((a) => !a.draft);

export function blogPath(slug: string): string {
  return `/blog/${slug}`;
}

export const BLOG_PATHS: string[] = BLOG_ARTICLES.map((a) => blogPath(a.slug));

const bySlug = new Map(BLOG_ARTICLES.map((a) => [a.slug, a]));

export function blogArticle(slug: string): BlogArticle | undefined {
  return bySlug.get(slug);
}

export function blogAuthor(a: BlogArticle): BlogAuthor {
  return BLOG_AUTHORS[a.authorId];
}

/** Pillar articles in data order (each anchors one topic cluster). */
export function blogPillars(): BlogArticle[] {
  return BLOG_ARTICLES.filter((a) => a.role === 'pillar');
}

/** Cluster articles belonging to a pillar slug (excluding the pillar itself). */
export function blogClusterOf(pillarSlug: string): BlogArticle[] {
  return BLOG_ARTICLES.filter((a) => a.role === 'cluster' && a.pillar === pillarSlug);
}

function truncate(text: string, max = 158): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' '))}\u2026`;
}

/** Contextual tail appended when a genuinely short description needs padding. */
const DESCRIPTION_TAIL = ' From the team at 165 W Superior St, River North, Chicago.';
const DESCRIPTION_MIN = 150;

/** Rendered <title>: metaTitle plus the brand suffix when it fits ~65 chars. */
export function blogTitle(a: BlogArticle): string {
  const withBrand = `${a.metaTitle} | Exhibit On Superior`;
  return withBrand.length <= 65 ? withBrand : a.metaTitle;
}

export function blogDescription(a: BlogArticle): string {
  const raw = a.description ?? a.summary;
  const standard = truncate(raw);
  if (standard.length >= DESCRIPTION_MIN) return standard;
  return truncate(`${raw}${DESCRIPTION_TAIL}`);
}

export function blogOgImage(a: BlogArticle): string {
  return ogCardUrl(a.ogCard);
}

/** "July 26, 2026" — human-readable date for the byline. */
export function blogDateDisplay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${months[m - 1]} ${d}, ${y}`;
}

/** Word count used by the 40–60-word summary rule (test-enforced). */
export function blogWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** JSON-LD author node: a full Person node (with credentials) or the org. */
function authorNode(author: BlogAuthor): Record<string, unknown> {
  if (author.type === 'Organization') {
    return {
      '@type': 'Organization',
      '@id': blogAuthorNodeId(author),
      name: ORGANIZATION_NODE.name,
    };
  }
  return {
    '@type': 'Person',
    '@id': blogAuthorNodeId(author),
    name: author.name,
    jobTitle: 'Property Manager',
    description: author.bio,
    worksFor: { '@id': `${SITE_URL}#organization` },
  };
}

export function blogJsonLd(a: BlogArticle): Record<string, unknown> {
  const canonical = `${SITE_URL}${blogPath(a.slug)}`;
  const author = blogAuthor(a);
  const authorRef =
    author.type === 'Organization'
      ? { '@type': 'Organization', '@id': blogAuthorNodeId(author), name: ORGANIZATION_NODE.name }
      : { '@type': 'Person', '@id': blogAuthorNodeId(author), name: author.name };

  const publisher = {
    '@type': 'Organization',
    '@id': `${SITE_URL}#organization`,
    name: ORGANIZATION_NODE.name,
    logo: { '@type': 'ImageObject', url: ORGANIZATION_NODE.logo },
  };

  const article = {
    '@type': ['Article', 'WebPage'],
    '@id': `${canonical}#webpage`,
    headline: a.title,
    url: canonical,
    name: blogTitle(a),
    description: blogDescription(a),
    isPartOf: { '@id': `${SITE_URL}#website` },
    about: { '@id': `${SITE_URL}#apartmentcomplex` },
    primaryImageOfPage: blogOgImage(a),
    // OG card first (stable share/primary image), then in-article photos.
    image: a.images?.length
      ? [blogOgImage(a), ...a.images.map((img) => `${SITE_URL}${img.src}`)]
      : blogOgImage(a),
    author: authorRef,
    publisher,
    datePublished: a.published,
    dateModified: a.updated,
    lastReviewed: a.updated,
    reviewedBy: authorRef,
    breadcrumb: { '@id': `${canonical}#breadcrumb` },
    ...(a.sources.length
      ? { citation: a.sources.map((s) => ({ '@type': 'CreativeWork', name: s.label, url: s.href })) }
      : {}),
  };

  const breadcrumb = {
    '@type': 'BreadcrumbList',
    '@id': `${canonical}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Exhibit On Superior', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: a.title, item: canonical },
    ],
  };

  const graph: Record<string, unknown>[] = [
    WEBSITE_NODE,
    ORGANIZATION_NODE,
    APARTMENT_COMPLEX_NODE,
    article,
    breadcrumb,
  ];

  // Full author Person node with credentials (E-E-A-T), only for person
  // authors — the org author already IS the ORGANIZATION_NODE above.
  if (author.type === 'Person') graph.push(authorNode(author));

  if (a.faqs.length) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${canonical}#faq`,
      mainEntity: a.faqs.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

/** Hub (/blog) JSON-LD: CollectionPage + ItemList of every published article. */
export function blogHubJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${SITE_URL}/blog#articles`,
    name: 'Exhibit On Superior Blog — Renter Guides',
    itemListElement: BLOG_ARTICLES.map((a, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: a.title,
      url: `${SITE_URL}${blogPath(a.slug)}`,
    })),
  };
}

/** Full head-tag model for an article page (client <Seo model> + prerenderer). */
export function buildBlogSeoModel(a: BlogArticle): SeoModel {
  const title = blogTitle(a);
  const description = blogDescription(a);
  const canonical = `${SITE_URL}${blogPath(a.slug)}`;
  const ogImage = blogOgImage(a);
  const author = blogAuthor(a);

  const metas: SeoMeta[] = [
    { name: 'description', content: description },
    { name: 'robots', content: 'index, follow, max-image-preview:large' },
    { name: 'author', content: author.name },
    { property: 'og:locale', content: 'en_US' },
    { property: 'og:type', content: 'article' },
    { property: 'og:site_name', content: 'Exhibit On Superior' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: canonical },
    { property: 'og:image', content: ogImage },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: title },
    { property: 'article:published_time', content: a.published },
    { property: 'article:modified_time', content: a.updated },
    { property: 'article:author', content: author.name },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:site', content: TWITTER_SITE },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: ogImage },
    { name: 'twitter:image:alt', content: title },
  ];

  return { title, canonical, metas, jsonLd: [blogJsonLd(a)] };
}
