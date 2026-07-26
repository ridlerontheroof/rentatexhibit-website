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
  '/apartments/il/chicago/floor-plans': '/available-units',
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
  '/floor-plans': '/available-units',
  // RentCafe-era .aspx URLs (2026-07 SEO audit): 404 live today, but 301s
  // preserve any legacy link equity.
  '/floorplans.aspx': '/available-units',
  '/availableunits.aspx': '/available-units',
  '/amenities.aspx': '/amenities',
  '/contactus.aspx': '/contact-us',
  '/brochure.aspx': '/apartment-guide',
};
