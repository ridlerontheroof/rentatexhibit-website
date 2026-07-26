// Floor plan dataset for Exhibit On Superior.
// Source of truth: the 34 owned floor-plan sheets (v0.7 book). Each record is one plan
// (a unit position on a specific floor band). Near-duplicate plans that repeat
// the same residence line across floor bands are grouped client-side into a
// single card (see `planGroups`).

export type Category = 'studio' | 'convertible' | '1br' | '2br' | '3br';

export interface Plan {
  /** slug — also the image filename stem */
  id: string;
  unit: number;
  /** Original floor range label as printed on the sheet, e.g. "6-29", "3-4M". */
  floorLabel: string;
  /** Expanded list of floor numbers this plan is offered on (for search). */
  floors: number[];
  floorMin: number;
  floorMax: number;
  mezzanine: boolean;
  category: Category;
  /** Human-facing layout label, e.g. "2 Bed / 2 Bath", "Jr. Convertible". */
  typeLabel: string;
  /** Bedroom count used for sorting (studio/convertible = 0). */
  beds: number;
  baths: number;
  den: boolean;
  /** Representative square footage (the sheet's figure; upper bound when the sheet prints a range). */
  sqft: number;
  /** Lower bound of the sheet's printed square footage (equals sqft unless the sheet prints a range). */
  sqftMin: number;
  images: { thumb: string; detail: string; zoom: string };
}

export interface FloorBand {
  id: string;
  label: string;
  /** Short descriptor used on chips / filters. */
  name: string;
  min: number;
  max: number;
}

export const FLOOR_BANDS: FloorBand[] = [
  { id: 'podium', label: '2\u20135', name: 'Podium', min: 2, max: 5 },
  { id: 'mid', label: '6\u201316', name: 'Mid-Rise', min: 6, max: 16 },
  { id: 'high', label: '17\u201329', name: 'High-Rise', min: 17, max: 29 },
  { id: 'penthouse', label: '30\u201334', name: 'Penthouse', min: 30, max: 34 },
];

export const CATEGORIES: { id: Category; label: string; order: number }[] = [
  { id: 'studio', label: 'Studio', order: 0 },
  { id: 'convertible', label: 'Convertible / Jr. Convertible', order: 1 },
  { id: '1br', label: '1 Bed', order: 2 },
  { id: '2br', label: '2 Bed', order: 3 },
  { id: '3br', label: '3 Bed', order: 4 },
];

const IMG_BASE = '/images/floor-plans';

export function parseFloors(label: string) {
  const mezzanine = label.includes('M');
  const clean = label.replace(/M/g, '');
  const parts = clean
    .split('-')
    .map((s) => parseInt(s, 10))
    .filter((n) => !Number.isNaN(n));
  let min = parts[0];
  let max = parts.length > 1 ? parts[parts.length - 1] : parts[0];
  // The mezzanine counts as its own numbered residential level, one above the
  // floor it sits on: the sheets have no "floor 5" yet the podium band runs
  // 2-5 — level 5 IS the "4M" mezzanine, so unit line 2 there is unit 0502.
  if (mezzanine) {
    if (parts.length === 1 && /^[0-9]+M$/.test(label)) {
      // A pure mezzanine sheet like "4M" covers only the mezzanine level.
      min = max = max + 1;
    } else {
      // A range ending in the mezzanine ("3-4M", "4-4M") includes it.
      max = max + 1;
    }
  }
  const floors: number[] = [];
  for (let i = min; i <= max; i++) floors.push(i);
  return { floors, min, max, mezzanine };
}

// Raw records, in sheet order. Fields: unit, floorLabel, category, typeLabel, beds, baths, den, sqft
// (sqft is a single figure, or [min, max] when the sheet prints a range).
type Raw = [number, string, Category, string, number, number, boolean, number | [number, number]];

