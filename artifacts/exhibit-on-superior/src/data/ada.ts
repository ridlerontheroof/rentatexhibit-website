// ADA accessibility designations for Exhibit On Superior apartments.
//
// Source of truth: the building's as-built accessibility matrix (provided by
// the leasing team). Each entry maps an apartment number to its designation.
// Keys use the AppFolio unit format: 4-digit "FFUU" ("0403") for regular
// floors, or "04M" + two-digit line ("04M02") for the 4M mezzanine level.
// Designations:
//   - 'A'  — Type A accessible/adaptable residence.
//   - 'AC' — Type A unit with conduit line, per the as-built matrix.
//
// IMPORTANT: designations only. Installed accessibility components vary by
// unit and are NOT claimed anywhere on the site — every surface that shows a
// designation must also show ADA_KEY + ADA_DISCLAIMER below.

export type AdaDesignation = 'A' | 'AC';

/** Apartment number (AppFolio format, e.g. "0403" or "04M02") → designation, from the as-built matrix. */
export const ADA_UNITS: Record<string, AdaDesignation> = {
  // Floor 34
  '3406': 'AC',
  // Floor 33
  '3301': 'AC', '3303': 'A', '3304': 'AC',
  // Floor 32
  '3203': 'AC', '3206': 'A',
  // Floor 31
  '3101': 'A', '3102': 'AC',
  // Floor 30
  '3001': 'AC', '3007': 'A',
  // Floor 29
  '2901': 'A', '2908': 'A', '2910': 'A',
  // Floor 28
  '2805': 'A', '2809': 'AC',
  // Floor 27
  '2704': 'AC', '2705': 'AC',
  // Floor 26
  '2601': 'A', '2603': 'A', '2608': 'AC', '2610': 'A',
  // Floor 25
  '2505': 'A',
  // Floor 24
  '2403': 'AC', '2406': 'AC',
  // Floor 23
  '2304': 'A', '2308': 'A', '2310': 'AC',
  // Floor 22
  '2201': 'AC', '2209': 'A',
  // Floor 21
  '2105': 'AC', '2108': 'AC',
  // Floor 20
  '2010': 'A',
  // Floor 19
  '1908': 'A',
  // Floor 18
  '1803': 'A', '1806': 'A',
  // Floor 17
  '1701': 'A', '1704': 'AC', '1710': 'AC',
  // Floor 15
  '1505': 'A', '1509': 'AC',
  // Floor 14
  '1408': 'A',
  // Floor 12
  '1201': 'A', '1203': 'A',
  // Floor 11
  '1108': 'AC', '1110': 'AC',
  // Floor 10
  '1004': 'A', '1005': 'A', '1006': 'A',
  // Floor 9
  '0908': 'A',
  // Floor 8
  '0801': 'A', '0805': 'AC',
  // Floor 7
  '0708': 'A', '0709': 'AC',
  // Floor 6
  '0603': 'AC', '0604': 'A', '0608': 'AC', '0610': 'A',
  // Floor 4
  '0403': 'A',
  // Floor 3
  '0301': 'AC', '0303': 'AC',
  // Floor 2
  '0206': 'AC', '0210': 'A',
};

/** Designation counts, derived from the registry (never hand-maintained). */
export const ADA_COUNTS = (() => {
  let a = 0;
  let ac = 0;
  for (const d of Object.values(ADA_UNITS)) d === 'A' ? a++ : ac++;
  return { a, ac, total: a + ac };
})();

/** The designation for an apartment number, or null when not designated. */
export function adaDesignation(unitNumber: string): AdaDesignation | null {
  return ADA_UNITS[unitNumber] ?? null;
}

export function isAdaUnit(unitNumber: string): boolean {
  return unitNumber in ADA_UNITS;
}

/** Short badge label shown next to a designated unit, e.g. "(AC)". */
export function adaBadge(designation: AdaDesignation): string {
  return `(${designation})`;
}

/** Human-readable designation label used in copy and structured data. */
export function adaDesignationLabel(designation: AdaDesignation): string {
  return designation === 'AC'
    ? 'Type A accessible/adaptable residence with conduit line (AC)'
    : 'Type A accessible/adaptable residence (A)';
}

/**
 * Designation key — must appear wherever designations are shown, together
 * with ADA_DISCLAIMER.
 */
export const ADA_KEY: { code: AdaDesignation; label: string; description: string }[] = [
  {
    code: 'A',
    label: '(A)',
    description:
      'Type A accessible/adaptable residence. Features and installed accessibility components may vary.',
  },
  {
    code: 'AC',
    label: '(AC)',
    description: 'Type A unit with conduit line, per as-built accessibility matrix.',
  },
];

export const ADA_DISCLAIMER =
  "Contact leasing to verify the apartment's current configuration and discuss specific accessibility needs.";

/**
 * Designated apartment numbers within a list of unit numbers (used per plan
 * or plan group), in ascending order.
 */
export function adaUnitsAmong(unitNumbers: string[]): { unit: string; designation: AdaDesignation }[] {
  return unitNumbers
    .filter((n) => n in ADA_UNITS)
    .sort()
    .map((n) => ({ unit: n, designation: ADA_UNITS[n] }));
}

/** Free-text query terms that should activate ADA matching in plan search. */
const ADA_QUERY_TERMS = ['ada', 'accessible', 'accessibility', 'type a', 'type-a', 'adaptable', 'wheelchair'];

export function isAdaQuery(query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  return ADA_QUERY_TERMS.some((t) => q.includes(t));
}
