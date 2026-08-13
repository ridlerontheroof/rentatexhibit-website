// Pure helpers for the post-publish IndexNow submitter
// (scripts/submit-indexnow.mjs). Kept dependency-free so they can be unit
// tested from src/ (vitest) without touching the network or filesystem.

/**
 * Parse a sitemap.xml string into a { url: lastmod } record.
 * URLs without a <lastmod> map to an empty string so a later-added lastmod
 * still registers as a change.
 */
export function parseSitemap(xml) {
  const entries = {};
  for (const m of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const block = m[1];
    const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1]?.trim();
    if (!loc) continue;
    const lastmod = block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1]?.trim() ?? '';
    entries[loc] = lastmod;
  }
  return entries;
}

/**
 * URLs that are new or whose lastmod changed between two { url: lastmod }
 * records. URLs that disappeared are NOT included — removed pages are the
 * availability pipeline's job (api-server pings rented units the moment they
 * leave the feed); the sitemap simply stops listing them.
 */
export function changedUrls(prev, next) {
  const changed = [];
  for (const [url, lastmod] of Object.entries(next)) {
    if (!(url in prev) || prev[url] !== lastmod) changed.push(url);
  }
  return changed;
}