const RAW: Raw[] = [
  [5, '2', '2br', '2 Bed / 1 Bath', 2, 1, false, 821],
  [6, '2', '1br', '1 Bed / 1 Bath', 1, 1, false, 619],
  [7, '2', '1br', '1 Bed / 1 Bath', 1, 1, false, 630],
  [8, '2', '2br', '2 Bed / 2 Bath', 2, 2, false, 1003],
  [9, '2', '2br', '2 Bed / 2 Bath', 2, 2, false, 929],
  [10, '2', '2br', '2 Bed / 2 Bath', 2, 2, false, 935],
  [1, '3', '2br', '2 Bed / 2 Bath', 2, 2, false, 1135],
  [2, '3', 'studio', 'Studio', 0, 1, false, 448],
  [3, '3-4M', '1br', '1 Bed / 1 Bath', 1, 1, false, 656],
  [4, '3', '2br', '2 Bed / 2 Bath', 2, 2, false, 1079],
  [1, '4-4M', '1br', '1 Bed / 1 Bath', 1, 1, false, 768],
  [2, '4-4M', '1br', '1 Bed / 1 Bath', 1, 1, false, 628],
  [4, '4', '2br', '2 Bed / 2 Bath', 2, 2, false, 1026],
  [4, '4M', '2br', '2 Bed / 2 Bath', 2, 2, false, 1052],
  [1, '6-29', '2br', '2 Bed / 2 Bath', 2, 2, false, 899],
  [2, '6-29', 'convertible', 'Convertible', 0, 1, false, 554],
  [3, '6-29', 'studio', 'Studio', 0, 1, false, 484],
  [4, '6-29', '2br', '2 Bed + Den / 2 Bath', 2, 2, true, 983],
  [5, '6-29', 'convertible', 'Jr. Convertible', 0, 1, false, 450],
  // v0.7 book consolidated unit line 6's former 6-16 / 17-21 sheets into one
  // 6-29 sheet (printed "769-776 SF") — this also gives apartment 2406 (AC) a
  // covering plan card (see data/ada.ts).
  [6, '6-29', '2br', '2 Bed / 1 Bath', 2, 1, false, [769, 776]],
  [7, '6-16', '1br', '1 Bed / 1 Bath', 1, 1, false, 665],
  [8, '6-29', '1br', '1 Bed / 1 Bath', 1, 1, false, 645],
  [9, '6-29', '2br', '2 Bed / 1 Bath', 2, 1, false, 779],
  [10, '6-29', 'convertible', 'Jr. Convertible', 0, 1, false, 478],
  [1, '30-34', '3br', '3 Bed / 3 Bath', 3, 3, false, 1455],
  [2, '30-34', '3br', '3 Bed / 3 Bath', 3, 3, false, 1528],
  [3, '30-34', 'convertible', 'Jr. Convertible', 0, 1, false, 456],
  [4, '30-34', '2br', '2 Bed / 1 Bath', 2, 1, false, 767],
  [5, '30-34', '1br', '1 Bed / 1 Bath', 1, 1, false, 669],
  [6, '30-34', '1br', '1 Bed / 1 Bath', 1, 1, false, 651],
  [7, '30-34', '2br', '2 Bed / 1 Bath', 2, 1, false, 779],
  [8, '30-34', 'convertible', 'Jr. Convertible', 0, 1, false, 478],
  [7, '22-29', '1br', '1 Bed / 1 Bath', 1, 1, false, 672],
  [7, '17-21', '1br', '1 Bed / 1 Bath', 1, 1, false, 669],
];

export function slugFor(unit: number, floorLabel: string): string {
  const floors = floorLabel.toLowerCase();
  const single = /^[0-9]+m?$/.test(floors);
  const prefix = single ? 'floor' : 'floors';
  return `unit-${unit}-${prefix}-${floors.replace(/-/g, '-')}`;
}

import { adaUnitsAmong, isAdaQuery, type AdaDesignation } from './ada';

export const plans: Plan[] = RAW.map(([unit, floorLabel, category, typeLabel, beds, baths, den, rawSqft]) => {
  const { floors, min, max, mezzanine } = parseFloors(floorLabel);
  const id = slugFor(unit, floorLabel);
  const [sqftMin, sqft] = Array.isArray(rawSqft) ? rawSqft : [rawSqft, rawSqft];
  return {
    id,
    unit,
    floorLabel,
    floors,
    floorMin: min,
    floorMax: max,
    mezzanine,
    category,
    typeLabel,
    beds,
    baths,
    den,
    sqft,
    sqftMin,
    images: {
      thumb: `${IMG_BASE}/${id}-thumb.webp`,
      detail: `${IMG_BASE}/${id}-detail.webp`,
      zoom: `${IMG_BASE}/${id}-zoom.webp`,
    },
  };
});

