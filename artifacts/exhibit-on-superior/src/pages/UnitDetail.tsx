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
  tourUrlForListing,
} from '../components/floor-plans/UnitGalleryLightbox';
import { PlanLightbox } from '../components/floor-plans/PlanLightbox';
import { variantIndexForUnit } from '../data/floorPlans';
import { planPageForUnit, floorPlanPagePath, floorPlanH1 } from '../data/floorPlanPages';
import { resolveUnitSqft } from '../data/unitSqft';
import { trackOutboundClick } from '../lib/analytics';
import { youTubeEmbedUrl, youTubeThumbnailUrl } from '../lib/youtube';
import { EmbedFacade } from '../components/EmbedFacade';
import { APPLY_URL } from '../data/seo';
import { buildUnitSeoModel, unitFactSummary, unitFloor } from '../data/unitPageSeo';
import { adaDesignation, adaDesignationLabel, ADA_KEY, ADA_DISCLAIMER } from '../data/ada';
import { useModalHistory } from '../hooks/use-modal-history';
import { Accessibility } from 'lucide-react';

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
  // Back-button contract (same as the /available-units floor-plan lightbox):
  // opening either pop-up pushes a history entry so the phone's Back button
  // closes it; the lightboxes' own close paths (X, Escape, backdrop) go
  // through these wrappers, which consume the pushed entry.
  const closeGallery = useModalHistory(galleryOpen, () => setGalleryOpen(false));
  const closePlan = useModalHistory(planOpen, () => setPlanOpen(false));

  const unit: AvailableUnit | null = useMemo(
    () => data?.units.find((u) => u.unit === params.unit) ?? null,
    [data, params.unit],
  );

  if (isLoading) {
    return <div className="min-h-[60vh]" aria-hidden="true" />;
  }

  if (!unit) {
    // Graceful sold-out state: a unit URL that has left inventory (stale AI
    // citation, old bookmark, search result) still lands on a helpful page —
    // noindex, no hard 404 — pointing at what IS available right now.
    //
    // Staleness expectation (why this is enough): the prerendered HTML for a
    // rented unit keeps its old price/title until the next publish, but any
    // crawler that renders JS (Googlebot does) sees this state within one
    // availability-feed refresh: noindex robots, "Residence Not Available"
    // title, and NO Apartment/Offer JSON-LD (main.tsx strips the prerendered
    // copies pre-hydration, and noindex pages emit none). For raw-HTML
    // fetches, the stale page is bounded by the publish cadence plus the
    // Offer's priceValidUntil (snapshot date + 7 days) — engines are told the
    // quoted rent expires even if they never re-render. Bing/Copilot are also
    // pinged via IndexNow the moment the unit leaves the feed
    // (api-server changedUnitUrls). Worst case: Google may show the old
    // snippet until its next rendered recrawl — typically days — which is
    // acceptable because the landing experience is this accurate sold-out
    // page, never wrong facts presented as current.
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <Seo path={`/available-units/${params.unit}`} title="Residence Not Available | Exhibit On Superior" noindex />
        <h1 className="text-2xl font-semibold uppercase tracking-wider text-foreground">
          Apartment {params.unit} has been rented
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          This residence is no longer available — it may have just been leased. Current
          availability with live pricing and move-in dates is always listed on our Available
          Units page, or the leasing team can suggest a similar home.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/available-units"
            className="inline-block bg-primary px-6 py-3 text-xs uppercase tracking-wider text-white transition-opacity hover:opacity-90"
          >
            See current availability
          </Link>
          <Link
            href="/schedule-a-tour"
            className="inline-block border border-border px-6 py-3 text-xs uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Schedule a tour
          </Link>
        </div>
      </div>
    );
  }

  const group = groupForUnit(unit.unit);
  const rent = formatRent(unit.rent);
  // Floor-plan database is authoritative over the AppFolio feed — see data/unitSqft.ts.
  const sqft = resolveUnitSqft(unit);
  const baths = unit.bathrooms ?? group?.baths ?? null;
  const applyUrl = (unit.listingUrl && applyUrlForListing(unit.listingUrl)) || APPLY_URL;
  const tourUrl = unit.listingUrl ? tourUrlForListing(unit.listingUrl) : null;
  const heroPhotos = unit.photos.slice(0, 5);
  // The tour's VideoObject JSON-LD is emitted from the shared unit SEO model
  // (unitPageSeo.ts) — uploadDate/thumbnail come from the committed YouTube
  // metadata cache, not AppFolio.
  const videoEmbedUrl = unit.videoUrl ? youTubeEmbedUrl(unit.videoUrl) : null;
  const floor = unitFloor(unit.unit);
  const ada = adaDesignation(unit.unit);
  // Reverse of matchingUnitsForPlan: the layout's own landing page, so
  // shoppers can compare every apartment sharing this floor plan.
  const planPage = planPageForUnit(unit.unit);

  return (
    <div className="pb-16 pt-10 md:pt-14">
      {/* Indexable per-unit head: title/description/canonical/OG + Apartment/
          OfferForLease JSON-LD from the shared model — identical to what the
          prerenderer emits for this path (entry-server.tsx). */}
      <Seo
        path={`/available-units/${unit.unit}`}
        model={buildUnitSeoModel(unit, data?.updatedAt ?? null)}
      />

      <div className="container mx-auto px-4">
        <Link
          href="/available-units"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All available residences
        </Link>

        {/* Fact-first header: the first ~100 words of the page answer "what is
            this apartment?" directly for visitors, crawlers, and AI assistants
            — before photos or any expanded detail. */}
        <div className="mx-auto mt-8 max-w-3xl text-center">
          <h1 className="text-3xl font-semibold uppercase tracking-wider text-foreground md:text-4xl">
            Apartment {unit.unit}
            {floor !== null && (
              <span className="sr-only"> — floor {floor}</span>
            )}
          </h1>
          <p className="mt-2 text-muted-foreground">{ADDRESS}</p>
          <p className="mt-5 text-base leading-relaxed text-foreground">{unitFactSummary(unit)}</p>
          {/* Freshness disclosure: prerendered pricing can outlive a publish,
              so state the data's own date — visitors, crawlers, and AI
              assistants all see how current the quoted rent is. After
              hydration this reflects the live feed's timestamp. */}
          {data?.updatedAt && !Number.isNaN(Date.parse(data.updatedAt)) && (
            <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">
              Pricing and availability as of{' '}
              {new Date(data.updatedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
              {' — '}
              <Link href="/available-units" className="underline hover:text-primary">
                see current availability
              </Link>
            </p>
          )}
        </div>

        {/* Photo collage */}
        {heroPhotos.length > 0 && (
          <button
            type="button"
            onClick={() => setGalleryOpen(true)}
            className="relative mt-6 grid w-full cursor-pointer grid-cols-4 grid-rows-2 gap-1 overflow-hidden"
            // Visible badge text is "{n} photos", so the accessible name must
            // BEGIN with it (WCAG 2.5.3 label-in-name — guarded site-wide by
            // prerender-link-names.test.ts).
            aria-label={`${unit.photos.length} photos of apartment ${unit.unit} — view all`}
          >
            {/* The lead collage photo is above the fold, so it loads eagerly
                with high fetch priority (lazy-loading the largest visible
                image delays LCP). It is wrapped in <picture> because React 19
                SSR auto-emits a fixed-href image preload for any eager plain
                <img> outside <picture>, which the prerender guard rejects
                (these external AppFolio photos can't go through SmartImg's
                manifest). The remaining collage tiles stay lazy. */}
            {/* width/height: AppFolio listing photos are landscape 3:2; the
                intrinsic ratio hint lets the browser reserve space before the
                image loads (no layout shift), while object-cover + the grid
                classes control the displayed size. */}
            <picture className="col-span-2 row-span-2">
              <img
                src={heroPhotos[0]}
                alt={`Apartment ${unit.unit} interior`}
                loading="eager"
                fetchPriority="high"
                width={1170}
                height={780}
                className="h-full max-h-[420px] w-full object-cover"
              />
            </picture>
            {heroPhotos.slice(1).map((p, i) => (
              <img
                key={p}
                src={p}
                alt={`Apartment ${unit.unit} interior ${i + 2}`}
                loading="lazy"
                width={585}
                height={390}
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
            {ada && (
              <div>
                <p className="text-sm uppercase tracking-wider text-muted-foreground">Accessibility</p>
                <p className="mt-1 flex items-center justify-center gap-2 text-lg font-medium text-foreground">
                  <Accessibility className="h-5 w-5 text-primary" aria-hidden="true" />
                  ADA ({ada})
                </p>
              </div>
            )}
          </div>

          {/* ADA designation detail: key + leasing disclaimer must accompany
              the designation wherever it is shown (as-built matrix rule). */}
          {ada && (
            <div className="mx-auto mt-6 max-w-3xl border-t border-border pt-5 text-center text-sm leading-relaxed text-muted-foreground">
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
          {/* Posted listings book through the Exhibit-branded scheduler
              (real AppFolio showing times, no external hop); unposted units
              fall back to the general tour-request form. */}
          <Link
            href={
              tourUrl
                ? `/schedule-showing?unit=${unit.unit}`
                : `/schedule-a-tour?unit=${unit.unit}`
            }
            className="w-full border border-border px-8 py-4 text-center text-xs uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:text-primary sm:w-auto"
          >
            Schedule a tour
          </Link>
        </div>

        {/* Marketing story — centered content column (facts live in the
            header block at the top of the page). */}
        <div className="mx-auto mt-16 max-w-3xl text-center">
          {/* tracking-wider (not the 10px site display tracking): this is a
              sentence-length marketing line, and display-level letter-spacing
              makes it unreadable at this size. */}
          {unit.marketingTitle && (
            <h2 className="mt-8 text-xl font-medium tracking-wider text-foreground">
              {unit.marketingTitle}
            </h2>
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
                setPlanVariant(variantIndexForUnit(group, unit.unit));
                setPlanOpen(true);
              }}
              className="mt-8 inline-block border border-border px-6 py-3 text-xs uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              View the {group.typeLabel} floor plan
            </button>
          )}
          {planPage && (
            <p className="mt-5 text-sm text-muted-foreground">
              This apartment uses the{' '}
              <Link
                href={floorPlanPagePath(planPage.slug)}
                className="underline transition-colors hover:text-primary"
              >
                {floorPlanH1(planPage)} floor plan
              </Link>{' '}
              — see the full layout and every available apartment with it.
            </p>
          )}
        </div>

        {/* Video tour — wide, cinematic break between story and specs */}
        {videoEmbedUrl && (
          <div className="mx-auto mt-20 max-w-4xl">
            <div className="mb-10 h-px bg-border" />
            <h2 className="mb-8 text-center text-xl uppercase tracking-wider text-foreground">
              Video Tour
            </h2>
            <div className="relative w-full overflow-hidden border border-border bg-black" style={{ aspectRatio: '16 / 9' }}>
              <EmbedFacade
                poster={youTubeThumbnailUrl(unit.videoUrl!) ?? ''}
                posterAlt={`Preview of the apartment ${unit.unit} video tour`}
                buttonLabel={`Play video tour of apartment ${unit.unit}`}
                actionText="Play video"
                embedUrl={videoEmbedUrl}
              >
                <iframe
                  src={`${videoEmbedUrl}&autoplay=1`}
                  title={`Video tour of apartment ${unit.unit}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                  width={1280}
                  height={720}
                  className="absolute inset-0 h-full w-full"
                />
              </EmbedFacade>
            </div>
          </div>
        )}

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

        {/* Related pages — descriptive internal links so visitors (and
            crawlers) can reach the building-wide facts behind this listing. */}
        <div className="mx-auto mt-20 max-w-3xl">
          <div className="mb-10 h-px bg-border" />
          <h2 className="mb-6 text-center text-xl uppercase tracking-wider text-foreground">
            More About Exhibit On Superior
          </h2>
          <ul className="flex flex-wrap items-center justify-center gap-3 text-center">
            {[
              { href: '/available-units', label: 'All available apartments & floor plans' },
              { href: '/amenities', label: 'Building amenities' },
              { href: '/fees', label: 'Fees, utilities & leasing costs' },
              { href: '/parking-transportation', label: 'Parking & transportation' },
              { href: '/pet-friendly', label: 'Pet policy' },
              {
                href: tourUrl
                  ? `/schedule-showing?unit=${unit.unit}`
                  : `/schedule-a-tour?unit=${unit.unit}`,
                label: `Schedule a tour of Apt ${unit.unit}`,
              },
            ].map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="inline-block border border-border px-4 py-2 text-xs uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

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
