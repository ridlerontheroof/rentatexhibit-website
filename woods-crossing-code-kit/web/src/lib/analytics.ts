/**
 * GA4 analytics helpers. Two operating modes:
 *
 * 1. Direct gtag — when VITE_GA_MEASUREMENT_ID is set at build time, this
 *    module initialises a deferred gtag.js loader.
 *
 * 2. GTM-managed — when VITE_GA_MEASUREMENT_ID is not set (production uses
 *    a GTM container to own the GA4 Google tag).
 *    IMPORTANT: GTM does NOT install window.gtag, and gtag() commands queued
 *    into dataLayer are NOT processed by GTM's internal GA4 tag. This module
 *    must load gtag.js itself and tag every event with send_to.
 *
 * Nothing here runs during SSR/prerender.
 *
 * WOODS-CROSSING: 1 value to set (marked below).
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const MEASUREMENT_ID: string | undefined = import.meta.env.VITE_GA_MEASUREMENT_ID;

/**
 * The GA4 stream ID owned by your GTM container. Used in GTM-managed mode
 * to route send_to events to the correct property stream; a build-time
 * VITE_GA_MEASUREMENT_ID always takes precedence.
 * Read from VITE_GA4_MEASUREMENT_ID build env var (analytics.ga4MeasurementId
 * from property-config.json). Throws at build time if not set so a missing ID
 * can never silently route events to the wrong property stream.
 * WOODS-CROSSING: set VITE_GA4_MEASUREMENT_ID in your web artifact's env vars.
 */
const GTM_GA4_ID: string = (import.meta.env.VITE_GA4_MEASUREMENT_ID as string | undefined)?.trim() ||
  (() => {
    throw new Error(
      'VITE_GA4_MEASUREMENT_ID build env var is required for GA4 send_to routing ' +
      '(analytics.ga4MeasurementId from property-config.json). ' +
      'Example: VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX',
    );
  })();

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
// Read from VITE_UTM_STORAGE_KEY build-time env var (property-config analytics.utmStorageKey).
// Example: VITE_UTM_STORAGE_KEY=woodscrossing_utm_params
// WOODS-CROSSING: set this in your web artifact's environment variables.
const UTM_STORAGE_KEY: string = (import.meta.env.VITE_UTM_STORAGE_KEY as string | undefined)?.trim() ||
  (() => { throw new Error('VITE_UTM_STORAGE_KEY build env var is required (analytics.utmStorageKey from property-config.json).'); })();

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
    // Storage unavailable — attribution is best-effort.
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
  if (!window.gtag) {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer!.push(args);
    };
  }
  window.gtag('js', new Date());
  window.gtag('config', EFFECTIVE_ID, { send_page_view: false });

  // Defer the gtag.js script out of the startup window — first real user
  // gesture, tab backgrounding, or shortly after `load` for idle visits.
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
  if (path !== currentPath) {
    previousPath = currentPath;
    currentPath = path;
  }
  if (!window.gtag) return;
  // In GTM mode the GA4 stream owns every page_view via enhanced measurement.
  if (GTM_MANAGED) return;
  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
    send_to: EFFECTIVE_ID,
  });
}

/**
 * Report a conversion event. Uses GA4's recommended `generate_lead` event.
 * No PII — never send name/email/phone in analytics events.
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

  window.gtag('event', 'generate_lead', {
    ...params,
    transport_type: 'beacon',
    send_to: EFFECTIVE_ID,
  });
}

/**
 * Report a click on a high-intent outbound CTA. Sent with beacon transport
 * so the event survives an immediate tab close or navigation after Submit.
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
