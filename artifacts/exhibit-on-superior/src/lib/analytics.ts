/**
 * GA4 analytics helpers. Two operating modes:
 *
 * 1. Direct gtag — when VITE_GA_MEASUREMENT_ID is set at build time, this
 *    module initialises a deferred gtag.js loader (no third-party scripts in
 *    the startup window).
 *
 * 2. GTM-managed — when VITE_GA_MEASUREMENT_ID is not set (production uses
 *    the GTM container GTM-MDPWH532 to own the GA4 Google tag). Two hard-won
 *    facts (verified live 2026-08-12 against the production site):
 *      a. GTM does NOT install window.gtag, and gtag() commands queued into
 *         the dataLayer are NOT processed by GTM's internal GA4 tag — not
 *         even `config`. Custom events silently vanish unless the page loads
 *         the real gtag.js itself.
 *      b. Once gtag.js is loaded and configured on a page that also runs GTM,
 *         `gtag('event', …)` only routes to GA4 when the event carries an
 *         explicit `send_to`. Default fan-out drops the event.
 *    So in GTM mode this module loads gtag.js itself (same deferred loader),
 *    configures the container's GA4 stream with send_page_view:false, and
 *    tags every event with send_to. page_views are entirely stream-owned in
 *    this mode: the Google tag sends the initial one and enhanced
 *    measurement's history tracking covers SPA navigations (verified live —
 *    sending our own produced doubles).
 *
 * Nothing here runs during SSR/prerender.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const MEASUREMENT_ID: string | undefined = import.meta.env.VITE_GA_MEASUREMENT_ID;

/**
 * The GA4 stream owned by the production GTM container (GTM-MDPWH532, the ID
 * hardcoded in index.html). Used only in GTM-managed mode; a build-time
 * VITE_GA_MEASUREMENT_ID always takes precedence. Public by nature — it ships
 * in gtm.js to every visitor.
 */
const GTM_GA4_ID = 'G-1S66YHBN91';

/** True when GTM owns the GA4 stream (no build-time measurement ID). */
const GTM_MANAGED = !MEASUREMENT_ID;

/** The GA4 destination every event is explicitly routed to via send_to. */
const EFFECTIVE_ID: string = MEASUREMENT_ID ?? GTM_GA4_ID;

export const analyticsEnabled = (): boolean =>
  typeof window !== 'undefined' && Boolean(MEASUREMENT_ID);

let initialized = false;

/** SPA navigation history: the path before the current one (for lead attribution). */
let previousPath: string | null = null;
let currentPath: string | null = null;

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;
const UTM_STORAGE_KEY = 'exhibit_utm_params';

/**
 * Capture UTM parameters from the landing URL and persist them for the
 * session so they survive SPA navigation and can be attached to conversions.
 * Runs even when analytics is disabled so nothing is lost if the ID is set later.
 */
function captureUtmParams(): void {
  try {
    const params = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    for (const key of UTM_KEYS) {
      const value = params.get(key);
      if (value) utm[key] = value.slice(0, 100);
    }
    if (Object.keys(utm).length > 0) {
      sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));
    }
  } catch {
    // Storage unavailable (private mode, etc.) — attribution is best-effort.
  }
}

