import { describe, expect, it } from 'vitest';
import {
  FLOOR_BANDS,
  filterGroups,
  groupMatchesFilters,
  groupMatchesQuery,
  nextPosition,
  planGroups,
  resolveDeepLink,
  SQFT_MAX,
  SQFT_MIN,
  type Category,
  type GroupFilterState,
  type Plan,
  type PlanGroup,
} from './floorPlans';

// --- Test factories -------------------------------------------------------

function makePlan(over: Partial<Plan> = {}): Plan {
  return {
    id: 'unit-1-floor-2',
    unit: 1,
    floorLabel: '2',
    floors: [2],
    floorMin: 2,
    floorMax: 2,
    mezzanine: false,
    category: '1br',
    typeLabel: '1 Bed / 1 Bath',
    beds: 1,
    baths: 1,
    den: false,
    sqft: 600,
    images: { thumb: '', detail: '', zoom: '' },
    ...over,
  };
}

function makeGroup(over: Partial<PlanGroup> = {}): PlanGroup {
  const base: PlanGroup = {
    id: 'g-1',
    unit: 1,
    category: '1br',
    typeLabel: '1 Bed / 1 Bath',
    beds: 1,
    baths: 1,
    den: false,
    sqftMin: 600,
    sqftMax: 600,
    bands: [FLOOR_BANDS[0]],
    floors: [2],
    variants: [makePlan()],
    images: { thumb: '', detail: '', zoom: '' },
  };
  return { ...base, ...over };
}

function makeFilters(over: Partial<GroupFilterState> = {}): GroupFilterState {
  return {
    categories: new Set<Category>(),
    bands: new Set<string>(),
    sqft: [SQFT_MIN, SQFT_MAX],
    ...over,
  };
}

// --- groupMatchesQuery ----------------------------------------------------

describe('groupMatchesQuery', () => {
  it('matches everything when the query is empty or whitespace', () => {
    const g = makeGroup();
    expect(groupMatchesQuery(g, '')).toBe(true);
    expect(groupMatchesQuery(g, '   ')).toBe(true);
  });

  it('numeric query matches the unit number', () => {
    const g = makeGroup({ unit: 7, floors: [6, 7, 8] });
    expect(groupMatchesQuery(g, '7')).toBe(true);
  });

  it('numeric query matches a floor number even when it is not the unit', () => {
    const g = makeGroup({ unit: 1, floors: [6, 7, 8, 9] });
    expect(groupMatchesQuery(g, '8')).toBe(true);
  });

  it('numeric query that is neither a unit nor a floor does not match', () => {
    const g = makeGroup({ unit: 1, floors: [2, 3] });
    expect(groupMatchesQuery(g, '99')).toBe(false);
  });

  it('requires every number in a multi-number query to match', () => {
    const g = makeGroup({ unit: 5, floors: [10, 11, 12] });
    // 5 -> unit, 12 -> floor: both satisfied.
    expect(groupMatchesQuery(g, '5 12')).toBe(true);
    // 5 -> unit ok, 99 -> neither: fails.
    expect(groupMatchesQuery(g, '5 99')).toBe(false);
  });

  it('text query matches the type label (case-insensitive)', () => {
    const g = makeGroup({ typeLabel: 'Jr. Convertible', category: 'convertible' });
    expect(groupMatchesQuery(g, 'convertible')).toBe(true);
    expect(groupMatchesQuery(g, 'CONVERTIBLE')).toBe(true);
  });

  it('text query matches "unit N" phrasing', () => {
    const g = makeGroup({ unit: 4 });
    expect(groupMatchesQuery(g, 'unit 4')).toBe(true);
  });

  it('text query that appears nowhere does not match', () => {
    const g = makeGroup({ typeLabel: 'Studio', category: 'studio' });
    expect(groupMatchesQuery(g, 'penthouse')).toBe(false);
  });
});

// --- groupMatchesFilters (combined category + band + sqft) ----------------

