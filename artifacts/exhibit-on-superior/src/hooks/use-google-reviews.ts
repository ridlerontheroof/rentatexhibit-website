import { useQuery } from '@tanstack/react-query';

export interface GoogleReviewQuote {
  quote: string;
  author: string;
  rating: number;
  relativeTime: string | null;
  /** ISO-8601 date string of the original review (e.g. "2024-11-03T14:22:00Z"). */
  publishTime: string | null;
}

export interface GoogleReviewsData {
  rating: number;
  reviewCount: number;
  reviews: GoogleReviewQuote[];
}

const fetchGoogleReviews = async (): Promise<GoogleReviewsData> => {
  const response = await fetch(`${import.meta.env.BASE_URL}api/reviews`);
  if (!response.ok) {
    throw new Error('Google reviews unavailable');
  }
  return response.json();
};

/**
 * Live aggregate rating + review quotes from the community's Google Business
 * Profile (proxied through the API server). Callers should fall back to
 * curated content when this errors or is loading.
 */
export const useGoogleReviews = () =>
  useQuery({
    queryKey: ['google-reviews'],
    queryFn: fetchGoogleReviews,
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });
