import { useMemo, useState } from 'react';
import { Link, useParams } from 'wouter';
import {
  ArrowLeft,
  Accessibility,
  Bath,
  BedDouble,
  Building2,
  Ruler,
  Sun,
} from 'lucide-react';
import { Seo } from '../components/Seo';
import { PlanLightbox } from '../components/floor-plans/PlanLightbox';
import { useAvailability } from '../hooks/use-availability';
import { formatAvailable, formatRent } from '../components/floor-plans/AvailableUnits';
import {
  buildFloorPlanSeoModel,
  floorPlanH1,
  floorPlanPage,
  floorPlanPagePath,
  floorPlanSummary,
  matchingUnitsForPlan,
  planFloorPhrase,
  relatedPagesFor,
  variantPagesFor,
} from '../data/floorPlanPages';
import { planSqftLabel } from '../data/floorPlans';
import { ADA_KEY, ADA_DISCLAIMER } from '../data/ada';
import { APPLY_URL } from '../data/seo';
import { trackOutboundClick } from '../lib/analytics';
import { useModalHistory } from '../hooks/use-modal-history';

/**
 * Landing page for one distinct floor-plan layout (/floor-plans/<slug>):
 * plan facts, the plan sheet itself, and the live matching inventory. The
 * page stays fully useful with zero current availability — the plan facts
 * never disappear and the empty state offers the interest-list/contact CTA,
 * never a redirect.
 */
