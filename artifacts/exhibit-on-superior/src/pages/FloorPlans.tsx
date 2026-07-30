import { KnowledgeLinks } from '../components/KnowledgeLinks';
import { DeferBelowFold } from '../components/DeferBelowFold';
import { useEffect, useMemo } from 'react';
import { PageHero } from '../components/PageHero';
import { Link, useLocation } from 'wouter';
import { Seo } from '../components/Seo';
import { QuickAnswer } from '../components/QuickAnswer';
import { FaqSection } from '../components/FaqSection';
import { SplitHeadline } from '../components/SplitHeadline';
import { AvailableUnits } from '../components/floor-plans/AvailableUnits';
import { useAvailability } from '../hooks/use-availability';
import { SmartImg } from '../components/SmartImg';
import { planGroups, resolveDeepLink } from '../data/floorPlans';
import {
  FLOOR_PLAN_PAGES,
  floorPlanPagePath,
  PLAN_DEEP_LINK_REDIRECTS,
} from '../data/floorPlanPages';
import { unitAvailabilityJsonLd } from '../data/unitJsonLd';
import { ADA_KEY, ADA_DISCLAIMER } from '../data/ada';

function readPlanFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('plan');
}

// Deep-link: `?ada=1` marks visitors arriving from accessibility-focused
// links (the accessibility statement, the ADA Knowledge article, and ads);
// the page shows the ADA designation key and routes them to the layouts
// carrying designated apartments.
function readAdaFromUrl(): boolean {
  if (typeof window === 'undefined') return false;
  const value = new URLSearchParams(window.location.search).get('ada');
  return value === '1' || value === 'true';
}

/**
 * The floor-plan landing page for a legacy `?plan=<group id>` deep link.
 * Groups with several plan sheets (floor-band variants) resolve to the
 * group's first sheet — the same card order the /floor-plans hub lists.
 *
 * Production answers these deep links with a server-side 301 built from the
 * SAME map (PLAN_DEEP_LINK_REDIRECTS via dist/plan-redirects.json), so this
 * client redirect is the dev/preview fallback and can never disagree with it.
 */
export function landingPathForPlanId(planId: string | null): string | null {
  const id = resolveDeepLink(planGroups, planId);
  if (!id) return null;
  return PLAN_DEEP_LINK_REDIRECTS[id] ?? null;
}

// Baked fallback only — the component swaps in the live feed's units below so
// rented apartments drop out of the rendered Apartment/Offer graph immediately
// instead of lingering until the next publish.
const bakedUnitStructuredData = unitAvailabilityJsonLd();

