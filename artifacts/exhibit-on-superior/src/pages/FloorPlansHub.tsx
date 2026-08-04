import { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Seo } from '../components/Seo';
import { QuickAnswer } from '../components/QuickAnswer';
import { FaqSection } from '../components/FaqSection';
import { KnowledgeLinks } from '../components/KnowledgeLinks';
import { Input } from '../components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../components/ui/sheet';
import { PlanFilters } from '../components/floor-plans/PlanFilters';
import { CATEGORIES, SQFT_MIN, SQFT_MAX, type Category } from '../data/floorPlans';
import {
  FLOOR_PLAN_PAGES,
  filterFloorPlanPages,
  floorPlanCardTitle,
  floorPlanHubItemListJsonLd,
  floorPlanPagePath,
  planFloorPhrase,
  type FloorPlanPage,
} from '../data/floorPlanPages';
import { planSqftLabel } from '../data/floorPlans';
import {
  readFiltersFromUrl,
  writeFiltersToUrl,
  hasActiveFilters as computeHasActiveFilters,
  type ShareableState,
} from '../data/floorPlanFilterUrl';

/**
 * Floor-plan hub (/floor-plans): a complete crawlable directory of every
 * distinct plan layout, grouped by category, each linking to its own landing
 * page. Live pricing and inventory stay on /available-units — this hub (and
 * the pages under it) documents the layouts themselves, so it is always full
 * even when nothing is available.
 *
 * The filter panel narrows the card grid client-side only. In the prerender
 * the panel renders inert + aria-hidden with default state (the established
 * SSR-reserved control-row pattern): its space is reserved from first paint
 * so the interactive swap never shifts layout, the markdown twin skips it
 * (aria-hidden), and the crawler-visible directory is always the full grid.
 * Filter state round-trips to ?q/beds/floors/sqft/ada for shareable links;
 * the canonical always points at bare /floor-plans.
 */