export interface PlanGroup {
  id: string;
  unit: number;
  category: Category;
  typeLabel: string;
  beds: number;
  baths: number;
  den: boolean;
  sqftMin: number;
  sqftMax: number;
  /** Distinct floor bands this residence line is offered on. */
  bands: FloorBand[];
  /** All floor numbers across variants (for search). */
  floors: number[];
  /** Individual floor-band variants that make up this group. */
  variants: Plan[];
  /** Representative image (lowest-floor variant). */
  images: Plan['images'];
}

export function bandsForFloors(min: number, max: number): FloorBand[] {
  return FLOOR_BANDS.filter((b) => min <= b.max && max >= b.min);
}

export function groupKey(p: Plan): string {
  return `${p.unit}-${p.category}-${p.baths}-${p.den ? 'den' : 'std'}`;
}

export const planGroups: PlanGroup[] = (() => {
  const map = new Map<string, Plan[]>();
  for (const p of plans) {
    const key = groupKey(p);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }
  const groups: PlanGroup[] = [];
  for (const [key, variants] of map) {
    const sorted = [...variants].sort((a, b) => a.floorMin - b.floorMin);
    const rep = sorted[0];
    const sqfts = sorted.flatMap((v) => [v.sqftMin, v.sqft]);
    const floors = Array.from(new Set(sorted.flatMap((v) => v.floors))).sort((a, b) => a - b);
    const bandSet = new Map<string, FloorBand>();
    for (const v of sorted) {
      for (const b of bandsForFloors(v.floorMin, v.floorMax)) bandSet.set(b.id, b);
    }
    const bands = FLOOR_BANDS.filter((b) => bandSet.has(b.id));
    groups.push({
      id: key,
      unit: rep.unit,
      category: rep.category,
      typeLabel: rep.typeLabel,
      beds: rep.beds,
      baths: rep.baths,
      den: rep.den,
      sqftMin: Math.min(...sqfts),
      sqftMax: Math.max(...sqfts),
      bands,
      floors,
      variants: sorted,
      images: rep.images,
    });
  }
  return groups;
})();

export const SQFT_MIN = Math.min(...plans.map((p) => p.sqftMin));
export const SQFT_MAX = Math.max(...plans.map((p) => p.sqft));

/** "776" or "769–776" — a plan's printed square footage, formatted. */
export function planSqftLabel(p: Plan): string {
  return p.sqftMin === p.sqft
    ? p.sqft.toLocaleString()
    : `${p.sqftMin.toLocaleString()}\u2013${p.sqft.toLocaleString()}`;
}

export function bandLabelForGroup(g: PlanGroup): string {
  return g.bands.map((b) => b.label).join(', ');
}

/**
 * Actual apartment unit numbers for a single plan: each floor and the unit line
 * both zero-padded to two digits (FFUU). E.g. unit 6 on floor 6 -> "0606";
 * unit 2 on floors 30-34 -> 3002, 3102, 3202, 3302, 3402.
 */
export function unitNumbersForPlan(p: Plan): string[] {
  const line = String(p.unit).padStart(2, '0');
  return p.floors.map((f) => `${String(f).padStart(2, '0')}${line}`);
}

/**
 * Index of the group variant whose floor range contains the given apartment
 * unit number ("FFUU", e.g. "0606" -> floor 6). Falls back to 0 when the
 * floor cannot be parsed or no variant matches.
 */
export function variantIndexForUnit(g: PlanGroup, unitNumber: string): number {
  const digits = unitNumber.replace(/\D/g, '');
  if (digits.length < 3) return 0;
  const floor = Number(digits.slice(0, -2));
  if (!Number.isFinite(floor)) return 0;
  const idx = g.variants.findIndex((v) => v.floors.includes(floor));
  return idx >= 0 ? idx : 0;
}

