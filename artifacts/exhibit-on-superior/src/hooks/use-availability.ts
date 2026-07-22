import { useQuery } from '@tanstack/react-query';

export interface AvailableUnit {
  /** Apartment number, e.g. "0606" (pad2 floor + pad2 unit line). */
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
}

export interface DetailSection {
  title: string;
  items: string[];
}

export interface AvailabilityData {
  units: AvailableUnit[];
  updatedAt: string;
}

const fetchAvailability = async (): Promise<AvailabilityData> => {
  const response = await fetch(`${import.meta.env.BASE_URL}api/availability`);
  if (!response.ok) {
    throw new Error('Availability feed unavailable');
  }
  return response.json();
};

/**
 * Live available units from AppFolio (proxied through the API server so
 * credentials stay server-side). Callers should hide live-availability UI
 * when this errors or is loading — the site remains fully useful without it.
 */
export const useAvailability = () =>
  useQuery({
    queryKey: ['availability'],
    queryFn: fetchAvailability,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
