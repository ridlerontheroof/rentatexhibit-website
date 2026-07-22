import { useMemo, useState } from 'react';
import {
  UnitGalleryLightbox,
  applyUrlForListing,
} from './UnitGalleryLightbox';
import { SplitHeadline } from '../SplitHeadline';
import { useAvailability, type AvailableUnit } from '../../hooks/use-availability';
import { planGroups, type PlanGroup } from '../../data/floorPlans';
import { APPLY_URL } from '../../data/seo';
import { trackOutboundClick } from '../../lib/analytics';

interface AvailableUnitsProps {
  onView: (group: PlanGroup) => void;
}

function UnitThumb({ photoUrl, unit }: { photoUrl: string; unit: string }) {
  return (
    <img
      src={photoUrl}
      alt={`Apartment ${unit} interior`}
      loading="lazy"
      width={112}
      height={84}
      className="h-[84px] w-[112px] object-cover transition-transform duration-300 hover:scale-105"
    />
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

function formatRent(rent: number | null): string | null {
  if (rent === null || rent <= 0) return null;
  return `$${Math.round(rent).toLocaleString()}/mo`;
}

function formatAvailable(availableOn: string | null): string {
  if (!availableOn) return 'Available now';
  const date = new Date(`${availableOn}T12:00:00`);
  if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) return 'Available now';
  return `Available ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

function bedBathLabel(u: AvailableUnit, group: PlanGroup | null): string {
  const beds = u.bedrooms ?? group?.beds ?? null;
  const baths = u.bathrooms ?? group?.baths ?? null;
  const parts: string[] = [];
  if (beds !== null) parts.push(beds === 0 ? 'Studio' : `${beds} Bed`);
  if (baths !== null) parts.push(`${baths} Bath`);
  return parts.join(' · ');
}

/**
 * Live "available now" strip fed by AppFolio. Renders nothing while loading,
 * on error, or when no units are posted — the page stays fully useful without
 * it, so there is no fallback state to design around.
 */
export function AvailableUnits({ onView }: AvailableUnitsProps) {
  const { data } = useAvailability();
  const [galleryUnit, setGalleryUnit] = useState<AvailableUnit | null>(null);
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);

  const rows = useMemo(() => {
    if (!data?.units) return [];
    return data.units.map((u) => ({ ...u, group: groupForUnit(u.unit) }));
  }, [data]);

  if (rows.length === 0) return null;

  return (
    <section className="px-4 pb-6" aria-labelledby="available-units-heading">
      <div className="container mx-auto">
        <div className="border border-border bg-white p-6 md:p-8">
          <div id="available-units-heading" className="mb-6 text-center">
            <SplitHeadline script="Move-In Ready" caps="Available Residences" />
            <p className="mt-2 text-sm text-muted-foreground">
              Live availability, updated automatically from our leasing system.
            </p>
          </div>

          <ul className="divide-y divide-border">
            {rows.map((u) => {
              const rent = formatRent(u.rent);
              const sqft = u.sqft ?? u.group?.sqftMin ?? null;
              return (
                <li
                  key={u.unit}
                  className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between"
                >
                  {u.photoUrl &&
                    (u.photos.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setGalleryUnit(u)}
                        className="block shrink-0 cursor-pointer self-start overflow-hidden border border-border md:self-center"
                        aria-label={`View photos of apartment ${u.unit}`}
                      >
                        <UnitThumb photoUrl={u.photoUrl} unit={u.unit} />
                      </button>
                    ) : u.listingUrl ? (
                      <a
                        href={u.listingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block shrink-0 self-start overflow-hidden border border-border md:self-center"
                        aria-label={`View photos of apartment ${u.unit}`}
                      >
                        <UnitThumb photoUrl={u.photoUrl} unit={u.unit} />
                      </a>
                    ) : (
                      <span className="block shrink-0 self-start overflow-hidden border border-border md:self-center">
                        <UnitThumb photoUrl={u.photoUrl} unit={u.unit} />
                      </span>
                    ))}
                  <div className="flex flex-1 flex-wrap items-baseline gap-x-4 gap-y-1">
                    <span className="text-lg font-semibold uppercase tracking-wider text-foreground">
                      Apt {u.unit}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {[
                        bedBathLabel(u, u.group),
                        sqft !== null ? `${sqft.toLocaleString()} sq ft` : null,
                        formatAvailable(u.availableOn),
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                    {rent && <span className="text-lg font-semibold text-primary">{rent}</span>}
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-3">
                    {u.details.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setExpandedUnit(expandedUnit === u.unit ? null : u.unit)}
                        aria-expanded={expandedUnit === u.unit}
                        aria-controls={`unit-details-${u.unit}`}
                        className="border border-border px-4 py-2 text-xs uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:text-primary"
                      >
                        {expandedUnit === u.unit ? 'Hide details' : 'Details'}
                      </button>
                    )}
                    {u.photos.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setGalleryUnit(u)}
                        className="border border-border px-4 py-2 text-xs uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:text-primary"
                      >
                        Photos
                      </button>
                    ) : (
                      u.listingUrl && (
                        <a
                          href={u.listingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="border border-border px-4 py-2 text-xs uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:text-primary"
                        >
                          Photos
                        </a>
                      )
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
                    {u.group && (
                      <button
                        type="button"
                        onClick={() => onView(u.group!)}
                        className="border border-border px-4 py-2 text-xs uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:text-primary"
                      >
                        View floor plan
                      </button>
                    )}
                    {(() => {
                      // Posted units apply directly to their own AppFolio
                      // listing (same target as AppFolio's Apply Now button);
                      // others use the general application link.
                      const applyUrl = (u.listingUrl && applyUrlForListing(u.listingUrl)) || APPLY_URL;
                      return (
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
                      );
                    })()}
                  </div>

                  {expandedUnit === u.unit && u.details.length > 0 && (
                    <div
                      id={`unit-details-${u.unit}`}
                      className="w-full basis-full border-t border-border pt-4 md:mt-1"
                    >
                      <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
                        {u.details.map((section) => (
                          <div key={section.title}>
                            <h4 className="text-xs uppercase tracking-wider text-muted-foreground">
                              {section.title}
                            </h4>
                            <ul className="mt-2 space-y-1">
                              {section.items.map((item) => (
                                <li key={item} className="text-sm text-foreground">
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {galleryUnit && (
        <UnitGalleryLightbox unit={galleryUnit} onClose={() => setGalleryUnit(null)} />
      )}
    </section>
  );
}
