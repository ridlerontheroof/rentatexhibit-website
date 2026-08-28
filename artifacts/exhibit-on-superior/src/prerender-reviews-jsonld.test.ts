import { describe, expect, it } from 'vitest';
import { render } from './entry-server';
import { buildReviewsPageModel, reviewsJsonLd } from './data/reviews';

// Task: Google must see MATCHING review structured data in the pre-built page
// and the live page.
//
// The Reviews page's Review/AggregateRating JSON-LD is merged into the
// canonical property node in the base graph. This test renders the reviews
// route through the SAME entry-server pipeline the prerenderer uses, extracts
// the JSON-LD it would ship, and asserts it matches the shared module's
// fallback model. If the SEO model, prerender wiring, or reviews.ts diverges,
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
  it('merges review schema into the canonical property node', async () => {
    const { head } = await render('/reviews');

    const jsonLdBlocks = extractJsonLd(head);
    expect(jsonLdBlocks).toHaveLength(1);
    expect(Array.isArray(jsonLdBlocks[0]['@graph'])).toBe(true);

    const expected = reviewsJsonLd(buildReviewsPageModel(undefined));
    const graph = jsonLdBlocks[0]['@graph'] as Record<string, unknown>[];
    const property = graph.find((node) => node['@id'] === 'https://www.rentatexhibit.com#apartmentcomplex');
    expect(property).toBeTruthy();
    expect(property).toMatchObject(expected);
  });

  it('declares the reviewed property only once', async () => {
    const { head } = await render('/reviews');
    const [baseGraph] = extractJsonLd(head);
    const graph = baseGraph['@graph'] as Record<string, unknown>[];

    const propertyNodes = graph.filter(
      (node) => node['@id'] === 'https://www.rentatexhibit.com#apartmentcomplex',
    );
    expect(propertyNodes).toHaveLength(1);
    expect(propertyNodes[0]).toHaveProperty('aggregateRating');
    expect(propertyNodes[0]).toHaveProperty('review');
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
