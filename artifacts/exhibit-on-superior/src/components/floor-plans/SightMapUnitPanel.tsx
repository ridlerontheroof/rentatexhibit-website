import { useState } from 'react';
import { Link } from 'wouter';
import { Images } from 'lucide-react';
import type { AvailableUnit } from '../../hooks/use-availability';
import {
  groupForUnit,
  formatRent,
  formatAvailable,
  bedBathLabel,
  petsLabel,
} from './AvailableUnits';
import { UnitFactIcon, UnitFactIconDefs } from './UnitFactIcon';
import { UnitGalleryLightbox } from './UnitGalleryLightbox';
import { resolveUnitSqft } from '../../data/unitSqft';
import { planPageForUnit, floorPlanPagePath, floorPlanH1 } from '../../data/floorPlanPages';
import { adaDesignation, adaDesignationLabel, ADA_KEY, ADA_DISCLAIMER } from '../../data/ada';
import { useModalHistory } from '../../hooks/use-modal-history';

/**
 * Full listing panel for the map-selected unit — the same information as the
 * unit's own page (/available-units/<unit>): photo collage, key facts,
 * marketing story, and the Residence Details sections, condensed into a card
 * under the SightMap.
 *
 * This panel only ever exists after the visitor clicks to load the map
 * (EmbedFacade gate), so it is never part of prerendered HTML, the markdown
 * twins, or the fold/CLS budget — all images may load client-side and content
 * height changes happen only on the visitor's own map clicks.
 *
 * Layout: desktop puts the photo collage beside the facts + story column;
 * mobile stacks photos → facts → story. The detail sections span the full
 * width below, exactly like the unit page's grid.
 */
