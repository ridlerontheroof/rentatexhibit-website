import { KnowledgeLinks } from '../components/KnowledgeLinks';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PageHero } from '../components/PageHero';
import { Link } from 'wouter';
import { Seo } from '../components/Seo';
import { QuickAnswer } from '../components/QuickAnswer';
import { FaqSection } from '../components/FaqSection';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { SplitHeadline } from '../components/SplitHeadline';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../components/ui/sheet';
import { PlanCard } from '../components/floor-plans/PlanCard';
import { AvailableUnits } from '../components/floor-plans/AvailableUnits';
import { useAvailability } from '../hooks/use-availability';
import { PlanFilters, type FilterState } from '../components/floor-plans/PlanFilters';
import { PlanLightbox } from '../components/floor-plans/PlanLightbox';
import { SmartImg } from '../components/SmartImg';
import {
  planGroups,
  filterGroups,
  sortGroups,
  nextPosition,
  resolveDeepLink,
  floorPlansItemListJsonLd,
} from '../data/floorPlans';
import { unitAvailabilityJsonLd } from '../data/unitJsonLd';
import { ADA_KEY, ADA_DISCLAIMER } from '../data/ada';
import {
  SQFT_MIN,
  SQFT_MAX,
  FLOOR_BANDS,
  CATEGORIES,
  type Category,
  type PlanGroup,
  type SortKey,
} from '../data/floorPlans';


const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'size-desc', label: 'Largest first' },
  { value: 'size-asc', label: 'Smallest first' },
  { value: 'beds-asc', label: 'Fewest bedrooms' },
  { value: 'beds-desc', label: 'Most bedrooms' },
];

function readPlanFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('plan');
}

// Deep-link: `?ada=1` lands visitors with the ADA-accessible filter already on
// (used by the accessibility statement, the ADA Knowledge article, and ads).
function readAdaFromUrl(): boolean {
  if (typeof window === 'undefined') return false;
  const value = new URLSearchParams(window.location.search).get('ada');
  return value === '1' || value === 'true';
}

// Opening a plan pushes a history entry so the phone's Back button closes the
// pop-up instead of leaving the page; plan-to-plan arrow navigation and close
// replace the current entry so history doesn't pile up.
function writePlanToUrl(id: string | null, mode: 'push' | 'replace' = 'replace') {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  if (id) params.set('plan', id);
  else params.delete('plan');
  const query = params.toString();
  const newUrl = `${window.location.pathname}${query ? `?${query}` : ''}`;
  if (mode === 'push') window.history.pushState(null, '', newUrl);
  else window.history.replaceState(null, '', newUrl);
}

// Shareable filters: bedroom categories (`beds`), floor bands (`floors`), and
// the square-footage range (`sqft=min-max`) round-trip to the URL the same way
// `ada` does, so copying the address bar reproduces the filtered view.
const VALID_CATEGORIES = new Set<Category>(['studio', 'convertible', '1br', '2br', '3br']);
const VALID_BANDS = new Set(FLOOR_BANDS.map((b) => b.id));
const VALID_SORTS = new Set<SortKey>(SORT_OPTIONS.map((o) => o.value));

// The full shareable view state: sidebar filters plus the free-text search
// (`q`) and sort order (`sort`), so a copied link reproduces the whole view.
export type ShareableState = FilterState & { q: string; sort: SortKey };

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

// Shared with the build-time prerenderer (see entry-server.tsx) so the static
// HTML and the client emit identical floor-plan structured data.
const structuredData = floorPlansItemListJsonLd();
// Baked fallback only — the component swaps in the live feed's units below so
// rented apartments drop out of the rendered Apartment/Offer graph immediately
// instead of lingering until the next publish.
const bakedUnitStructuredData = unitAvailabilityJsonLd();