function getStoredUtmParams(): Record<string, string> {
  try {
    const raw = sessionStorage.getItem(UTM_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return {};
    const utm: Record<string, string> = {};
    for (const key of UTM_KEYS) {
      const value = (parsed as Record<string, unknown>)[key];
      if (typeof value === 'string' && value) utm[key] = value;
    }
    return utm;
  } catch {
    return {};
  }
}

/** Load gtag.js once and configure GA4. Page views are sent manually (SPA). */
export function initAnalytics(): void {
  if (typeof window === 'undefined') return;
  captureUtmParams();
  if (initialized) return;
  initialized = true;

  window.dataLayer = window.dataLayer || [];
  // In GTM mode index.html already installed an identical stub — keep it.
  if (!window.gtag) {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer!.push(args);
    };
  }
  window.gtag('js', new Date());
  // send_page_view: false — in direct mode the SPA router reports page views
  // explicitly (see trackPageView in App.tsx); in GTM mode the container's
  // Google tag sends the initial page_view and this config exists only to
  // register the destination so send_to-routed events are delivered.
  window.gtag('config', EFFECTIVE_ID, { send_page_view: false });

  // Defer the gtag.js script itself out of the startup window, mirroring the
  // inline GTM loader in index.html: first real user gesture, tab
  // backgrounding, or shortly after `load` for fully idle visits. The `window.gtag` stub above queues every
  // event pushed in the meantime (page views included), so nothing is lost —
  // gtag.js drains the dataLayer queue when it arrives. Injecting it eagerly
  // at hydration put ~250ms of third-party main-thread work inside mobile
  // TBT on the busiest pages.
  let injected = false;
  const events = ['pointerdown', 'touchstart', 'keydown', 'wheel', 'touchmove'] as const;
  const inject = () => {
    if (injected) return;
    injected = true;
    for (const e of events) document.removeEventListener(e, inject, true);
    document.removeEventListener('visibilitychange', onHidden);
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(EFFECTIVE_ID)}`;
    document.head.appendChild(script);
  };
  // Short-bounce coverage: the moment the tab is backgrounded (app switch,
  // tab switch — how most mobile visits end) inject immediately; the browser
  // finishes loading in the background and the queued page_view is delivered.
  // This never fires during a foreground page load, so it cannot re-enter
  // the startup window it was deferred out of. Only a hard navigation away
  // within the first ~5s remains uncounted — the same bounded loss as the
  // previous fixed 5s fallback timer.
  const onHidden = () => {
    if (document.visibilityState === 'hidden') inject();
  };
  for (const e of events) {
    document.addEventListener(e, inject, { capture: true, passive: true, once: true });
  }
  document.addEventListener('visibilitychange', onHidden);
  if (document.readyState === 'complete') {
    window.setTimeout(inject, 5000);
  } else {
    window.addEventListener('load', () => window.setTimeout(inject, 5000));
  }
  window.setTimeout(inject, 30000);
}

/** Report a page view (initial load and every SPA navigation). */
export function trackPageView(path: string): void {
  if (typeof window === 'undefined') return;
  // Track SPA navigation history regardless of whether GA is enabled, so
  // attribution stays correct when the measurement ID is configured later.
  if (path !== currentPath) {
    previousPath = currentPath;
    currentPath = path;
  }
  if (!window.gtag) return;
  // In GTM mode the GA4 stream owns every page_view: the container's Google
  // tag sends the initial one, and enhanced measurement's history tracking
  // (verified firing with _ee=1 once gtag.js is on the page) covers SPA
  // navigations. Sending our own as well double-counted every SPA page_view.
  if (GTM_MANAGED) return;
  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
    send_to: EFFECTIVE_ID,
  });
}

/**
 * Report a conversion event. Uses GA4's recommended `generate_lead` event for
 * contact/tour submissions so it can be marked as a key event (conversion) in
 * the GA4 admin UI without renaming.
 *
 * Attribution parameters (no PII — never send name/email/phone):
 * - page_path: the page hosting the form
 * - referring_page: the previous SPA page (or external referrer on direct landings)
 * - floor_plan_preference: the tour form's selected floor plan (tours only)
 * - utm_*: campaign parameters captured from the landing URL for this session
 */
export function trackLead(
  formType: 'contact' | 'tour' | 'apply',
  attribution?: { floorPlanPreference?: string }
): void {
  if (!window.gtag) return;

  let referringPage = previousPath ?? '';
  if (!referringPage && document.referrer) {
    try {
      const ref = new URL(document.referrer);
      if (ref.origin !== window.location.origin) {
        referringPage = ref.origin + ref.pathname;
      }
    } catch {
      // Malformed referrer — omit.
    }
  }

  const params: Record<string, string> = {
    form_type: formType,
    page_path: currentPath ?? window.location.pathname,
    ...getStoredUtmParams(),
  };
  if (referringPage) params.referring_page = referringPage;
  if (attribution?.floorPlanPreference) {
    params.floor_plan_preference = attribution.floorPlanPreference;
  }

  // Sent with beacon transport so the conversion survives an immediate tab
  // close or navigation right after Submit (same rationale as outbound_click).
  window.gtag('event', 'generate_lead', {
    ...params,
    transport_type: 'beacon',
    send_to: EFFECTIVE_ID,
  });
}

/**
 * Report a SightMap interaction (unit selected, filters changed, apply click)
 * forwarded from the Engrain Metrics API — see src/lib/sightmap.ts.
 *
 * Works in both operating modes (direct-gtag and GTM-managed): the map only
 * mounts on a click, which is the same gesture that triggers deferred gtag.js
 * injection in direct-gtag mode, so window.gtag is always available by the
 * time the first Metrics API event fires. In GTM mode GTM's GA4 Configuration
 * tag has already installed window.gtag by page-load time. Never any PII.
 */
export function trackSightMap(
  eventName:
    | 'sightmap_impression'
    | 'sightmap_unit_selected'
    | 'sightmap_filter_change'
    | 'sightmap_apply_click'
    | 'sightmap_outbound_click'
    | 'sightmap_tour_cta_click'
    | 'sightmap_apply_cta_click',
  extra: Record<string, string | number | boolean> = {}
): void {
  if (!window.gtag) return;
  window.gtag('event', eventName, {
    ...extra,
    page_path: currentPath ?? window.location.pathname,
    ...getStoredUtmParams(),
    send_to: EFFECTIVE_ID,
  });
}

/**
 * Report a click on a high-intent outbound CTA (Apply Now / View Availability
 * on RentCafe). Same attribution model as trackLead — page path, referring
 * page, and stored UTM params; never any PII.
 *
 * - link_type: 'apply' | 'availability'
 * - link_url: the outbound destination
 * - cta_location: where the CTA lives (e.g. 'nav', 'floor_plans', 'redirect')
 * - floor_plan: the plan/unit label the visitor was viewing (lightbox clicks; no PII)
 *
 * These clicks fire immediately before a same-tab navigation to RentCafe
 * (see the Redirect component in App.tsx), so the event is sent with
 * `transport_type: 'beacon'` — gtag then uses navigator.sendBeacon, which the
 * browser flushes even after the page unloads. Without it, the request could
 * be dropped mid-navigation and the highest-intent action undercounted.
 */
export function trackOutboundClick(
  linkType: 'apply' | 'availability' | 'social' | 'tour',
  linkUrl: string,
  ctaLocation: string,
  attribution?: { floorPlan?: string }
): void {
  if (!window.gtag) return;

  const params: Record<string, string> = {
    link_type: linkType,
    link_url: linkUrl,
    cta_location: ctaLocation,
    page_path: currentPath ?? window.location.pathname,
    ...getStoredUtmParams(),
  };
  if (previousPath) params.referring_page = previousPath;
  if (attribution?.floorPlan) params.floor_plan = attribution.floorPlan.slice(0, 100);

  window.gtag('event', 'outbound_click', {
    ...params,
    transport_type: 'beacon',
    send_to: EFFECTIVE_ID,
  });
}