export function SightMapUnitPanel({
  unit: u,
  actions,
}: {
  unit: AvailableUnit;
  actions: React.ReactNode;
}) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  // Same back-button contract as the unit page: opening the gallery pushes a
  // history entry so the phone's Back button closes it.
  const closeGallery = useModalHistory(galleryOpen, () => setGalleryOpen(false));

  const group = groupForUnit(u.unit);
  const rent = formatRent(u.rent);
  // Floor-plan database is authoritative over the AppFolio feed — see data/unitSqft.ts.
  const sqft = resolveUnitSqft(u);
  const baths = u.bathrooms ?? group?.baths ?? null;
  const pets = petsLabel(u);
  const ada = adaDesignation(u.unit);
  const planPage = planPageForUnit(u.unit);
  // Same lightweight rendition trick as the unit page: the collage displays
  // small, so request AppFolio's `medium` rendition; the lightbox keeps the
  // original full-size URLs (u.photos).
  const collageSrc = (url: string) => url.replace(/\/large\.jpg$/, '/medium.jpg');
  const photos = Array.isArray(u.photos) ? u.photos.slice(0, 5).map(collageSrc) : [];
  // Defensive: test fixtures / degraded feeds may carry non-section details.
  const detailSections = (u.details ?? []).filter(
    (s): s is { title: string; items: string[] } =>
      Boolean(s) && typeof s === 'object' && Array.isArray((s as { items?: unknown }).items),
  );

  const infoColClasses = photos.length > 0 ? 'lg:col-span-7 lg:col-start-6' : 'lg:col-span-12 lg:col-start-1';

  return (
    <div className="p-4 md:p-6 flex flex-col gap-5 lg:grid lg:grid-cols-12 lg:gap-x-8 lg:gap-y-5">
      <UnitFactIconDefs />

      {/* 1. Header: Apt + Rent and CTAs */}
      <div className={`${infoColClasses} lg:row-start-1 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between`}>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <Link
            href={`/available-units/${u.unit}`}
            className="text-2xl font-semibold uppercase tracking-wider text-foreground transition-colors hover:text-primary"
          >
            Apt {u.unit}
          </Link>
          {rent && <span className="text-xl font-semibold text-primary">{rent}</span>}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>
      </div>

      {/* 2. Photos (if any) */}
      {photos.length > 0 && (
        <div className="lg:col-span-5 lg:col-start-1 lg:row-start-1 lg:row-span-3 flex flex-col self-start">
          <button
            type="button"
            onClick={() => setGalleryOpen(true)}
            className="relative grid h-fit w-full cursor-pointer grid-cols-4 grid-rows-2 gap-1 overflow-hidden border border-border transition-opacity hover:opacity-90"
            // Visible badge text is "{n} photos", so the accessible name must
            // BEGIN with it (WCAG 2.5.3 label-in-name).
            aria-label={`${u.photos.length} photos of apartment ${u.unit} — view all`}
          >
            {/* This panel mounts only after the visitor's map click, never in
                prerendered HTML — so a plain eager <img> is safe here (no SSR
                preload emission) and the lead photo may load immediately. */}
            <img
              src={photos[0]}
              alt={`Apartment ${u.unit} interior`}
              loading="eager"
              width={1170}
              height={780}
              className="col-span-2 row-span-2 h-full w-full object-cover"
            />
            {photos.slice(1).map((p, i) => (
              <img
                key={p}
                src={p}
                alt={`Apartment ${u.unit} interior ${i + 2}`}
                loading="lazy"
                width={585}
                height={390}
                className="col-span-1 row-span-1 h-full w-full object-cover aspect-[3/2]"
              />
            ))}
            <span className="absolute left-2 top-2 inline-flex items-center gap-1.5 bg-black/60 px-2.5 py-1 text-xs uppercase tracking-wider text-white">
              <Images className="h-4 w-4" aria-hidden="true" /> {u.photos.length} photos
            </span>
          </button>
        </div>
      )}

      {/* 3. Facts Strip */}
      <div className={`${infoColClasses} lg:row-start-2 border-b border-border pb-4`}>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <UnitFactIcon name="bed-double" className="h-4 w-4 text-primary" />
            {bedBathLabel(u, group).split(' · ')[0] ?? ''}
          </span>
          {baths !== null && (
            <span className="inline-flex items-center gap-1.5">
              <UnitFactIcon name="bath" className="h-4 w-4 text-primary" />
              {baths} Bath
            </span>
          )}
          {sqft !== null && (
            <span className="inline-flex items-center gap-1.5">
              <UnitFactIcon name="ruler" className="h-4 w-4 text-primary" />
              {sqft.toLocaleString()} sq ft
            </span>
          )}
          {pets && (
            <span className="inline-flex items-center gap-1.5">
              <UnitFactIcon name="paw-print" className="h-4 w-4 text-primary" />
              {pets}
            </span>
          )}
          <span>{formatAvailable(u.availableOn)}</span>
          {ada && <span>ADA ({ada})</span>}
        </div>
      </div>

      {/* 4. Story & Links */}
      {(u.marketingTitle || u.description || u.videoUrl || planPage) && (
        <div className={`${infoColClasses} lg:row-start-3 flex flex-col gap-4 self-start`}>
          {u.marketingTitle && (
            <h3 className="text-base font-semibold uppercase tracking-wider text-foreground">
              {u.marketingTitle}
            </h3>
          )}
          {u.description && (
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              {u.description.split(/\n+/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/available-units/${u.unit}`}
              aria-label={`Apt ${u.unit} full listing page`}
              className="border border-border px-4 py-2 text-xs uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              Apt {u.unit} full listing page
            </Link>
            {u.videoUrl && (
              <a
                href={u.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Video tour of apartment ${u.unit}`}
                className="border border-border px-4 py-2 text-xs uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                Video tour
              </a>
            )}
            {planPage && (
              <Link
                href={floorPlanPagePath(planPage.slug)}
                className="border border-border px-4 py-2 text-xs uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {floorPlanH1(planPage)} floor plan
              </Link>
            )}
          </div>
        </div>
      )}

      {/* 5. Residence Details */}
      {detailSections.length > 0 && (
        <div className="lg:col-span-12 lg:col-start-1 lg:row-start-4 border-t border-border pt-5">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground">
            Residence Details
          </h3>
          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {detailSections.map((section) => (
              <div key={section.title}>
                <h4 className="mb-2 border-l-2 border-primary pl-2.5 text-xs uppercase tracking-wider text-foreground">
                  {section.title}
                </h4>
                <ul className="space-y-1 pl-3">
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

      {/* 6. ADA */}
      {ada && (
        <div className="lg:col-span-12 lg:col-start-1 lg:row-start-5 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
          <p className="text-foreground">
            Apartment {u.unit} is designated as a {adaDesignationLabel(ada)} per the
            building&rsquo;s as-built accessibility matrix.
          </p>
          <div className="mt-2 space-y-1">
            {ADA_KEY.map((k) => (
              <p key={k.code}>
                <span className="font-semibold text-foreground">{k.label}</span>: {k.description}
              </p>
            ))}
            <p className="mt-2">{ADA_DISCLAIMER}</p>
          </div>
        </div>
      )}

      {galleryOpen && <UnitGalleryLightbox unit={u} onClose={closeGallery} />}
    </div>
  );
}
