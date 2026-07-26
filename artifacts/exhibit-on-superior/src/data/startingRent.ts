// Dynamic "starting at" pricing derived from the baked availability snapshot —
// the SAME pipeline the Available Units page renders from, so the number the
// homepage FAQ states can never go stale relative to the listings. When the
// snapshot is missing, malformed, or too old (getBakedAvailability returns
// null), callers fall back to wording without a number rather than risk
// publishing a wrong price.
import { getBakedAvailability } from './availabilitySnapshot';

export interface StartingRent {
  /** Lowest current asking rent across available units, in whole dollars. */
  rent: number;
  /** Formatted dollar figure, e.g. "$2,271". */
  formatted: string;
  /** Human floor-plan label for the cheapest unit, e.g. "studio/convertible". */
  planLabel: string;
}

/** Bedroom count → renter-facing floor-plan label. */
function planLabelFor(bedrooms: number | null): string {
  switch (bedrooms) {
    case 0:
      return 'studio/convertible';
    case 1:
      return 'one-bedroom';
    case 2:
      return 'two-bedroom';
    case 3:
      return 'three-bedroom';
    default:
      return 'apartment';
  }
}

/**
 * Lowest current rent from the baked availability snapshot, or null when no
 * usable snapshot/pricing exists (callers must then omit the dollar figure).
 */
export function getStartingRent(now: number = Date.now()): StartingRent | null {
  const data = getBakedAvailability(now);
  if (!data) return null;
  let cheapest: { rent: number; bedrooms: number | null } | null = null;
  for (const u of data.units) {
    if (typeof u.rent !== 'number' || !Number.isFinite(u.rent) || u.rent <= 0) continue;
    if (!cheapest || u.rent < cheapest.rent) cheapest = { rent: u.rent, bedrooms: u.bedrooms };
  }
  if (!cheapest) return null;
  return {
    rent: cheapest.rent,
    formatted: `$${cheapest.rent.toLocaleString('en-US')}`,
    planLabel: planLabelFor(cheapest.bedrooms),
  };
}

/**
 * Shared "starting at" sentence used verbatim by both the homepage FAQ and the
 * how-much-is-rent knowledge article, so the fact-drift guard
 * (faq-knowledge-alignment.test.ts) always sees the same dollar token on both
 * surfaces. Null when no usable price exists.
 */
export function startingRentSentence(): string | null {
  const s = getStartingRent();
  if (!s) return null;
  return `Apartments currently start at ${s.formatted} per month for a ${s.planLabel} residence.`;
}