export function FloorPlans() {
  const ada = readAdaFromUrl();
  const [, navigate] = useLocation();

  // Legacy `?plan=` deep links used to open the on-page floor-plan lightbox.
  // The catalog now lives at /floor-plans, so resolve the id to its layout
  // landing page instead of silently ignoring the parameter. `replace` keeps
  // the redirect out of history so Back returns to wherever the visitor came
  // from, not to the redirecting URL.
  useEffect(() => {
    const target = landingPathForPlanId(readPlanFromUrl());
    if (target) navigate(target, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live-feed structured data: once the availability query resolves (it starts
  // from the baked snapshot via placeholderData), the Apartment/Offer graph
  // reflects current inventory — a unit rented after the last publish
  // disappears from the rendered JSON-LD within one feed refresh.
  const { data: availability } = useAvailability();
  const unitStructuredData = useMemo(
    () =>
      availability
        ? unitAvailabilityJsonLd(availability.units, availability.updatedAt)
        : bakedUnitStructuredData,
    [availability],
  );

  // ADA-designated layouts (for the ?ada=1 arrival panel): every landing page
  // with at least one designated (A)/(AC) apartment.
  const adaPages = ada ? FLOOR_PLAN_PAGES.filter((fp) => fp.adaUnits.length > 0) : [];

  return (
    <>
      <Seo
        path="/available-units"
        // `?ada=1` deep links get a distinct title so crawlers don't flag the
        // parameterized variant as a duplicate of the base page (canonical
        // still points at /available-units).
        title={
          ada ? 'ADA-Accessible Units & Floor Plans | Exhibit On Superior' : undefined
        }
        description={
          ada
            ? 'Browse ADA-accessible apartments at Exhibit On Superior in River North, Chicago — accessible floor plans, real-time pricing, and availability.'
            : undefined
        }
        extraJsonLd={[unitStructuredData]}
      />

      <div>
        <PageHero
          image="/images/image-030-012417-5663-hxwee6.jpg"
          alt="Available Units | Exhibit On Superior in Chicago, Illinois"
          titleScript="Move-In Ready Residences"
          title="Available Units"
          subtitle="Live Pricing & Availability, Studio to 3 Bedroom Apartments in River North Chicago"
          compact
        />

        <AvailableUnits />

        <QuickAnswer path="/available-units" />

        {/* Everything below the Available Units strip starts below the fold
            on all viewports (verified by check-units-above-fold), so it can
            hydrate in a time-sliced transition instead of the critical path. */}
        <DeferBelowFold>
        {/* Layout intent hands off to the /floor-plans hub — the full
            27-line catalog (34 plan sheets) lives there now, one landing
            page per layout. */}
        <section className="cv-below-fold px-4 py-14">
          <div className="container mx-auto max-w-3xl text-center">
            <SplitHeadline
              script="Find Your Perfect Fit"
              caps="Explore All Layouts"
              className="mb-6"
            />
            <p className="text-lg leading-relaxed text-muted-foreground">
              Looking for a specific layout rather than what&rsquo;s available today? Every
              distinct Exhibit On Superior floor plan &mdash; studios, convertibles, and one-,
              two-, and three-bedroom homes &mdash; has its own page with the plan sheet,
              square footage, floor range, and balcony and accessibility details.
            </p>
            <Link href="/floor-plans" className="btn-gold-outline mt-8 inline-block">
              Browse All Floor Plans
            </Link>

            {/* ADA arrivals (?ada=1): designation key + direct links to every
                layout with designated (A)/(AC) apartments. */}
            {ada && (
              <div className="mt-10 border border-border bg-white p-6 text-left text-sm leading-relaxed text-muted-foreground">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[2px] text-foreground">
                  ADA designation key
                </p>
                {ADA_KEY.map((k) => (
                  <p key={k.code}>
                    <span className="font-semibold text-foreground">{k.label}</span>: {k.description}
                  </p>
                ))}
                <p className="mt-2">{ADA_DISCLAIMER}</p>
                {adaPages.length > 0 && (
                  <>
                    <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-[2px] text-foreground">
                      Layouts with ADA-designated apartments
                    </p>
                    <ul className="flex flex-wrap gap-x-4 gap-y-1">
                      {adaPages.map((fp) => (
                        <li key={fp.slug}>
                          <Link
                            href={floorPlanPagePath(fp.slug)}
                            className="text-primary underline underline-offset-4 hover:text-primary/80"
                          >
                            {fp.plan.typeLabel} &mdash; Unit {String(fp.plan.unit).padStart(2, '0')}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Closing CTA — carried over from the original site, now pointing
            layout browsing at the /floor-plans hub. */}
        <section className="cv-below-fold px-4 py-20">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
              <div className="lg:order-1">
                <SplitHeadline
                  script="Live Smart, Live Beautifully"
                  caps="Studio, Convertible, 1, 2 & 3 Bedroom Floor Plans"
                  align="left"
                  className="mb-6"
                />
                <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
                  Choose your perfect floor plan and step up to a trend-forward home that provides
                  the ultimate respite from the hustle and bustle of Chicago. Packed with stylish
                  features and life-enhancing extras, the studio, convertible, one, two, and three bedroom
                  apartments at Exhibit On Superior are designed for ultimate modern living. Enjoy a
                  space that&rsquo;s uniquely yours, perfect for both relaxing and entertaining
                  right here at Exhibit.
                </p>
                <Link href="/floor-plans" className="btn-gold-outline inline-block">
                  Compare Every Layout
                </Link>
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
        <section className="cv-below-fold bg-dark-section px-4 py-20">
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

        <FaqSection path="/available-units" />

        <KnowledgeLinks
          slugs={[
            'what-apartment-sizes',
            'which-units-have-balconies',
            'what-is-a-convertible',
            'largest-apartment',
            'ada-accessible-apartments',
            'lease-terms',
          ]}
        />
        </DeferBelowFold>
      </div>
    </>
  );
}
