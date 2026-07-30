// Shareable floor-plan filter state <-> URL round-trip.
//
// One pure module (no React, no hooks — the pure-data-module convention) so
// BOTH filterable plan views share the exact same query params and rules:
//   - /available-units (pages/FloorPlans.tsx, the live-inventory page)
//   - /floor-plans     (pages/FloorPlansHub.tsx, the layout directory hub)
// Params: `beds` (categories), `floors` (bands), `sqft=min-max`, `ada`,
// `q` (free-text search), `sort`. Defaults delete their param so the
// no-filter URL stays exactly the clean canonical one.
//
// SEO note: nothing links to a filtered URL variant, canonicals always point
// at the bare paths, and the prerender never reads these params (readers
// return defaults when `window` is undefined), so no crawlable duplicates.
import {
  CATEGORIES,
  FLOOR_BANDS,
  SQFT_MIN,
  SQFT_MAX,
  type Category,
  type SortKey,
} from './floorPlans';
import type { FilterState } from '../components/floor-plans/PlanFilters';

const VALID_CATEGORIES = new Set<Category>(['studio', 'convertible', '1br', '2br', '3br']);
const VALID_BANDS = new Set(FLOOR_BANDS.map((b) => b.id));
const VALID_SORTS = new Set<SortKey>(['featured', 'size-desc', 'size-asc', 'beds-asc', 'beds-desc']);

// The full shareable view state: sidebar filters plus the free-text search
// (`q`) and sort order (`sort`), so a copied link reproduces the whole view.
export type ShareableState = FilterState & { q: string; sort: SortKey };

// Deep-link: `?ada=1` lands visitors with the ADA-accessible filter already on
// (used by the accessibility statement, the ADA Knowledge article, and ads).
export function readAdaFromUrl(): boolean {
  if (typeof window === 'undefined') return false;
  const value = new URLSearchParams(window.location.search).get('ada');
  return value === '1' || value === 'true';
}

export function readFiltersFromUrl(): ShareableState {
  const base: ShareableState = {
    categories: new Set<Category>(),
    bands: new Set<string>(),
    sqft: [SQFT_MIN, SQFT_MAX],
    ada: readAdaFromUrl(),
    q: '',
    sort: 'featured',
  };
  if (typeof window === 'undefined') return base;
  const params = new URLSearchParams(window.location.search);

  for (const raw of (params.get('beds') ?? '').split(',')) {
    const value = raw.trim() as Category;
    if (VALID_CATEGORIES.has(value)) base.categories.add(value);
  }
  for (const raw of (params.get('floors') ?? '').split(',')) {
    const value = raw.trim();
    if (VALID_BANDS.has(value)) base.bands.add(value);
  }
  const sqft = params.get('sqft');
  if (sqft) {
    const match = /^(\d+)-(\d+)$/.exec(sqft.trim());
    if (match) {
      const lo = Math.max(SQFT_MIN, Math.min(SQFT_MAX, Number(match[1])));
      const hi = Math.max(SQFT_MIN, Math.min(SQFT_MAX, Number(match[2])));
      if (lo <= hi) base.sqft = [lo, hi];
    }
  }
  base.q = (params.get('q') ?? '').trim();
  const sort = (params.get('sort') ?? '').trim() as SortKey;
  if (VALID_SORTS.has(sort)) base.sort = sort;
  return base;
}

export function writeFiltersToUrl(filters: ShareableState) {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);

  if (filters.categories.size > 0) {
    // Keep a stable, canonical order so equivalent views share one URL.
    const beds = CATEGORIES.filter((c) => filters.categories.has(c.id)).map((c) => c.id);
    params.set('beds', beds.join(','));
  } else params.delete('beds');

  if (filters.bands.size > 0) {
    const floors = FLOOR_BANDS.filter((b) => filters.bands.has(b.id)).map((b) => b.id);
    params.set('floors', floors.join(','));
  } else params.delete('floors');

  if (filters.sqft[0] !== SQFT_MIN || filters.sqft[1] !== SQFT_MAX) {
    params.set('sqft', `${filters.sqft[0]}-${filters.sqft[1]}`);
  } else params.delete('sqft');

  if (filters.ada) params.set('ada', '1');
  else params.delete('ada');

  // Defaults (empty search, "featured" sort) keep the URL clean.
  if (filters.q.trim() !== '') params.set('q', filters.q.trim());
  else params.delete('q');

  if (filters.sort !== 'featured') params.set('sort', filters.sort);
  else params.delete('sort');

  const query = params.toString();
  const newUrl = `${window.location.pathname}${query ? `?${query}` : ''}`;
  window.history.replaceState(null, '', newUrl);
}

/** True when any control differs from its default (drives "Clear all"). */
export function hasActiveFilters(filters: ShareableState): boolean {
  return (
    filters.q.trim() !== '' ||
    filters.categories.size > 0 ||
    filters.bands.size > 0 ||
    filters.sqft[0] !== SQFT_MIN ||
    filters.sqft[1] !== SQFT_MAX ||
    filters.ada
  );
}
