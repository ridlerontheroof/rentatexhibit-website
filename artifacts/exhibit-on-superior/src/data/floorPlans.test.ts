import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
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
  parseFloors,
  slugFor,
  floorPlansItemListJsonLd,
  planGroups,
  plans,
  resolveDeepLink,
  sortGroups,
  SQFT_MAX,
  SQFT_MIN,
  unitNumbersForGroup,
  unitNumbersForPlan,
  variantIndexForUnit,
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

describe('variantIndexForUnit', () => {
  const group = makeGroup({
    floors: [2, 3, 6, 7, 17, 18],
    variants: [
      makePlan({ id: 'v-podium', floors: [2, 3], floorMin: 2, floorMax: 3 }),
      makePlan({ id: 'v-mid', floors: [6, 7], floorMin: 6, floorMax: 7 }),
      makePlan({ id: 'v-high', floors: [17, 18], floorMin: 17, floorMax: 18 }),
    ],
  });

  it('picks the variant whose floor range contains the unit floor', () => {
    expect(variantIndexForUnit(group, '0201')).toBe(0);
    expect(variantIndexForUnit(group, '0601')).toBe(1);
    expect(variantIndexForUnit(group, '1801')).toBe(2);
  });

  it('falls back to 0 for unparseable or unmatched floors', () => {
    expect(variantIndexForUnit(group, '01')).toBe(0);
    expect(variantIndexForUnit(group, 'abc')).toBe(0);
    expect(variantIndexForUnit(group, '9901')).toBe(0);
  });

  it('resolves real availability-style unit numbers against real groups', () => {
    for (const g of planGroups) {
      for (const [i, v] of g.variants.entries()) {
        const line = String(g.unit).padStart(2, '0');
        const unitNumber = `${String(v.floors[0]).padStart(2, '0')}${line}`;
        expect(variantIndexForUnit(g, unitNumber)).toBe(i);
      }
    }
  });
});

function makeFilters(over: Partial<GroupFilterState> = {}): GroupFilterState {
  return {
    categories: new Set<Category>(),
    bands: new Set<string>(),
    sqft: [SQFT_MIN, SQFT_MAX],
    ada: false,
    ...over,
  };
}

// --- parseFloors (floor label -> numeric range) ----------------------------

describe('parseFloors', () => {
  it('parses a single-floor label', () => {
    expect(parseFloors('2')).toEqual({ floors: [2], min: 2, max: 2, mezzanine: false });
  });

  it('parses a ranged label into the full expanded floor list', () => {
    expect(parseFloors('6-29')).toEqual({
      floors: Array.from({ length: 24 }, (_, i) => i + 6),
      min: 6,
      max: 29,
      mezzanine: false,
    });
    expect(parseFloors('30-34')).toEqual({
      floors: [30, 31, 32, 33, 34],
      min: 30,
      max: 34,
      mezzanine: false,
    });
  });

  it('counts the mezzanine as its own level (one above the floor it tops)', () => {
    // The building has no sheet for "floor 5": the podium band runs 2-5 and
    // level 5 IS the "4M" mezzanine, so ranges ending in the mezzanine
    // include it as max+1. Real unit numbers like 0502 depend on this.
    expect(parseFloors('3-4M')).toEqual({ floors: [3, 4, 5], min: 3, max: 5, mezzanine: true });
    expect(parseFloors('4-4M')).toEqual({ floors: [4, 5], min: 4, max: 5, mezzanine: true });
  });

  it('parses a pure mezzanine sheet ("4M") as only the mezzanine level', () => {
    expect(parseFloors('4M')).toEqual({ floors: [5], min: 5, max: 5, mezzanine: true });
  });

  it('every floor it produces is a finite number (no NaN from "M")', () => {
    for (const label of ['2', '4M', '3-4M', '6-29', '17-21']) {
      const { floors, min, max } = parseFloors(label);
      expect(Number.isFinite(min)).toBe(true);
      expect(Number.isFinite(max)).toBe(true);
      expect(floors.every((f) => Number.isInteger(f))).toBe(true);
    }
  });
});

// --- slugFor (plan id / image filename stem) --------------------------------

