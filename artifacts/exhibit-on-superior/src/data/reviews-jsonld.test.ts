import { describe, expect, it } from 'vitest';
import {
  buildReviewsPageModel,
  reviewsJsonLd,
  FALLBACK_RATING,
  FALLBACK_REVIEW_COUNT,
  FALLBACK_REVIEWS,
} from './reviews';

// Guards the Reviews page's structured data: the Review/AggregateRating
// JSON-LD must mirror EXACTLY what the page renders when live Google reviews
// are merged in. Google penalizes schema that claims ratings or reviews not
// visible on the page, so the JSON-LD may never include quotes dropped by the
// 6-card cap or the duplicate filter, and its aggregate must match the
// displayed one.

interface JsonLdReview {
  '@type': string;
  reviewBody: string;
  author: { '@type': string; name: string };
  reviewRating: {
    '@type': string;
    ratingValue: number;
    bestRating: number;
    worstRating: number;
  };
}

function liveData(overrides?: Partial<{ rating: number; reviewCount: number }>) {
  return {
    rating: overrides?.rating ?? 4.7,
    reviewCount: overrides?.reviewCount ?? 150,
    reviews: [
      // Exact duplicate of a curated quote — filtered from page AND schema.
      {
        quote: FALLBACK_REVIEWS[1].quote,
        author: 'Duplicate Resident',
        rating: 5,
      },
      { quote: 'Fresh quote one', author: 'Live Resident 1', rating: 5 },
      { quote: 'Fresh quote two', author: 'Live Resident 2', rating: 4 },
      { quote: 'Fresh quote three', author: 'Live Resident 3', rating: 5 },
      // 7th candidate counting the three curated — dropped by the 6-card cap.
      { quote: 'Fresh quote four', author: 'Live Resident 4', rating: 3 },
    ],
  };
}

describe('reviewsJsonLd stays in lockstep with the rendered model', () => {
  it('mirrors the model exactly: aggregate rating/count and one Review node per displayed quote', () => {
    const model = buildReviewsPageModel(liveData());
    const jsonLd = reviewsJsonLd(model);

    const agg = jsonLd.aggregateRating as Record<string, unknown>;
    expect(agg.ratingValue).toBe(model.rating);
    expect(agg.reviewCount).toBe(model.reviewCount);
    expect(agg.ratingValue).toBe(4.7);
    expect(agg.reviewCount).toBe(150);

    const reviews = jsonLd.review as JsonLdReview[];
    expect(reviews).toHaveLength(model.reviews.length);
    model.reviews.forEach((displayed, i) => {
      expect(reviews[i].reviewBody).toBe(displayed.quote);
      expect(reviews[i].author.name).toBe(displayed.author);
      expect(reviews[i].reviewRating.ratingValue).toBe(displayed.rating);
    });
  });

  it('keeps the curated aggregate in the schema while the live count is below the curated one', () => {
    const model = buildReviewsPageModel(liveData({ rating: 4.9, reviewCount: 42 }));
    const jsonLd = reviewsJsonLd(model);

    const agg = jsonLd.aggregateRating as Record<string, unknown>;
    // Page shows the curated 4.2 / 136 — schema must match the page, not the feed.
    expect(agg.ratingValue).toBe(FALLBACK_RATING);
    expect(agg.reviewCount).toBe(FALLBACK_REVIEW_COUNT);
  });

  it('never includes quotes dropped by the 6-card cap or the duplicate filter', () => {
    const model = buildReviewsPageModel(liveData());
    const jsonLd = reviewsJsonLd(model);
    const reviews = jsonLd.review as JsonLdReview[];
    const bodies = reviews.map((r) => r.reviewBody);
    const authors = reviews.map((r) => r.author.name);

    // Cap: exactly 6 Review nodes, and the 7th candidate is absent.
    expect(reviews).toHaveLength(6);
    expect(bodies).not.toContain('Fresh quote four');
    expect(authors).not.toContain('Live Resident 4');

    // Duplicate filter: the duplicated curated quote appears once, attributed
    // to the curated author, never the live duplicate submitter.
    expect(
      bodies.filter((b) => b === FALLBACK_REVIEWS[1].quote),
    ).toHaveLength(1);
    expect(authors).not.toContain('Duplicate Resident');

    // No duplicates anywhere in the schema.
    expect(new Set(bodies).size).toBe(bodies.length);
  });

  it('emits the curated-only schema when there is no live data', () => {
    const model = buildReviewsPageModel(undefined);
    const jsonLd = reviewsJsonLd(model);

    const agg = jsonLd.aggregateRating as Record<string, unknown>;
    expect(agg.ratingValue).toBe(FALLBACK_RATING);
    expect(agg.reviewCount).toBe(FALLBACK_REVIEW_COUNT);

    const reviews = jsonLd.review as JsonLdReview[];
    expect(reviews.map((r) => r.reviewBody)).toEqual(
      FALLBACK_REVIEWS.map((r) => r.quote),
    );
    // Curated quotes render as 5-star cards; schema must say the same.
    reviews.forEach((r) => expect(r.reviewRating.ratingValue).toBe(5));
  });
});
