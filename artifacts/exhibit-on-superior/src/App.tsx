import { Route, Switch, useLocation } from 'wouter';
import { lazy, Suspense, useEffect } from 'react';
import { Layout } from './components/Layout';
import { APPLY_URL, AVAILABILITY_URL } from './data/seo';

// Route-based code splitting: each page ships in its own chunk.
const Home = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })));
const FloorPlans = lazy(() => import('./pages/FloorPlans').then((m) => ({ default: m.FloorPlans })));
const PhotoGallery = lazy(() => import('./pages/PhotoGallery').then((m) => ({ default: m.PhotoGallery })));
const VirtualTour = lazy(() => import('./pages/VirtualTour').then((m) => ({ default: m.VirtualTour })));
const Amenities = lazy(() => import('./pages/Amenities').then((m) => ({ default: m.Amenities })));
const PetFriendly = lazy(() => import('./pages/PetFriendly').then((m) => ({ default: m.PetFriendly })));
const Neighborhood = lazy(() => import('./pages/Neighborhood').then((m) => ({ default: m.Neighborhood })));
const ArtistInResidence = lazy(() => import('./pages/ArtistInResidence').then((m) => ({ default: m.ArtistInResidence })));
const ContactUs = lazy(() => import('./pages/ContactUs').then((m) => ({ default: m.ContactUs })));
const MapDirections = lazy(() => import('./pages/MapDirections').then((m) => ({ default: m.MapDirections })));
const Residents = lazy(() => import('./pages/Residents').then((m) => ({ default: m.Residents })));
const ScheduleTour = lazy(() => import('./pages/ScheduleTour').then((m) => ({ default: m.ScheduleTour })));
const Reviews = lazy(() => import('./pages/Reviews').then((m) => ({ default: m.Reviews })));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy').then((m) => ({ default: m.PrivacyPolicy })));
const AccessibilityStatement = lazy(() =>
  import('./pages/AccessibilityStatement').then((m) => ({ default: m.AccessibilityStatement }))
);
const NotFound = lazy(() => import('./pages/not-found').then((m) => ({ default: m.NotFound })));

/**
 * Client-side redirect. Handles both internal route changes and external URLs.
 * Note: true HTTP 301s for legacy URLs should also be configured at the host/edge
 * (see the migration bundle's host-recommendation.md); this guarantees visitors
 * never hit a 404 in the SPA.
 */
function Redirect({ to }: { to: string }) {
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (/^https?:\/\//i.test(to)) {
      window.location.replace(to);
    } else {
      setLocation(to, { replace: true });
    }
  }, [to, setLocation]);
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

function App() {
  return (
    <Layout>
      <Suspense fallback={<div className="min-h-[60vh]" aria-hidden="true" />}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/floor-plans" component={FloorPlans} />
          <Route path="/photo-gallery" component={PhotoGallery} />
          <Route path="/virtual-tour" component={VirtualTour} />
          <Route path="/amenities" component={Amenities} />
          <Route path="/pet-friendly" component={PetFriendly} />
          <Route path="/neighborhood" component={Neighborhood} />
          <Route path="/artist-in-residence" component={ArtistInResidence} />
          <Route path="/contact-us" component={ContactUs} />
          <Route path="/map-directions" component={MapDirections} />
          <Route path="/residents" component={Residents} />
          <Route path="/schedule-a-tour" component={ScheduleTour} />
          <Route path="/reviews" component={Reviews} />
          <Route path="/privacy-policy" component={PrivacyPolicy} />
          <Route path="/accessibility-statement" component={AccessibilityStatement} />

          {/* Clean external CTA URLs preserved from the migration information architecture */}
          <Route path="/available-units">{() => <Redirect to={AVAILABILITY_URL} />}</Route>
          <Route path="/apply">{() => <Redirect to={APPLY_URL} />}</Route>

          {/* Legacy URL redirects */}
          {Object.entries(LEGACY_REDIRECTS).map(([from, to]) => (
            <Route key={from} path={from}>
              {() => <Redirect to={to} />}
            </Route>
          ))}

          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </Layout>
  );
}

export default App;
