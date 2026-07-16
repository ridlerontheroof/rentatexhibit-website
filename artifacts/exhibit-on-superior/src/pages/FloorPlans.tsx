import { useEffect, useMemo, useState } from 'react';
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
import { PlanFilters, type FilterState } from '../components/floor-plans/PlanFilters';
import { PlanLightbox } from '../components/floor-plans/PlanLightbox';
import {
  planGroups,
  filterGroups,
  sortGroups,
  nextPosition,
  resolveDeepLink,
  floorPlansItemListJsonLd,
  SQFT_MIN,
  SQFT_MAX,
  type Category,
  type PlanGroup,
  type SortKey,
} from '../data/floorPlans';

const AVAILABILITY_URL = 'https://www.highlandptrs.com/chicago-availability?search=exhibit';

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

function writePlanToUrl(id: string | null) {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  if (id) params.set('plan', id);
  else params.delete('plan');
  const query = params.toString();
  const newUrl = `${window.location.pathname}${query ? `?${query}` : ''}`;
  window.history.replaceState(null, '', newUrl);
}

// Shared with the build-time prerenderer (see entry-server.tsx) so the static
// HTML and the client emit identical floor-plan structured data.
const structuredData = floorPlansItemListJsonLd();

export function FloorPlans() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    categories: new Set<Category>(),
    bands: new Set<string>(),
    sqft: [SQFT_MIN, SQFT_MAX],
  });
  const [sort, setSort] = useState<SortKey>('featured');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [openId, setOpenId] = useState<string | null>(null);
  const [variantIndex, setVariantIndex] = useState(0);

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

  const openGroup = openId ? planGroups.find((g) => g.id === openId) ?? null : null;
  const openPosition = openGroup ? filtered.findIndex((g) => g.id === openGroup.id) : -1;

  const handleOpen = (group: PlanGroup) => {
    setOpenId(group.id);
    setVariantIndex(0);
    writePlanToUrl(group.id);
  };

  const handleClose = () => {
    setOpenId(null);
    writePlanToUrl(null);
  };

  const handleNavigate = (dir: -1 | 1) => {
    if (openPosition < 0 || filtered.length === 0) return;
    const next = nextPosition(openPosition, dir, filtered.length);
    const nextGroup = filtered[next];
    setOpenId(nextGroup.id);
    setVariantIndex(0);
    writePlanToUrl(nextGroup.id);
  };

  const toggleCategory = (c: Category) =>
    setFilters((f) => {
      const categories = new Set(f.categories);
      categories.has(c) ? categories.delete(c) : categories.add(c);
      return { ...f, categories };
    });

  const toggleBand = (id: string) =>
    setFilters((f) => {
      const bands = new Set(f.bands);
      bands.has(id) ? bands.delete(id) : bands.add(id);
      return { ...f, bands };
    });

  const setSqft = (range: [number, number]) => setFilters((f) => ({ ...f, sqft: range }));

  const hasActiveFilters =
    search.trim() !== '' ||
    filters.categories.size > 0 ||
    filters.bands.size > 0 ||
    filters.sqft[0] !== SQFT_MIN ||
    filters.sqft[1] !== SQFT_MAX;

  const resetAll = () => {
    setSearch('');
    setFilters({ categories: new Set(), bands: new Set(), sqft: [SQFT_MIN, SQFT_MAX] });
  };

  const filterProps = {
    state: filters,
    sqftMin: SQFT_MIN,
    sqftMax: SQFT_MAX,
    onToggleCategory: toggleCategory,
    onToggleBand: toggleBand,
    onSqftChange: setSqft,
  };

  return (
    <>
      <Seo path="/floor-plans" extraJsonLd={[structuredData]} />

      <div>
        <PageHero
          image="/images/image-030-012417-5663-hxwee6.jpg"
          alt="Floor Plans | Exhibit On Superior in Chicago, Illinois"
          titleScript="Smartly Designed Residences"
          title="Studio, 1, 2 & 3 Bedroom Apartments"
          subtitle="Floor Plans"
        />

        <QuickAnswer path="/floor-plans" />

        <section className="px-4 py-14">
          <div className="container mx-auto max-w-3xl text-center">
            <SplitHeadline script="Live Smart, Live Beautifully" caps="Find Your Floor Plan" className="mb-6" />
            <p className="text-lg leading-relaxed text-muted-foreground">
              Explore every layout at Exhibit On Superior. Search by unit or floor, filter by
              size and bedroom count, then open any plan for a closer look. When you're ready, check
              live availability and pricing with our leasing team.
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
                        <SelectTrigger className="w-[170px]">
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

                {/* Grid or empty state */}
                {filtered.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {filtered.map((group) => (
                      <PlanCard key={group.id} group={group} onOpen={handleOpen} />
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
        <section className="bg-dark-section px-4 py-16">
          <div className="container mx-auto max-w-3xl text-center">
            <SplitHeadline script="Embrace Unbounded" caps="City Living" dark className="mb-6" />
            <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-white/80">
              Found a layout you love? Check real-time availability and pricing, or connect with our
              leasing team to schedule a personal tour.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <a
                href={AVAILABILITY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold-outline border-white bg-primary text-white hover:bg-primary/90"
              >
                Check Availability
              </a>
              <Link href="/schedule-a-tour" className="btn-gold-outline border-white text-white hover:bg-white hover:text-foreground">
                Schedule a Tour
              </Link>
              <Link href="/photo-gallery" className="btn-gold-outline border-white text-white hover:bg-white hover:text-foreground">
                See More Photos
              </Link>
            </div>
          </div>
        </section>

        <FaqSection path="/floor-plans" />
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
