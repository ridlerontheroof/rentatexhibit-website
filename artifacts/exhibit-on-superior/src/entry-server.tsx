import { renderToString } from 'react-dom/server';
import { Route, Router } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ComponentType } from 'react';
import { Layout } from './components/Layout';
import { routes } from './routes';
import { NotFound } from './pages/not-found';
import { buildSeoModel, renderHeadTags } from './data/seo';
import { buildUnitSeoModel, unitPagePath } from './data/unitPageSeo';
import { UnitDetail } from './pages/UnitDetail';
import {
  KNOWLEDGE_ARTICLES,
  buildKnowledgeSeoModel,
  knowledgeArticle,
  knowledgeDescription,
  knowledgeHubJsonLd,
  knowledgePath,
  knowledgeTitle,
} from './data/knowledge';
import { KnowledgeArticle } from './pages/KnowledgeArticle';
import {
  FLOOR_PLAN_PAGES,
  FLOOR_PLAN_PAGE_PATHS as FLOOR_PLAN_PATHS_INTERNAL,
  PLAN_DEEP_LINK_REDIRECTS as PLAN_DEEP_LINK_REDIRECTS_INTERNAL,
  buildFloorPlanSeoModel,
  floorPlanH1,
  floorPlanDescription,
  floorPlanHubItemListJsonLd,
  floorPlanPage,
  floorPlanPagePath,
} from './data/floorPlanPages';
import { FloorPlanDetail } from './pages/FloorPlanDetail';
import { planGroups } from './data/floorPlans';
import { liveUnitPlanGroups, unitAvailabilityJsonLd } from './data/unitJsonLd';
import { getBakedAvailability, getBakedSnapshotStatus } from './data/availabilitySnapshot';
import { buildReviewsPageModel, reviewsJsonLd } from './data/reviews';
import { photoGalleryJsonLd } from './data/gallery';
import { virtualToursJsonLd, virtualTourVideoJsonLd } from './data/virtualTours';
import { feesOfferCatalogJsonLd } from './data/fees';

// Re-exported so the (browserless) prerender script can read the route list,
// canonical URLs, and noindex flags straight from the built SSR bundle.
export { PAGE_SEO, SITE_URL, canonicalFor } from './data/seo';
export { extractLcpPreload } from './lib/lcpPreload';
export { LEGACY_REDIRECTS } from './data/legacyRedirects';

// Counts the prerenderer uses to REQUIRE the FloorPlan/Apartment/Offer
// structured data on /available-units (see scripts/prerender.mjs).
export const FLOOR_PLAN_COUNT = planGroups.length;
// Distinct residence lines among the baked snapshot's units — the number of
// FloorPlan nodes /available-units ships (the full catalog lives on the hub).
export const LIVE_FLOORPLAN_COUNT = liveUnitPlanGroups(
  getBakedAvailability()?.units ?? [],
).length;
export const BAKED_UNIT_COUNT = getBakedAvailability()?.units.length ?? 0;

// 'fresh' | 'stale' | 'invalid' — the prerenderer fails the build on anything
// but 'fresh', because a stale/invalid snapshot would silently drop every
// per-unit page (and its sitemap entries) from the publish.
export const BAKED_SNAPSHOT_STATUS = getBakedSnapshotStatus();

// Per-unit pages: one prerendered route per baked available unit. The
// prerenderer loops over these exactly like the static PAGE_SEO routes.
export const UNIT_PATHS: string[] = (getBakedAvailability()?.units ?? []).map((u) =>
  unitPagePath(u.unit),
);

// Knowledge Center articles: one prerendered route per article. Like unit
// pages they live outside PAGE_SEO/ROUTE_PATHS (dynamic route, shared head
// builder in data/knowledge.ts). The prerenderer also uses the meta list to
// generate llms.txt / llms-full.txt entries.
export const KNOWLEDGE_PATHS: string[] = KNOWLEDGE_ARTICLES.map((a) => knowledgePath(a.slug));

// Floor-plan landing pages (/floor-plans/<slug>): one prerendered route per
// distinct plan layout. Like unit/knowledge pages they live outside
// PAGE_SEO/ROUTE_PATHS (dynamic route, shared head builder in
// data/floorPlanPages.ts). Slugs are code-derived, so the artifact.toml
// rewrite parity guard in scripts/prerender.mjs pins them.
export const FLOOR_PLAN_PAGE_PATHS: string[] = FLOOR_PLAN_PATHS_INTERNAL;
/**
 * Legacy `?plan=<group id>` → /floor-plans/<slug> map, exported so the
 * prerenderer can write dist/plan-redirects.json for the production
 * server's single-hop 301 (same map the client fallback redirect uses).
 */
export const PLAN_DEEP_LINK_REDIRECTS: Record<string, string> =
  PLAN_DEEP_LINK_REDIRECTS_INTERNAL;
