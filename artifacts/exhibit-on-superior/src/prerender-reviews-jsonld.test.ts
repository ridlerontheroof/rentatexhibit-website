import { describe, expect, it } from 'vitest';
import { render } from './entry-server';
import { buildReviewsPageModel, reviewsJsonLd } from './data/reviews';

// Task: Google must see MATCHING review structured data in the pre-built page
// and the live page.
//
// The Reviews page's Review/AggregateRating JSON-LD is emitted twice:
//   1. At build time by scripts/prerender.mjs, which injects the head produced
//      by entry-server's render() (curated fallback model — no live feed).
//   2. Client-side by <Seo extraJsonLd> after live Google reviews load.
// Both are supposed to flow through the same shared module
// (reviewsJsonLd(buildReviewsPageModel(...))). This test renders the reviews
// route through the SAME entry-server pipeline the prerenderer uses, extracts
// the JSON-LD it would ship, and asserts it deep-equals what the shared module
// produces for the fallback model. If a refactor of the SEO model, the
// prerender wiring (EXTRA_JSONLD), or reviews.ts ever makes them diverge,
// this fails loudly instead of crawlers silently indexing stale schema.

/** Pull every <script type="application/ld+json"> payload out of a head string. */
function extractJsonLd(head: string): Record<string, unknown>[] {
  const scripts = [
    ...head.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g),
  ].map((m) => m[1]);
  // renderHeadTags escapes "<" as \u003c inside the JSON; JSON.parse restores it.
  return scripts.map((s) => JSON.parse(s) as Record<string, unknown>);
}

describe('prerendered /reviews JSON-LD matches the shared reviews module', () => {
  it('ships review schema that deep-equals reviewsJsonLd(buildReviewsPageModel(undefined))', async () => {
    const { head } = await render('/reviews');

    const jsonLdBlocks = extractJsonLd(head);
    // Base @graph plus the reviews extra block — at minimum two scripts.
    expect(jsonLdBlocks.length).toBeGreaterThanOrEqual(2);

    // The LocalBusiness node carrying aggregateRating/review is the extra
    // block appended after the base @graph. Find it structurally rather than
    // by position so reordering alone doesn't mask a real divergence.
    const reviewBlocks = jsonLdBlocks.filter(
      (b) => b['@type'] === 'LocalBusiness' && 'aggregateRating' in b,
    );
    expect(reviewBlocks).toHaveLength(1);

    const expected = reviewsJsonLd(buildReviewsPageModel(undefined));
    expect(reviewBlocks[0]).toEqual(expected);
  });

  it('does not leak review/aggregateRating claims into the base @graph', async () => {
    const { head } = await render('/reviews');
    const [baseGraph] = extractJsonLd(head);
    const graph = baseGraph['@graph'] as Record<string, unknown>[];

    // The aggregate/review data must live ONLY in the shared-module block, so
    // there is exactly one source of truth for crawlers to merge by @id.
    for (const node of graph) {
      expect(node).not.toHaveProperty('aggregateRating');
      expect(node).not.toHaveProperty('review');
    }
  });

  it('prerendered page body visibly shows the same aggregate the schema claims', async () => {
    const { html } = await render('/reviews');
    const model = buildReviewsPageModel(undefined);

    // Google requires schema ratings to be visible on the page; the fallback
    // aggregate and every fallback quote must appear in the prerendered body.
    expect(html).toContain(model.rating.toFixed(1));
    expect(html).toContain(String(model.reviewCount));
    for (const r of model.reviews) {
      // renderToString HTML-escapes quotes/apostrophes; compare on a fragment
      // without those characters.
      const fragment = r.quote.split(/['"&<>]/)[0].trim();
      expect(html).toContain(fragment);
    }
  });
});