export function FloorPlansHub() {
  const [filters, setFilters] = useState<ShareableState>(readFiltersFromUrl);
  const search = filters.q;

  // Back/Forward changes the URL without remounting; re-read shared state.
  useEffect(() => {
    const onPopState = () => setFilters(readFiltersFromUrl());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

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

  const setSqft = (range: [number, number]) => updateFilters((f) => ({ ...f, sqft: range }));
  const toggleAda = () => updateFilters((f) => ({ ...f, ada: !f.ada }));
  const setSearch = (q: string) => updateFilters((f) => ({ ...f, q }));

  const hasActiveFilters = computeHasActiveFilters(filters);

  const resetAll = () =>
    updateFilters((f) => ({
      categories: new Set(),
      bands: new Set(),
      sqft: [SQFT_MIN, SQFT_MAX],
      ada: false,
      q: '',
      sort: f.sort,
    }));

  const filtered = useMemo(
    () => filterFloorPlanPages(FLOOR_PLAN_PAGES, search, filters),
    [search, filters],
  );
  const filteredSlugs = useMemo(() => new Set(filtered.map((fp) => fp.slug)), [filtered]);

  return (
    <>
      <Seo
        path="/floor-plans"
        // `?ada=1` deep links get a distinct title so crawlers don't flag the
        // parameterized variant as a duplicate of the base page (canonical
        // still points at /floor-plans) — same rule as /available-units.
        title={
          filters.ada
            ? 'ADA-Accessible Floor Plan Layouts | Exhibit On Superior'
            : undefined
        }
        description={
          filters.ada
            ? 'Browse ADA-accessible floor plan layouts at Exhibit On Superior in River North, Chicago — accessible studio, convertible, and one-, two-, and three-bedroom plan sheets.'
            : undefined
        }
        extraJsonLd={[floorPlanHubItemListJsonLd()]}
      />
      <div>
        <section className="pt-28 pb-12 px-4 bg-dark-section text-center">
          <div className="container mx-auto max-w-3xl">
            <p className="eyebrow mb-3 text-primary">Floor Plans</p>
            <h1 className="text-3xl md:text-4xl uppercase tracking-wider text-white mb-4">
              River North Floor Plans &mdash; Studio to 3 Bedroom
            </h1>
            <p className="text-white/80 leading-relaxed">
              All {FLOOR_PLAN_PAGES.length} distinct layouts at Exhibit On Superior &mdash;
              studios, convertibles, and one-, two-, and three-bedroom homes &mdash; each with its
              plan sheet, floor range, and current availability.
            </p>
          </div>
        </section>

        <QuickAnswer path="/floor-plans" />

        <section className="px-4 pb-16">
          <div className="container mx-auto max-w-6xl">
            <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-10">
              {/* Sidebar filters (desktop). Prerender + pre-mount frames get an
                  inert aria-hidden twin (default state, identical geometry) so
                  first paint reserves the space, the markdown twin stays clean,
                  and no control is focusable before React takes over. */}
              <aside className="hidden lg:block">
                <div className="sticky top-24 space-y-6">
                  <HubFilterSidebar
                    filters={filters}
                    hasActiveFilters={hasActiveFilters}
                    onSearch={setSearch}
                    onToggleCategory={toggleCategory}
                    onToggleBand={toggleBand}
                    onSqftChange={setSqft}
                    onToggleAda={toggleAda}
                    onReset={resetAll}
                  />
                </div>
              </aside>

              {/* Results column */}
              <div>
                <HubFilterTopBar
                  filters={filters}
                  hasActiveFilters={hasActiveFilters}
                  shownCount={filtered.length}
                  onSearch={setSearch}
                  onToggleCategory={toggleCategory}
                  onToggleBand={toggleBand}
                  onSqftChange={setSqft}
                  onToggleAda={toggleAda}
                  onReset={resetAll}
                />

                {filtered.length > 0 ? (
                  CATEGORIES.map((cat) => {
                    const pages = FLOOR_PLAN_PAGES.filter(
                      (fp) => fp.plan.category === cat.id && filteredSlugs.has(fp.slug),
                    );
                    if (pages.length === 0) return null;
                    return (
                      <div key={cat.id} className="mt-12 first:mt-0">
                        <h2 className="mb-6 border-l-2 border-primary pl-3 text-xl uppercase tracking-wider text-foreground">
                          {cat.label}
                        </h2>
                        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                          {pages.map((fp) => (
                            <HubCard key={fp.slug} page={fp} />
                          ))}
                        </ul>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center border border-dashed border-border py-20 text-center">
                    <p className="mb-2 text-lg uppercase tracking-wider">No layouts match your search</p>
                    <p className="mb-6 max-w-md text-muted-foreground">
                      Try widening your filters or clearing your search to see every layout in the tower.
                    </p>
                    <button type="button" onClick={resetAll} className="btn-gold-outline">
                      Reset filters
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Citation-friendly comparison table — generated from FLOOR_PLAN_PAGES.
                Always the full directory: the table is the crawlable/citable
                surface, so the filter panel never narrows it. */}
            <div className="mt-16 overflow-x-auto border border-border bg-white p-6">
              <table className="w-full text-left text-sm">
                <caption className="mb-4 text-left text-lg uppercase tracking-wider text-foreground">
                  Floor Plan Comparison at Exhibit On Superior
                </caption>
                <thead>
                  <tr className="border-b border-border uppercase tracking-wider">
                    <th scope="col" className="py-2 pr-4">Floor Plan</th>
                    <th scope="col" className="py-2 pr-4">Beds / Baths</th>
                    <th scope="col" className="py-2 pr-4">Sq Ft</th>
                    <th scope="col" className="py-2">Floors</th>
                  </tr>
                </thead>
                <tbody>
                  {FLOOR_PLAN_PAGES.map((fp) => {
                    const p = fp.plan;
                    return (
                      <tr key={fp.slug} className="border-b border-border/50">
                        <th scope="row" className="py-2 pr-4 font-normal">
                          {/* aria-label carries sq ft + floor range so links to
                              different variants of the same residence line stay
                              unique for assistive tech (check:link-names). */}
                          <Link
                            href={floorPlanPagePath(fp.slug)}
                            className="text-primary underline"
                            aria-label={`${p.typeLabel} \u2014 Unit ${String(p.unit).padStart(2, '0')}, ${planSqftLabel(p)} sq ft, ${planFloorPhrase(p)}`}
                          >
                            {p.typeLabel} &mdash; Unit {String(p.unit).padStart(2, '0')}
                          </Link>
                        </th>
                        <td className="py-2 pr-4 text-muted-foreground">
                          {p.beds > 0 ? p.beds : p.typeLabel.includes('Convertible') ? 'Convertible' : 'Studio'} / {p.baths}
                        </td>
                        <td className="py-2 pr-4">{planSqftLabel(p)}</td>
                        <td className="py-2 text-muted-foreground">{p.floorLabel.replace(/-/g, '\u2013')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-16 border-t border-border pt-8 text-center">
              <p className="text-muted-foreground">
                Looking for what you can move into right now?
              </p>
              <Link
                href="/available-units"
                className="mt-4 inline-block bg-primary px-6 py-3 text-xs uppercase tracking-wider text-white transition-opacity hover:opacity-90"
              >
                See live availability &amp; pricing
              </Link>
            </div>
          </div>
        </section>

        {/* Cross-links into the bedroom-type landing pages (data/landingPages.ts). */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-3xl text-center">
            <p className="eyebrow mb-3">Browse by Residence Type</p>
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              <li>
                <Link href="/studio-apartments-river-north" className="text-sm uppercase tracking-wider text-primary hover:opacity-80 transition-opacity">
                  Studio Apartments
                </Link>
              </li>
              <li>
                <Link href="/convertible-apartments-river-north" className="text-sm uppercase tracking-wider text-primary hover:opacity-80 transition-opacity">
                  Convertible Apartments
                </Link>
              </li>
              <li>
                <Link href="/one-bedroom-apartments-river-north" className="text-sm uppercase tracking-wider text-primary hover:opacity-80 transition-opacity">
                  1 Bedroom Apartments
                </Link>
              </li>
              <li>
                <Link href="/two-bedroom-apartments-river-north" className="text-sm uppercase tracking-wider text-primary hover:opacity-80 transition-opacity">
                  2 Bedroom Apartments
                </Link>
              </li>
              <li>
                <Link href="/luxury-apartments-river-north" className="text-sm uppercase tracking-wider text-primary hover:opacity-80 transition-opacity">
                  Luxury Apartments in River North
                </Link>
              </li>
            </ul>
          </div>
        </section>

        {/* Knowledge Center cross-links: surfaces floor-plan-relevant articles
            so users browsing layouts can find informational answers, increasing
            pages-per-session and distributing link equity to Knowledge Center
            content that targets featured-snippet queries. */}
        <KnowledgeLinks
          slugs={[
            'what-apartment-sizes',
            'which-units-have-balconies',
            'what-is-a-convertible',
            'ada-accessible-apartments',
            'utility-fee-by-floor-plan',
          ]}
          title="Floor Plan Questions"
        />

        {/* Visible mirror of the page's FAQPage JSON-LD — Google penalizes
            FAQ markup whose Q&A isn't readable on the page. */}
        <FaqSection path="/floor-plans" />
      </div>
    </>
  );
}

interface HubFilterProps {
  filters: ShareableState;
  hasActiveFilters: boolean;
  onSearch: (q: string) => void;
  onToggleCategory: (c: Category) => void;
  onToggleBand: (id: string) => void;
  onSqftChange: (range: [number, number]) => void;
  onToggleAda: () => void;
  onReset: () => void;
}

/**
 * The search field. This hub searches the layout catalog (residence line /
 * floor), not live unit inventory — the label and placeholder say so.
 */
function HubSearchField({
  value,
  onSearch,
  className = '',
}: {
  value: string;
  onSearch: (q: string) => void;
  className?: string;
}) {
  return (
    <label className={`relative block ${className}`}>
      <span className="sr-only">Search layouts by residence line or floor</span>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        aria-label="Search layouts by residence line or floor"
        value={value}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search residence line or floor…"
        className="pl-9"
      />
    </label>
  );
}

function ClearFiltersButton({ onReset, className = '' }: { onReset: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onReset}
      className={`flex min-h-11 items-center gap-1.5 text-sm uppercase tracking-wide text-primary underline underline-offset-4 hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}
    >
      <X className="h-4 w-4" aria-hidden="true" /> Clear all filters
    </button>
  );
}

/** Desktop sidebar: search + the shared PlanFilters panel + clear. */
function HubFilterSidebarInner(props: HubFilterProps) {
  const { filters } = props;
  return (
    <>
      <HubSearchField value={filters.q} onSearch={props.onSearch} />
      <PlanFilters
        state={filters}
        sqftMin={SQFT_MIN}
        sqftMax={SQFT_MAX}
        onToggleCategory={props.onToggleCategory}
        onToggleBand={props.onToggleBand}
        onSqftChange={props.onSqftChange}
        onToggleAda={props.onToggleAda}
      />
      {props.hasActiveFilters && <ClearFiltersButton onReset={props.onReset} />}
    </>
  );
}

/**
 * SSR-reserved mounting (see memory: ssr-reserved-inert-controls): the
 * prerender ships the same markup inert + aria-hidden with default state, so
 * first paint reserves the exact geometry at every breakpoint, the
 * markdown-twin converter skips it, and nothing is focusable before React
 * mounts. The client renders the interactive panel from its first commit.
 */
const DEFAULT_FILTERS: ShareableState = {
  categories: new Set<Category>(),
  bands: new Set<string>(),
  sqft: [SQFT_MIN, SQFT_MAX],
  ada: false,
  q: '',
  sort: 'featured',
};

const NOOP = () => {};

function HubFilterSidebar(props: HubFilterProps) {
  if (import.meta.env.SSR) {
    return (
      <div inert aria-hidden="true" className="pointer-events-none select-none space-y-6">
        <HubFilterSidebarInner
          {...props}
          filters={DEFAULT_FILTERS}
          hasActiveFilters={false}
          onSearch={NOOP}
          onToggleCategory={NOOP}
          onToggleBand={NOOP}
          onSqftChange={NOOP}
          onToggleAda={NOOP}
          onReset={NOOP}
        />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <HubFilterSidebarInner {...props} />
    </div>
  );
}

/** Mobile search + filter sheet + shown-count live region row. */
function HubFilterTopBar(props: HubFilterProps & { shownCount: number }) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const { filters, shownCount } = props;

  const countText = `${shownCount} ${shownCount === 1 ? 'layout' : 'layouts'} shown`;

  const bar = (interactive: boolean) => (
    <div className="mb-6 space-y-4">
      <HubSearchField
        value={interactive ? filters.q : ''}
        onSearch={interactive ? props.onSearch : NOOP}
        className="lg:hidden"
      />
      <div className="flex items-center justify-between gap-4">
        {/* Screen-reader live region: filtering re-renders this text, and
            role="status" (polite) announces the new count without moving
            focus off the control that changed. */}
        <p
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="text-sm uppercase tracking-wide text-muted-foreground"
        >
          {interactive ? countText : `${FLOOR_PLAN_PAGES.length} layouts shown`}
        </p>

        {/* Mobile filter trigger */}
        {interactive ? (
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild>
              <button type="button" className={FILTER_TRIGGER_CLASSES}>
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                Filters
                {props.hasActiveFilters && (
                  <span className="ml-1 flex h-2 w-2 rounded-full bg-primary" aria-hidden />
                )}
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] max-w-sm overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="uppercase tracking-wider">Filter Layouts</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <PlanFilters
                  state={filters}
                  sqftMin={SQFT_MIN}
                  sqftMax={SQFT_MAX}
                  onToggleCategory={props.onToggleCategory}
                  onToggleBand={props.onToggleBand}
                  onSqftChange={props.onSqftChange}
                  onToggleAda={props.onToggleAda}
                />
                {props.hasActiveFilters && (
                  <ClearFiltersButton onReset={props.onReset} className="mt-6" />
                )}
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          <button type="button" className={FILTER_TRIGGER_CLASSES}>
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filters
          </button>
        )}
      </div>
    </div>
  );

  if (import.meta.env.SSR) {
    return (
      <div inert aria-hidden="true" className="pointer-events-none select-none">
        {bar(false)}
      </div>
    );
  }
  return bar(true);
}

const FILTER_TRIGGER_CLASSES =
  'flex min-h-11 items-center gap-2 border border-border px-3 py-2 text-xs uppercase tracking-wide hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:hidden';

function HubCard({ page }: { page: FloorPlanPage }) {
  const p = page.plan;
  return (
    <li>
      <Link
        href={floorPlanPagePath(page.slug)}
        className="group flex h-full flex-col border border-border bg-white transition-colors hover:border-primary"
      >
        <div className="relative aspect-4/3 overflow-hidden bg-muted">
          <img
            src={p.images.thumb}
            alt={`${p.typeLabel} floor plan diagram, ${planSqftLabel(p)} sq ft`}
            loading="lazy"
            width={600}
            height={450}
            className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-105"
          />
          <span className="absolute left-0 top-3 bg-primary px-3 py-1 text-xs uppercase tracking-wider text-white">
            Unit {String(p.unit).padStart(2, '0')}
          </span>
        </div>
        <div className="flex flex-1 flex-col p-5">
          {/* Title without the floor range — the floor range renders once,
              in the line below, so extraction/screen readers hear it once. */}
          <h3 className="text-base uppercase tracking-wider text-foreground">
            {floorPlanCardTitle(page)}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {planFloorPhrase(p).replace(/^f/, 'F')}
            {!page.balcony ? ' \u00b7 No balcony' : ''}
            {page.adaUnits.length > 0 ? ' \u00b7 ADA-designated apartments' : ''}
          </p>
        </div>
      </Link>
    </li>
  );
}