describe('groupMatchesFilters', () => {
  it('an empty filter matches every group', () => {
    expect(groupMatchesFilters(makeGroup(), makeFilters())).toBe(true);
  });

  it('bedroom-category filter keeps only the selected categories', () => {
    const oneBed = makeGroup({ category: '1br' });
    const twoBed = makeGroup({ category: '2br' });
    const filters = makeFilters({ categories: new Set<Category>(['1br']) });
    expect(groupMatchesFilters(oneBed, filters)).toBe(true);
    expect(groupMatchesFilters(twoBed, filters)).toBe(false);
  });

  it('floor-band filter matches groups offered on any selected band', () => {
    const midOnly = makeGroup({ bands: [FLOOR_BANDS.find((b) => b.id === 'mid')!] });
    const podiumOnly = makeGroup({ bands: [FLOOR_BANDS.find((b) => b.id === 'podium')!] });
    const filters = makeFilters({ bands: new Set(['mid']) });
    expect(groupMatchesFilters(midOnly, filters)).toBe(true);
    expect(groupMatchesFilters(podiumOnly, filters)).toBe(false);
  });

  it('sqft filter uses range overlap, not containment', () => {
    const filters = makeFilters({ sqft: [700, 900] });
    // fully below range -> excluded
    expect(groupMatchesFilters(makeGroup({ sqftMin: 500, sqftMax: 650 }), filters)).toBe(false);
    // fully above range -> excluded
    expect(groupMatchesFilters(makeGroup({ sqftMin: 950, sqftMax: 1100 }), filters)).toBe(false);
    // partial overlap on the low end -> included
    expect(groupMatchesFilters(makeGroup({ sqftMin: 650, sqftMax: 750 }), filters)).toBe(true);
    // group range fully contains the filter range -> included
    expect(groupMatchesFilters(makeGroup({ sqftMin: 400, sqftMax: 1200 }), filters)).toBe(true);
  });

  it('sqft overlap is inclusive at the boundaries', () => {
    const filters = makeFilters({ sqft: [700, 900] });
    // touches the upper bound exactly
    expect(groupMatchesFilters(makeGroup({ sqftMin: 900, sqftMax: 950 }), filters)).toBe(true);
    // just past the upper bound
    expect(groupMatchesFilters(makeGroup({ sqftMin: 901, sqftMax: 950 }), filters)).toBe(false);
    // touches the lower bound exactly
    expect(groupMatchesFilters(makeGroup({ sqftMin: 600, sqftMax: 700 }), filters)).toBe(true);
    // just below the lower bound
    expect(groupMatchesFilters(makeGroup({ sqftMin: 600, sqftMax: 699 }), filters)).toBe(false);
  });

  it('all three constraints must pass together', () => {
    const filters = makeFilters({
      categories: new Set<Category>(['2br']),
      bands: new Set(['mid']),
      sqft: [800, 1000],
    });
    const pass = makeGroup({
      category: '2br',
      bands: [FLOOR_BANDS.find((b) => b.id === 'mid')!],
      sqftMin: 850,
      sqftMax: 950,
    });
    expect(groupMatchesFilters(pass, filters)).toBe(true);

    // right category + band but sqft outside
    const wrongSize = makeGroup({
      category: '2br',
      bands: [FLOOR_BANDS.find((b) => b.id === 'mid')!],
      sqftMin: 400,
      sqftMax: 600,
    });
    expect(groupMatchesFilters(wrongSize, filters)).toBe(false);

    // right category + size but wrong band
    const wrongBand = makeGroup({
      category: '2br',
      bands: [FLOOR_BANDS.find((b) => b.id === 'podium')!],
      sqftMin: 850,
      sqftMax: 950,
    });
    expect(groupMatchesFilters(wrongBand, filters)).toBe(false);
  });
});

// --- filterGroups (query + filter together) -------------------------------

