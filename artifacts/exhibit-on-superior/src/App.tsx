import { Route, Switch } from 'wouter';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { FloorPlans } from './pages/FloorPlans';
import { PhotoGallery } from './pages/PhotoGallery';
import { VirtualTour } from './pages/VirtualTour';
import { Amenities } from './pages/Amenities';
import { PetFriendly } from './pages/PetFriendly';
import { Neighborhood } from './pages/Neighborhood';
import { ArtistInResidence } from './pages/ArtistInResidence';
import { Contact } from './pages/Contact';
import { MapDirections } from './pages/MapDirections';
import { Residents } from './pages/Residents';
import { ScheduleTour } from './pages/ScheduleTour';
import { Reviews } from './pages/Reviews';

function App() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/floor-plans" component={FloorPlans} />
        <Route path="/photo-gallery" component={PhotoGallery} />
        <Route path="/virtual-tour" component={VirtualTour} />
        <Route path="/amenities" component={Amenities} />
        <Route path="/pet-friendly" component={PetFriendly} />
        <Route path="/neighborhood" component={Neighborhood} />
        <Route path="/artist-in-residence" component={ArtistInResidence} />
        <Route path="/contact" component={Contact} />
        <Route path="/map-directions" component={MapDirections} />
        <Route path="/residents" component={Residents} />
        <Route path="/schedule-a-tour" component={ScheduleTour} />
        <Route path="/reviews" component={Reviews} />
        <Route>
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl uppercase tracking-wider mb-4">404 - Page Not Found</h1>
              <p className="text-lg mb-6">The page you're looking for doesn't exist.</p>
              <a href="/" className="btn-gold-outline inline-block">
                Return Home
              </a>
            </div>
          </div>
        </Route>
      </Switch>
    </Layout>
  );
}

export default App;
