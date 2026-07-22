import { useMemo, useState } from 'react';
import { Link, useParams } from 'wouter';
import { BedDouble, Bath, Ruler, Images, ArrowLeft } from 'lucide-react';
import { Seo } from '../components/Seo';
import { useAvailability, type AvailableUnit } from '../hooks/use-availability';
import {
  groupForUnit,
  formatRent,
  formatAvailable,
  bedBathLabel,
} from '../components/floor-plans/AvailableUnits';
import {
  UnitGalleryLightbox,
  applyUrlForListing,
  contactUrlForListing,
  tourUrlForListing,
} from '../components/floor-plans/UnitGalleryLightbox';
import { PlanLightbox } from '../components/floor-plans/PlanLightbox';
import { trackOutboundClick } from '../lib/analytics';
import { APPLY_URL } from '../data/seo';

const ADDRESS = '165 W Superior St, Chicago, IL 60654';

/**
 * Full listing page for a single available residence — the same information
 * as AppFolio's hosted listing page (photos, rental terms, pet policy,
 * amenities, utilities, appliances, description), in the site's own design.
 */
export function UnitDetail() {
  const params = useParams<{ unit: string }>();
  const { data, isLoading } = useAvailability();
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [planVariant, setPlanVariant] = useState(0);

  const unit: AvailableUnit | null = useMemo(
    () => data?.units.find((u) => u.unit === params.unit) ?? null,
    [data, params.unit],
  );

  if (isLoading) {
    return <div className="min-h-[60vh]" aria-hidden="true" />;
  }

  if (!unit) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <Seo path={`/available-units/${params.unit}`} title="Residence Not Available | Exhibit On Superior" noindex />
        <h1 className="text-2xl font-semibold uppercase tracking-wider text-foreground">
          This residence is no longer available
        </h1>
        <p className="mt-3 text-muted-foreground">
          It may have just been leased. Browse the rest of our available residences below.
        </p>
        <Link
          href="/available-units"
          className="mt-6 inline-block bg-primary px-6 py-3 text-xs uppercase tracking-wider text-white transition-opacity hover:opacity-90"
        >
          View floor plans &amp; availability
        </Link>
      </div>
    );
  }

  const group = groupForUnit(unit.unit);
  const rent = formatRent(unit.rent);
  const sqft = unit.sqft ?? group?.sqftMin ?? null;
  const baths = unit.bathrooms ?? group?.baths ?? null;
  const applyUrl = (unit.listingUrl && applyUrlForListing(unit.listingUrl)) || APPLY_URL;
  const contactUrl = unit.listingUrl ? contactUrlForListing(unit.listingUrl) : null;
  const tourUrl = unit.listingUrl ? tourUrlForListing(unit.listingUrl) : null;
  const heroPhotos = unit.photos.slice(0, 5);

  return (
    <div className="pb-16 pt-10 md:pt-14">
      <Seo
        path={`/available-units/${unit.unit}`}
        title={`Apt ${unit.unit} | Available Residences | Exhibit On Superior`}
        noindex
      />

      <div className="container mx-auto px-4">
        <Link
          href="/available-units"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All available residences
        </Link>

        {/* Photo collage */}
        {heroPhotos.length > 0 && (
          <button
            type="button"
            onClick={() => setGalleryOpen(true)}
            className="relative mt-6 grid w-full cursor-pointer grid-cols-4 grid-rows-2 gap-1 overflow-hidden"
            aria-label={`View all ${unit.photos.length} photos of apartment ${unit.unit}`}
          >
            <img
              src={heroPhotos[0]}
              alt={`Apartment ${unit.unit} interior`}
              className="col-span-2 row-span-2 h-full max-h-[420px] w-full object-cover"
            />
            {heroPhotos.slice(1).map((p, i) => (
              <img
                key={p}
                src={p}
                alt={`Apartment ${unit.unit} interior ${i + 2}`}
                loading="lazy"
                className="h-full max-h-[208px] w-full object-cover"
              />
            ))}
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 bg-black/60 px-3 py-1.5 text-xs uppercase tracking-wider text-white">
              <Images className="h-4 w-4" aria-hidden="true" /> {unit.photos.length} photos
            </span>
          </button>
        )}
      </div>

      {/* Key info bar — full-width visual strip */}
      <div className="mt-10 border-y border-border bg-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-center">
            {rent && (
              <div>
                <p className="text-sm uppercase tracking-wider text-muted-foreground">Rent</p>
                <p className="mt-1 text-3xl font-semibold text-primary">{rent}</p>
              </div>
            )}
            <div>
              <p className="text-sm uppercase tracking-wider text-muted-foreground">Availability</p>
              <p className="mt-1 text-lg font-medium text-foreground">{formatAvailable(unit.availableOn)}</p>
            </div>
            <div>
              <p className="text-sm uppercase tracking-wider text-muted-foreground">Bedrooms</p>
              <p className="mt-1 flex items-center justify-center gap-2 text-lg font-medium text-foreground">
                <BedDouble className="h-5 w-5 text-primary" aria-hidden="true" />
                {bedBathLabel(unit, group).split(' · ')[0] ?? ''}
              </p>
            </div>
            {baths !== null && (
              <div>
                <p className="text-sm uppercase tracking-wider text-muted-foreground">Bathrooms</p>
                <p className="mt-1 flex items-center justify-center gap-2 text-lg font-medium text-foreground">
                  <Bath className="h-5 w-5 text-primary" aria-hidden="true" />
                  {baths} Bath
                </p>
              </div>
            )}
            {sqft !== null && (
              <div>
                <p className="text-sm uppercase tracking-wider text-muted-foreground">Square Feet</p>
                <p className="mt-1 flex items-center justify-center gap-2 text-lg font-medium text-foreground">
                  <Ruler className="h-5 w-5 text-primary" aria-hidden="true" />
                  {sqft.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Primary actions — centered, prominent */}
      <div className="container mx-auto px-4">
        <div className="mx-auto mt-10 flex max-w-2xl flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href={applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackOutboundClick('apply', applyUrl, 'unit_detail', { floorPlan: unit.unit })
            }
            className="w-full bg-primary px-8 py-4 text-center text-xs uppercase tracking-wider text-white transition-opacity hover:opacity-90 sm:w-auto"
          >
            Apply now
          </a>
          {tourUrl ? (
            <a
              href={tourUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackOutboundClick('tour', tourUrl, 'unit_detail', { floorPlan: unit.unit })
              }
              className="w-full border border-border px-8 py-4 text-center text-xs uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:text-primary sm:w-auto"
            >
              Schedule a tour
            </a>
          ) : (
            <Link
              href="/schedule-a-tour"
              className="w-full border border-border px-8 py-4 text-center text-xs uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:text-primary sm:w-auto"
            >
              Schedule a tour
            </Link>
          )}
          {contactUrl && (
            <a
              href={contactUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full border border-border px-8 py-4 text-center text-xs uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:text-primary sm:w-auto"
            >
              Contact us
            </a>
          )}
        </div>

        {/* Title, address, description — centered content column */}
        <div className="mx-auto mt-16 max-w-3xl text-center">
          <h1 className="text-3xl font-semibold uppercase tracking-wider text-foreground md:text-4xl">
            Apartment {unit.unit}
          </h1>
          <p className="mt-2 text-muted-foreground">{ADDRESS}</p>
          {unit.marketingTitle && (
            <h2 className="mt-8 text-xl font-medium text-foreground">{unit.marketingTitle}</h2>
          )}
          {unit.description && (
            <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground">
              {unit.description.split(/\n+/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          )}
          {group && (
            <button
              type="button"
              onClick={() => {
                setPlanVariant(0);
                setPlanOpen(true);
              }}
              className="mt-8 inline-block border border-border px-6 py-3 text-xs uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              View the {group.typeLabel} floor plan
            </button>
          )}
        </div>

        {/* Detail sections — multi-column grid, full width */}
        {unit.details.length > 0 && (
          <div className="mx-auto mt-20 max-w-5xl">
            <div className="mb-10 h-px bg-border" />
            <h2 className="mb-8 text-center text-xl uppercase tracking-wider text-foreground">
              Residence Details
            </h2>
            <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {unit.details.map((section) => (
                <div key={section.title}>
                  <h3 className="mb-3 border-l-2 border-primary pl-3 text-sm uppercase tracking-wider text-foreground">
                    {section.title}
                  </h3>
                  <ul className="space-y-2 pl-3">
                    {section.items.map((item) => (
                      <li key={item} className="text-sm leading-relaxed text-muted-foreground">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {galleryOpen && <UnitGalleryLightbox unit={unit} onClose={() => setGalleryOpen(false)} />}
      {group && (
        <PlanLightbox
          group={planOpen ? group : null}
          variantIndex={planVariant}
          position={{ index: 0, total: 1 }}
          onClose={() => setPlanOpen(false)}
          onNavigate={() => {}}
          onVariantChange={setPlanVariant}
        />
      )}
    </div>
  );
}
