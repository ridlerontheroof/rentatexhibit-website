/**
 * The dedicated "Tour" unit — a non-rentable AppFolio unit at the property
 * used ONLY to book showings for prospects who don't pick a specific
 * apartment (the /schedule-a-tour "No specific apartment" path).
 *
 * Config only — no imports — so both the availability feed (lib/appfolio.ts)
 * and the showings routes can use it without a dependency cycle.
 *
 * Rules this file encodes:
 *  - The unit was created as "General Tour" and later renamed "Tour"; feeds
 *    can lag a rename, so BOTH names match. A future rename is a one-line
 *    change here (or the TOUR_UNIT_NAMES env override, comma-separated).
 *  - The tour unit must NEVER appear anywhere public (availability feed,
 *    baked snapshot, sitemap, structured data). isTourUnitName() is the
 *    single feed-boundary filter.
 *  - The web app requests its scheduler slots with the reserved token
 *    "TOUR" — never a real apartment number (those are digits / "04M02"
 *    style, so no collision is possible).
 */

const DEFAULT_TOUR_UNIT_NAMES = ["Tour", "General Tour"];

/** AppFolio unit names that identify the dedicated tour unit. */
export const TOUR_UNIT_NAMES: string[] = (() => {
  const env = process.env.TOUR_UNIT_NAMES;
  if (!env) return DEFAULT_TOUR_UNIT_NAMES;
  const names = env.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
  return names.length > 0 ? names : DEFAULT_TOUR_UNIT_NAMES;
})();

/** Reserved unit token the web app sends for a no-specific-apartment tour. */
export const TOUR_UNIT_REQUEST = "TOUR";

/** True when an AppFolio unit name is the dedicated tour unit. */
export function isTourUnitName(unit: string): boolean {
  const u = unit.trim().toLowerCase();
  return TOUR_UNIT_NAMES.some((n) => n.toLowerCase() === u);
}

/**
 * True when a showings-API `unit` value asks for the tour unit: the reserved
 * "TOUR" token or the configured unit names (case-insensitive).
 */
export function isTourUnitRequest(unit: string): boolean {
  const u = unit.trim().toLowerCase();
  return u === TOUR_UNIT_REQUEST.toLowerCase() || isTourUnitName(unit);
}