export function FloorPlanDetail() {
  const params = useParams<{ slug: string }>();
  const page = floorPlanPage(params.slug);
  const { data } = useAvailability();
  const [planOpen, setPlanOpen] = useState(false);
  const closePlan = useModalHistory(planOpen, () => setPlanOpen(false));

  const matching = useMemo(
    () => (page ? matchingUnitsForPlan(page.plan, data?.units ?? []) : []),
    [page, data],
  );

  if (!page) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <Seo
          path={`/floor-plans/${params.slug}`}
          title="Floor Plan Not Found | Exhibit On Superior"
          noindex
        />
        <h1 className="text-2xl font-semibold uppercase tracking-wider text-foreground">
          That floor plan could not be found
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          The link may be out of date. Every layout in the tower is listed on our Floor Plans
          page.
        </p>
        <Link
          href="/floor-plans"
          className="mt-6 inline-block bg-primary px-6 py-3 text-xs uppercase tracking-wider text-white transition-opacity hover:opacity-90"
        >
          Browse all floor plans
        </Link>
      </div>
    );
  }

  const p = page.plan;
  const variantIndex = Math.max(
    0,
    page.group.variants.findIndex((v) => v.id === p.id),
  );

  return (
    <div className="pb-16 pt-10 md:pt-14">
      <Seo
        path={floorPlanPagePath(page.slug)}
        model={buildFloorPlanSeoModel(page, data?.units ?? [], data?.updatedAt ?? null)}
      />

      <div className="container mx-auto px-4">
        <Link
          href="/floor-plans"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All floor plans
        </Link>

        {/* Fact-first header: the first ~60 words answer "what is this floor
            plan?" directly for visitors, crawlers, and AI assistants. */}
        <div className="mx-auto mt-8 max-w-3xl text-center">
          <h1 className="text-3xl font-semibold uppercase tracking-wider text-foreground md:text-4xl">
            {floorPlanH1(page)}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Residence line {String(p.unit).padStart(2, '0')} &middot; Exhibit On Superior, 165 W
            Superior St, Chicago
          </p>
          <p className="mt-5 text-base leading-relaxed text-foreground">{floorPlanSummary(page)}</p>
        </div>

        {/* Plan sheet — click to zoom via the shared lightbox. */}
        <div className="mx-auto mt-8 max-w-3xl">
          <button
            type="button"
            onClick={() => setPlanOpen(true)}
            className="group block w-full cursor-zoom-in border border-border bg-white transition-colors hover:border-primary"
          >
            {/* <picture> wrapper: React 19 SSR auto-emits a fixed-href preload
                for eager plain <img>, which the prerender guard rejects. */}
            <picture>
              <img
                src={p.images.detail}
                alt={`${p.typeLabel} floor plan diagram, ${planSqftLabel(p)} sq ft, ${planFloorPhrase(p)}`}
                loading="eager"
                fetchPriority="high"
                width={1200}
                height={900}
                className="h-auto w-full object-contain p-4"
              />
            </picture>
            <span className="block border-t border-border px-4 py-3 text-center text-xs uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-primary">
              Click to zoom the plan sheet
            </span>
          </button>
        </div>
      </div>

      {/* Key facts bar */}
      <div className="mt-10 border-y border-border bg-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-center">
            <div>
              <p className="text-sm uppercase tracking-wider text-muted-foreground">Layout</p>
              <p className="mt-1 flex items-center justify-center gap-2 text-lg font-medium text-foreground">
                <BedDouble className="h-5 w-5 text-primary" aria-hidden="true" />
                {p.typeLabel}
              </p>
            </div>
            <div>
              <p className="text-sm uppercase tracking-wider text-muted-foreground">Bathrooms</p>
              <p className="mt-1 flex items-center justify-center gap-2 text-lg font-medium text-foreground">
                <Bath className="h-5 w-5 text-primary" aria-hidden="true" />
                {p.baths} Bath
              </p>
            </div>
            <div>
              <p className="text-sm uppercase tracking-wider text-muted-foreground">Square Feet</p>
              <p className="mt-1 flex items-center justify-center gap-2 text-lg font-medium text-foreground">
                <Ruler className="h-5 w-5 text-primary" aria-hidden="true" />
                {planSqftLabel(p)}
              </p>
            </div>
            <div>
              <p className="text-sm uppercase tracking-wider text-muted-foreground">Floors</p>
              <p className="mt-1 flex items-center justify-center gap-2 text-lg font-medium text-foreground">
                <Building2 className="h-5 w-5 text-primary" aria-hidden="true" />
                {planFloorPhrase(p).replace(/^floors? /, '')}
              </p>
            </div>
            <div>
              <p className="text-sm uppercase tracking-wider text-muted-foreground">Balcony</p>
              <p className="mt-1 flex items-center justify-center gap-2 text-lg font-medium text-foreground">
                <Sun className="h-5 w-5 text-primary" aria-hidden="true" />
                {page.balcony ? 'Private balcony' : 'No balcony'}
              </p>
            </div>
          </div>

          {/* Balcony exception note — the 02/03 stacks on floors 6–29 are the
              only balcony-free homes in the tower (verified building fact). */}
          {!page.balcony && (
            <p className="mx-auto mt-6 max-w-3xl border-t border-border pt-5 text-center text-sm leading-relaxed text-muted-foreground">
              This plan is one of the only two layouts in the tower without a private balcony:
              the 02 and 03 stacks on floors 6&ndash;29. Every other floor plan includes one.
            </p>
          )}

          {/* ADA designations: key + leasing disclaimer must accompany the
              designation wherever it is shown (as-built matrix rule). */}
          {page.adaUnits.length > 0 && (
            <div className="mx-auto mt-6 max-w-3xl border-t border-border pt-5 text-center text-sm leading-relaxed text-muted-foreground">
              <p className="flex items-center justify-center gap-1.5 text-foreground">
                <Accessibility className="h-4 w-4 text-primary" aria-hidden="true" />
                Designated accessible apartments in this plan&rsquo;s floor range:
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                {page.adaUnits.map((u) => (
                  <span
                    key={u.unit}
                    className="border border-primary/40 px-2 py-0.5 text-xs tracking-wide"
                  >
                    {u.unit} ({u.designation})
                  </span>
                ))}
              </div>
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

      <div className="container mx-auto px-4">
        {/* Live matching inventory — or the never-empty interest-list state. */}
        <div className="mx-auto mt-16 max-w-3xl">
          <h2 className="mb-6 text-center text-xl uppercase tracking-wider text-foreground">
            Available {p.typeLabel} Apartments{p.sqftMin === p.sqft ? `, ${planSqftLabel(p)} Sq Ft` : ''}
          </h2>
          {matching.length > 0 ? (
            <ul className="divide-y divide-border border border-border bg-white">
              {matching.map((u) => (
                <li key={u.unit}>
                  <Link
                    href={`/available-units/${u.unit}`}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-muted"
                  >
                    <span className="text-sm font-semibold uppercase tracking-wider text-foreground">
                      Apartment {u.unit}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatAvailable(u.availableOn)}
                    </span>
                    {formatRent(u.rent) && (
                      <span className="text-base font-semibold text-primary">
                        {formatRent(u.rent)}
                      </span>
                    )}
                    <span className="text-xs uppercase tracking-wider text-primary">
                      View listing &rarr;
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="border border-border bg-white px-6 py-8 text-center">
              <p className="text-foreground">
                No {p.typeLabel} apartment on {planFloorPhrase(p)} is available right now.
              </p>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Homes in this line turn over throughout the year. Join the interest list and the
                leasing team will reach out when one opens up, or browse everything available
                today.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/contact-us"
                  className="inline-block bg-primary px-6 py-3 text-xs uppercase tracking-wider text-white transition-opacity hover:opacity-90"
                >
                  Join the interest list
                </Link>
                <Link
                  href="/available-units"
                  className="inline-block border border-border px-6 py-3 text-xs uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  See all available homes
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Primary actions */}
        <div className="mx-auto mt-10 flex max-w-2xl flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href={APPLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackOutboundClick('apply', APPLY_URL, 'floor_plan_page', { floorPlan: page.slug })
            }
            className="w-full bg-primary px-8 py-4 text-center text-xs uppercase tracking-wider text-white transition-opacity hover:opacity-90 sm:w-auto"
          >
            Apply now
          </a>
          <Link
            href="/schedule-a-tour"
            className="w-full border border-border px-8 py-4 text-center text-xs uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:text-primary sm:w-auto"
          >
            Schedule a tour
          </Link>
        </div>

        {/* Same line on other floors + related plans */}
        {(variantPagesFor(page).length > 0 || relatedPagesFor(page).length > 0) && (
          <div className="mx-auto mt-20 max-w-3xl">
            <div className="mb-10 h-px bg-border" />
            <h2 className="mb-6 text-center text-xl uppercase tracking-wider text-foreground">
              Related Floor Plans
            </h2>
            <ul className="flex flex-wrap items-center justify-center gap-3 text-center">
              {[...variantPagesFor(page), ...relatedPagesFor(page)].map((fp) => (
                <li key={fp.slug}>
                  <Link
                    href={floorPlanPagePath(fp.slug)}
                    className="inline-block border border-border px-4 py-2 text-xs uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    {floorPlanH1(fp)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <PlanLightbox
        group={planOpen ? page.group : null}
        variantIndex={variantIndex}
        position={{ index: 0, total: 1 }}
        onClose={closePlan}
        onNavigate={() => {}}
        onVariantChange={() => {}}
      />
    </div>
  );
}