/** Every apartment unit number across a group's full floor range. */
export function unitNumbersForGroup(g: PlanGroup): string[] {
  const line = String(g.unit).padStart(2, '0');
  return g.floors.map((f) => `${String(f).padStart(2, '0')}${line}`);
}

/**
 * Designated (A)/(AC) apartments within a group's full floor range, from the
 * as-built accessibility matrix (see data/ada.ts).
 */
export function adaUnitsForGroup(g: PlanGroup): { unit: string; designation: AdaDesignation }[] {
  return adaUnitsAmong(unitNumbersForGroup(g));
}

export function groupHasAdaUnits(g: PlanGroup): boolean {
  return adaUnitsForGroup(g).length > 0;
}

/**
 * Match a group against a free-text query. Numeric tokens match the unit line,
 * a floor number, or an apartment unit number — short forms are zero-padded to
 * the 4-digit unit-number form ("203" is treated as "0203"). Non-numeric text
 * matches the type label, "unit N" phrasing, or a floor-band label.
 */
export function groupMatchesQuery(g: PlanGroup, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  // Any standalone numbers in the query
  const tokens: string[] = q.match(/\d+/g) || [];
  if (tokens.length) {
    const unitNumbers = new Set(unitNumbersForGroup(g));
    return tokens.every((tok) => {
      const n = parseInt(tok, 10);
      // Unit numbers are always 4 digits (pad2 floor + pad2 line), so a shorter
      // numeric query is zero-padded to that form: "203" -> "0203".
      return g.unit === n || g.floors.includes(n) || unitNumbers.has(tok.padStart(4, '0'));
    });
  }
  // ADA/accessibility terms match groups with designated (A)/(AC) apartments.
  if (isAdaQuery(q)) return groupHasAdaUnits(g);
  // Text search across type label + "unit N" + floor labels
  const haystack = [
    g.typeLabel.toLowerCase(),
    `unit ${g.unit}`,
    ...g.variants.map((v) => v.floorLabel.toLowerCase()),
  ].join(' ');
  return haystack.includes(q);
}

/** Structural filter state (bedroom categories, floor bands, sqft range). */
export interface GroupFilterState {
  categories: Set<Category>;
  bands: Set<string>;
  sqft: [number, number];
  /** When true, only groups with designated (A)/(AC) apartments match. */
  ada: boolean;
}

/** Match a group against the combined category / floor-band / sqft-range filter. */
export function groupMatchesFilters(g: PlanGroup, filters: GroupFilterState): boolean {
  if (filters.categories.size > 0 && !filters.categories.has(g.category)) return false;
  if (filters.bands.size > 0 && !g.bands.some((b) => filters.bands.has(b.id))) return false;
  // sqft ranges overlap if the group's [min, max] intersects the filter's [lo, hi].
  if (g.sqftMax < filters.sqft[0] || g.sqftMin > filters.sqft[1]) return false;
  if (filters.ada && !groupHasAdaUnits(g)) return false;
  return true;
}

/** Apply the free-text query and the combined filter together. */
export function filterGroups(
  groups: PlanGroup[],
  search: string,
  filters: GroupFilterState,
): PlanGroup[] {
  return groups.filter((g) => groupMatchesQuery(g, search) && groupMatchesFilters(g, filters));
}

/** Sort keys exposed by the Floor Plans "sort by" control. */
export type SortKey = 'featured' | 'beds-asc' | 'beds-desc' | 'size-desc' | 'size-asc';

/**
 * Category display order used by the "Featured" sort. Kept as an explicit list
 * (studio → convertible → 1br → 2br → 3br) so the featured ordering is locked in
 * place independently of the CATEGORIES array.
 */
const FEATURED_CATEGORY_ORDER: Category[] = ['studio', 'convertible', '1br', '2br', '3br'];

function featuredRank(g: PlanGroup): number {
  return FEATURED_CATEGORY_ORDER.indexOf(g.category);
}

