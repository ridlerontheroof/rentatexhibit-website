import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'wouter';
import { SplitHeadline } from '../SplitHeadline';
import { EmbedFacade } from '../EmbedFacade';
import { useAvailability } from '../../hooks/use-availability';
import { tourUrlForListing } from './UnitGalleryLightbox';
import { bedBathLabel, formatRent, groupForUnit } from './AvailableUnits';
import { resolveUnitSqft } from '../../data/unitSqft';
import { trackSightMap } from '../../lib/analytics';
import {
  loadSightMapSdk,
  sightMapIframeSrc,
  summarizeSightMapFilters,
  unitTokenFromSightMap,
  SIGHTMAP_EMBED_URL,
  SIGHTMAP_IFRAME_ID,
  type SightMapUnit,
} from '../../lib/sightmap';

/** How long the iframe gets to fire onLoad before we show the failure state. */
const IFRAME_LOAD_TIMEOUT_MS = 15_000;

/**
 * "Explore the Building" — the Engrain SightMap interactive property map,
 * placed map-first at the top of /available-units (approved mockup). The
 * heavy embed loads only on click through EmbedFacade; until then the section
 * is a local poster + real button, so prerendered HTML, markdown twins, and
 * the TBT/LCP budgets are unaffected.
 *
 * Once loaded, the Metrics API drives:
 * - the Exhibit CTA row under the map (details / schedule tour / apply now —
 *   the SAME routes as the unit list rows, so no lead ever bypasses the
 *   site's schedulers, application flow, or attribution), and
 * - GA4 events via the deferred analytics module.
 *
 * Failure discipline: the map is third-party, so every failure mode keeps a
 * site-owned conversion path visible —
 * - iframe never loads (blocked/offline): a visible message with Try Again
 *   replaces the blank panel, and the CTA row below stays.
 * - SDK fails: the map itself still works; the CTA row stays pinned to the
 *   first available unit and a note says in-map selection won't sync.
 * - availability feed not loaded: the CTA row falls back to the general
 *   residence list / tour / application links (no unit prefill).
 */
