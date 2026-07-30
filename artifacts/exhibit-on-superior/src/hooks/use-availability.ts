import { useQuery } from '@tanstack/react-query';
import { getBakedAvailability } from '../data/availabilitySnapshot';
import { normalizeAvailability, type AvailabilityData } from '../lib/availabilityData';

// Data shapes + typo normalization live in lib/availabilityData.ts (pure, no
// React) — re-exported here so existing imports keep working.
export {
  fixAmenitySpelling,
  normalizeAvailability,
  type AvailabilityData,
  type AvailableUnit,
  type DetailSection,
} from '../lib/availabilityData';

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
    // Drain the body before rejecting. An abandoned body keeps the request
    // "in flight" at the network layer, which holds the browser's
    // network-quiet signal open indefinitely (and, in lab tools like
    // Lighthouse, keeps the page observation window pinned at its maximum).
    response.body?.cancel().catch(() => {});
    throw new Error('Availability feed unavailable');
  }
  return normalizeAvailability(await response.json());
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