/**
 * Pure comparator for two plan groups under a given sort key. Returns a negative
 * number when `a` should sort before `b`, positive when after, and 0 for a tie.
 *
 * Tie-break rules:
 * - featured:  category order, then unit number ascending
 * - beds-asc:  bedroom count ascending, then smallest sqft ascending
 * - beds-desc: bedroom count descending, then largest sqft descending
 * - size-desc: largest sqft descending
 * - size-asc:  smallest sqft ascending
 */
export function compareGroups(a: PlanGroup, b: PlanGroup, sort: SortKey): number {
  switch (sort) {
    case 'size-desc':
      return b.sqftMax - a.sqftMax;
    case 'size-asc':
      return a.sqftMin - b.sqftMin;
    case 'beds-asc':
      return a.beds - b.beds || a.sqftMin - b.sqftMin;
    case 'beds-desc':
      return b.beds - a.beds || b.sqftMax - a.sqftMax;
    case 'featured':
    default:
      return featuredRank(a) - featuredRank(b) || a.unit - b.unit;
  }
}

/**
 * Return a new array of groups ordered by the given sort key. Does not mutate
 * the input array.
 */
export function sortGroups(groups: PlanGroup[], sort: SortKey): PlanGroup[] {
  return [...groups].sort((a, b) => compareGroups(a, b, sort));
}

/**
 * Step to the next position within a filtered list, wrapping around at both
 * ends. Returns the current index unchanged when there is nothing to navigate.
 */
export function nextPosition(current: number, dir: -1 | 1, total: number): number {
  if (total <= 0 || current < 0) return current;
  return (current + dir + total) % total;
}

/**
 * Resolve a deep-linked `?plan=` id: returns the id when it matches an existing
 * group, otherwise null (unknown / missing ids are ignored).
 */
export function resolveDeepLink(groups: PlanGroup[], id: string | null): string | null {
  return id && groups.some((g) => g.id === id) ? id : null;
}

/**
 * JSON-LD ItemList of every floor-plan group, surfaced on /floor-plans via
 * <Seo extraJsonLd>. Shared with the prerenderer (entry-server.tsx) so the
 * static HTML and the client emit identical structured data.
 */
const CATEGORY_SCHEMA_LABEL: Record<Category, string> = {
  studio: 'Studio',
  convertible: 'Convertible',
  '1br': 'One Bedroom',
  '2br': 'Two Bedroom',
  '3br': 'Three Bedroom',
};

export function floorPlansItemListJsonLd(): Record<string, unknown> {
  // NOTE: No `Offer` (price/availability) nodes are emitted here on purpose.
  // Pricing lives off-site (Highland/AppFolio) and is not displayed on the
  // page; schema must never claim prices the visitor cannot see. If live
  // per-plan pricing ever lands on /floor-plans, map it to an `offers` node
  // on each item — sourced from the same data the page renders.
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Floor Plans at Exhibit On Superior',
    itemListElement: planGroups.map((g, i) => {
      const floorRange =
        g.floors.length > 1 ? `floors ${g.floors[0]}\u2013${g.floors[g.floors.length - 1]}` : `floor ${g.floors[0]}`;
      return {
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Apartment',
          name: `${g.typeLabel} \u2013 Unit ${g.unit}`,
          description: `${g.typeLabel} residence line (unit ${String(g.unit).padStart(2, '0')}) at Exhibit On Superior, offered on ${floorRange}, ${
            g.sqftMin === g.sqftMax ? `${g.sqftMin} sq ft` : `${g.sqftMin}\u2013${g.sqftMax} sq ft`
          }.`,
          url: `https://www.rentatexhibit.com/available-units?plan=${encodeURIComponent(g.id)}`,
          accommodationCategory: CATEGORY_SCHEMA_LABEL[g.category],
          numberOfBathroomsTotal: g.baths,
          ...(g.beds > 0 ? { numberOfBedrooms: g.beds } : {}),
          floorSize: {
            '@type': 'QuantitativeValue',
            minValue: g.sqftMin,
            maxValue: g.sqftMax,
            unitCode: 'FTK',
            unitText: 'sq ft',
          },
          containedInPlace: { '@id': 'https://www.rentatexhibit.com#apartmentcomplex' },
          image: `https://www.rentatexhibit.com${g.images.detail}`,
        },
      };
    }),
  };
}
