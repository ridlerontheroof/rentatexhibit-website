import type { ComponentType } from 'react';

/**
 * Single source of truth for the site's content-page routes.
 *
 * Used by BOTH the client router (`App.tsx`, which wraps each loader in
 * `React.lazy` to preserve per-page code splitting) and the build-time
 * prerenderer (`scripts/prerender.mjs` via `entry-server.tsx`, which awaits the
 * loader to render each page to static HTML).
 *
 * Redirect and legacy-URL routes live in `App.tsx` only — they are intentionally
 * excluded here because they are not indexable pages and are never prerendered.
 * Keep this list in sync with `PAGE_SEO` in `data/seo.ts`.
 */
export interface RouteDef {
  path: string;
  /** Dynamic import of the page component (a named export, normalized here). */
  load: () => Promise<ComponentType>;
}

/**
 * Components preloaded before the first client render (see `preloadRoute`).
 * `App.tsx` prefers these over the `React.lazy` wrapper so the initial route
 * renders synchronously in the first commit — the prerendered HTML is replaced
 * by identical-height content with no Suspense fallback in between. Without
 * this, the page briefly collapses to header+footer while the route chunk
 * downloads, producing a large Cumulative Layout Shift on every page load.
 */
const preloadedComponents = new Map<string, ComponentType>();

export function getPreloadedComponent(path: string): ComponentType | undefined {
  return preloadedComponents.get(path);
}

/**
 * Preload the page component for `pathname` (the browser location, possibly
 * including the Vite base prefix and/or a trailing slash). Resolves once the
 * chunk is cached — errors are swallowed so boot always proceeds; the lazy
 * wrapper remains as the fallback loader.
 */
export async function preloadRoute(pathname: string): Promise<void> {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  // Segment-aware base strip: only remove the base when it's followed by a
  // path boundary, so a base of "/app" never mangles "/apple".
  let path =
    base && (pathname === base || pathname.startsWith(`${base}/`))
      ? pathname.slice(base.length)
      : pathname;
  if (!path.startsWith('/')) path = `/${path}`;
  if (path !== '/' && path.endsWith('/')) path = path.slice(0, -1);
  const match = routes.find((r) => r.path === path);
  if (!match) {
    // Per-unit pages are prerendered too (one per baked available unit), so
    // their chunk must also be cached before the first render — otherwise the
    // prerendered listing collapses to the Suspense fallback (the CLS trap
    // the route preload exists to prevent).
    if (/^\/available-units\/[^/]+$/.test(path)) {
      try {
        preloadedComponents.set(
          UNIT_DETAIL_ROUTE,
          (await import('./pages/UnitDetail')).UnitDetail,
        );
      } catch {
        // Fall back to React.lazy.
      }
    }
    // Knowledge Center articles are prerendered too (one per article), so the
    // same CLS guard applies: cache their chunk before the first render.
    if (/^\/knowledge\/[^/]+$/.test(path)) {
      try {
        preloadedComponents.set(
          KNOWLEDGE_ARTICLE_ROUTE,
          (await import('./pages/KnowledgeArticle')).KnowledgeArticle,
        );
      } catch {
        // Fall back to React.lazy.
      }
    }
    return;
  }
  try {
    preloadedComponents.set(match.path, await match.load());
  } catch {
    // Chunk fetch failed (offline, deploy skew): fall back to React.lazy.
  }
}

/** Preload-map key for the dynamic per-unit route (see App.tsx). */
export const UNIT_DETAIL_ROUTE = '/available-units/:unit';

/** Preload-map key for the dynamic knowledge-article route (see App.tsx). */
export const KNOWLEDGE_ARTICLE_ROUTE = '/knowledge/:slug';

export const routes: RouteDef[] = [
  { path: '/', load: () => import('./pages/Home').then((m) => m.Home) },
  { path: '/available-units', load: () => import('./pages/FloorPlans').then((m) => m.FloorPlans) },
  { path: '/photo-gallery', load: () => import('./pages/PhotoGallery').then((m) => m.PhotoGallery) },
  { path: '/virtual-tour', load: () => import('./pages/VirtualTour').then((m) => m.VirtualTour) },
  { path: '/amenities', load: () => import('./pages/Amenities').then((m) => m.Amenities) },
  {
    path: '/apartment-guide',
    load: () => import('./pages/ApartmentGuide').then((m) => m.ApartmentGuide),
  },
  { path: '/fees', load: () => import('./pages/Fees').then((m) => m.Fees) },
  {
    path: '/parking-transportation',
    load: () => import('./pages/ParkingTransportation').then((m) => m.ParkingTransportation),
  },
  {
    path: '/application-guide',
    load: () => import('./pages/ApplicationGuide').then((m) => m.ApplicationGuide),
  },
  { path: '/faq', load: () => import('./pages/FaqHub').then((m) => m.FaqHub) },
  { path: '/knowledge', load: () => import('./pages/Knowledge').then((m) => m.Knowledge) },
  { path: '/pet-friendly', load: () => import('./pages/PetFriendly').then((m) => m.PetFriendly) },
  { path: '/neighborhood', load: () => import('./pages/Neighborhood').then((m) => m.Neighborhood) },
  { path: '/contact-us', load: () => import('./pages/ContactUs').then((m) => m.ContactUs) },
  { path: '/map-directions', load: () => import('./pages/MapDirections').then((m) => m.MapDirections) },
  { path: '/residents', load: () => import('./pages/Residents').then((m) => m.Residents) },
  { path: '/schedule-a-tour', load: () => import('./pages/ScheduleTour').then((m) => m.ScheduleTour) },
  { path: '/schedule-showing', load: () => import('./pages/ScheduleShowing').then((m) => m.ScheduleShowing) },
  { path: '/reviews', load: () => import('./pages/Reviews').then((m) => m.Reviews) },
  { path: '/privacy-policy', load: () => import('./pages/PrivacyPolicy').then((m) => m.PrivacyPolicy) },
  {
    path: '/accessibility-statement',
    load: () => import('./pages/AccessibilityStatement').then((m) => m.AccessibilityStatement),
  },
];
