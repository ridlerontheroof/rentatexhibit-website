// One-shot bulk IndexNow resubmission: fetch the LIVE sitemap and submit
// every URL to IndexNow (Bing/Copilot & friends) in a single batch.
//
// Why this exists: Bing Webmaster Tools flagged "large number of pages
// pointing to the same canonical URL" based on a pre-prerender crawl
// (every deep route used to serve the homepage head). A full crawl on
// 2026-08-05 confirmed every live page now serves a unique self-referencing
// canonical, so the fix is simply to push Bing to recrawl everything.
//
// Rerun after any major publish that changes many pages at once:
//   pnpm --filter @workspace/api-server run resubmit:indexnow
//
// IndexNow accepts up to 10,000 URLs per batch, so one POST covers the whole
// sitemap. Exits non-zero when the sitemap fetch fails, yields implausibly
// few URLs, or the IndexNow endpoint rejects the submission — so a rerun in
// CI or a shell can't silently no-op.
import { pingIndexNow, SITE_URL } from "../src/lib/indexnow";

const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;

// Guard against submitting a truncated/broken sitemap: the live site has
// 140+ URLs; anything below this strongly suggests a fetch or parse problem.
const MIN_EXPECTED_URLS = 50;

const log = {
  info: (o: object, msg: string) => console.log(msg, JSON.stringify(o).slice(0, 500)),
  warn: (o: object, msg: string) => console.error(msg, JSON.stringify(o).slice(0, 500)),
};

async function main(): Promise<number> {
  const res = await fetch(SITEMAP_URL);
  if (!res.ok) {
    console.error(`Failed to fetch ${SITEMAP_URL}: HTTP ${res.status}`);
    return 1;
  }
  const xml = await res.text();
  const urls = [...new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()))];
  const foreign = urls.filter((u) => !u.startsWith(`${SITE_URL}/`) && u !== SITE_URL);
  if (foreign.length > 0) {
    console.error(`Sitemap contains URLs outside ${SITE_URL}:`, foreign.slice(0, 5));
    return 1;
  }
  if (urls.length < MIN_EXPECTED_URLS) {
    console.error(
      `Sitemap yielded only ${urls.length} URLs (< ${MIN_EXPECTED_URLS}) — refusing to submit a suspicious batch.`,
    );
    return 1;
  }
  console.log(`Submitting ${urls.length} sitemap URLs from ${SITEMAP_URL} to IndexNow…`);
  const ok = await pingIndexNow(urls, log);
  if (!ok) {
    console.error("IndexNow submission was not accepted — see warning above.");
    return 1;
  }
  console.log(
    `Done: ${urls.length} URLs accepted by IndexNow at ${new Date().toISOString()}. ` +
      "Recheck the Bing Webmaster Tools duplicate-canonical flag in ~2–4 weeks.",
  );
  return 0;
}

process.exit(await main());
