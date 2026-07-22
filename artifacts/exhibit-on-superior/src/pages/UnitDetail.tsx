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
} from '../components/floor-plans/UnitGalleryLightbox';
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
  const heroPhotos = unit.photos.slice(0, 5);

  return (
    <div className="container mx-auto px-4 py-10 md:py-14">
      <Seo
        path={`/available-units/${unit.unit}`}
        title={`Apt ${unit.unit} | Available Residences | Exhibit On Superior`}
        noindex
      />

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
          className="relative mt-4 grid w-full cursor-pointer grid-cols-4 grid-rows-2 gap-1 overflow-hidden"
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
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 bg-black/60! px-3 py-1.5 text-xs uppercase tracking-wider text-white">
            <Images className="h-4 w-4" aria-hidden="true" /> {unit.photos.length} photos
          </span>
        </button>
      )}

      <div className="mt-8 grid gap-10 md:grid-cols-[280px_1fr]">
        {/* Left column — pricing, actions, listing sections */}
        <aside>
          <div className="border border-border p-6 text-center">
            {rent && <p className="text-3xl font-semibold text-primary">{rent}</p>}
            <p className="mt-1 text-sm text-muted-foreground">{formatAvailable(unit.availableOn)}</p>

            <div className="mt-4 flex items-center justify-center gap-5 text-sm text-foreground">
              <span className="inline-flex items-center gap-1.5">
                <BedDouble className="h-4 w-4 text-primary" aria-hidden="true" />
                {bedBathLabel(unit, group).split(' · ')[0] ?? ''}
              </span>
              {baths !== null && (
                <span className="inline-flex items-center gap-1.5">
                  <Bath className="h-4 w-4 text-primary" aria-hidden="true" /> {baths} ba
                </span>
              )}
              {sqft !== null && (
                <span className="inline-flex items-center gap-1.5">
                  <Ruler className="h-4 w-4 text-primary" aria-hidden="true" />
                  {sqft.toLocaleString()} sqft
                </span>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <a
                href={applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackOutboundClick('apply', applyUrl, 'unit_detail', { floorPlan: unit.unit })
                }
                className="bg-primary px-4 py-3 text-xs uppercase tracking-wider text-white transition-opacity hover:opacity-90"
              >
                Apply now
              </a>
              <Link
                href="/schedule-a-tour"
                className="border border-border px-4 py-3 text-xs uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                Schedule a tour
              </Link>
              {contactUrl && (
                <a
                  href={contactUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-border px-4 py-3 text-xs uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  Contact us
                </a>
              )}
            </div>
          </div>

          <div className="mt-8 space-y-6">
            {unit.details.map((section) => (
              <div key={section.title}>
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </h3>
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
        </aside>

        {/* Right column — title, address, description */}
        <div>
          <h1 className="text-2xl font-semibold uppercase tracking-wider text-foreground md:text-3xl">
            Apt {unit.unit}
          </h1>
          <p className="mt-1 text-muted-foreground">{ADDRESS}</p>
          {unit.marketingTitle && (
            <h2 className="mt-5 text-lg font-medium text-foreground">{unit.marketingTitle}</h2>
          )}
          {unit.description && (
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
              {unit.description.split(/\n+/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          )}
          {group && (
            <Link
              href="/available-units"
              className="mt-6 inline-block border border-border px-4 py-2 text-xs uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              View the {group.typeLabel} floor plan
            </Link>
          )}
        </div>
      </div>

      {galleryOpen && <UnitGalleryLightbox unit={unit} onClose={() => setGalleryOpen(false)} />}
    </div>
  );
}