describe('slugFor', () => {
  it('uses the "floor" prefix for a single floor', () => {
    expect(slugFor(5, '2')).toBe('unit-5-floor-2');
  });

  it('uses the "floor" prefix for a single mezzanine floor and lowercases the label', () => {
    expect(slugFor(4, '4M')).toBe('unit-4-floor-4m');
  });

  it('uses the "floors" prefix for ranged labels', () => {
    expect(slugFor(1, '6-29')).toBe('unit-1-floors-6-29');
    expect(slugFor(3, '3-4M')).toBe('unit-3-floors-3-4m');
  });
});

// --- plans dataset integrity ------------------------------------------------

describe('plans dataset', () => {
  it('has a unique id for every plan (no slug collisions across the 35 sheets)', () => {
    expect(plans).toHaveLength(35);
    const ids = plans.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('derives each plan\'s three image paths from its own id', () => {
    for (const p of plans) {
      expect(p.images.thumb).toBe(`/images/floor-plans/${p.id}-thumb.webp`);
      expect(p.images.detail).toBe(`/images/floor-plans/${p.id}-detail.webp`);
      expect(p.images.zoom).toBe(`/images/floor-plans/${p.id}-zoom.webp`);
    }
  });

  it('each plan\'s id matches slugFor of its own unit + floor label', () => {
    for (const p of plans) {
      expect(p.id).toBe(slugFor(p.unit, p.floorLabel));
    }
  });
});

// --- floor-plan image files exist on disk ---------------------------------

describe('floor-plan image files', () => {
  const IMG_DIR = join(__dirname, '..', '..', 'public', 'images', 'floor-plans');

  it('every plan\'s thumb, detail, and zoom .webp files exist on disk', () => {
    const missing: string[] = [];
    for (const p of plans) {
      for (const key of ['thumb', 'detail', 'zoom'] as const) {
        const file = basename(p.images[key]);
        if (!existsSync(join(IMG_DIR, file))) missing.push(file);
      }
    }
    expect(missing).toEqual([]);
  });

  it('every file in floor-plans/ is referenced by a plan (no retired sheets keep shipping)', () => {
    // Inverse of the existence check above: if a plan is renamed or retired,
    // its old thumb/detail/zoom sheets would otherwise sit in public/images/
    // and ship with every deploy. siteImages.test.ts explicitly delegates
    // /images/floor-plans/ coverage to this file, so this guard closes that
    // gap. Fix by deleting the orphaned files (or restoring the plan).
    const expected = new Set<string>();
    for (const p of plans) {
      for (const key of ['thumb', 'detail', 'zoom'] as const) {
        expected.add(basename(p.images[key]));
      }
    }
    const orphans = readdirSync(IMG_DIR).filter((f) => !expected.has(f));
    expect(
      orphans,
      `files in public/images/floor-plans/ no plan references — delete them: ${orphans.join(', ')}`,
    ).toEqual([]);
  });

  it('every image file is non-empty and starts with a valid WebP header (RIFF....WEBP)', () => {
    const bad: string[] = [];
    for (const p of plans) {
      for (const key of ['thumb', 'detail', 'zoom'] as const) {
        const file = basename(p.images[key]);
        const path = join(IMG_DIR, file);
        if (!existsSync(path)) continue; // missing files are reported by the previous test
        const buf = readFileSync(path);
        if (buf.length === 0) {
          bad.push(`${file} (empty file)`);
        } else if (
          buf.length < 12 ||
          buf.toString('ascii', 0, 4) !== 'RIFF' ||
          buf.toString('ascii', 8, 12) !== 'WEBP'
        ) {
          bad.push(`${file} (invalid WebP header)`);
        }
      }
    }
    expect(bad, `corrupted or empty floor-plan images: ${bad.join(', ')}`).toEqual([]);
  });

  /** Parse pixel dimensions from a WebP header (VP8 / VP8L / VP8X). */
  function readWebpDimensions(buf: Buffer): { width: number; height: number } | null {
    if (
      buf.length < 30 ||
      buf.toString('ascii', 0, 4) !== 'RIFF' ||
      buf.toString('ascii', 8, 12) !== 'WEBP'
    ) {
      return null;
    }
    const fourcc = buf.toString('ascii', 12, 16);
    if (fourcc === 'VP8 ') {
      // Lossy: frame tag at 20, sync code 9D 01 2A, then 14-bit width/height.
      if (buf[23] === 0x9d && buf[24] === 0x01 && buf[25] === 0x2a) {
        return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
      }
      return null;
    }
    if (fourcc === 'VP8L') {
      if (buf[20] !== 0x2f) return null; // signature byte
      const bits = buf.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    if (fourcc === 'VP8X') {
      // 24-bit little-endian canvas width/height minus one at offsets 24 and 27.
      const width = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16));
      const height = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16));
      return { width, height };
    }
    return null;
  }

  it('every image stays under its byte budget for its pixel size', () => {
    // Guards against a bloated re-export silently shipping — mirrors the
    // bytes-per-pixel + hard-cap approach in siteImages.test.ts. Floor-plan
    // renderings are line art, so they compress far better than photos: the
    // current worst offender sits around 0.055 B/px. A 0.15 B/px budget leaves
    // ~3x headroom for normal re-exports while catching order-of-magnitude
    // regressions.
    const BYTES_PER_PIXEL_BUDGET = 0.15; // all floor-plan images are WebP line art
    const MIN_BUDGET_BYTES = 30 * 1024; // container/metadata floor for tiny images
    const HARD_CAP_BYTES = 512 * 1024; // largest zoom today is ~233KB; >512KB is a mistake

    const fmtKB = (bytes: number) => `${(bytes / 1024).toFixed(1)}KB`;
    const over: string[] = [];
    let checked = 0;

    for (const p of plans) {
      for (const key of ['thumb', 'detail', 'zoom'] as const) {
        const file = basename(p.images[key]);
        const path = join(IMG_DIR, file);
        if (!existsSync(path)) continue; // missing files are reported by an earlier test
        checked += 1;
        const buf = readFileSync(path);
        const dims = readWebpDimensions(buf);
        if (!dims) {
          over.push(`${file} (could not read dimensions to compute budget)`);
          continue;
        }
        const budget = Math.min(
          HARD_CAP_BYTES,
          Math.max(MIN_BUDGET_BYTES, Math.ceil(dims.width * dims.height * BYTES_PER_PIXEL_BUDGET)),
        );
        if (buf.length > budget) {
          over.push(
            `${file} is ${fmtKB(buf.length)}, over its ${fmtKB(budget)} budget ` +
              `(${dims.width}x${dims.height} webp @ ${BYTES_PER_PIXEL_BUDGET} B/px, hard cap ${fmtKB(HARD_CAP_BYTES)})`,
          );
        }
      }
    }

    expect(checked).toBeGreaterThan(100); // sanity: 35 plans x 3 variants
    expect(over, `oversized floor-plan images:\n${over.join('\n')}`).toEqual([]);
  });

  it('every variant tier has its expected pixel dimensions (thumb 600x776, detail 1500x1941, zoom 2600x3365)', () => {
    // Guards against a mis-sized re-export: a wrong-width thumb stretches the
    // cards, a zoom smaller than its detail shows *less* when zooming in.
    const EXPECTED: Record<'thumb' | 'detail' | 'zoom', { width: number; height: number }> = {
      thumb: { width: 600, height: 776 },
      detail: { width: 1500, height: 1941 },
      zoom: { width: 2600, height: 3365 },
    };

    const bad: string[] = [];
    let checked = 0;

    for (const p of plans) {
      for (const key of ['thumb', 'detail', 'zoom'] as const) {
        const file = basename(p.images[key]);
        const path = join(IMG_DIR, file);
        if (!existsSync(path)) continue; // missing files are reported by an earlier test
        checked += 1;
        const dims = readWebpDimensions(readFileSync(path));
        if (!dims) {
          bad.push(`${file} (could not read WebP dimensions)`);
          continue;
        }
        const exp = EXPECTED[key];
        if (dims.width !== exp.width || dims.height !== exp.height) {
          bad.push(
            `${file} is ${dims.width}x${dims.height}, expected ${exp.width}x${exp.height} for the ${key} tier`,
          );
        }
      }
    }

    expect(checked).toBeGreaterThan(100); // sanity: 35 plans x 3 variants
    expect(bad, `mis-sized floor-plan images:\n${bad.join('\n')}`).toEqual([]);
  });

  it('per plan, zoom > detail > thumb in pixel area (zooming must add detail)', () => {
    const bad: string[] = [];

    for (const p of plans) {
      const dimsByKey: Partial<Record<'thumb' | 'detail' | 'zoom', { width: number; height: number }>> = {};
      for (const key of ['thumb', 'detail', 'zoom'] as const) {
        const path = join(IMG_DIR, basename(p.images[key]));
        if (!existsSync(path)) continue; // missing files are reported by an earlier test
        dimsByKey[key] = readWebpDimensions(readFileSync(path)) ?? undefined;
      }
      const { thumb, detail, zoom } = dimsByKey;
      const fmt = (d: { width: number; height: number }) => `${d.width}x${d.height}`;
      if (detail && thumb && (detail.width <= thumb.width || detail.height <= thumb.height)) {
        bad.push(
          `${p.id}: detail (${fmt(detail)}) is not strictly larger than thumb (${fmt(thumb)})`,
        );
      }
      if (zoom && detail && (zoom.width <= detail.width || zoom.height <= detail.height)) {
        bad.push(
          `${p.id}: zoom (${fmt(zoom)}) is not strictly larger than detail (${fmt(detail)})`,
        );
      }
    }

    expect(bad, `floor-plan variant ordering violations:\n${bad.join('\n')}`).toEqual([]);
  });

  it('no orphan image files exist that no plan references', () => {
    const referenced = new Set(
      plans.flatMap((p) => [p.images.thumb, p.images.detail, p.images.zoom].map((s) => basename(s))),
    );
    const orphans = readdirSync(IMG_DIR).filter((f) => f.endsWith('.webp') && !referenced.has(f));
    expect(orphans).toEqual([]);
  });
});

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

  it('treats a short numeric query as a zero-padded unit number (203 -> 0203)', () => {
    const g = makeGroup({ unit: 3, floors: [2] });
    expect(groupMatchesQuery(g, '203')).toBe(true);
    // still matches the fully padded form
    expect(groupMatchesQuery(g, '0203')).toBe(true);
  });

  it('finds real mezzanine-level units in the actual dataset (502 regression)', () => {
    // Unit 0502 = unit line 2 on the "4M" mezzanine (level 5). Searching
    // "502" or "0502" must surface it.
    for (const q of ['502', '0502']) {
      const hits = planGroups.filter((g) => groupMatchesQuery(g, q));
      expect(hits.length).toBeGreaterThan(0);
      expect(hits.some((g) => g.unit === 2 && g.floors.includes(5))).toBe(true);
    }
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

describe('floorPlansItemListJsonLd', () => {
  const list = floorPlansItemListJsonLd() as {
    '@type': string;
    itemListElement: { position: number; item: Record<string, unknown> }[];
  };

  it('emits one enriched Apartment item per plan group', () => {
    expect(list['@type']).toBe('ItemList');
    expect(list.itemListElement).toHaveLength(planGroups.length);
    for (const { item } of list.itemListElement) {
      expect(item['@type']).toBe('Apartment');
      expect(item.name).toBeTruthy();
      expect(item.description).toBeTruthy();
      expect(String(item.url)).toMatch(/^https:\/\/www\.rentatexhibit\.com\/available-units\?plan=/);
      expect(item.accommodationCategory).toBeTruthy();
      expect(typeof item.numberOfBathroomsTotal).toBe('number');
      const floorSize = item.floorSize as Record<string, unknown>;
      expect(floorSize.unitCode).toBe('FTK');
      expect(typeof floorSize.minValue).toBe('number');
      expect(String(item.image)).toMatch(/^https:\/\/www\.rentatexhibit\.com\/images\//);
    }
  });

  it('links each item to the site-wide ApartmentComplex node', () => {
    for (const { item } of list.itemListElement) {
      expect(item.containedInPlace).toEqual({
        '@id': 'https://www.rentatexhibit.com#apartmentcomplex',
      });
    }
  });

  it('never emits pricing/availability claims not shown on the page', () => {
    for (const { item } of list.itemListElement) {
      expect(item).not.toHaveProperty('offers');
      expect(item).not.toHaveProperty('price');
      expect(item).not.toHaveProperty('petsAllowed');
      // numberOfRooms is not derivable from bedroom count — must not be claimed
      expect(item).not.toHaveProperty('numberOfRooms');
    }
  });

  it('only claims numberOfBedrooms for plans that actually have bedrooms', () => {
    list.itemListElement.forEach(({ item }, i) => {
      const g = planGroups[i];
      if (g.beds > 0) expect(item.numberOfBedrooms).toBe(g.beds);
      else expect(item).not.toHaveProperty('numberOfBedrooms');
    });
  });
});
