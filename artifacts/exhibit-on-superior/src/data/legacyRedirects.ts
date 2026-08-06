import { APPLY_URL } from './seo';

/**
 * Legacy Wix/WordPress URLs -> canonical routes (source: migration
 * redirects.csv). Single source of truth shared by:
 * - App.tsx: client-side <Redirect> routes for JS-enabled visitors
 * - scripts/prerender.mjs: build-time no-JS meta-refresh stubs for crawlers
 *   (artifact.toml rewrites route these paths to the stubs; a parity guard in
 *   the prerenderer fails the build if the rewrites drift from this map)
 *
 * /artist-in-residence variants are intentionally absent: they're served by a
 * hand-written static stub in public/artist-in-residence/.
 */
export const LEGACY_REDIRECTS: Record<string, string> = {
  // Points at the /floor-plans hub (2026-07): Google still ranks this legacy
  // URL for floor-plan queries, so its 301 must hand that equity to the new
  // hub — not /available-units — or Google keeps re-learning the wrong page.
  '/apartments/il/chicago/floor-plans': '/floor-plans',
  '/apartments/il/chicago/photo-gallery': '/photo-gallery',
  '/apartments/il/chicago/virtual-tour': '/virtual-tour',
  '/apartments/il/chicago/amenities': '/amenities',
  '/apartments/il/chicago/pet-friendly': '/pet-friendly',
  '/apartments/il/chicago/neighborhood': '/neighborhood',
  '/apartments/il/chicago/contact-us': '/contact-us',
  '/apartments/il/chicago/map-directions': '/map-directions',
  '/apartments/il/chicago/residents': '/residents',
  '/apartments/il/chicago/schedule-a-tour': '/schedule-a-tour',
  '/apartments/il/chicago/reviews': '/reviews',
  '/apartments/il/chicago/apply': APPLY_URL,
  '/apartments/il/chicago/magellan-rewards': '/',
  '/apartments/il/chicago': '/available-units',
  // NOTE: '/floor-plans' is no longer a legacy redirect — it is a real,
  // indexable hub page (pages/FloorPlansHub.tsx) with one landing page per
  // distinct plan layout underneath it (/floor-plans/<slug>).
  // RentCafe-era .aspx URLs (2026-07 SEO audit): 404 live today, but 301s
  // preserve any legacy link equity.
  // Wix-era URL still indexed by Google (2026-07): "Studio, 1, 2 & 3 Bedroom
  // Apartments" listing page.
  '/availableunits': '/available-units',
  '/floorplans.aspx': '/floor-plans',
  '/availableunits.aspx': '/available-units',
  '/amenities.aspx': '/amenities',
  '/contactus.aspx': '/contact-us',
  '/brochure.aspx': '/apartment-guide',
  // G5/RentCafe-era .aspx URLs (2026-07 SEO audit, second batch): 404 live
  // today, but 301s preserve any historical link equity.
  '/mapsanddirections.aspx': '/map-directions',
  // HIDDEN PENDING ZENTRO INSTALL (2026-07): the internet-options knowledge
  // article is unpublished until the Zentro bulk-internet rollout is live.
  // The indexed URL 301s to the Knowledge hub meanwhile. Remove this entry
  // when the article returns (its artifact.toml rewrite pair stays as-is).
  '/knowledge/internet-options': '/knowledge',
  '/video.aspx': '/virtual-tour',
  '/apartmentphotos.aspx': '/photo-gallery',
  // -------------------------------------------------------------------------
  // Hidden channel short URLs (2026-08): printable/QR-friendly paths that 301
  // to a real page with a `?source=Token` tag. visitSource.ts turns that tag
  // into the visit's AppFolio lead-source label — e.g. scanning the lobby QR
  // code lands on /available-units and every lead from that visit reaches the
  // leasing team as "Website (LobbyQR)". Token rules: alphanumerics/hyphens
  // only (the strict `Website (Token)` convention — see api-server
  // leadSource.ts). To add a channel: one entry here + the artifact.toml
  // rewrite pair (bare + trailing slash); the prerender parity guard enforces
  // the pair. These paths are noindex redirect stubs, never indexable pages.
  '/go/lobby-qr': '/available-units?source=LobbyQR',
  '/go/print': '/available-units?source=Print',
  '/go/banner': '/available-units?source=Banner',
};
