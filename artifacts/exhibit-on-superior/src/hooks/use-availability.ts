import { useQuery } from '@tanstack/react-query';
import { getBakedAvailability } from '../data/availabilitySnapshot';

export interface AvailableUnit {
  /** Apartment number in AppFolio format: "0606" (pad2 floor + pad2 line) or "04M02" (4M mezzanine). */
  unit: string;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  rent: number | null;
  /** ISO date (YYYY-MM-DD) the unit becomes available, or null when now/unknown. */
  availableOn: string | null;
  /** Cover photo from the public AppFolio listing, when the unit is posted. */
  photoUrl: string | null;
  /** Public AppFolio listing page with the full photo gallery, when posted. */
  listingUrl: string | null;
  /** YouTube video tour URL, when the leasing team has added one. */
  videoUrl: string | null;
  /** Full listing photo gallery (ordered), when the unit is posted. */
  photos: string[];
  /** Listing info sections (Rental Terms, Pet Policy, Amenities, …). */
  details: DetailSection[];
  /** Listing headline from the public detail page, when posted. */
  marketingTitle: string | null;
  /** Listing description from the public detail page, when posted. */
  description: string | null;
}

export interface DetailSection {
  title: string;
  items: string[];
}

export interface AvailabilityData {
  units: AvailableUnit[];
  updatedAt: string;
}

declare global {
  interface Window {
    /**
     * Early availability fetch kicked off from an inline <script> in the HTML
     * head (see index.html), so the network round-trip overlaps with the JS
     * chunks downloading instead of waiting for them. Consumed at most once.
     */
    __availabilityPrefetch?: Promise<Response>;
  }
}

const parseResponse = async (response: Response): Promise<AvailabilityData> => {
  if (!response.ok) {
    throw new Error('Availability feed unavailable');
  }
  return response.json();
};

const fetchAvailability = async (): Promise<AvailabilityData> => {
  // Reuse the head-started request when it's available and succeeded;
  // otherwise (no prefetch, or it failed at the network level) fetch normally.
  const prefetch = typeof window !== 'undefined' ? window.__availabilityPrefetch : undefined;
  if (prefetch) {
    delete window.__availabilityPrefetch;
    try {
      return await parseResponse(await prefetch);
    } catch {
      // Fall through to a regular fetch — the prefetch may have raced a
      // flaky connection; the query's own retry policy governs from here.
    }
  }
  return parseResponse(await fetch(`${import.meta.env.BASE_URL}api/availability`));
};

/**
 * Live available units from AppFolio (proxied through the API server so
 * credentials stay server-side).
 *
 * Until the live response lands, `data` is served from the build-time
 * snapshot (placeholderData) when one fresh enough exists — so unit cards
 * paint immediately and are then silently replaced by live data. Callers
 * should hide live-availability UI on error — the site remains fully useful
 * without it. `isPlaceholderData` distinguishes the baked snapshot from a
 * confirmed live payload.
 */
export const useAvailability = () => {
  const query = useQuery({
    queryKey: ['availability'],
    queryFn: fetchAvailability,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    placeholderData: () => getBakedAvailability() ?? undefined,
  });
  // When the live fetch errors, TanStack Query drops placeholderData — which
  // would collapse the prerendered units section (a ~1,100px layout shift).
  // Fall back to the baked snapshot while it's still fresh (48h gate inside
  // getBakedAvailability); with no fresh snapshot the section hides as before.
  const data = query.data ?? (query.isError ? getBakedAvailability() ?? undefined : undefined);
  return { ...query, data };
};
