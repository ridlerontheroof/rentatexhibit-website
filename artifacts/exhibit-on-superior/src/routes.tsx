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
  { path: '/pet-friendly', load: () => import('./pages/PetFriendly').then((m) => m.PetFriendly) },
  { path: '/neighborhood', load: () => import('./pages/Neighborhood').then((m) => m.Neighborhood) },
  { path: '/contact-us', load: () => import('./pages/ContactUs').then((m) => m.ContactUs) },
  { path: '/map-directions', load: () => import('./pages/MapDirections').then((m) => m.MapDirections) },
  { path: '/residents', load: () => import('./pages/Residents').then((m) => m.Residents) },
  { path: '/schedule-a-tour', load: () => import('./pages/ScheduleTour').then((m) => m.ScheduleTour) },
  { path: '/reviews', load: () => import('./pages/Reviews').then((m) => m.Reviews) },
  { path: '/privacy-policy', load: () => import('./pages/PrivacyPolicy').then((m) => m.PrivacyPolicy) },
  {
    path: '/accessibility-statement',
    load: () => import('./pages/AccessibilityStatement').then((m) => m.AccessibilityStatement),
  },
];
