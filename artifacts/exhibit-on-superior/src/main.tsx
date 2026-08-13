import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { preloadRoute } from './routes';
import { captureVisitSource } from './lib/visitSource';
import { stripPrerenderedSeo } from './lib/stripPrerenderedSeo';
import './index.css';

// Remember campaign attribution (UTM tags) from the landing URL for the whole
// visit — lead forms and Apply links send it to AppFolio so the leasing team
// can tell a Google Ads click from an organic visit.
captureVisitSource();

// Remove prerendered JSON-LD before hydration: Helmet re-emits the same
// structured data (with live values) on mount, and Helmet never removes
// scripts it didn't create. Leaving both sets in the DOM makes Google's
// rendered crawl see duplicate entities (e.g. two aggregate ratings on
// /reviews). Removing here — before render — avoids any window where both
// copies coexist.
document.querySelectorAll('script[data-ssr-jsonld]').forEach((el) => el.remove());

// Remove the whole server-written SEO block (title/canonical/OG/Twitter/robots
// between the seo:start/seo:end markers) too: Helmet re-emits the current
// route's full set on mount but never removes tags it didn't create. Leaving
// the static block made JS-executing preview scrapers (iMessage) see two
// og:image tags — the homepage card from index.html plus the route's own —
// and render a two-image share card. This also covers the stale robots meta
// on rented-unit pages (Helmet's live directive is the only one left).
// (Raw-HTML crawls are unaffected; they see the prerendered block as before.)
stripPrerenderedSeo();

const queryClient = new QueryClient();

// Fetch the current page's code chunk BEFORE the first client render. The
// prerendered HTML stays on screen while it downloads; once ready, React's
// first commit renders the full page in one step. Rendering earlier would
// swap the prerendered page for the Suspense fallback (header + footer only)
// until the chunk arrived — a footer jump of several thousand pixels that
// Google measured as a 0.31 CLS across the site.
preloadRoute(window.location.pathname).finally(() => {
  createRoot(document.getElementById('root')!).render(
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </HelmetProvider>
  );
});
