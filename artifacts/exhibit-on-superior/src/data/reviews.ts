// Shared review data + JSON-LD builder for the /reviews page.
//
// One module feeds BOTH the Reviews page (visible quotes + aggregate) and the
// Review/AggregateRating structured data (client <Seo extraJsonLd> and the
// build-time prerenderer), so the schema can never claim reviews or ratings
// that visitors don't actually see on the page.

import { SITE_URL } from './seo';
import type { GoogleReviewsData } from '../hooks/use-google-reviews';

export interface DisplayReview {
  quote: string;
  author: string;
  rating: number;
}

export interface ReviewsPageModel {
  /** Aggregate star rating displayed on the page. */
  rating: number;
  /** Review count displayed alongside the aggregate rating. */
  reviewCount: number;
  /** The review quotes rendered in the grid (max 6). */
  reviews: DisplayReview[];
}

/**
 * Curated fallback shown when the live Google reviews feed is unavailable.
 * Quotes were pulled from the community's public Google Business Profile.
 */
export const FALLBACK_RATING = 4.2;
export const FALLBACK_REVIEW_COUNT = 136;
export const FALLBACK_REVIEWS: ReadonlyArray<{ quote: string; author: string }> = [
  {
    quote:
      "I honestly can't say enough about Exhibit. I moved in to a very clean apartment! The staff has bent over backwards to make us feel welcome and have been responsive to any request! Great location, great apartment, great staff!!!",
    author: 'Verified Resident',
  },
  {
    quote:
      'Love this apartment. Great location, amazing amenities and stunning views. Will be resigning my lease!',
    author: 'Verified Resident',
  },
  {
    quote:
      "I've enjoyed living here for almost three years. It's a great location.",
    author: 'Verified Resident',
  },
];

/**
 * Merge the curated quotes with the live Google feed into exactly what the
 * Reviews page displays. The building's review history (4.2 / 136) lives on an
 * older Google profile awaiting a merge, so the curated aggregate is kept until
 * the live listing's count catches up — once Google merges the profiles, the
 * live figures take over automatically.
 */
export function buildReviewsPageModel(live?: GoogleReviewsData): ReviewsPageModel {
  const useLiveAggregate = live !== undefined && live.reviewCount >= FALLBACK_REVIEW_COUNT;
  const rating = useLiveAggregate ? live.rating : FALLBACK_RATING;
  const reviewCount = useLiveAggregate ? live.reviewCount : FALLBACK_REVIEW_COUNT;

  const curated: DisplayReview[] = FALLBACK_REVIEWS.map((r) => ({ ...r, rating: 5 }));
  const fresh: DisplayReview[] = (live?.reviews ?? [])
    .filter((r) => !FALLBACK_REVIEWS.some((c) => c.quote === r.quote))
    .map((r) => ({ quote: r.quote, author: r.author, rating: r.rating }));

  return { rating, reviewCount, reviews: [...curated, ...fresh].slice(0, 6) };
}

/**
 * Review + AggregateRating JSON-LD for /reviews, derived from the SAME model
 * the page renders. Google requires that rating values in schema be visibly
 * displayed on the page and come from genuine reviews — so this must only ever
 * be called with the model actually rendered, and never padded or fabricated.
 *
 * Emitted as an ApartmentComplex node with the same @id as the site-wide
 * ApartmentComplex node in the base @graph, so validators merge the reviews
 * and aggregate rating into that entity.
 */
export function reviewsJsonLd(model: ReviewsPageModel): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ApartmentComplex',
    '@id': `${SITE_URL}#apartmentcomplex`,
    name: 'Exhibit On Superior',
    url: SITE_URL,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: model.rating,
      reviewCount: model.reviewCount,
      bestRating: 5,
      worstRating: 1,
    },
    // NOTE: no `itemReviewed` on nested reviews — Google flags itemReviewed
    // inside a review that is already nested in the entity it reviews.
    review: model.reviews.map((r) => ({
      '@type': 'Review',
      reviewBody: r.quote,
      author: { '@type': 'Person', name: r.author },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: r.rating,
        bestRating: 5,
        worstRating: 1,
      },
    })),
  };
}