export function FloorPlans() {
  const [filters, setFilters] = useState<ShareableState>(readFiltersFromUrl);
  const search = filters.q;
  const sort = filters.sort;
  // Live-feed structured data: once the availability query resolves (it starts
  // from the baked snapshot via placeholderData), the Apartment/Offer graph
  // reflects current inventory — a unit rented after the last publish
  // disappears from the rendered JSON-LD within one feed refresh.
  const { data: availability } = useAvailability();
  const unitStructuredData = useMemo(
    () =>
      availability
        ? unitAvailabilityJsonLd(availability.units, availability.updatedAt)
        : bakedUnitStructuredData,
    [availability],
  );
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [openId, setOpenId] = useState<string | null>(null);
  const [variantIndex, setVariantIndex] = useState(0);
  // True while the current history entry is the one handleOpen pushed. Lets a
  // manual close (the X) consume that entry with history.back() so the phone's
  // Back button afterwards leaves the page in one press instead of two.
  const pushedEntryRef = useRef(false);

  const filtered = useMemo(
    () => sortGroups(filterGroups(planGroups, search, filters), sort),
    [search, filters, sort],
  );

  // Deep-link: open from URL on load.
  useEffect(() => {
    const id = resolveDeepLink(planGroups, readPlanFromUrl());
    if (id) {
      setOpenId(id);
      setVariantIndex(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // History navigation: Back/Forward changes the URL without remounting the
  // page, so re-read the shareable state whenever the browser fires popstate.
  // (Normal filter changes go through updateFilters → writeFiltersToUrl and
  // never fire popstate, so this only runs on real history navigation.)
  // The `?plan=` deep-link is part of that state too: navigating history to a
  // URL with `plan` reopens that plan's lightbox, navigating away closes it.
  useEffect(() => {
    const onPopState = () => {
      // Whatever entry handleOpen pushed has been navigated away from, so a
      // later manual close must not call history.back() again.
      pushedEntryRef.current = false;
      setFilters(readFiltersFromUrl());
      const id = resolveDeepLink(planGroups, readPlanFromUrl());
      setOpenId(id);
      if (id) setVariantIndex(0);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const openGroup = openId ? planGroups.find((g) => g.id === openId) ?? null : null;
  const openPosition = openGroup ? filtered.findIndex((g) => g.id === openGroup.id) : -1;

  const handleOpen = (group: PlanGroup) => {
    setOpenId(group.id);
    setVariantIndex(0);
    writePlanToUrl(group.id, 'push');
    pushedEntryRef.current = true;
  };

  const handleClose = () => {
    setOpenId(null);
    if (pushedEntryRef.current) {
      // Consume the entry handleOpen pushed so one Back press leaves the page.
      // The resulting popstate re-runs the close (idempotent) and clears the flag.
      pushedEntryRef.current = false;
      window.history.back();
    } else {
      // Deep-link opens (no pushed entry) just clean the URL in place.
      writePlanToUrl(null);
    }
  };

  const handleNavigate = (dir: -1 | 1) => {
    if (openPosition < 0 || filtered.length === 0) return;
    const next = nextPosition(openPosition, dir, filtered.length);
    const nextGroup = filtered[next];
    setOpenId(nextGroup.id);
    setVariantIndex(0);
    writePlanToUrl(nextGroup.id);
  };

  // Single funnel for filter changes so the URL always mirrors the state.
  const updateFilters = (update: (f: ShareableState) => ShareableState) =>
    setFilters((f) => {
      const next = update(f);
      writeFiltersToUrl(next);
      return next;
    });

  const toggleCategory = (c: Category) =>
    updateFilters((f) => {
      const categories = new Set(f.categories);
      categories.has(c) ? categories.delete(c) : categories.add(c);
      return { ...f, categories };
    });

  const toggleBand = (id: string) =>
    updateFilters((f) => {
      const bands = new Set(f.bands);
      bands.has(id) ? bands.delete(id) : bands.add(id);
      return { ...f, bands };
    });

  const setSqft = (range: [number, number]) =>
    updateFilters((f) => ({ ...f, sqft: range }));

  const toggleAda = () => updateFilters((f) => ({ ...f, ada: !f.ada }));

  const setSearch = (q: string) => updateFilters((f) => ({ ...f, q }));
  const setSort = (sortKey: SortKey) => updateFilters((f) => ({ ...f, sort: sortKey }));

  const hasActiveFilters =
    search.trim() !== '' ||
    filters.categories.size > 0 ||
    filters.bands.size > 0 ||
    filters.sqft[0] !== SQFT_MIN ||
    filters.sqft[1] !== SQFT_MAX ||
    filters.ada;

  const resetAll = () =>
    updateFilters((f) => ({
      categories: new Set(),
      bands: new Set(),
      sqft: [SQFT_MIN, SQFT_MAX],
      ada: false,
      q: '',
      sort: f.sort,
    }));

  const filterProps = {
    state: filters,
    sqftMin: SQFT_MIN,
    sqftMax: SQFT_MAX,
    onToggleCategory: toggleCategory,
    onToggleBand: toggleBand,
    onSqftChange: setSqft,
    onToggleAda: toggleAda,
  };

  return (
    <>
      <Seo path="/available-units" extraJsonLd={[structuredData, unitStructuredData]} />

      <div>
        <PageHero
          image="/images/image-030-012417-5663-hxwee6.jpg"
          alt="Available Units | Exhibit On Superior in Chicago, Illinois"
          titleScript="Move-In Ready Residences"
          title="Available Units & Floor Plans"
          subtitle="Studio, 1, 2 & 3 Bedroom Apartments in River North Chicago"
          compact
        />

        <AvailableUnits />

        <QuickAnswer path="/available-units" />

        <section className="px-4 py-14">
          <div className="container mx-auto max-w-3xl text-center">
            <SplitHeadline script="Live Smart, Live Beautifully" caps="Explore All Floor Plans" className="mb-6" />
            <p className="text-lg leading-relaxed text-muted-foreground">
              Looking for a specific layout? Compare all Exhibit On Superior floor plans here,
              then check current unit availability and pricing above. Filter by bedroom count,
              square footage, floor range, or unit line to find your best fit.
            </p>
          </div>
        </section>

        <section className="px-4 pb-20">
          <div className="container mx-auto">
            <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-10">
              {/* Sidebar filters (desktop) */}
              <aside className="hidden lg:block">
                <div className="sticky top-24 space-y-6">
                  <label className="relative block">
                    <span className="sr-only">Search by unit or floor</span>
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search unit # or floor…"
                      className="pl-9"
                    />
                  </label>
                  <PlanFilters {...filterProps} />
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={resetAll}
                      className="flex items-center gap-1.5 text-sm uppercase tracking-wide text-primary hover:underline"
                    >
                      <X className="h-4 w-4" /> Clear all filters
                    </button>
                  )}
                </div>
              </aside>

              {/* Results column */}
              <div>
                {/* Top bar: mobile search + count + sort */}
                <div className="mb-6 space-y-4">
                  <label className="relative block lg:hidden">
                    <span className="sr-only">Search by unit or floor</span>
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search unit # or floor…"
                      className="pl-9"
                    />
                  </label>

                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm uppercase tracking-wide text-muted-foreground" aria-live="polite">
                      {filtered.length} {filtered.length === 1 ? 'plan' : 'plans'}
                    </p>

                    <div className="flex items-center gap-3">
                      {/* Mobile filter trigger */}
                      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                        <SheetTrigger asChild>
                          <button
                            type="button"
                            className="flex items-center gap-2 border border-border px-3 py-2 text-xs uppercase tracking-wide hover:border-primary lg:hidden"
                          >
                            <SlidersHorizontal className="h-4 w-4" />
                            Filters
                            {hasActiveFilters && (
                              <span className="ml-1 flex h-2 w-2 rounded-full bg-primary" aria-hidden />
                            )}
                          </button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[85vw] max-w-sm overflow-y-auto">
                          <SheetHeader>
                            <SheetTitle className="uppercase tracking-wider">Filter Plans</SheetTitle>
                          </SheetHeader>
                          <div className="mt-6">
                            <PlanFilters {...filterProps} />
                            {hasActiveFilters && (
                              <button
                                type="button"
                                onClick={resetAll}
                                className="mt-6 flex items-center gap-1.5 text-sm uppercase tracking-wide text-primary hover:underline"
                              >
                                <X className="h-4 w-4" /> Clear all filters
                              </button>
                            )}
                          </div>
                        </SheetContent>
                      </Sheet>

                      <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                        <SelectTrigger className="w-[170px]" aria-label="Sort plans">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SORT_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* ADA designation key + disclaimer — always shown while the
                    ADA filter is active, next to the results it explains. */}
                {filters.ada && (
                  <div className="mb-6 border border-border bg-white p-4 text-sm leading-relaxed text-muted-foreground">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[2px] text-foreground">
                      ADA designation key
                    </p>
                    {ADA_KEY.map((k) => (
                      <p key={k.code}>
                        <span className="font-semibold text-foreground">{k.label}</span>: {k.description}
                      </p>
                    ))}
                    <p className="mt-2">{ADA_DISCLAIMER}</p>
                  </div>
                )}

                {/* Grid or empty state */}
                {filtered.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {filtered.map((group) => (
                      <PlanCard key={group.id} group={group} onOpen={handleOpen} showAda={filters.ada} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center border border-dashed border-border py-20 text-center">
                    <p className="mb-2 text-lg uppercase tracking-wider">No plans match your search</p>
                    <p className="mb-6 max-w-md text-muted-foreground">
                      Try widening your filters or clearing your search to see every available layout.
                    </p>
                    <button type="button" onClick={resetAll} className="btn-gold-outline">
                      Reset filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        {/* Live Smart, Live Beautifully — carried over from the original site */}
        <section className="px-4 py-20">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
              <div className="lg:order-1">
                <SplitHeadline
                  script="Live Smart, Live Beautifully"
                  caps="Studio, 1, 2 & 3 Bedroom Floor Plans"
                  align="left"
                  className="mb-6"
                />
                <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
                  Choose your perfect floor plan and step up to a trend-forward home that provides
                  the ultimate respite from the hustle and bustle of Chicago. Packed with stylish
                  features and life-enhancing extras, the studio, one, two, and three bedroom
                  apartments at Exhibit On Superior are designed for ultimate modern living. Enjoy a
                  space that&rsquo;s uniquely yours, perfect for both relaxing and entertaining
                  right here at Exhibit.
                </p>
                <a href="#available-units" className="btn-gold-outline inline-block">
                  View Available Residences
                </a>
              </div>
              <div className="relative lg:order-2">
                <div aria-hidden="true" className="pointer-events-none absolute -right-4 -top-4 bottom-8 left-8 border border-primary" />
                <SmartImg
                  src="/images/image-031-012417-5607-piqxtr.jpg"
                  alt="Dining table and living room with blue accent wall at Exhibit On Superior in Chicago, Illinois"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="relative h-[320px] w-full object-cover md:h-[420px]"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Your Space, Your Style — carried over from the original site */}
        <section className="bg-dark-section px-4 py-20">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
              <div className="relative">
                <div aria-hidden="true" className="pointer-events-none absolute -left-4 -top-4 bottom-8 right-8 border border-primary" />
                <SmartImg
                  src="/images/image-014-exhibit-living-room-n5xrna.jpg"
                  alt="Living room with floor-to-ceiling windows and Chicago city views at Exhibit On Superior in Chicago, Illinois"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="relative h-[320px] w-full object-cover md:h-[420px]"
                />
              </div>
              <div>
                <SplitHeadline
                  script="Your Space, Your Style"
                  caps="Where Creativity and City Life Collide"
                  align="left"
                  dark
                  className="mb-6"
                />
                <p className="mb-8 text-lg leading-relaxed text-white">
                  Welcome home to your high-rise hideaway to a living space as vibrant as Chicago
                  itself. Our apartments strike the perfect balance of style, comfort, and
                  functionality in the heart of River North. Retreat to your personal sanctuary,
                  where thoughtfully designed bedrooms feature floor-to-ceiling windows that frame
                  stunning city views, ensuring that your private oasis is as beautiful as it is
                  comfortable. Your dream home is just a move away!
                </p>
                <Link href="/photo-gallery" className="btn-gold-outline inline-block">
                  See More Photos
                </Link>
              </div>
            </div>
          </div>
        </section>

        <FaqSection path="/available-units" />

        <KnowledgeLinks
          slugs={[
            'what-apartment-sizes',
            'which-units-have-balconies',
            'what-is-a-convertible',
            'largest-apartment',
            'ada-accessible-apartments',
            'lease-terms',
          ]}
        />
      </div>

      <PlanLightbox
        group={openGroup}
        variantIndex={variantIndex}
        position={{ index: openPosition, total: filtered.length }}
        onClose={handleClose}
        onNavigate={handleNavigate}
        onVariantChange={setVariantIndex}
      />
    </>
  );
}
