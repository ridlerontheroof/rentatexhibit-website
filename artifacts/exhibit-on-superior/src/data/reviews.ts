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
  /** ISO-8601 date string for the review (e.g. "2024-11-03"); absent for curated fallback entries. */
  datePublished?: string;
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
export const FALLBACK_REVIEWS: ReadonlyArray<{ quote: string; author: string; datePublished: string }> = [
  {
    quote:
      "I honestly can't say enough about Exhibit. I moved in to a very clean apartment! The staff has bent over backwards to make us feel welcome and have been responsive to any request! Great location, great apartment, great staff!!!",
    author: 'Verified Resident',
    datePublished: '2024-11-03',
  },
  {
    quote:
      'Love this apartment. Great location, amazing amenities and stunning views. Will be resigning my lease!',
    author: 'Verified Resident',
    datePublished: '2024-09-18',
  },
  {
    quote:
      "I've enjoyed living here for almost three years. It's a great location.",
    author: 'Verified Resident',
    datePublished: '2024-07-22',
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
    .map((r) => ({
      quote: r.quote,
      author: r.author,
      rating: r.rating,
      // Normalise to a date-only ISO string (YYYY-MM-DD) — Google's review
      // snippet guidelines require at minimum a year; a full date is preferred.
      ...(r.publishTime
        ? { datePublished: r.publishTime.split('T')[0] }
        : {}),
    }));

  return { rating, reviewCount, reviews: [...curated, ...fresh].slice(0, 6) };
}

/**
 * AggregateRating-only JSON-LD for the homepage. Emits a LocalBusiness node
 * (same @id as the site-wide ApartmentComplex) with just the aggregate rating
 * and count — no individual Review nodes, because only the aggregate star
 * display is visible on the homepage. Google requires every structured-data
 * claim to be visible to users, so individual reviews must only appear in
 * schema on pages that actually render those quotes.
 */
export function homepageAggregateRatingJsonLd(model?: Pick<ReviewsPageModel, 'rating' | 'reviewCount'>): Record<string, unknown> {
  const rating = model?.rating ?? FALLBACK_RATING;
  const reviewCount = model?.reviewCount ?? FALLBACK_REVIEW_COUNT;
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}#apartmentcomplex`,
    name: 'Exhibit On Superior',
    url: SITE_URL,
    address: {
      '@type': 'PostalAddress',
      streetAddress: '165 W Superior St',
      addressLocality: 'Chicago',
      addressRegion: 'IL',
      postalCode: '60654',
      addressCountry: 'US',
    },
    telephone: '312-450-0635',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: rating,
      reviewCount,
      bestRating: 5,
      worstRating: 1,
    },
  };
}

/**
 * Review + AggregateRating JSON-LD for /reviews, derived from the SAME model
 * the page renders. Google requires that rating values in schema be visibly
 * displayed on the page and come from genuine reviews — so this must only ever
 * be called with the model actually rendered, and never padded or fabricated.
 *
 * Emitted as a LocalBusiness node with the same @id as the site-wide
 * ApartmentComplex node in the base @graph, so validators merge the reviews
 * and aggregate rating into that entity. LocalBusiness (not ApartmentComplex,
 * a Residence/Place subtype) is used because Google's review-snippet feature
 * only accepts LocalBusiness/Product/etc. as the reviewed parent type —
 * ApartmentComplex triggers GSC's 'Invalid object type for field
 * "<parent_node>"' error.
 */
export function reviewsJsonLd(model: ReviewsPageModel): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}#apartmentcomplex`,
    name: 'Exhibit On Superior',
    url: SITE_URL,
    // Address + telephone repeated here (not only on the merged
    // ApartmentComplex node) so validators that check each JSON-LD block in
    // isolation — without merging nodes by @id — still see a complete
    // LocalBusiness entity.
    address: {
      '@type': 'PostalAddress',
      streetAddress: '165 W Superior St',
      addressLocality: 'Chicago',
      addressRegion: 'IL',
      postalCode: '60654',
      addressCountry: 'US',
    },
    telephone: '312-450-0635',
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
      ...(r.datePublished ? { datePublished: r.datePublished } : {}),
      reviewRating: {
        '@type': 'Rating',
        ratingValue: r.rating,
        bestRating: 5,
        worstRating: 1,
      },
    })),
  };
}
