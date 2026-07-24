import { useMemo } from 'react';
import { Link } from 'wouter';
import { BedDouble, Bath, Ruler, PawPrint } from 'lucide-react';
import {
  applyUrlForListing,
  tourUrlForListing,
} from './UnitGalleryLightbox';
import { SplitHeadline } from '../SplitHeadline';
import { useAvailability, type AvailableUnit } from '../../hooks/use-availability';
import { planGroups, type PlanGroup } from '../../data/floorPlans';
import { APPLY_URL } from '../../data/seo';
import { trackOutboundClick } from '../../lib/analytics';

function UnitThumb({ photoUrl, unit, eager = false }: { photoUrl: string; unit: string; eager?: boolean }) {
  // Eager-load only in the browser: React 19 SSR auto-emits a fixed-href
  // image preload for any eager plain <img>, which the prerender guard
  // rejects (and these AppFolio CDN photos shouldn't be preloaded from the
  // static HTML anyway — the snapshot's photo may have rotated by visit time).
  const eagerNow = eager && !import.meta.env.SSR;
  return (
    <img
      src={photoUrl}
      alt={`Apartment ${unit} interior`}
      loading={eagerNow ? 'eager' : 'lazy'}
      fetchPriority={eagerNow ? 'high' : undefined}
      width={112}
      height={84}
      className="h-[84px] w-[112px] object-cover transition-transform duration-300 hover:scale-105"
    />
  );
}

/**
 * Skeleton placeholder rows shown while the very first availability response
 * is still in flight and no baked snapshot exists — the section should never
 * be a blank gap that pops in late. Matches the real row geometry (thumb +
 * text lines + action buttons) so the swap to live cards is seamless.
 */
