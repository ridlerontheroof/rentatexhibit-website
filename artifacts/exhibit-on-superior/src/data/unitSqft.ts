// Single source of truth for a unit's displayed square footage.
//
// Two first-party numbers exist for every unit: the AppFolio feed's sqft and
// the approved floor-plan database (data/floorPlans.ts, from the plan book).
// When they conflict, the floor-plan database wins — the plan book is the
// architect-approved unit map, while AppFolio records are hand-entered and
// occasionally wrong (e.g. Apartment 2705 was entered as 478 SF when line 05
// on floors 6–29 is 450 SF). Showing two contradictory numbers on one page
// (visible text vs FloorPlan JSON-LD) erodes trust with visitors, Google, and
// AI answer engines alike.
//
// Every surface that renders a unit's sqft (unit card, detail page, meta
// description, Apartment JSON-LD; the markdown twin derives from the rendered
// page) must go through resolveUnitSqft so they can never disagree.
import { parseUnitNumber, plans, type Plan } from './floorPlans';

/**
 * AppFolio records already known to disagree with the floor-plan database,
 * keyed by unit number → the (wrong) feed value. Entries here silence the
 * consistency test in unitSqft.test.ts while the leasing team corrects the
 * record in AppFolio. The floor-plan value is still what renders.
 */
export const KNOWN_BAD_APPFOLIO_SQFT: Record<string, number> = {
  // Line 10, floors 6–29 = 478 SF per the approved unit map; AppFolio began
  // reporting 450 on 2026-07-26 (possibly the 2705 correction applied to the
  // wrong unit). Flagged to the leasing team for correction in AppFolio.
  '0610': 450,
};

/**
 * The floor-plan variant a specific apartment number is built from: matching
 * unit line with the unit's floor inside the variant's floor range. Accepts
 * "FFUU" ("0606") and the mezzanine form ("04M02").
 */
export function planForUnitNumber(unitNumber: string): Plan | null {
  const parsed = parseUnitNumber(unitNumber);
  if (!parsed) return null;
  return plans.find((p) => p.unit === parsed.line && p.floors.includes(parsed.floor)) ?? null;
}

/**
 * The square footage to display for a unit, everywhere.
 *
 * Authority rule:
 * - No matching floor plan (unmapped unit): trust the feed.
 * - Plan prints a single figure: that figure wins; a conflicting feed value is
 *   ignored (and logged in dev builds).
 * - Plan prints a range (e.g. line 06 "769–776 SF"): a feed value inside the
 *   range is the per-floor truth and wins; outside it, fall back to the
 *   range's lower bound.
 * - Feed has no value: the plan's lower bound (existing fallback behavior).
 */
export function resolveUnitSqft(u: { unit: string; sqft: number | null }): number | null {
  const plan = planForUnitNumber(u.unit);
  if (!plan) return u.sqft;
  if (u.sqft === null) return plan.sqftMin;
  const isRange = plan.sqftMin !== plan.sqft;
  if (isRange) {
    if (u.sqft >= plan.sqftMin && u.sqft <= plan.sqft) return u.sqft;
    warnMismatch(u.unit, u.sqft, `${plan.sqftMin}–${plan.sqft}`);
    return plan.sqftMin;
  }
  if (u.sqft !== plan.sqft) {
    warnMismatch(u.unit, u.sqft, String(plan.sqft));
    return plan.sqft;
  }
  return u.sqft;
}

function warnMismatch(unit: string, feed: number, plan: string): void {
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    console.warn(
      `[unitSqft] Apartment ${unit}: AppFolio reports ${feed} sq ft but the floor-plan database says ${plan} sq ft — using the floor plan. Ask the leasing team to correct the AppFolio record.`,
    );
  }
}
