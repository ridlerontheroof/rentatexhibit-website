import { Route, Switch, useLocation, type RouteComponentProps } from 'wouter';
import { lazy, Suspense, useEffect, type ComponentType } from 'react';
import { Layout } from './components/Layout';
import { initAnalytics, trackPageView, trackOutboundClick } from './lib/analytics';
import { APPLY_URL, AVAILABILITY_URL } from './data/seo';
import {
  routes,
  getPreloadedComponent,
  UNIT_DETAIL_ROUTE,
  KNOWLEDGE_ARTICLE_ROUTE,
  BLOG_ARTICLE_ROUTE,
  FLOOR_PLAN_DETAIL_ROUTE,
} from './routes';
import { LEGACY_REDIRECTS as SHARED_LEGACY_REDIRECTS } from './data/legacyRedirects';
import { withStaleChunkRecovery } from './lib/staleChunkRecovery';

// Route-based code splitting: each page ships in its own chunk. The page list is
// shared with the build-time prerenderer via `routes.tsx`; here each loader is
// wrapped in `React.lazy` (created once at module scope, stable across renders).
const lazyRoutes = routes.map((r) => {
  const Lazy = lazy(
    withStaleChunkRecovery(() => r.load().then((C: ComponentType) => ({ default: C }))),
  );
  // Prefer the component preloaded by main.tsx (initial route only): it renders
  // synchronously in the first commit, so the prerendered HTML is never
  // replaced by the Suspense fallback (which would collapse the page and shift
  // the footer — a large CLS on every load). SPA navigations to other routes
  // still go through React.lazy as before.
  function RouteComponent(_props: RouteComponentProps) {
    const Preloaded = getPreloadedComponent(r.path);
    // Page components take no props (route params are unused on these
    // static content routes), so none are forwarded.
    return Preloaded ? <Preloaded /> : <Lazy />;
  }
  return { path: r.path, Component: RouteComponent };
});

// All lazy loaders are wrapped in withStaleChunkRecovery: a route chunk that
// vanished across a publish triggers a one-time reload instead of a broken page.
const NotFound = lazy(
  withStaleChunkRecovery(() => import('./pages/not-found').then((m) => ({ default: m.NotFound }))),
);
const UnitDetailLazy = lazy(
  withStaleChunkRecovery(() =>
    import('./pages/UnitDetail').then((m) => ({ default: m.UnitDetail })),
  ),
);
/** Prefer the boot-preloaded component (see routes.tsx) — same CLS guard as the
    static routes: the prerendered unit page must never swap to the Suspense
    fallback while the chunk downloads. */
function UnitDetailRoute(_props: RouteComponentProps) {
  const Preloaded = getPreloadedComponent(UNIT_DETAIL_ROUTE);
  return Preloaded ? <Preloaded /> : <UnitDetailLazy />;
}

const FloorPlanDetailLazy = lazy(
  withStaleChunkRecovery(() =>
    import('./pages/FloorPlanDetail').then((m) => ({ default: m.FloorPlanDetail })),
  ),
);
/** Same boot-preload CLS guard as unit pages, for /floor-plans/<slug>. */
function FloorPlanDetailRoute(_props: RouteComponentProps) {
  const Preloaded = getPreloadedComponent(FLOOR_PLAN_DETAIL_ROUTE);
  return Preloaded ? <Preloaded /> : <FloorPlanDetailLazy />;
}

const KnowledgeArticleLazy = lazy(
  withStaleChunkRecovery(() =>
    import('./pages/KnowledgeArticle').then((m) => ({ default: m.KnowledgeArticle })),
  ),
);
/** Same boot-preload CLS guard as unit pages, for /knowledge/<slug>. */
function KnowledgeArticleRoute(_props: RouteComponentProps) {
  const Preloaded = getPreloadedComponent(KNOWLEDGE_ARTICLE_ROUTE);
  return Preloaded ? <Preloaded /> : <KnowledgeArticleLazy />;
}

const BlogArticleLazy = lazy(
  withStaleChunkRecovery(() =>
    import('./pages/BlogArticle').then((m) => ({ default: m.BlogArticle })),
  ),
);
/** Same boot-preload CLS guard as unit pages, for /blog/<slug>. */
function BlogArticleRoute(_props: RouteComponentProps) {
  const Preloaded = getPreloadedComponent(BLOG_ARTICLE_ROUTE);
  return Preloaded ? <Preloaded /> : <BlogArticleLazy />;
}

