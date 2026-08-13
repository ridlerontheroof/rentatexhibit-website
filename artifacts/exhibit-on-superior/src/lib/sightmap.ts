/**
 * Engrain SightMap embed integration (Available Units page).
 *
 * The map is embedded via the click-to-load facade; once the visitor
 * activates it, this module loads Engrain's small IFrame API SDK
 * (https://sightmap.com/embed/api.js) and subscribes to the SightMap
 * Metrics API events (https://developers.sightmap.com/docs/sightmap-metrics-api).
 * The SDK performs the postMessage origin validation against sightmap.com
 * internally, and the embed URL's `origin` parameter pins our side of the
 * channel, so no hand-rolled `message` listener exists here.
 *
 * Availability inside the map is synced server-side by Engrain from our
 * AppFolio — the site never injects availability into the map.
 */

export const SIGHTMAP_EMBED_ID = 'r5v516ejwny';

/** Canonical embed URL (no runtime params) — exposed via data-embed-url so the
 * prerender-mirror tests can assert the facade defers exactly this embed. */
export const SIGHTMAP_EMBED_URL = `https://sightmap.com/embed/${SIGHTMAP_EMBED_ID}`;

/** DOM id the SightMap SDK uses to find the iframe. */
export const SIGHTMAP_IFRAME_ID = 'sightmap-embed';

/**
 * Full iframe src, built in the browser at activation time:
 * - enable_api/origin: switch on the postMessage Metrics API, pinned to the
 *   serving origin (dev preview and production differ, so this can't be baked).
 * - hide_apply_button: the map's own in-modal "Apply" CTA would deep-link the
 *   visitor straight to AppFolio's hosted page, bypassing the site's branded
 *   application-start flow (lead capture + attribution + bot guard). Hidden —
 *   our own CTA row below the map is the only apply path.
 * - disable_structured_data: the page already renders its own Apartment/Offer
 *   JSON-LD from the availability feed; the map's would duplicate it.
 */
export function sightMapIframeSrc(): string {
  // SSR-safe: the iframe element is only ever *rendered* after the facade
  // click (browser-only), but the JSX that describes it is constructed on
  // every render, including prerender — so this must not touch window there.
  if (typeof window === 'undefined') return SIGHTMAP_EMBED_URL;
  const params = new URLSearchParams({
    enable_api: '1',
    origin: window.location.origin,
    hide_apply_button: '1',
    disable_structured_data: '1',
  });
  return `${SIGHTMAP_EMBED_URL}?${params.toString()}`;
}

/** Unit payload carried by the Metrics API click events. */
export interface SightMapUnit {
  id?: string;
  unitNumber?: string;
  unitNumberDisplay?: string;
  price?: number | null;
  priceDisplay?: string | null;
  floorPlan?: { name?: string; bedroomCount?: number; bathroomCount?: number };
}

interface SightMapEvent {
  name?: string;
  data?: {
    unit?: SightMapUnit;
    units?: SightMapUnit[];
    filters?: Array<{ label?: string; selectedOptions?: Array<{ label?: string }> }>;
  };
}

export interface SightMapEmbed {
  on(eventName: string, handler: (event: SightMapEvent) => void): void;
  /** Disable in-map UI elements ('filters' | 'unitList' | 'floorSelection' |
   * 'unitTooltip' | 'unitDetails'). Optional: older SDK builds may lack it. */
  disableUI?(elements: string[]): void;
}

declare global {
  interface Window {
    SightMap?: { Embed: new (iframeId: string) => SightMapEmbed };
  }
}

let sdkPromise: Promise<void> | null = null;

/** Load Engrain's IFrame API SDK once (only ever called after the facade is
 * activated — never during the page's startup window). */
export function loadSightMapSdk(): Promise<void> {
  if (window.SightMap) return Promise.resolve();
  if (!sdkPromise) {
    sdkPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://sightmap.com/embed/api.js';
      script.onload = () => resolve();
      script.onerror = () => {
        sdkPromise = null; // allow a retry on the next activation
        reject(new Error('SightMap SDK failed to load'));
      };
      document.head.appendChild(script);
    });
  }
  return sdkPromise;
}

/**
 * Resolve a SightMap unit identifier to the site's unit token
 * (apartment # = pad2(floor)+pad2(line), e.g. "0208"). SightMap is fed from
 * the same AppFolio, so unit numbers should already be "0208"-style; the
 * digit-normalization tolerates display prefixes like "UNIT 208" or "2-08".
 * Returns null (callers must log the raw identifier) when nothing plausible
 * remains.
 */
export function unitTokenFromSightMap(unit: SightMapUnit | undefined): string | null {
  const raw = unit?.unitNumber ?? unit?.unitNumberDisplay ?? '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 3 || digits.length > 4) return null;
  return digits.padStart(4, '0');
}

/** Compact "Bedrooms: 2 · Unit Price: $3k-$4k" summary of the active
 * (non-"Any") filters, capped for GA4 param limits. */
export function summarizeSightMapFilters(event: SightMapEvent): string {
  const filters = event.data?.filters ?? [];
  const active = filters
    .map((f) => {
      const chosen = (f.selectedOptions ?? [])
        .map((o) => o.label ?? '')
        .filter((label) => label && label !== 'Any');
      return chosen.length ? `${f.label ?? '?'}: ${chosen.join(',')}` : null;
    })
    .filter(Boolean)
    .join(' · ');
  return active.slice(0, 100);
}
