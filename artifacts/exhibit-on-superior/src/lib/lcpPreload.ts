/**
 * Derives a per-page LCP image preload hint from prerendered page markup.
 *
 * Every page opens with a large above-the-fold image rendered by <SmartImg>
 * with loading="eager" + fetchPriority="high" (the home HeroSlider's first
 * slide, or <PageHero> on subpages). Because the preload is extracted from the
 * exact <source type="image/avif"> markup SmartImg rendered, its
 * imagesrcset/imagesizes are byte-for-byte what the browser will request for
 * the <picture> — so the preloaded response is always reused (never a double
 * download).
 *
 * The hint is AVIF-only and carries no href: browsers without imagesrcset
 * support skip it entirely rather than preloading a fixed URL they may not use
 * (same rationale as the original home-hero preload guarded by
 * hero-lcp-preload.test.ts).
 */
export function extractLcpPreload(html: string): string | null {
  // Find the first high-priority <picture> in document order — that's the
  // page's LCP candidate.
  for (const [, inner] of html.matchAll(/<picture>([\s\S]*?)<\/picture>/g)) {
    if (!/\bfetchpriority="high"/i.test(inner)) continue;
    const source = inner.match(/<source\b[^>]*type="image\/avif"[^>]*>/i)?.[0];
    if (!source) return null; // eager image has no AVIF variants — nothing to preload
    const srcset = source.match(/\bsrcset="([^"]*)"/i)?.[1];
    if (!srcset) return null;
    const sizes = source.match(/\bsizes="([^"]*)"/i)?.[1] ?? '100vw';
    return `<link rel="preload" as="image" type="image/avif" imagesrcset="${srcset}" imagesizes="${sizes}" fetchpriority="high">`;
  }
  return null;
}