export function SightMapSection() {
  const { data } = useAvailability();
  const [activated, setActivated] = useState(false);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  // iframe lifecycle: 'loading' → 'loaded' | 'failed' (timeout); retryNonce
  // remounts the iframe for Try Again.
  const [iframeState, setIframeState] = useState<'loading' | 'loaded' | 'failed'>('loading');
  const [retryNonce, setRetryNonce] = useState(0);
  const [sdkFailed, setSdkFailed] = useState(false);
  const iframeStateRef = useRef(iframeState);
  iframeStateRef.current = iframeState;

  const units = data?.units;
  const count = units?.length ?? null;

  // CTA row target: the map-selected unit when it matches a posted unit;
  // before any selection, the first posted unit (the bar is pre-filled from
  // the moment the map mounts, so selection never shifts layout).
  const ctaUnit = useMemo(() => {
    if (!units || units.length === 0) return null;
    return (selectedToken && units.find((u) => u.unit === selectedToken)) || units[0];
  }, [units, selectedToken]);

  // Selected-but-unposted units (shouldn't happen — Engrain syncs from the
  // same AppFolio) still get tour/apply CTAs via the general fallbacks.
  const unpostedToken = selectedToken && units && !units.some((u) => u.unit === selectedToken)
    ? selectedToken
    : null;

  // Iframe watchdog: if onLoad hasn't fired within the timeout (network
  // block, extension, sightmap.com outage), surface the failure state
  // instead of leaving a silent blank panel.
  useEffect(() => {
    if (!activated) return;
    setIframeState('loading');
    const timer = window.setTimeout(() => {
      if (iframeStateRef.current !== 'loaded') setIframeState('failed');
    }, IFRAME_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [activated, retryNonce]);

  useEffect(() => {
    if (!activated) return;
    let disposed = false;
    loadSightMapSdk()
      .then(() => {
        if (disposed || !window.SightMap) return;
        const embed = new window.SightMap.Embed(SIGHTMAP_IFRAME_ID);

        const onUnitClick = (event: { data?: { unit?: SightMapUnit } }) => {
          const unit = event.data?.unit;
          const token = unitTokenFromSightMap(unit);
          if (token) {
            setSelectedToken(token);
          } else {
            // Unmatched identifier: keep the previous CTA target and surface
            // the raw value for debugging + GA so drift is noticed.
            console.warn('[sightmap] unmatched unit identifier', unit?.unitNumber, unit?.id);
          }
          trackSightMap('sightmap_unit_selected', {
            unit_number: token ?? (unit?.unitNumber ?? 'unknown'),
            matched: Boolean(token),
            ...(unit?.floorPlan?.name ? { floor_plan: unit.floorPlan.name } : {}),
          });
        };

        embed.on('metrics.unitMap.unit.click', onUnitClick);
        embed.on('metrics.unitList.unit.click', onUnitClick);
        embed.on('metrics.unitMatches.impression', () => trackSightMap('sightmap_impression'));
        embed.on('metrics.filters.change', (event) => {
          trackSightMap('sightmap_filter_change', { filters: summarizeSightMapFilters(event) });
        });
        // hide_apply_button suppresses the in-map Apply CTA, so these should
        // never fire — tracked anyway so a config regression shows up in GA4.
        const onApply = (event: { data?: { unit?: SightMapUnit } }) => {
          trackSightMap('sightmap_apply_click', {
            unit_number: unitTokenFromSightMap(event.data?.unit) ?? 'unknown',
          });
        };
        embed.on('metrics.unitDetails.apply.click', onApply);
        embed.on('metrics.calculator.apply.click', onApply);
        embed.on('metrics.unitDetails.outbound.click', (event) => {
          trackSightMap('sightmap_outbound_click', {
            unit_number: unitTokenFromSightMap(event.data?.unit) ?? 'unknown',
          });
        });
      })
      .catch((err: unknown) => {
        // The map itself still works without the SDK — but in-map unit
        // selection won't sync to the CTA row, so say so under the bar.
        console.warn('[sightmap] SDK unavailable:', err);
        if (!disposed) setSdkFailed(true);
      });
    return () => {
      disposed = true;
    };
  }, [activated, retryNonce]);

  const ctaGroup = ctaUnit ? groupForUnit(ctaUnit.unit) : null;
  const ctaSqft = ctaUnit ? resolveUnitSqft(ctaUnit) : null;
  const ctaRent = ctaUnit ? formatRent(ctaUnit.rent) : null;
  const ctaTourUrl = ctaUnit?.listingUrl ? tourUrlForListing(ctaUnit.listingUrl) : null;
  const ctaButtonToken = unpostedToken ?? ctaUnit?.unit ?? null;

  return (
    <section
      id="explore-the-building"
      className="px-4 pb-6 pt-10"
      aria-labelledby="sightmap-heading"
    >
      <div className="container mx-auto">
        <div id="sightmap-heading" className="mb-3 text-center">
          <SplitHeadline script="Find It on the Map" caps="Explore the Building" />
          <p className="mx-auto mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Exhibit On Superior has 34 residential floors in River North, Chicago
            {count !== null && count > 0 && (
              <>
                {' '}&mdash; {count} residence{count === 1 ? ' is' : 's are'} available today
              </>
            )}
            . Browse floor by floor on the interactive map; availability is synced
            automatically from our leasing system.
          </p>
        </div>

        {/* Fixed-aspect wrapper: portrait on phones (the map's filters, plan
            view, and unit panel all need vertical room), 16:9 capped at 620px
            from sm up — reserved from first paint, so opening the map never
            shifts the page. */}
        <div className="relative mx-auto aspect-[3/4] w-full overflow-hidden border border-border bg-muted sm:aspect-video sm:max-h-[min(620px,75vh)]">
          <EmbedFacade
            poster="/images/sightmap-embed-poster.png"
            posterAlt="Interactive SightMap of Exhibit On Superior showing the floor-by-floor apartment availability map with price, move-in date, and bedroom filters"
            buttonLabel="Explore the interactive map of unit availability (loads the SightMap embed)"
            actionText="Explore the interactive map"
            embedUrl={SIGHTMAP_EMBED_URL}
            onActivate={() => setActivated(true)}
            // The map leads /available-units, above the fold — a lazy poster
            // here means the page's primary content pops in late.
            eagerPoster
          >
            {iframeState !== 'failed' && (
              <iframe
                key={retryNonce}
                id={SIGHTMAP_IFRAME_ID}
                title="SightMap interactive property map showing unit availability"
                src={sightMapIframeSrc()}
                className="absolute inset-0 h-full w-full"
                allow="geolocation; web-share; clipboard-write"
                onLoad={() => setIframeState('loaded')}
              />
            )}
            {iframeState === 'failed' && (
              <div
                role="alert"
                className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-muted px-6 text-center"
              >
                <p className="max-w-md text-sm text-muted-foreground">
                  The interactive map didn&rsquo;t load &mdash; it may be blocked by your
                  network or temporarily unavailable. Every residence is also listed
                  right below.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setRetryNonce((n) => n + 1)}
                    className="border border-primary px-4 py-2 text-xs uppercase tracking-wider text-primary transition-colors hover:bg-primary hover:text-white"
                  >
                    Try again
                  </button>
                  <a
                    href="#available-units"
                    className="bg-primary px-4 py-2 text-xs uppercase tracking-wider text-white transition-opacity hover:opacity-90"
                  >
                    View available residences
                  </a>
                </div>
              </div>
            )}
          </EmbedFacade>
        </div>

        {!activated ? (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Loads on click &mdash; the map&rsquo;s code never slows the page down.
          </p>
        ) : !ctaUnit ? (
          /* Availability feed hasn't loaded (or is empty): keep site-owned
             conversion paths visible under the map instead of nothing. */
          <div className="mt-3 flex flex-col gap-3 border border-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-muted-foreground">
              Ready to take the next step?
            </span>
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <a
                href="#available-units"
                className="border border-border px-4 py-2 text-xs uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                View available residences
              </a>
              <Link
                href="/schedule-a-tour"
                className="border border-primary px-4 py-2 text-xs uppercase tracking-wider text-primary transition-colors hover:bg-primary hover:text-white"
              >
                Schedule a tour
              </Link>
              <Link
                href="/start-application"
                className="bg-primary px-4 py-2 text-xs uppercase tracking-wider text-white transition-opacity hover:opacity-90"
              >
                Apply now
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Exhibit CTA row for the map-selected unit — identical targets
                to the Available Residences rows below, mounted together with
                the iframe (never inserted later), so it cannot shift layout. */}
            <div className="mt-3 flex flex-col gap-3 border border-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <span className="text-lg font-semibold uppercase tracking-wider text-foreground">
                  Apt {ctaButtonToken}
                </span>
                {!unpostedToken && (
                  <span className="ml-3 text-sm text-muted-foreground">
                    {[
                      ctaRent,
                      bedBathLabel(ctaUnit, ctaGroup),
                      ctaSqft !== null ? `${ctaSqft.toLocaleString()} sq ft` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                )}
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-3">
                {!unpostedToken && ctaUnit.details.length > 0 && (
                  <Link
                    href={`/available-units/${ctaUnit.unit}`}
                    aria-label={`Apt ${ctaUnit.unit} details`}
                    className="border border-border px-4 py-2 text-xs uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    Apt {ctaUnit.unit} details
                  </Link>
                )}
                <Link
                  href={
                    unpostedToken
                      ? `/schedule-a-tour?unit=${unpostedToken}`
                      : ctaTourUrl
                        ? `/schedule-showing?unit=${ctaUnit.unit}`
                        : `/schedule-a-tour?unit=${ctaUnit.unit}`
                  }
                  aria-label={`Schedule a tour of apartment ${ctaButtonToken}`}
                  className="border border-primary px-4 py-2 text-xs uppercase tracking-wider text-primary transition-colors hover:bg-primary hover:text-white"
                >
                  Schedule a tour
                </Link>
                <Link
                  href={`/start-application?unit=${ctaButtonToken}`}
                  aria-label={`Apply now for apartment ${ctaButtonToken}`}
                  className="bg-primary px-4 py-2 text-xs uppercase tracking-wider text-white transition-opacity hover:opacity-90"
                >
                  Apply now
                </Link>
              </div>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {sdkFailed ? (
                <>Selecting a unit in the map won&rsquo;t update this bar right now &mdash;
                use the residence list below to pick a specific apartment.</>
              ) : (
                <>Tours and applications always go through Exhibit&rsquo;s own scheduler and
                application flow &mdash; the same links as the residence list below.</>
              )}
            </p>
          </>
        )}
      </div>
    </section>
  );
}
