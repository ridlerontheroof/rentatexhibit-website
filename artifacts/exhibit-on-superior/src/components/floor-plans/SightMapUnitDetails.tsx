import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { BedDouble, Bath, Ruler, Images, Accessibility, CalendarDays } from 'lucide-react';
import { type AvailableUnit } from '../../hooks/use-availability';
import {
  groupForUnit,
  formatRent,
  formatAvailable,
  bedBathLabel,
} from './AvailableUnits';
import { UnitGalleryLightbox, tourUrlForListing } from './UnitGalleryLightbox';
import { PlanLightbox } from './PlanLightbox';
import { resolveUnitSqft } from '../../data/unitSqft';
import { variantIndexForUnit } from '../../data/floorPlans';
import { planPageForUnit, floorPlanPagePath, floorPlanH1 } from '../../data/floorPlanPages';
import { adaDesignation, adaDesignationLabel, ADA_KEY, ADA_DISCLAIMER } from '../../data/ada';
import { unitFloor } from '../../data/unitPageSeo';
import { useModalHistory } from '../../hooks/use-modal-history';

const ADDRESS = '165 W Superior St, Chicago, IL 60654';

/** AppFolio listing photos ship a lighter `medium` rendition; the collage
 * never displays wider than ~560px, so request that instead of `large`. The
 * lightbox keeps the original full-size URLs (unit.photos). */
const collageSrc = (url: string) => url.replace(/\/large\.jpg$/, '/medium.jpg');

interface KeyFact {
  label: string;
  value: string;
  icon?: typeof BedDouble;
}

/**
 * Full listing detail for the residence currently selected on the SightMap,
 * rendered directly below the interactive map on /available-units. It mirrors
 * the standalone unit page (UnitDetail.tsx) — photos, key facts, description,
 * residence details, and the same site-owned CTAs — but is a compact,
 * client-only panel: it mounts only after the map is activated and a unit is
 * chosen, so it never touches prerender, the markdown twins, or the page's
 * TBT/LCP budgets.
 *
 * `updatedAt` is the availability feed's own timestamp, surfaced as a
 * freshness line so the quoted rent is never presented as more current than
 * the data behind it.
 */