function UnitRowsSkeleton() {
  return (
    <ul className="divide-y divide-border" aria-hidden="true" data-testid="units-skeleton">
      {[0, 1, 2].map((i) => (
        <li key={i} className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <span className="h-[84px] w-[112px] shrink-0 animate-pulse bg-muted" />
            <span className="flex flex-col gap-2">
              <span className="h-5 w-24 animate-pulse bg-muted" />
              <span className="h-5 w-28 animate-pulse bg-muted" />
            </span>
            <span className="hidden h-4 w-64 animate-pulse bg-muted lg:block" />
          </div>
          <span className="flex shrink-0 gap-3">
            <span className="h-9 w-32 animate-pulse bg-muted" />
            <span className="h-9 w-28 animate-pulse bg-muted" />
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Resolve an AppFolio apartment number ("FFUU", e.g. "0606") to the floor-plan
 * group for that residence line, using the floor to disambiguate lines offered
 * with different layouts on different floor bands.
 */
export function groupForUnit(unitNumber: string): PlanGroup | null {
  const digits = unitNumber.replace(/\D/g, '');
  if (digits.length < 3) return null;
  const line = Number(digits.slice(-2));
  const floor = Number(digits.slice(0, -2));
  if (!Number.isFinite(line) || !Number.isFinite(floor)) return null;

  const candidates = planGroups.filter((g) => g.unit === line);
  if (candidates.length === 0) return null;
  return candidates.find((g) => g.floors.includes(floor)) ?? candidates[0];
}

export function formatRent(rent: number | null): string | null {
  if (rent === null || rent <= 0) return null;
  return `$${Math.round(rent).toLocaleString()}/mo`;
}

/** Short pets summary derived from the listing's Pet Policy section. */
export function petsLabel(u: AvailableUnit): string | null {
  const policy = u.details.find((s) => /pet/i.test(s.title));
  if (!policy) return null;
  const cats = policy.items.some((i) => /cats? allowed/i.test(i));
  const dogs = policy.items.some((i) => /dogs? allowed/i.test(i));
  if (cats && dogs) return 'Cats & dogs OK';
  if (cats) return 'Cats OK';
  if (dogs) return 'Dogs OK';
  return null;
}

export function formatAvailable(availableOn: string | null): string {
  if (!availableOn) return 'Available now';
  const date = new Date(`${availableOn}T12:00:00`);
  if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) return 'Available now';
  return `Available ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

export function bedBathLabel(u: AvailableUnit, group: PlanGroup | null): string {
  const beds = u.bedrooms ?? group?.beds ?? null;
  const baths = u.bathrooms ?? group?.baths ?? null;
  const parts: string[] = [];
  if (beds !== null) parts.push(beds === 0 ? 'Studio' : `${beds} Bed`);
  if (baths !== null) parts.push(`${baths} Bath`);
  return parts.join(' · ');
}

/**
 * Live "available now" strip fed by AppFolio. Paints instantly from the
 * build-time snapshot (via useAvailability's placeholderData) and is silently
 * replaced by live data; when no snapshot exists it shows skeleton rows while
 * the first fetch is in flight. Renders nothing on error or when no units are
 * posted — the page stays fully useful without it.
 */
export function AvailableUnits() {
  const { data, isPending } = useAvailability();

  const rows = useMemo(() => {
    if (!data?.units) return [];
    return data.units.map((u) => ({ ...u, group: groupForUnit(u.unit) }));
  }, [data]);

  // First browser paint racing the live fetch with no baked snapshot: show
  // skeletons rather than a blank gap. SSR skips this — prerendered HTML only
  // carries real snapshot cards, never placeholder chrome for crawlers.
  const showSkeleton = rows.length === 0 && isPending && !import.meta.env.SSR;

  if (rows.length === 0 && !showSkeleton) return null;

  return (
    <section id="available-units" className="px-4 pb-6" aria-labelledby="available-units-heading">
      <div className="container mx-auto">
        <div className="border border-border bg-white p-4 md:p-6">
          <div id="available-units-heading" className="mb-3 text-center">
            <SplitHeadline
              caps="Available Residences"
            />
            <p className="mt-1 text-sm leading-snug text-muted-foreground">
              Real-time availability and pricing, updated automatically from our leasing system.
            </p>
          </div>

          {showSkeleton && <UnitRowsSkeleton />}

          <ul className="divide-y divide-border">
            {rows.map((u, rowIndex) => {
              const rent = formatRent(u.rent);
              const sqft = u.sqft ?? u.group?.sqftMin ?? null;
              return (
                <li
                  key={u.unit}
                  className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  {/* On mobile: photo and Apt/rent share the top row and the
                      detail chips span full width beneath, so no gap is left
                      beside the photo. lg:contents dissolves the wrappers on
                      desktop (lg+) so the row layout there is unchanged. */}
                  <div className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 lg:contents">
                  {u.photoUrl &&
                    (u.details.length > 0 ? (
                      <Link
                        href={`/available-units/${u.unit}`}
                        className="block shrink-0 cursor-pointer self-start overflow-hidden border border-border lg:self-center"
                        aria-label={`View details for apartment ${u.unit}`}
                      >
                        <UnitThumb photoUrl={u.photoUrl} unit={u.unit} eager={rowIndex === 0} />
                      </Link>
                    ) : (
                      <span className="block shrink-0 self-start overflow-hidden border border-border lg:self-center">
                        <UnitThumb photoUrl={u.photoUrl} unit={u.unit} eager={rowIndex === 0} />
                      </span>
                    ))}
                  <div className="contents lg:flex lg:flex-1 lg:flex-wrap lg:items-start lg:gap-x-6 lg:gap-y-1">
                    {/* Unit number stacked above rent so pricing lines up in
                        the same spot on every row. */}
                    <span className="flex w-28 shrink-0 flex-col">
                      <Link
                        href={`/available-units/${u.unit}`}
                        className="text-lg font-semibold uppercase tracking-wider text-foreground transition-colors hover:text-primary"
                      >
                        Apt {u.unit}
                      </Link>
                      {rent && <span className="text-lg font-semibold text-primary">{rent}</span>}
                    </span>
                    <span className="col-span-2 flex min-w-0 flex-col gap-y-1 pt-0.5 lg:col-auto lg:flex-1">
                      <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <BedDouble className="h-4 w-4 text-primary" aria-hidden="true" />
                          {bedBathLabel(u, u.group).split(' · ')[0] ?? ''}
                        </span>
                        {(u.bathrooms ?? u.group?.baths) != null && (
                          <span className="inline-flex items-center gap-1.5">
                            <Bath className="h-4 w-4 text-primary" aria-hidden="true" />
                            {u.bathrooms ?? u.group?.baths} Bath
                          </span>
                        )}
                        {sqft !== null && (
                          <span className="inline-flex items-center gap-1.5">
                            <Ruler className="h-4 w-4 text-primary" aria-hidden="true" />
                            {sqft.toLocaleString()} sq ft
                          </span>
                        )}
                        {petsLabel(u) && (
                          <span className="inline-flex items-center gap-1.5">
                            <PawPrint className="h-4 w-4 text-primary" aria-hidden="true" />
                            {petsLabel(u)}
                          </span>
                        )}
                        <span>{formatAvailable(u.availableOn)}</span>
                      </span>
                      {u.marketingTitle && (
                        <span className="text-sm text-muted-foreground">{u.marketingTitle}</span>
                      )}
                    </span>
                  </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-3">
                    {u.details.length > 0 && (
                      <Link
                        href={`/available-units/${u.unit}`}
                        aria-label={`View details for apartment ${u.unit}`}
                        className="border border-border px-4 py-2 text-xs uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:text-primary"
                      >
                        View details
                      </Link>
                    )}
                    {u.videoUrl && (
                      <a
                        href={u.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border border-border px-4 py-2 text-xs uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:text-primary"
                      >
                        Video tour
                      </a>
                    )}
                    {(() => {
                      // Posted units link to their own AppFolio listing's
                      // showing scheduler and application (same targets as the
                      // buttons on AppFolio's hosted listing page), so tour
                      // requests and applications arrive tied to this exact
                      // unit. Units not yet posted fall back to the general
                      // application link / tour page.
                      const tourUrl = u.listingUrl ? tourUrlForListing(u.listingUrl) : null;
                      const applyUrl = (u.listingUrl && applyUrlForListing(u.listingUrl)) || APPLY_URL;
                      return (
                        <>
                          {tourUrl ? (
                            <a
                              href={tourUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() =>
                                trackOutboundClick('tour', tourUrl, 'floor_plans_available_units', {
                                  floorPlan: u.unit,
                                })
                              }
                              className="border border-primary px-4 py-2 text-xs uppercase tracking-wider text-primary transition-colors hover:bg-primary hover:text-white"
                            >
                              Schedule a tour
                            </a>
                          ) : (
                            <Link
                              href={`/schedule-a-tour?unit=${u.unit}`}
                              className="border border-primary px-4 py-2 text-xs uppercase tracking-wider text-primary transition-colors hover:bg-primary hover:text-white"
                            >
                              Schedule a tour
                            </Link>
                          )}
                          <a
                            href={applyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() =>
                              trackOutboundClick('apply', applyUrl, 'floor_plans_available_units', {
                                floorPlan: u.group?.typeLabel,
                              })
                            }
                            className="bg-primary px-4 py-2 text-xs uppercase tracking-wider text-white transition-opacity hover:opacity-90"
                          >
                            Apply now
                          </a>
                        </>
                      );
                    })()}
                  </div>

                </li>
              );
            })}
          </ul>
        </div>
      </div>

    </section>
  );
}
