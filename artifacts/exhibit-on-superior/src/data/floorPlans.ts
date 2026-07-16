// Floor plan dataset for Exhibit On Superior.
// Source of truth: the 35 owned floor-plan sheets. Each record is one plan
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
  sqft: number;
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

function parseFloors(label: string) {
  const mezzanine = label.includes('M');
  const clean = label.replace(/M/g, '');
  const parts = clean
    .split('-')
    .map((s) => parseInt(s, 10))
    .filter((n) => !Number.isNaN(n));
  const min = parts[0];
  const max = parts.length > 1 ? parts[parts.length - 1] : parts[0];
  const floors: number[] = [];
  for (let i = min; i <= max; i++) floors.push(i);
  return { floors, min, max, mezzanine };
}

// Raw records, in sheet order. Fields: unit, floorLabel, category, typeLabel, beds, baths, den, sqft
type Raw = [number, string, Category, string, number, number, boolean, number];

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
  [6, '6-16', '2br', '2 Bed / 1 Bath', 2, 1, false, 776],
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
  [6, '17-21', '2br', '2 Bed / 1 Bath', 2, 1, false, 769],
];

function slugFor(unit: number, floorLabel: string): string {
  const floors = floorLabel.toLowerCase();
  const single = /^[0-9]+m?$/.test(floors);
  const prefix = single ? 'floor' : 'floors';
  return `unit-${unit}-${prefix}-${floors.replace(/-/g, '-')}`;
}

export const plans: Plan[] = RAW.map(([unit, floorLabel, category, typeLabel, beds, baths, den, sqft]) => {
  const { floors, min, max, mezzanine } = parseFloors(floorLabel);
  const id = slugFor(unit, floorLabel);
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

function bandsForFloors(min: number, max: number): FloorBand[] {
  return FLOOR_BANDS.filter((b) => min <= b.max && max >= b.min);
}

function groupKey(p: Plan): string {
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
    const sqfts = sorted.map((v) => v.sqft);
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

export const SQFT_MIN = Math.min(...plans.map((p) => p.sqft));
export const SQFT_MAX = Math.max(...plans.map((p) => p.sqft));

export function bandLabelForGroup(g: PlanGroup): string {
  return g.bands.map((b) => b.label).join(', ');
}

/** Match a group against a free-text query (unit number or floor number). */
export function groupMatchesQuery(g: PlanGroup, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  // Any standalone numbers in the query
  const nums = (q.match(/\d+/g) || []).map((n) => parseInt(n, 10));
  if (nums.length) {
    return nums.every((n) => g.unit === n || g.floors.includes(n));
  }
  // Text search across type label + "unit N" + floor labels
  const haystack = [
    g.typeLabel.toLowerCase(),
    `unit ${g.unit}`,
    ...g.variants.map((v) => v.floorLabel.toLowerCase()),
  ].join(' ');
  return haystack.includes(q);
}