export const FLOOR_PLAN_PAGE_META: Array<{ path: string; title: string; description: string }> =
  FLOOR_PLAN_PAGES.map((fp) => ({
    path: floorPlanPagePath(fp.slug),
    title: `${floorPlanH1(fp)} Floor Plan`,
    description: floorPlanDescription(fp),
  }));
export const KNOWLEDGE_META: Array<{ path: string; title: string; description: string; question: string; category: string }> =
  KNOWLEDGE_ARTICLES.map((a) => ({
    path: knowledgePath(a.slug),
    title: knowledgeTitle(a),
    description: knowledgeDescription(a),
    question: a.question,
    category: a.category,
  }));

/** Content-page paths, exported for the prerenderer's route<->PAGE_SEO parity check. */
export const ROUTE_PATHS: string[] = routes.map((r) => r.path);

// Page-specific JSON-LD that isn't derivable from PAGE_SEO. Mirrors what the
// page component passes to <Seo extraJsonLd>; keep in sync with that page.
const EXTRA_JSONLD: Record<string, () => Record<string, unknown>[]> = {
  '/available-units': () => [unitAvailabilityJsonLd()],
  '/fees': () => [feesOfferCatalogJsonLd()],
  '/floor-plans': () => [floorPlanHubItemListJsonLd()],
  '/knowledge': () => [knowledgeHubJsonLd()],
  // At prerender time there is no live Google feed, so the model resolves to
  // the curated fallback — exactly what the SSR'd page body displays. The
  // client re-emits the schema from the live-merged model after hydration.
  '/reviews': () => [reviewsJsonLd(buildReviewsPageModel())],
  '/photo-gallery': () => [photoGalleryJsonLd()],
  '/virtual-tour': () => [virtualToursJsonLd(), virtualTourVideoJsonLd()],
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
  // Per-unit page (/available-units/<unit>): rendered through a wouter
  // <Route> so useParams resolves, with the head built from the same shared
  // model the client <Seo> emits. Only baked snapshot units are prerendered.
  const unitMatch = pathname.match(/^\/available-units\/([^/]+)$/);
  if (unitMatch) {
    const unit = (getBakedAvailability()?.units ?? []).find((u) => u.unit === unitMatch[1]);
    if (!unit) {
      throw new Error(`render(${pathname}): unit ${unitMatch[1]} is not in the baked snapshot`);
    }
    const html = renderToString(
      <QueryClientProvider client={new QueryClient()}>
        <Router ssrPath={pathname}>
          <Layout>
            <Route path="/available-units/:unit" component={UnitDetail} />
          </Layout>
        </Router>
      </QueryClientProvider>,
    );
    return {
      html,
      head: renderHeadTags(buildUnitSeoModel(unit, getBakedAvailability()?.updatedAt ?? null)),
    };
  }

  // Floor-plan landing page (/floor-plans/<slug>): same dynamic-route pattern
  // as per-unit pages — wouter <Route> so useParams resolves, shared head
  // model built from the SAME baked availability snapshot the body renders.
  const planMatch = pathname.match(/^\/floor-plans\/([^/]+)$/);
  if (planMatch) {
    const page = floorPlanPage(planMatch[1]);
    if (!page) {
      throw new Error(`render(${pathname}): no floor-plan page with slug ${planMatch[1]}`);
    }
    const html = renderToString(
      <QueryClientProvider client={new QueryClient()}>
        <Router ssrPath={pathname}>
          <Layout>
            <Route path="/floor-plans/:slug" component={FloorPlanDetail} />
          </Layout>
        </Router>
      </QueryClientProvider>,
    );
    return {
      html,
      head: renderHeadTags(
        buildFloorPlanSeoModel(
          page,
          getBakedAvailability()?.units ?? [],
          getBakedAvailability()?.updatedAt ?? null,
        ),
      ),
    };
  }

  // Knowledge article (/knowledge/<slug>): same dynamic-route pattern as
  // per-unit pages — wouter <Route> so useParams resolves, shared head model.
  const knowledgeMatch = pathname.match(/^\/knowledge\/([^/]+)$/);
  if (knowledgeMatch) {
    const article = knowledgeArticle(knowledgeMatch[1]);
    if (!article) {
      throw new Error(`render(${pathname}): no knowledge article with slug ${knowledgeMatch[1]}`);
    }
    const html = renderToString(
      <QueryClientProvider client={new QueryClient()}>
        <Router ssrPath={pathname}>
          <Layout>
            <Route path="/knowledge/:slug" component={KnowledgeArticle} />
          </Layout>
        </Router>
      </QueryClientProvider>,
    );
    return { html, head: renderHeadTags(buildKnowledgeSeoModel(article)) };
  }

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