describe('filterGroups', () => {
  const groups = [
    makeGroup({ id: 'a', unit: 1, category: 'studio', typeLabel: 'Studio', floors: [3], sqftMin: 448, sqftMax: 448, bands: [FLOOR_BANDS[0]] }),
    makeGroup({ id: 'b', unit: 2, category: '2br', typeLabel: '2 Bed / 2 Bath', floors: [6, 7], sqftMin: 900, sqftMax: 950, bands: [FLOOR_BANDS.find((x) => x.id === 'mid')!] }),
    makeGroup({ id: 'c', unit: 3, category: '2br', typeLabel: '2 Bed / 1 Bath', floors: [30], sqftMin: 767, sqftMax: 767, bands: [FLOOR_BANDS.find((x) => x.id === 'penthouse')!] }),
  ];

  it('with no query and no filters returns every group', () => {
    expect(filterGroups(groups, '', makeFilters()).map((g) => g.id)).toEqual(['a', 'b', 'c']);
  });

  it('combines the free-text query with the structured filter', () => {
    // category 2br narrows to b + c, query "2 Bed / 2" narrows to b only
    const filters = makeFilters({ categories: new Set<Category>(['2br']) });
    expect(filterGroups(groups, '2 Bed / 2', filters).map((g) => g.id)).toEqual(['b']);
  });

  it('returns nothing when the query excludes all filter-matching groups', () => {
    const filters = makeFilters({ categories: new Set<Category>(['studio']) });
    expect(filterGroups(groups, '99', filters)).toEqual([]);
  });

  it('operates on real plan data without throwing and only returns studios when filtered', () => {
    const studios = filterGroups(planGroups, '', makeFilters({ categories: new Set<Category>(['studio']) }));
    expect(studios.length).toBeGreaterThan(0);
    expect(studios.every((g) => g.category === 'studio')).toBe(true);
  });
});

// --- nextPosition (lightbox navigation over filtered ordering) ------------

describe('nextPosition', () => {
  it('advances forward within the list', () => {
    expect(nextPosition(0, 1, 5)).toBe(1);
    expect(nextPosition(2, 1, 5)).toBe(3);
  });

  it('steps backward within the list', () => {
    expect(nextPosition(3, -1, 5)).toBe(2);
  });

  it('wraps around from the last item to the first', () => {
    expect(nextPosition(4, 1, 5)).toBe(0);
  });

  it('wraps around from the first item to the last', () => {
    expect(nextPosition(0, -1, 5)).toBe(4);
  });

  it('is a no-op when there is nothing to navigate', () => {
    expect(nextPosition(-1, 1, 5)).toBe(-1); // nothing open
    expect(nextPosition(0, 1, 0)).toBe(0); // empty list
  });

  it('wraps correctly over a real filtered ordering', () => {
    const filtered = filterGroups(
      planGroups,
      '',
      makeFilters({ categories: new Set<Category>(['studio']) }),
    );
    const last = filtered.length - 1;
    expect(last).toBeGreaterThan(0); // more than one studio to navigate
    // stepping past the end lands on the first entry of the filtered list
    expect(filtered[nextPosition(last, 1, filtered.length)].id).toBe(filtered[0].id);
    // stepping before the start lands on the last entry
    expect(filtered[nextPosition(0, -1, filtered.length)].id).toBe(filtered[last].id);
  });
});

// --- resolveDeepLink (?plan= handling) ------------------------------------

describe('resolveDeepLink', () => {
  it('returns the id when it matches an existing group', () => {
    const id = planGroups[0].id;
    expect(resolveDeepLink(planGroups, id)).toBe(id);
  });

  it('returns null for an unknown id', () => {
    expect(resolveDeepLink(planGroups, 'does-not-exist')).toBeNull();
  });

  it('returns null when there is no id', () => {
    expect(resolveDeepLink(planGroups, null)).toBeNull();
    expect(resolveDeepLink(planGroups, '')).toBeNull();
  });
});
