// Filtering predicate for the Available Residences strip (see unitFilters.ts).
//
// Pins the boundary rules the UI relies on: the move-in cutoff is inclusive,
// 0-bedroom units filter under their floor-plan marketing label (Studio /
// Convertible), and square-footage bounds compare against the RESOLVED sqft
// (floor-plan DB beats the AppFolio feed) — not the raw feed value.
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_UNIT_FILTERS,
  bathsOptions,
  bedsOptions,
  filterUnits,
  hasActiveUnitFilters,
  readUnitFiltersFromParams,
  writeUnitFiltersToParams,
  sqftBounds,
  unitBedsLabel,
  unitMatchesFilters,
  type FilterableUnit,
  type UnitFilterState,
} from './unitFilters';

const TODAY = new Date(2026, 6, 30); // 2026-07-30

const unit = (over: Partial<FilterableUnit> & { unit: string }): FilterableUnit => ({
  bedrooms: 1,
  bathrooms: 1,
  sqft: null,
  availableOn: null,
  ...over,
});

const state = (over: Partial<UnitFilterState>): UnitFilterState => ({
  ...DEFAULT_UNIT_FILTERS,
  ...over,
});

describe('default state', () => {
  it('is inactive and passes every unit unchanged', () => {
    expect(hasActiveUnitFilters(DEFAULT_UNIT_FILTERS)).toBe(false);
    const units = [unit({ unit: '0606' }), unit({ unit: '2705', bedrooms: 0 })];
    // Same array identity — the default render is exactly today's full list.
    expect(filterUnits(units, DEFAULT_UNIT_FILTERS, TODAY)).toBe(units);
  });
});

describe('move-in date', () => {
  it('null availableOn always passes (already available)', () => {
    expect(unitMatchesFilters(unit({ unit: '0606' }), state({ moveIn: { kind: 'now' } }), TODAY)).toBe(true);
  });

  it('"now" passes units available on or before today, drops future ones', () => {
    const now = state({ moveIn: { kind: 'now' } });
    expect(unitMatchesFilters(unit({ unit: '0606', availableOn: '2026-07-30' }), now, TODAY)).toBe(true);
    expect(unitMatchesFilters(unit({ unit: '0606', availableOn: '2026-07-31' }), now, TODAY)).toBe(false);
  });

  it('"within N days" cutoff is inclusive on the boundary day', () => {
    const in30 = state({ moveIn: { kind: 'days', days: 30 } });
    expect(unitMatchesFilters(unit({ unit: '0606', availableOn: '2026-08-29' }), in30, TODAY)).toBe(true);
    expect(unitMatchesFilters(unit({ unit: '0606', availableOn: '2026-08-30' }), in30, TODAY)).toBe(false);
  });

  it('custom date cutoff is inclusive; malformed dates deactivate the filter', () => {
    const byDate = state({ moveIn: { kind: 'date', date: '2026-09-15' } });
    expect(unitMatchesFilters(unit({ unit: '0606', availableOn: '2026-09-15' }), byDate, TODAY)).toBe(true);
    expect(unitMatchesFilters(unit({ unit: '0606', availableOn: '2026-09-16' }), byDate, TODAY)).toBe(false);
    const bad = state({ moveIn: { kind: 'date', date: 'not-a-date' } });
    expect(unitMatchesFilters(unit({ unit: '0606', availableOn: '2099-01-01' }), bad, TODAY)).toBe(true);
  });

  it('unparseable availableOn counts as available now (matches the visible label rule)', () => {
    expect(
      unitMatchesFilters(unit({ unit: '0606', availableOn: 'garbage' }), state({ moveIn: { kind: 'now' } }), TODAY),
    ).toBe(true);
  });
});

describe('beds (type labels)', () => {
  it('labels 0-bedroom units with the floor-plan marketing type, not "0 Bed"', () => {
    // Line 05 is a Studio in the plan book; the label must say so.
    const label = unitBedsLabel(unit({ unit: '2705', bedrooms: 0 }));
    expect(label).not.toBe('0 Bed');
    expect(label).toMatch(/Studio|Convertible/);
  });

  it('unmapped 0-bedroom units fall back to "Studio"', () => {
    expect(unitBedsLabel(unit({ unit: '9999', bedrooms: 0 }))).toBe('Studio');
  });

  it('filters by the derived label', () => {
    const studio = unit({ unit: '2705', bedrooms: 0 });
    const oneBed = unit({ unit: '0606', bedrooms: 1 });
    const label = unitBedsLabel(studio)!;
    expect(unitMatchesFilters(studio, state({ beds: label }), TODAY)).toBe(true);
    expect(unitMatchesFilters(oneBed, state({ beds: label }), TODAY)).toBe(false);
    expect(unitMatchesFilters(oneBed, state({ beds: '1 Bed' }), TODAY)).toBe(true);
  });

  it('derives sorted distinct options from the units present', () => {
    const options = bedsOptions([
      unit({ unit: '0606', bedrooms: 2 }),
      unit({ unit: '0606', bedrooms: 1 }),
      unit({ unit: '2705', bedrooms: 0 }),
      unit({ unit: '0606', bedrooms: 1 }),
    ]);
    expect(options[options.length - 1]).toBe('2 Bed');
    expect(new Set(options).size).toBe(options.length);
    expect(options).toContain('1 Bed');
  });
});