/**
 * Client-side redirect. Handles both internal route changes and external URLs.
 * Note: true HTTP 301s for legacy URLs should also be configured at the host/edge
 * (see the migration bundle's host-recommendation.md); this guarantees visitors
 * never hit a 404 in the SPA.
 */
export function Redirect({ to, cta }: { to: string; cta?: 'apply' | 'availability' }) {
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (/^https?:\/\//i.test(to)) {
      // Outbound CTA reached via an internal redirect route (/apply,
      // /available-units, legacy URLs) — attribute it before leaving the SPA.
      // The CTA kind is passed explicitly because APPLY_URL and
      // AVAILABILITY_URL can point at the same destination, making the URL
      // alone ambiguous for attribution.
      // Fallback URL-based attribution is only trustworthy while the two CTA
      // URLs differ; when they're identical the fallback is disabled and
      // callsites must pass `cta` explicitly.
      const urlFallback =
        APPLY_URL === AVAILABILITY_URL
          ? null
          : to === APPLY_URL
            ? 'apply'
            : to === AVAILABILITY_URL
              ? 'availability'
              : null;
      const kind = cta ?? urlFallback;
      if (kind) trackOutboundClick(kind, to, 'redirect');
      window.location.replace(to);
    } else {
      setLocation(to, { replace: true });
    }
  }, [to, cta, setLocation]);
  return null;
}

/**
 * Legacy Wix/WordPress URLs -> canonical routes. The shared map lives in
 * data/legacyRedirects.ts (also consumed by the build-time redirect-stub
 * generator); the artist-in-residence variants are client-side-only extras
 * because their no-JS stub is hand-written in public/.
 */
const LEGACY_REDIRECTS: Record<string, string> = {
  ...SHARED_LEGACY_REDIRECTS,
  '/apartments/il/chicago/artist-in-residence': '/',
  '/artist-in-residence': '/',
};

/**
 * SPA navigations preserve the previous page's scroll position by default —
 * reset to the top on every route change (unless navigating to an in-page anchor).
 */
function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    // Track back/forward navigations: the browser restores the previous scroll
    // position for those, and we must not override it.
    const onPopState = () => {
      isPopNavigation = true;
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
  useEffect(() => {
    const wasPop = isPopNavigation;
    isPopNavigation = false;
    if (!wasPop && !window.location.hash) {
      window.scrollTo(0, 0);
    }
  }, [location]);
  return null;
}
let isPopNavigation = false;

/** GA4: init once, then report a page_view on load and every SPA navigation. */
function AnalyticsTracker() {
  const [location] = useLocation();
  useEffect(() => {
    initAnalytics();
  }, []);
  useEffect(() => {
    trackPageView(location);
  }, [location]);
  return null;
}

function App() {
  return (
    <Layout>
      <AnalyticsTracker />
      <ScrollToTop />
      <Suspense fallback={<div className="min-h-[60vh]" aria-hidden="true" />}>
        <Switch>
          {lazyRoutes.map(({ path, Component }) => (
            <Route key={path} path={path} component={Component} />
          ))}

          {/* Live availability: per-unit listing pages. Prerendered per baked
              unit at build time (scripts/prerender.mjs); hydrates from the live
              feed so prices/dates self-correct between publishes. */}
          <Route path={UNIT_DETAIL_ROUTE} component={UnitDetailRoute} />

          {/* Knowledge Center articles: static content data, prerendered per
              article at build time (scripts/prerender.mjs). */}
          <Route path={KNOWLEDGE_ARTICLE_ROUTE} component={KnowledgeArticleRoute} />

          {/* Blog articles: static content data, prerendered per published
              article at build time (scripts/prerender.mjs). */}
          <Route path={BLOG_ARTICLE_ROUTE} component={BlogArticleRoute} />

          {/* Floor-plan landing pages: one per distinct plan layout, prerendered
              at build time (scripts/prerender.mjs). The /floor-plans hub itself
              is a static content route in routes.tsx. */}
          <Route path={FLOOR_PLAN_DETAIL_ROUTE} component={FloorPlanDetailRoute} />

          {/* Clean external CTA URL preserved from the migration information architecture */}
          <Route path="/apply">{() => <Redirect to={APPLY_URL} cta="apply" />}</Route>

          {/* Legacy URL redirects */}
          {Object.entries(LEGACY_REDIRECTS).map(([from, to]) => (
            <Route key={from} path={from}>
              {() => <Redirect to={to} cta={to === APPLY_URL ? 'apply' : undefined} />}
            </Route>
          ))}

          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </Layout>
  );
}

export default App;
