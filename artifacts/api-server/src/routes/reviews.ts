import { Router, type IRouter } from "express";

const router: IRouter = Router();

/**
 * GET /reviews — live aggregate rating + top resident quotes from the
 * community's Google Business Profile, proxied server-side so the Places API
 * key never reaches the browser.
 *
 * Responses are cached in memory for six hours; if a refresh fails we keep
 * serving the last good snapshot rather than erroring. When no key is
 * configured (or nothing has ever been fetched) the endpoint returns 503 and
 * the web app falls back to its curated quotes.
 */

const PLACES_BASE = "https://places.googleapis.com/v1";
const SEARCH_QUERY = "Exhibit on Superior apartments Chicago";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const MIN_QUOTE_RATING = 4;
const MAX_QUOTES = 3;

export interface GoogleReviewQuote {
  quote: string;
  author: string;
  rating: number;
  relativeTime: string | null;
  /** ISO-8601 date string of the original review (e.g. "2024-11-03T14:22:00Z"). */
  publishTime: string | null;
}

export interface GoogleReviewsPayload {
  rating: number;
  reviewCount: number;
  reviews: GoogleReviewQuote[];
}

let cached: { payload: GoogleReviewsPayload; fetchedAt: number } | null = null;
let cachedPlaceId: string | null = null;
let inflight: Promise<GoogleReviewsPayload> | null = null;

async function resolvePlaceId(apiKey: string): Promise<string> {
  if (cachedPlaceId) return cachedPlaceId;

  const res = await fetch(`${PLACES_BASE}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id,places.displayName",
    },
    body: JSON.stringify({ textQuery: SEARCH_QUERY }),
  });
  if (!res.ok) {
    throw new Error(`Places searchText failed with status ${res.status}`);
  }
  const data = (await res.json()) as {
    places?: Array<{ id?: string }>;
  };
  const id = data.places?.[0]?.id;
  if (!id) {
    throw new Error("Places searchText returned no matching place");
  }
  cachedPlaceId = id;
  return id;
}

async function fetchReviews(apiKey: string): Promise<GoogleReviewsPayload> {
  const placeId = await resolvePlaceId(apiKey);

  const res = await fetch(`${PLACES_BASE}/places/${placeId}`, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "rating,userRatingCount,reviews",
    },
  });
  if (!res.ok) {
    // A stale cached place id could 404 if the listing changes; drop it so
    // the next refresh re-resolves instead of failing forever.
    if (res.status === 404) cachedPlaceId = null;
    throw new Error(`Place details failed with status ${res.status}`);
  }

  const data = (await res.json()) as {
    rating?: number;
    userRatingCount?: number;
    reviews?: Array<{
      rating?: number;
      publishTime?: string;
      relativePublishTimeDescription?: string;
      text?: { text?: string };
      authorAttribution?: { displayName?: string };
    }>;
  };

  if (typeof data.rating !== "number" || typeof data.userRatingCount !== "number") {
    throw new Error("Place details response missing rating fields");
  }

  const reviews: GoogleReviewQuote[] = (data.reviews ?? [])
    .filter(
      (r) =>
        typeof r.rating === "number" &&
        r.rating >= MIN_QUOTE_RATING &&
        typeof r.text?.text === "string" &&
        r.text.text.trim().length > 0,
    )
    .slice(0, MAX_QUOTES)
    .map((r) => ({
      quote: r.text!.text!.trim(),
      author: r.authorAttribution?.displayName?.trim() || "Verified Resident",
      rating: r.rating!,
      relativeTime: r.relativePublishTimeDescription ?? null,
      publishTime: r.publishTime ?? null,
    }));

  return {
    rating: data.rating,
    reviewCount: data.userRatingCount,
    reviews,
  };
}

router.get("/reviews", async (req, res) => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  const fresh = cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS;
  if (cached && (fresh || !apiKey)) {
    res.json(cached.payload);
    return;
  }

  if (!apiKey) {
    res.status(503).json({ error: "Google reviews are not configured" });
    return;
  }

  try {
    // Coalesce concurrent refreshes into a single upstream request.
    inflight ??= fetchReviews(apiKey).finally(() => {
      inflight = null;
    });
    const payload = await inflight;
    cached = { payload, fetchedAt: Date.now() };
    res.json(payload);
  } catch (err) {
    req.log.error({ err }, "Failed to refresh Google reviews");
    if (cached) {
      // Serve the last good snapshot instead of failing the page.
      res.json(cached.payload);
      return;
    }
    res.status(503).json({ error: "Google reviews are temporarily unavailable" });
  }
});

export default router;
