/**
 * Per-property Content Security Policy additions.
 *
 * This file is the ONLY place in the server that contains property-specific
 * CSP values. Replace its contents for each new property build — do not
 * scatter property literals anywhere else in server/index.mjs.
 *
 * How to populate after deploy:
 *   1. Start the server with CSP_ENFORCE=0 (default, report-only mode).
 *   2. Run `pnpm run check:csp` — it reports the sha256 hash(es) needed for
 *      any GTM Custom HTML tag that your container injects at runtime.
 *   3. Paste those hash(es) into GTM_INJECTED_SCRIPT_HASHES below.
 *   4. Add any third-party hosts your property's GTM tags or embeds contact
 *      to the EXTRA_* arrays (one host per entry, full origin, no wildcards).
 *   5. Set CSP_ENFORCE=1 once check:csp passes cleanly.
 *
 * PROPERTY CONFIG: fill in all four exports below before first deploy.
 */

/**
 * sha256 hashes for scripts injected at runtime by your GTM container's
 * Custom HTML tags (can't be startup-hashed since they aren't in the dist).
 *
 * Format: "'sha256-<base64>'"  (note the single-quote wrapping)
 *
 * PROPERTY CONFIG: replace the empty array with the container hash values
 * after running `pnpm run check:csp` post-deploy.
 */
export const GTM_INJECTED_SCRIPT_HASHES = [
  // Example (remove and add your own after running check:csp):
  // "'sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='",
];

/**
 * Additional script-src hosts required by your property's third-party tools
 * (analytics, chat widgets, map SDKs, etc.).
 *
 * PROPERTY CONFIG: add hosts for tools the GTM container or pages load.
 * Example entries (uncomment if applicable):
 *   'https://analytics.ahrefs.com',
 *   'https://www.clarity.ms',
 *   'https://scripts.clarity.ms',
 *   'https://sightmap.com',
 */
export const EXTRA_SCRIPT_SRC_HOSTS = [
  // 'https://analytics.example.com',
];

/**
 * Additional connect-src hosts (fetch/XHR targets) for your property.
 *
 * PROPERTY CONFIG: add hosts that analytics, embeds, or API calls reach.
 * Example entries:
 *   'https://analytics.ahrefs.com',
 *   'https://sightmap.com',
 */
export const EXTRA_CONNECT_SRC_HOSTS = [
  // 'https://analytics.example.com',
];

/**
 * Additional frame-src hosts for iframes your property embeds
 * (virtual tour players, map embeds, Matterport, SightMap, etc.).
 *
 * PROPERTY CONFIG: add origins for any iframe source values the pages use.
 * Example entries:
 *   'https://my.matterport.com',
 *   'https://app.sightmap.com',
 */
export const EXTRA_FRAME_SRC_HOSTS = [
  // 'https://my.matterport.com',
];
