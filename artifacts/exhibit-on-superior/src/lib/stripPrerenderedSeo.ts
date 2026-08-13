// Remove the server-written SEO head block before Helmet takes over.
//
// The static index.html (dev + SPA fallback) and every prerendered page carry
// a full title/canonical/meta/JSON-LD block between the `<!-- seo:start -->`
// and `<!-- seo:end -->` head markers. On the client, the <Seo> component
// re-emits the current route's tags via react-helmet-async, and Helmet never
// removes tags it didn't create — so without this strip a JS-executing
// scraper (iMessage, Facebook's rendered pass, Google's rendered crawl) sees
// TWO og:image / og:title / canonical sets: the static homepage block plus
// the route's own. This ran a shared dev-preview link into a two-image
// iMessage card.
//
// Must run before the first React render so there is no window where both
// copies coexist. The markers are preserved (prerender tooling keys off
// them); only the nodes between them are dropped.
export function stripPrerenderedSeo(head: HTMLElement = document.head): void {
  let inBlock = false;
  for (const node of Array.from(head.childNodes)) {
    if (node.nodeType === Node.COMMENT_NODE) {
      const marker = node.textContent?.trim();
      if (marker === 'seo:start') {
        inBlock = true;
        continue;
      }
      if (marker === 'seo:end') break;
      continue;
    }
    if (inBlock) head.removeChild(node);
  }
}
