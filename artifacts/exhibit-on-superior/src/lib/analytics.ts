/**
 * GA4 analytics, env-configured (VITE_GA_MEASUREMENT_ID). When the ID is not
 * set, every function is a silent no-op so development/preview builds ship no
 * third-party scripts. Nothing here runs during SSR/prerender.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const MEASUREMENT_ID: string | undefined = import.meta.env.VITE_GA_MEASUREMENT_ID;

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
  if (typeof window !== 'undefined') captureUtmParams();
  if (!analyticsEnabled() || initialized) return;
  initialized = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  };
  window.gtag('js', new Date());
  // send_page_view: false — the SPA router reports page views explicitly so
  // client-side navigations are counted (see trackPageView in App.tsx).
  window.gtag('config', MEASUREMENT_ID, { send_page_view: false });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID!)}`;
  document.head.appendChild(script);
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
  if (!analyticsEnabled() || !window.gtag) return;
  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
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
  if (!analyticsEnabled() || !window.gtag) return;

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
  window.gtag('event', 'generate_lead', { ...params, transport_type: 'beacon' });
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
  if (!analyticsEnabled() || !window.gtag) return;

  const params: Record<string, string> = {
    link_type: linkType,
    link_url: linkUrl,
    cta_location: ctaLocation,
    page_path: currentPath ?? window.location.pathname,
    ...getStoredUtmParams(),
  };
  if (previousPath) params.referring_page = previousPath;
  if (attribution?.floorPlan) params.floor_plan = attribution.floorPlan.slice(0, 100);

  window.gtag('event', 'outbound_click', { ...params, transport_type: 'beacon' });
}
