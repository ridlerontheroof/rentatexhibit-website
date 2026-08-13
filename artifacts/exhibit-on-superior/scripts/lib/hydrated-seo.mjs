// Pure helpers for the hydrated-head single-SEO guard
// (scripts/check-hydrated-seo.mjs). Kept dependency-free and side-effect-free
// so the settle predicate and raw-head analysis are unit-testable
// (scripts/lib/hydrated-seo.test.mjs).

/** The share-preview tags every page must carry exactly once. */
export const PREVIEW_TAGS = ['title', 'canonical', 'ogTitle', 'ogImage', 'twitterImage'];

const TAG_PATTERNS = {
  title: /<title[\s>]/gi,
  canonical: /<link[^>]+rel=["']canonical["']/gi,
  ogTitle: /<meta[^>]+property=["']og:title["']/gi,
  ogImage: /<meta[^>]+property=["']og:image["'](?![^>]*og:image:)/gi,
  twitterImage: /<meta[^>]+name=["']twitter:image["']/gi,
};

/**
 * Analyze a RAW (pre-hydration) HTML document's head: per-tag counts overall
 * and within the `<!-- seo:start -->` / `<!-- seo:end -->` markers.
 *
 * Non-JS fetchers (iMessage, WhatsApp, Slack, Facebook's first pass) consume
 * exactly this version, so the raw head must already be a clean single set —
 * and it must live INSIDE the markers, because that is the block
 * stripPrerenderedSeo removes at hydration; a preview tag outside the markers
 * would survive hydration and duplicate the route's Helmet-emitted tag.
 */
export function analyzeRawHead(html) {
  const headEnd = html.search(/<\/head\s*>/i);
  const head = headEnd === -1 ? html : html.slice(0, headEnd);
  const startIdx = head.indexOf('<!-- seo:start -->');
  const endIdx = head.indexOf('<!-- seo:end -->');
  const hasMarkers = startIdx !== -1 && endIdx !== -1 && endIdx > startIdx;
  const block = hasMarkers ? head.slice(startIdx, endIdx) : '';
  const counts = {};
  const insideMarkers = {};
  for (const [name, re] of Object.entries(TAG_PATTERNS)) {
    counts[name] = (head.match(re) ?? []).length;
    insideMarkers[name] = (block.match(re) ?? []).length;
  }
  return { hasMarkers, counts, insideMarkers };
}

/**
 * Failures (empty array = pass) for one route's raw head: markers present,
 * exactly one of each preview tag, and every one of them inside the markers.
 */
export function rawHeadFailures(html, route) {
  const { hasMarkers, counts, insideMarkers } = analyzeRawHead(html);
  const failures = [];
  if (!hasMarkers) {
    failures.push(`${route}: raw head is missing the seo:start/seo:end marker pair`);
    return failures;
  }
  for (const tag of PREVIEW_TAGS) {
    if (counts[tag] !== 1) {
      failures.push(`${route}: raw head has ${counts[tag]} ${tag} tags (expected exactly 1)`);
    } else if (insideMarkers[tag] !== 1) {
      failures.push(
        `${route}: raw ${tag} tag sits OUTSIDE the seo markers — hydration will not strip it, so JS-executing scrapers would see a duplicate`,
      );
    }
  }
  return failures;
}

/** Normalize a URL for target comparison: drop query/hash and trailing slash. */
export function normalizeUrl(url) {
  return String(url ?? '')
    .replace(/[?#].*$/, '')
    .replace(/\/$/, '');
}

/**
 * True when a hydrated-head snapshot (from the in-page SNAPSHOT_EXPR) is the
 * desired end state FOR THE EXPECTED URL: the document really is the target
 * route (guards against reading the previous route's already-settled head
 * before the navigation commits), every preview tag appears exactly once,
 * and no element nodes survive between the seo markers.
 */
export function isSettled(snap, expectedUrl) {
  return (
    snap != null &&
    normalizeUrl(snap.href) === normalizeUrl(expectedUrl) &&
    PREVIEW_TAGS.every((tag) => snap[tag] === 1) &&
    snap.leftoverInBlock === 0
  );
}