export function SightMapUnitDetails({
  unit,
  updatedAt,
}: {
  unit: AvailableUnit;
  updatedAt?: string | null;
}) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [planVariant, setPlanVariant] = useState(0);
  // Same back-button contract as the unit page: opening a lightbox pushes a
  // history entry so the phone's Back button closes it.
  const closeGallery = useModalHistory(galleryOpen, () => setGalleryOpen(false));
  const closePlan = useModalHistory(planOpen, () => setPlanOpen(false));

  const group = groupForUnit(unit.unit);
  const rent = formatRent(unit.rent);
  const sqft = resolveUnitSqft(unit);
  const baths = unit.bathrooms ?? group?.baths ?? null;
  const floor = unitFloor(unit.unit);
  const ada = adaDesignation(unit.unit);
  const tourUrl = unit.listingUrl ? tourUrlForListing(unit.listingUrl) : null;
  const planPage = planPageForUnit(unit.unit);
  const photos = unit.photos ?? [];
  const details = unit.details ?? [];
  const heroPhotos = useMemo(() => photos.slice(0, 5).map(collageSrc), [photos]);

  const keyFacts: KeyFact[] = [];
  if (rent) keyFacts.push({ label: 'Rent', value: rent });
  keyFacts.push({
    label: 'Availability',
    value: formatAvailable(unit.availableOn),
    icon: CalendarDays,
  });
  keyFacts.push({
    label: 'Bedrooms',
    value: bedBathLabel(unit, group).split(' \u00b7 ')[0] ?? '',
    icon: BedDouble,
  });
  if (baths !== null) keyFacts.push({ label: 'Bathrooms', value: `${baths} Bath`, icon: Bath });
  if (sqft !== null)
    keyFacts.push({ label: 'Square Feet', value: sqft.toLocaleString(), icon: Ruler });
  if (ada) keyFacts.push({ label: 'Accessibility', value: `ADA (${ada})`, icon: Accessibility });

  return (
    <div className="mt-4 border border-border bg-white">
      {/* Header */}
      <div className="border-b border-border px-5 py-4 sm:px-7">
        <p className="text-xs uppercase tracking-wider text-primary">Selected residence</p>
        <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className="text-2xl font-semibold uppercase tracking-wider text-foreground">
            Apartment {unit.unit}
            {floor !== null && <span className="sr-only"> — floor {floor}</span>}
          </h3>
          {rent && <span className="text-2xl font-semibold text-primary">{rent}</span>}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{ADDRESS}</p>
      </div>

      {/* Photos + facts: two columns on desktop, stacked on mobile */}
      <div className="grid gap-0 lg:grid-cols-2">
        {heroPhotos.length > 0 && (
          <button
            type="button"
            onClick={() => setGalleryOpen(true)}
            className="relative grid aspect-[3/2] w-full cursor-pointer grid-cols-4 grid-rows-2 gap-1 overflow-hidden border-b border-border lg:border-b-0 lg:border-r"
            // Visible badge is "{n} photos" — accessible name must BEGIN with
            // it (WCAG 2.5.3 label-in-name).
            aria-label={`${photos.length} photos of apartment ${unit.unit} — view all`}
          >
            <img
              src={heroPhotos[0]}
              alt={`Apartment ${unit.unit} interior`}
              loading="lazy"
              width={1170}
              height={780}
              className="col-span-2 row-span-2 h-full w-full object-cover"
            />
            {heroPhotos.slice(1).map((p, i) => (
              <img
                key={p}
                src={p}
                alt={`Apartment ${unit.unit} interior ${i + 2}`}
                loading="lazy"
                width={585}
                height={390}
                className="h-full w-full object-cover"
              />
            ))}
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 bg-black/60 px-3 py-1.5 text-xs uppercase tracking-wider text-white">
              <Images className="h-4 w-4" aria-hidden="true" /> {photos.length} photos
            </span>
          </button>
        )}

        {/* Facts + CTAs */}
        <div className="flex flex-col justify-between gap-6 p-5 sm:p-7">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
            {keyFacts.map((f) => (
              <div key={f.label}>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                  {f.label}
                </dt>
                <dd className="mt-1 flex items-center gap-2 text-lg font-medium text-foreground">
                  {f.icon && <f.icon className="h-5 w-5 text-primary" aria-hidden="true" />}
                  {f.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href={`/start-application?unit=${unit.unit}`}
              aria-label={`Apply now for apartment ${unit.unit}`}
              className="bg-primary px-6 py-3 text-center text-xs uppercase tracking-wider text-white transition-opacity hover:opacity-90"
            >
              Apply now
            </Link>
            <Link
              href={
                tourUrl
                  ? `/schedule-showing?unit=${unit.unit}`
                  : `/schedule-a-tour?unit=${unit.unit}`
              }
              aria-label={`Schedule a tour of apartment ${unit.unit}`}
              className="border border-primary px-6 py-3 text-center text-xs uppercase tracking-wider text-primary transition-colors hover:bg-primary hover:text-white"
            >
              Schedule a tour
            </Link>
            {details.length > 0 && (
              <Link
                href={`/available-units/${unit.unit}`}
                aria-label={`Apt ${unit.unit} full details page`}
                className="border border-border px-6 py-3 text-center text-xs uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                Full details
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Marketing story + floor plan */}
      {(unit.marketingTitle || unit.description || group) && (
        <div className="border-t border-border px-5 py-6 sm:px-7">
          {unit.marketingTitle && (
            <h4 className="text-lg font-medium tracking-wider text-foreground">
              {unit.marketingTitle}
            </h4>
          )}
          {unit.description && (
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
              {unit.description.split(/\n+/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
            {group && (
              <button
                type="button"
                onClick={() => {
                  setPlanVariant(variantIndexForUnit(group, unit.unit));
                  setPlanOpen(true);
                }}
                className="inline-block border border-border px-5 py-2.5 text-xs uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                View the {group.typeLabel} floor plan
              </button>
            )}
            {planPage && (
              <p className="text-sm text-muted-foreground">
                Uses the{' '}
                <Link
                  href={floorPlanPagePath(planPage.slug)}
                  className="underline transition-colors hover:text-primary"
                >
                  {floorPlanH1(planPage)} floor plan
                </Link>
                .
              </p>
            )}
          </div>
        </div>
      )}

      {/* Residence details */}
      {details.length > 0 && (
        <div className="border-t border-border px-5 py-6 sm:px-7">
          <h4 className="mb-5 text-sm uppercase tracking-wider text-foreground">
            Residence Details
          </h4>
          <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {details.map((section) => (
              <div key={section.title}>
                <h5 className="mb-2 border-l-2 border-primary pl-3 text-xs uppercase tracking-wider text-foreground">
                  {section.title}
                </h5>
                <ul className="space-y-1.5 pl-3">
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

      {/* ADA detail: designation key + disclaimer must travel with the badge. */}
      {ada && (
        <div className="border-t border-border px-5 py-6 text-sm leading-relaxed text-muted-foreground sm:px-7">
          <p className="text-foreground">
            Apartment {unit.unit} is designated as a {adaDesignationLabel(ada)} per the
            building&rsquo;s as-built accessibility matrix.
          </p>
          <div className="mt-3 space-y-1 text-xs">
            {ADA_KEY.map((k) => (
              <p key={k.code}>
                <span className="font-semibold text-foreground">{k.label}</span>: {k.description}
              </p>
            ))}
            <p className="mt-2">{ADA_DISCLAIMER}</p>
          </div>
        </div>
      )}

      {/* Freshness disclosure */}
      {updatedAt && !Number.isNaN(Date.parse(updatedAt)) && (
        <p className="border-t border-border px-5 py-3 text-xs uppercase tracking-wider text-muted-foreground sm:px-7">
          Pricing and availability as of{' '}
          {new Date(updatedAt).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
          {' — tours and applications always go through Exhibit\u2019s own scheduler.'}
        </p>
      )}

      {galleryOpen && <UnitGalleryLightbox unit={unit} onClose={closeGallery} />}
      {group && (
        <PlanLightbox
          group={planOpen ? group : null}
          variantIndex={planVariant}
          position={{ index: 0, total: 1 }}
          onClose={closePlan}
          onNavigate={() => {}}
          onVariantChange={setPlanVariant}
        />
      )}
    </div>
  );
}