describe('baths', () => {
  it('filters by count and derives ascending options', () => {
    const u15 = unit({ unit: '0606', bathrooms: 1.5 });
    expect(unitMatchesFilters(u15, state({ baths: 1.5 }), TODAY)).toBe(true);
    expect(unitMatchesFilters(u15, state({ baths: 2 }), TODAY)).toBe(false);
    expect(bathsOptions([unit({ unit: 'x', bathrooms: 2 }), u15, unit({ unit: 'y', bathrooms: 1 })])).toEqual([
      1, 1.5, 2,
    ]);
  });
});

describe('square footage (resolver-based)', () => {
  it('compares against the resolved sqft, not the raw feed value', () => {
    // Apartment 2705: feed says 478, floor-plan DB says 450 — 450 governs.
    const u = unit({ unit: '2705', bedrooms: 0, sqft: 478 });
    expect(unitMatchesFilters(u, state({ sqftMin: 460 }), TODAY)).toBe(false);
    expect(unitMatchesFilters(u, state({ sqftMin: 440, sqftMax: 460 }), TODAY)).toBe(true);
  });

  it('bounds are inclusive', () => {
    const u = unit({ unit: '9999', sqft: 512 });
    expect(unitMatchesFilters(u, state({ sqftMin: 512, sqftMax: 512 }), TODAY)).toBe(true);
    expect(unitMatchesFilters(u, state({ sqftMax: 511 }), TODAY)).toBe(false);
  });

  it('units with no resolvable sqft drop out when a sqft bound is active', () => {
    expect(unitMatchesFilters(unit({ unit: '9999', sqft: null }), state({ sqftMin: 400 }), TODAY)).toBe(false);
  });

  it('sqftBounds uses resolved values and ignores unresolvable units', () => {
    expect(sqftBounds([unit({ unit: '2705', sqft: 478 }), unit({ unit: '9999', sqft: 1200 })])).toEqual([450, 1200]);
    expect(sqftBounds([unit({ unit: '9999', sqft: null })])).toBeNull();
  });
});

describe('URL round-trip (shareable filtered views)', () => {
  const roundTrip = (s: UnitFilterState): UnitFilterState => {
    const params = new URLSearchParams();
    writeUnitFiltersToParams(s, params);
    return readUnitFiltersFromParams(params.toString());
  };

  it('defaults write no params and read back as defaults', () => {
    const params = new URLSearchParams();
    writeUnitFiltersToParams(DEFAULT_UNIT_FILTERS, params);
    expect(params.toString()).toBe('');
    expect(readUnitFiltersFromParams('')).toEqual(DEFAULT_UNIT_FILTERS);
  });

  it('round-trips every filter kind', () => {
    expect(roundTrip(state({ moveIn: { kind: 'now' } }))).toEqual(state({ moveIn: { kind: 'now' } }));
    expect(roundTrip(state({ moveIn: { kind: 'days', days: 30 } }))).toEqual(
      state({ moveIn: { kind: 'days', days: 30 } }),
    );
    expect(roundTrip(state({ moveIn: { kind: 'date', date: '2026-09-01' } }))).toEqual(
      state({ moveIn: { kind: 'date', date: '2026-09-01' } }),
    );
    expect(roundTrip(state({ beds: 'Convertible', baths: 1.5, sqftMin: 500, sqftMax: 900 }))).toEqual(
      state({ beds: 'Convertible', baths: 1.5, sqftMin: 500, sqftMax: 900 }),
    );
    expect(roundTrip(state({ sqftMin: 500 }))).toEqual(state({ sqftMin: 500 }));
    expect(roundTrip(state({ sqftMax: 900 }))).toEqual(state({ sqftMax: 900 }));
  });

  it('an unfinished "By a date…" pick (empty date) is not written', () => {
    const params = new URLSearchParams();
    writeUnitFiltersToParams(state({ moveIn: { kind: 'date', date: '' } }), params);
    expect(params.toString()).toBe('');
  });

  it('leaves unrelated params (floor-plans filters, plan pop-up) untouched', () => {
    const params = new URLSearchParams('beds=studio,1br&floors=high&sqft=400-900&plan=a1&ada=1');
    writeUnitFiltersToParams(state({ beds: '1 Bed', sqftMin: 600 }), params);
    expect(params.get('beds')).toBe('studio,1br');
    expect(params.get('floors')).toBe('high');
    expect(params.get('sqft')).toBe('400-900');
    expect(params.get('plan')).toBe('a1');
    expect(params.get('ubeds')).toBe('1 Bed');
    expect(params.get('usqft')).toBe('600-');
    // Clearing back to defaults removes only the unit-filter params.
    writeUnitFiltersToParams(DEFAULT_UNIT_FILTERS, params);
    expect(params.get('ubeds')).toBeNull();
    expect(params.get('usqft')).toBeNull();
    expect(params.get('beds')).toBe('studio,1br');
  });

  it('malformed or unknown values fall back to no filter (full list, not empty state)', () => {
    expect(readUnitFiltersFromParams('movein=soonish&ubeds=Penthouse&ubaths=abc&usqft=900-500')).toEqual(
      DEFAULT_UNIT_FILTERS,
    );
    expect(readUnitFiltersFromParams('ubaths=1.3&usqft=-')).toEqual(DEFAULT_UNIT_FILTERS);
    expect(readUnitFiltersFromParams('movein=0')).toEqual(DEFAULT_UNIT_FILTERS);
  });

  it('accepts valid marketing bed labels and "N Bed"', () => {
    expect(readUnitFiltersFromParams('ubeds=Studio').beds).toBe('Studio');
    expect(readUnitFiltersFromParams('ubeds=2%20Bed').beds).toBe('2 Bed');
  });
});
