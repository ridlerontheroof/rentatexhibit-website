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

/** Load gtag.js once and configure GA4. Page views are sent manually (SPA). */
export function initAnalytics(): void {
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
 */
export function trackLead(formType: 'contact' | 'tour'): void {
  if (!analyticsEnabled() || !window.gtag) return;
  window.gtag('event', 'generate_lead', { form_type: formType });
}
