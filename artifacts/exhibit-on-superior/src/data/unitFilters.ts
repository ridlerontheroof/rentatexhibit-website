// Pure filtering logic for the Available Residences strip on /available-units.
//
// Client-side only: the live unit list (from useAvailability) is narrowed by
// move-in date, bedroom type, bathrooms, and square footage. No data-layer or
// server involvement — the default (empty) filter state passes every unit, so
// the prerendered page and markdown twins are unaffected.
//
// Kept as a pure module (no React, no hooks) so unit tests can run in the
// default node environment and other data modules can import it safely.
import { parseUnitNumber, planGroups, type PlanGroup } from './floorPlans';
import { resolveUnitSqft } from './unitSqft';

/** The subset of AvailableUnit fields the filters read. */
export interface FilterableUnit {
  unit: string;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  availableOn: string | null;
}

export type MoveInFilter =
  | { kind: 'any' }
  | { kind: 'now' }
  | { kind: 'days'; days: number }
  | { kind: 'date'; date: string }; // YYYY-MM-DD from an <input type="date">

export interface UnitFilterState {
  moveIn: MoveInFilter;
  /** Bedroom-type label ("Studio", "Convertible", "1 Bed", …) or null = all. */
  beds: string | null;
  /** Bathroom count (1, 1.5, 2, …) or null = all. */
  baths: number | null;
  /** Min/max square footage; null = unbounded on that side. */
  sqftMin: number | null;
  sqftMax: number | null;
}

export const DEFAULT_UNIT_FILTERS: UnitFilterState = {
  moveIn: { kind: 'any' },
  beds: null,
  baths: null,
  sqftMin: null,
  sqftMax: null,
};

export function hasActiveUnitFilters(state: UnitFilterState): boolean {
  return (
    state.moveIn.kind !== 'any' ||
    state.beds !== null ||
    state.baths !== null ||
    state.sqftMin !== null ||
    state.sqftMax !== null
  );
}

/** Floor-plan group for a unit number (same resolution rule as the unit rows). */
function groupFor(unitNumber: string): PlanGroup | null {
  const parsed = parseUnitNumber(unitNumber);
  if (!parsed) return null;
  const candidates = planGroups.filter((g) => g.unit === parsed.line);
  if (candidates.length === 0) return null;
  return candidates.find((g) => g.floors.includes(parsed.floor)) ?? candidates[0];
}

/**
 * The bedroom-type label a unit filters under — matches the visible label on
 * its row: 0-bedroom units take the floor-plan catalog's marketing type
 * (Studio / Convertible / …), everything else is "N Bed".
 */
export function unitBedsLabel(u: FilterableUnit): string | null {
  const group = groupFor(u.unit);
  const beds = u.bedrooms ?? group?.beds ?? null;
  if (beds === null) return null;
  if (beds === 0) return group && group.beds === 0 ? group.typeLabel : 'Studio';
  return `${beds} Bed`;
}

/** Bathroom count a unit filters under (feed first, plan group as fallback). */
export function unitBathsValue(u: FilterableUnit): number | null {
  return u.bathrooms ?? groupFor(u.unit)?.baths ?? null;
}

/** Move-in cutoff date (local, end-of-day granularity) or null for "any". */
export function moveInCutoff(filter: MoveInFilter, today: Date): Date | null {
  switch (filter.kind) {
    case 'any':
      return null;
    case 'now':
      return new Date(today.getFullYear(), today.getMonth(), today.getDate());
    case 'days': {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      d.setDate(d.getDate() + filter.days);
      return d;
    }
    case 'date': {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(filter.date.trim());
      if (!m) return null;
      return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    }
  }
}

/**
 * True when the unit is available on/before the cutoff. Units with no
 * availableOn (or an unparseable one) count as available now — the same rule
 * formatAvailable uses for the visible "Available now" label.
 */
function passesMoveIn(u: FilterableUnit, filter: MoveInFilter, today: Date): boolean {
  const cutoff = moveInCutoff(filter, today);
  if (!cutoff) return true;
  if (!u.availableOn) return true;
  const available = new Date(`${u.availableOn}T00:00:00`);
  if (Number.isNaN(available.getTime())) return true;
  // Compare at day granularity: available on the cutoff day still passes.
  return available.getTime() <= cutoff.getTime();
}

export function unitMatchesFilters(
  u: FilterableUnit,
  state: UnitFilterState,
  today: Date = new Date(),
): boolean {
  if (!passesMoveIn(u, state.moveIn, today)) return false;

  if (state.beds !== null && unitBedsLabel(u) !== state.beds) return false;

  if (state.baths !== null && unitBathsValue(u) !== state.baths) return false;

  if (state.sqftMin !== null || state.sqftMax !== null) {
    // Same authority rule as the visible number: floor-plan DB beats the feed.
    const sqft = resolveUnitSqft(u);
    if (sqft === null) return false;
    if (state.sqftMin !== null && sqft < state.sqftMin) return false;
    if (state.sqftMax !== null && sqft > state.sqftMax) return false;
  }

  return true;
}

export function filterUnits<T extends FilterableUnit>(
  units: T[],
  state: UnitFilterState,
  today: Date = new Date(),
): T[] {
  if (!hasActiveUnitFilters(state)) return units;
  return units.filter((u) => unitMatchesFilters(u, state, today));
}

/** Distinct bedroom-type labels present in the live list, smallest first. */
export function bedsOptions(units: FilterableUnit[]): string[] {
  const rank = (label: string) => {
    const n = /^(\d+) Bed$/.exec(label);
    return n ? Number(n[1]) : 0; // Studio/Convertible sort before "1 Bed"
  };
  const labels = new Set<string>();
  for (const u of units) {
    const label = unitBedsLabel(u);
    if (label) labels.add(label);
  }
  return [...labels].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}

/** Distinct bathroom counts present in the live list, ascending. */
export function bathsOptions(units: FilterableUnit[]): number[] {
  const values = new Set<number>();
  for (const u of units) {
    const v = unitBathsValue(u);
    if (v !== null) values.add(v);
  }
  return [...values].sort((a, b) => a - b);
}

/** Resolved-sqft bounds of the live list, or null when nothing has a sqft. */
export function sqftBounds(units: FilterableUnit[]): [number, number] | null {
  let min = Infinity;
  let max = -Infinity;
  for (const u of units) {
    const sqft = resolveUnitSqft(u);
    if (sqft === null) continue;
    if (sqft < min) min = sqft;
    if (sqft > max) max = sqft;
  }
  return min <= max ? [min, max] : null;
}
