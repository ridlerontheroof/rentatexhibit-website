import { describe, expect, it } from 'vitest';
import {
  bandsForFloors,
  FLOOR_BANDS,
  compareGroups,
  filterGroups,
  groupKey,
  groupMatchesFilters,
  groupMatchesQuery,
  nextPosition,
  planGroups,
  plans,
  resolveDeepLink,
  sortGroups,
  SQFT_MAX,
  SQFT_MIN,
  unitNumbersForGroup,
  unitNumbersForPlan,
  type Category,
  type GroupFilterState,
  type Plan,
  type PlanGroup,
  type SortKey,
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

// --- unit numbers --------------------------------------------------------

describe('unitNumbersForPlan / unitNumbersForGroup', () => {
  it('formats each number as floor + zero-padded unit line', () => {
    expect(unitNumbersForPlan(makePlan({ unit: 2, floors: [30, 31, 34] }))).toEqual([
      '3002',
      '3102',
      '3402',
    ]);
  });

  it('zero-pads single-digit floors (floor 6, unit 6 -> 0606)', () => {
    expect(unitNumbersForPlan(makePlan({ unit: 6, floors: [6] }))).toEqual(['0606']);
    expect(unitNumbersForPlan(makePlan({ unit: 5, floors: [2] }))).toEqual(['0205']);
  });

  it('keeps two-digit unit lines intact', () => {
    expect(unitNumbersForPlan(makePlan({ unit: 10, floors: [2] }))).toEqual(['0210']);
  });

  it('unitNumbersForGroup spans the whole floor range', () => {
    expect(unitNumbersForGroup(makeGroup({ unit: 7, floors: [6, 7, 8] }))).toEqual([
      '0607',
      '0707',
      '0807',
    ]);
  });
});

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

  it('numeric query matches a full apartment unit number (floor + unit line)', () => {
    const g = makeGroup({ unit: 2, floors: [30, 31, 32, 33, 34] });
    expect(groupMatchesQuery(g, '3002')).toBe(true);
    expect(groupMatchesQuery(g, '3402')).toBe(true);
    expect(groupMatchesQuery(g, '9902')).toBe(false);
  });

  it('matches full unit numbers on single-digit floors (floor zero-padded)', () => {
    const g = makeGroup({ unit: 5, floors: [2] });
    expect(groupMatchesQuery(g, '0205')).toBe(true);
    expect(groupMatchesQuery(g, '9905')).toBe(false);
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

// --- compareGroups / sortGroups (the "sort by" control) -------------------

describe('compareGroups', () => {
  it('featured: orders by category (studio → convertible → 1br → 2br → 3br)', () => {
    const studio = makeGroup({ category: 'studio', unit: 9 });
    const convertible = makeGroup({ category: 'convertible', unit: 9 });
    const oneBed = makeGroup({ category: '1br', unit: 9 });
    const twoBed = makeGroup({ category: '2br', unit: 9 });
    const threeBed = makeGroup({ category: '3br', unit: 9 });
    expect(compareGroups(studio, convertible, 'featured')).toBeLessThan(0);
    expect(compareGroups(convertible, oneBed, 'featured')).toBeLessThan(0);
    expect(compareGroups(oneBed, twoBed, 'featured')).toBeLessThan(0);
    expect(compareGroups(twoBed, threeBed, 'featured')).toBeLessThan(0);
  });

  it('featured: breaks ties within a category by unit number ascending', () => {
    const a = makeGroup({ category: '2br', unit: 4 });
    const b = makeGroup({ category: '2br', unit: 9 });
    expect(compareGroups(a, b, 'featured')).toBeLessThan(0);
    expect(compareGroups(b, a, 'featured')).toBeGreaterThan(0);
    expect(compareGroups(a, makeGroup({ category: '2br', unit: 4 }), 'featured')).toBe(0);
  });

  it('size-desc: orders by largest sqft (sqftMax) descending', () => {
    const big = makeGroup({ sqftMax: 1200 });
    const small = makeGroup({ sqftMax: 600 });
    expect(compareGroups(big, small, 'size-desc')).toBeLessThan(0);
    expect(compareGroups(small, big, 'size-desc')).toBeGreaterThan(0);
  });

  it('size-asc: orders by smallest sqft (sqftMin) ascending', () => {
    const small = makeGroup({ sqftMin: 500 });
    const big = makeGroup({ sqftMin: 900 });
    expect(compareGroups(small, big, 'size-asc')).toBeLessThan(0);
    expect(compareGroups(big, small, 'size-asc')).toBeGreaterThan(0);
  });

  it('beds-asc: orders by bedroom count, then breaks ties by smallest sqft ascending', () => {
    const oneBed = makeGroup({ beds: 1, sqftMin: 700 });
    const twoBed = makeGroup({ beds: 2, sqftMin: 600 });
    // fewer beds wins even though its sqft is larger
    expect(compareGroups(oneBed, twoBed, 'beds-asc')).toBeLessThan(0);
    // same beds -> smaller sqftMin first
    const twoBedSmall = makeGroup({ beds: 2, sqftMin: 800 });
    const twoBedBig = makeGroup({ beds: 2, sqftMin: 950 });
    expect(compareGroups(twoBedSmall, twoBedBig, 'beds-asc')).toBeLessThan(0);
    // full tie
    expect(compareGroups(twoBedSmall, makeGroup({ beds: 2, sqftMin: 800 }), 'beds-asc')).toBe(0);
  });

  it('beds-desc: orders by bedroom count descending, then breaks ties by largest sqft descending', () => {
    const twoBed = makeGroup({ beds: 2, sqftMax: 900 });
    const oneBed = makeGroup({ beds: 1, sqftMax: 1100 });
    // more beds wins even though its sqft is smaller
    expect(compareGroups(twoBed, oneBed, 'beds-desc')).toBeLessThan(0);
    // same beds -> larger sqftMax first
    const twoBedBig = makeGroup({ beds: 2, sqftMax: 1000 });
    const twoBedSmall = makeGroup({ beds: 2, sqftMax: 800 });
    expect(compareGroups(twoBedBig, twoBedSmall, 'beds-desc')).toBeLessThan(0);
    // full tie
    expect(compareGroups(twoBedBig, makeGroup({ beds: 2, sqftMax: 1000 }), 'beds-desc')).toBe(0);
  });
});

describe('sortGroups', () => {
  const groups = [
    makeGroup({ id: 'twoBed-u9', category: '2br', unit: 9, beds: 2, sqftMin: 779, sqftMax: 899 }),
    makeGroup({ id: 'studio', category: 'studio', unit: 3, beds: 0, sqftMin: 448, sqftMax: 484 }),
    makeGroup({ id: 'threeBed', category: '3br', unit: 1, beds: 3, sqftMin: 1455, sqftMax: 1528 }),
    makeGroup({ id: 'convertible', category: 'convertible', unit: 5, beds: 0, sqftMin: 450, sqftMax: 450 }),
    makeGroup({ id: 'twoBed-u4', category: '2br', unit: 4, beds: 2, sqftMin: 983, sqftMax: 983 }),
    makeGroup({ id: 'oneBed', category: '1br', unit: 6, beds: 1, sqftMin: 619, sqftMax: 665 }),
  ];

  it('does not mutate the input array', () => {
    const input = [...groups];
    const originalOrder = input.map((g) => g.id);
    sortGroups(input, 'size-desc');
    expect(input.map((g) => g.id)).toEqual(originalOrder);
  });

  it('featured: category order, then unit ascending within a category', () => {
    expect(sortGroups(groups, 'featured').map((g) => g.id)).toEqual([
      'studio',
      'convertible',
      'oneBed',
      'twoBed-u4', // unit 4 before unit 9 within 2br
      'twoBed-u9',
      'threeBed',
    ]);
  });

  it('size-desc: largest sqftMax first', () => {
    expect(sortGroups(groups, 'size-desc').map((g) => g.id)).toEqual([
      'threeBed', // 1528
      'twoBed-u4', // 983
      'twoBed-u9', // 899
      'oneBed', // 665
      'studio', // 484
      'convertible', // 450
    ]);
  });

  it('size-asc: smallest sqftMin first', () => {
    expect(sortGroups(groups, 'size-asc').map((g) => g.id)).toEqual([
      'studio', // 448
      'convertible', // 450
      'oneBed', // 619
      'twoBed-u9', // 779
      'twoBed-u4', // 983
      'threeBed', // 1455
    ]);
  });

  it('beds-asc: bedroom count ascending, smallest sqft tie-break', () => {
    expect(sortGroups(groups, 'beds-asc').map((g) => g.id)).toEqual([
      'studio', // 0 beds, sqftMin 448 -> smaller sqftMin comes first
      'convertible', // 0 beds, sqftMin 450
      'oneBed', // 1 bed
      'twoBed-u9', // 2 beds, sqftMin 779
      'twoBed-u4', // 2 beds, sqftMin 983
      'threeBed', // 3 beds
    ]);
  });

  it('beds-desc: bedroom count descending, largest sqft tie-break', () => {
    expect(sortGroups(groups, 'beds-desc').map((g) => g.id)).toEqual([
      'threeBed', // 3 beds
      'twoBed-u4', // 2 beds, sqftMax 983
      'twoBed-u9', // 2 beds, sqftMax 899
      'oneBed', // 1 bed
      'studio', // 0 beds, sqftMax 484 -> larger sqftMax first
      'convertible', // 0 beds, sqftMax 450
    ]);
  });

  it('every sort key produces a stable, complete ordering of real plan data', () => {
    const keys: SortKey[] = ['featured', 'size-desc', 'size-asc', 'beds-asc', 'beds-desc'];
    for (const key of keys) {
      const sorted = sortGroups(planGroups, key);
      expect(sorted).toHaveLength(planGroups.length);
      expect(new Set(sorted.map((g) => g.id)).size).toBe(planGroups.length);
    }
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

// --- bandsForFloors (floor-range -> floor-band resolution) ----------------

describe('bandsForFloors', () => {
  it('maps a single floor to the one band that contains it', () => {
    // floor 2 sits in the podium band (2-5)
    expect(bandsForFloors(2, 2).map((b) => b.id)).toEqual(['podium']);
    // a mid-rise floor
    expect(bandsForFloors(10, 10).map((b) => b.id)).toEqual(['mid']);
    // top penthouse floor
    expect(bandsForFloors(34, 34).map((b) => b.id)).toEqual(['penthouse']);
  });

  it('returns every band a cross-band range touches, in floor order', () => {
    // 6-29 spans mid-rise (6-16) and high-rise (17-29)
    expect(bandsForFloors(6, 29).map((b) => b.id)).toEqual(['mid', 'high']);
    // a range that touches all four bands
    expect(bandsForFloors(2, 34).map((b) => b.id)).toEqual([
      'podium',
      'mid',
      'high',
      'penthouse',
    ]);
  });

  it('is inclusive at band boundaries', () => {
    // 5 is the last podium floor, 6 the first mid floor
    expect(bandsForFloors(5, 6).map((b) => b.id)).toEqual(['podium', 'mid']);
    // 16/17 straddle the mid/high boundary
    expect(bandsForFloors(16, 17).map((b) => b.id)).toEqual(['mid', 'high']);
  });

  it('resolves mezzanine ("M") plans to the band of their base floors', () => {
    // Every mezzanine plan in the dataset (e.g. "3-4M", "4M") should still
    // land in the correct band(s) from its expanded floor range.
    const mezz = plans.filter((p) => p.mezzanine);
    expect(mezz.length).toBeGreaterThan(0);
    expect(mezz.every((p) => p.floorLabel.includes('M'))).toBe(true);
    for (const p of mezz) {
      // the "M" suffix must not have leaked into the numeric floor range
      expect(Number.isNaN(p.floorMin)).toBe(false);
      expect(Number.isNaN(p.floorMax)).toBe(false);
      const bands = bandsForFloors(p.floorMin, p.floorMax);
      // every band returned genuinely overlaps the plan's floor range
      expect(bands.every((b) => p.floorMin <= b.max && p.floorMax >= b.min)).toBe(true);
    }
    // "3-4M" and "4M" both live entirely within the podium band (2-5)
    const podiumMezz = mezz.filter((p) => p.floorMax <= 5);
    expect(podiumMezz.length).toBeGreaterThan(0);
    for (const p of podiumMezz) {
      expect(bandsForFloors(p.floorMin, p.floorMax).map((b) => b.id)).toEqual(['podium']);
    }
  });
});

// --- groupKey (residence identity) ----------------------------------------

describe('groupKey', () => {
  it('same-line variants across floor bands share one key', () => {
    // Same unit / category / baths / den, only the floor band differs.
    const podium = makePlan({ unit: 7, category: '1br', baths: 1, den: false, floorMin: 2 });
    const mid = makePlan({ unit: 7, category: '1br', baths: 1, den: false, floorMin: 6 });
    const high = makePlan({ unit: 7, category: '1br', baths: 1, den: false, floorMin: 17 });
    expect(groupKey(podium)).toBe(groupKey(mid));
    expect(groupKey(mid)).toBe(groupKey(high));
  });

  it('a different unit produces a different key', () => {
    expect(groupKey(makePlan({ unit: 1 }))).not.toBe(groupKey(makePlan({ unit: 2 })));
  });

  it('a different bedroom category produces a different key', () => {
    expect(groupKey(makePlan({ category: '1br' }))).not.toBe(
      groupKey(makePlan({ category: '2br' })),
    );
  });

  it('a different bath count produces a different key', () => {
    expect(groupKey(makePlan({ baths: 1 }))).not.toBe(groupKey(makePlan({ baths: 2 })));
  });

  it('den vs. no-den produces a different key', () => {
    expect(groupKey(makePlan({ den: true }))).not.toBe(groupKey(makePlan({ den: false })));
  });
});

// --- planGroups (client-side collapse of 35 sheets into residence cards) ---

describe('planGroups', () => {
  it('represents every raw plan in exactly one group with no variants lost', () => {
    const allVariantIds = planGroups.flatMap((g) => g.variants.map((v) => v.id));
    // no variant is dropped and none is duplicated across groups
    expect(allVariantIds.length).toBe(plans.length);
    expect(new Set(allVariantIds).size).toBe(plans.length);
    // and the set of grouped variant ids is exactly the set of plan ids
    expect(new Set(allVariantIds)).toEqual(new Set(plans.map((p) => p.id)));
  });

  it('never collapses distinct residences into one card', () => {
    // Any two plans that differ in unit / category / baths / den must land in
    // separate groups. Verify no group mixes those defining attributes.
    for (const g of planGroups) {
      const signatures = new Set(
        g.variants.map((v) => `${v.unit}-${v.category}-${v.baths}-${v.den}`),
      );
      expect(signatures.size).toBe(1);
    }
    // Concretely: unit 4 splits into three residences (2/2 std, 2/2 den, 2/1).
    const unit4 = planGroups.filter((g) => g.unit === 4);
    const unit4Keys = new Set(unit4.map((g) => g.id));
    expect(unit4Keys.has('4-2br-2-std')).toBe(true);
    expect(unit4Keys.has('4-2br-2-den')).toBe(true);
    expect(unit4Keys.has('4-2br-1-std')).toBe(true);
  });

  it('collapses same-line variants offered across floor bands into one card', () => {
    // Unit 7's 1-bed line appears on floors 2, 6-16, 17-21 and 22-29 as four
    // separate sheets; they must fold into a single multi-band residence card.
    const group = planGroups.find((g) => g.id === '7-1br-1-std');
    expect(group).toBeDefined();
    expect(group!.variants.length).toBeGreaterThan(1);
    // spans more than one band
    expect(group!.bands.length).toBeGreaterThan(1);
  });

  it('aggregates sqft range, floors and bands across a multi-variant group', () => {
    const group = planGroups.find((g) => g.id === '7-1br-1-std')!;
    const sqfts = group.variants.map((v) => v.sqft);
    // sqftMin / sqftMax span the smallest and largest variant
    expect(group.sqftMin).toBe(Math.min(...sqfts));
    expect(group.sqftMax).toBe(Math.max(...sqfts));
    expect(group.sqftMin).toBeLessThan(group.sqftMax);

    // floors are the sorted union of every variant's floors, no duplicates
    const expectedFloors = Array.from(new Set(group.variants.flatMap((v) => v.floors))).sort(
      (a, b) => a - b,
    );
    expect(group.floors).toEqual(expectedFloors);

    // bands are exactly those touched by the aggregated floors, in floor order
    expect(group.bands.map((b) => b.id)).toEqual(['podium', 'mid', 'high']);
    // bands follow the canonical FLOOR_BANDS ordering
    const canonical = FLOOR_BANDS.map((b) => b.id).filter((id) =>
      group.bands.some((b) => b.id === id),
    );
    expect(group.bands.map((b) => b.id)).toEqual(canonical);
  });

  it('orders each group\'s variants by ascending floor and picks the lowest as representative', () => {
    for (const g of planGroups) {
      const mins = g.variants.map((v) => v.floorMin);
      const sorted = [...mins].sort((a, b) => a - b);
      expect(mins).toEqual(sorted);
      // representative image comes from the lowest-floor variant
      expect(g.images).toEqual(g.variants[0].images);
    }
  });
});
