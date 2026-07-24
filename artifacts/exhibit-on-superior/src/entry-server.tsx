import { renderToString } from 'react-dom/server';
import { Router } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ComponentType } from 'react';
import { Layout } from './components/Layout';
import { routes } from './routes';
import { NotFound } from './pages/not-found';
import { buildSeoModel, renderHeadTags } from './data/seo';
import { floorPlansItemListJsonLd } from './data/floorPlans';
import { buildReviewsPageModel, reviewsJsonLd } from './data/reviews';
import { photoGalleryJsonLd } from './data/gallery';
import { virtualToursJsonLd } from './data/virtualTours';

// Re-exported so the (browserless) prerender script can read the route list,
// canonical URLs, and noindex flags straight from the built SSR bundle.
export { PAGE_SEO, SITE_URL, canonicalFor } from './data/seo';
export { extractLcpPreload } from './lib/lcpPreload';
export { LEGACY_REDIRECTS } from './data/legacyRedirects';

/** Content-page paths, exported for the prerenderer's route<->PAGE_SEO parity check. */
export const ROUTE_PATHS: string[] = routes.map((r) => r.path);

// Page-specific JSON-LD that isn't derivable from PAGE_SEO. Mirrors what the
// page component passes to <Seo extraJsonLd>; keep in sync with that page.
const EXTRA_JSONLD: Record<string, () => Record<string, unknown>[]> = {
  '/available-units': () => [floorPlansItemListJsonLd()],
  // At prerender time there is no live Google feed, so the model resolves to
  // the curated fallback — exactly what the SSR'd page body displays. The
  // client re-emits the schema from the live-merged model after hydration.
  '/reviews': () => [reviewsJsonLd(buildReviewsPageModel())],
  '/photo-gallery': () => [photoGalleryJsonLd()],
  '/virtual-tour': () => [virtualToursJsonLd()],
};

export interface RenderResult {
  /** Rendered page markup for injection into `<div id="root">`. */
  html: string;
  /** `<head>` tags (title, meta, canonical, JSON-LD) for the seo marker block. */
  head: string;
}

/**
 * Render a single route to static HTML + head tags at build time. Components are
 * already SSR-guarded (no `window`/`document` at render time), and <Seo> renders
 * null on the server, so `renderToString` yields clean body markup while the head
 * is produced deterministically from the shared SEO model. The client re-renders
 * on load (`createRoot().render`), so this output is purely for crawlers/bots.
 */
export async function render(pathname: string): Promise<RenderResult> {
  const match = routes.find((r) => r.path === pathname);
  const Component: ComponentType = match ? await match.load() : NotFound;

  const html = renderToString(
    <QueryClientProvider client={new QueryClient()}>
      <Router ssrPath={pathname}>
        <Layout>
          <Component />
        </Layout>
      </Router>
    </QueryClientProvider>,
  );

  const model = buildSeoModel(pathname, { extraJsonLd: EXTRA_JSONLD[pathname]?.() });
  const head = model ? renderHeadTags(model) : '';

  return { html, head };
}
