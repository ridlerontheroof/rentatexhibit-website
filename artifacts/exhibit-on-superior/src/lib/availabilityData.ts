// Availability data shapes + feed-typo normalization, extracted from
// hooks/use-availability.ts so pure data modules (availabilitySnapshot,
// startingRent → seo) can use them without importing the React hook file —
// tests mock the hook module and would otherwise have to re-export these.

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

/**
 * Known misspellings in the AppFolio amenity feed → corrected label. The
 * api-server normalizes these at fetch time too, but the correction is
 * repeated here so data from an older server build (or an old baked snapshot)
 * can never render the typo.
 */
export function fixAmenitySpelling(item: string): string {
  return item.replace(/\bDiswasher\b/gi, 'Dishwasher');
}

/** Correct known feed typos across every unit's detail sections. */
export function normalizeAvailability(data: AvailabilityData): AvailabilityData {
  return {
    ...data,
    units: data.units.map((u) => ({
      ...u,
      details: u.details.map((s) => ({ ...s, items: s.items.map(fixAmenitySpelling) })),
    })),
  };
}
