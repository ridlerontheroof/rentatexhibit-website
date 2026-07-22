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
import { AvailableUnits } from '../components/floor-plans/AvailableUnits';
import { PlanFilters, type FilterState } from '../components/floor-plans/PlanFilters';
import { PlanLightbox } from '../components/floor-plans/PlanLightbox';
import { SmartImg } from '../components/SmartImg';
import { TOUR_URL } from '../data/seo';
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
      <Seo path="/available-units" extraJsonLd={[structuredData]} />

      <div>
        <PageHero
          image="/images/image-030-012417-5663-hxwee6.jpg"
          alt="Available Units | Exhibit On Superior in Chicago, Illinois"
          titleScript="Move-In Ready Residences"
          title="Available Units & Floor Plans"
          subtitle="Studio, 1, 2 & 3 Bedroom Apartments in River North Chicago"
        />

        <QuickAnswer path="/available-units" />

        <AvailableUnits onView={handleOpen} />

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

        <section className="bg-dark-section px-4 py-16">
          <div className="container mx-auto max-w-3xl text-center">
            <SplitHeadline script="Embrace Unbounded" caps="City Living" dark className="mb-6" />
            <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-white/80">
              Found a layout you love? Check real-time availability and pricing, or connect with our
              leasing team to schedule a personal tour.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <a
                href="#available-units"
                className="btn-gold-outline border-white bg-primary text-white hover:bg-primary/90"
              >
                Check Availability
              </a>
              <a href={TOUR_URL} target="_blank" rel="noopener noreferrer" className="btn-gold-outline border-white text-white hover:bg-white hover:text-foreground">
                Schedule a Tour
              </a>
              <Link href="/photo-gallery" className="btn-gold-outline border-white text-white hover:bg-white hover:text-foreground">
                See More Photos
              </Link>
            </div>
          </div>
        </section>

        <FaqSection path="/available-units" />
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
