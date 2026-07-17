import { Route, Switch, useLocation } from 'wouter';
import { lazy, Suspense, useEffect, type ComponentType } from 'react';
import { Layout } from './components/Layout';
import { initAnalytics, trackPageView, trackOutboundClick } from './lib/analytics';
import { APPLY_URL, AVAILABILITY_URL } from './data/seo';
import { routes } from './routes';

// Route-based code splitting: each page ships in its own chunk. The page list is
// shared with the build-time prerenderer via `routes.tsx`; here each loader is
// wrapped in `React.lazy` (created once at module scope, stable across renders).
const lazyRoutes = routes.map((r) => ({
  path: r.path,
  Component: lazy(() => r.load().then((C: ComponentType) => ({ default: C }))),
}));

const NotFound = lazy(() => import('./pages/not-found').then((m) => ({ default: m.NotFound })));

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

/** Legacy Wix/WordPress URLs -> canonical routes (source: migration redirects.csv). */
const LEGACY_REDIRECTS: Record<string, string> = {
  '/apartments/il/chicago/floor-plans': '/floor-plans',
  '/apartments/il/chicago/photo-gallery': '/photo-gallery',
  '/apartments/il/chicago/virtual-tour': '/virtual-tour',
  '/apartments/il/chicago/amenities': '/amenities',
  '/apartments/il/chicago/pet-friendly': '/pet-friendly',
  '/apartments/il/chicago/neighborhood': '/neighborhood',
  '/apartments/il/chicago/artist-in-residence': '/artist-in-residence',
  '/apartments/il/chicago/contact-us': '/contact-us',
  '/apartments/il/chicago/map-directions': '/map-directions',
  '/apartments/il/chicago/residents': '/residents',
  '/apartments/il/chicago/schedule-a-tour': '/schedule-a-tour',
  '/apartments/il/chicago/reviews': '/reviews',
  '/apartments/il/chicago/apply': APPLY_URL,
  '/apartments/il/chicago/magellan-rewards': '/',
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

          {/* Clean external CTA URLs preserved from the migration information architecture */}
          <Route path="/available-units">{() => <Redirect to={AVAILABILITY_URL} cta="availability" />}</Route>
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
