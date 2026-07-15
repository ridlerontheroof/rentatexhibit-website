import { PageHero } from '../components/PageHero';
import { MapPin, Coffee, Utensils, ShoppingBag, Music, Palmtree, Train } from 'lucide-react';

export function Neighborhood() {
  return (
    <div>
      <PageHero
        image="/images/assets/images/image-081-20170926-1450-wmbiod.jpg"
        alt="Neighborhood | Exhibit On Superior in Chicago, Illinois"
        title="Neighborhood"
        subtitle="River North at Your Doorstep"
      />

      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <span className="eyebrow">Prime Location</span>
          <h2 className="section-title mb-6">Where Art Meets Urban Energy</h2>
          <p className="text-lg leading-relaxed">
            Exhibit on Superior sits in the heart of River North, Chicago's most vibrant and culturally rich neighborhood. Known for its world-class art galleries, innovative restaurants, trendy boutiques, and pulsing nightlife, River North offers an urban lifestyle unlike any other.
          </p>
        </div>
      </section>

      <section className="py-12 px-4 bg-muted">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h3 className="text-3xl uppercase tracking-wider mb-6">The River North Experience</h3>
              <p className="text-lg leading-relaxed mb-6">
                River North is Chicago's epicenter of creativity and culture. From the moment you step outside, you're surrounded by galleries showcasing contemporary art, Michelin-starred restaurants, craft cocktail bars, and historic architecture.
              </p>
              <p className="text-lg leading-relaxed">
                The neighborhood perfectly balances artistic sophistication with modern urban convenience—farmers markets on weekends, rooftop bars with skyline views, and the energy of a community that never sleeps.
              </p>
            </div>
            <img
              src="/images/assets/images/image-082-bt7b3562-adimkf.jpg"
              alt="Street view of the city near Exhibit On Superior in Chicago, Illinois"
              className="w-full h-[400px] object-cover"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 text-primary mb-4">
                <Utensils className="w-7 h-7" />
              </div>
              <h4 className="text-xl uppercase tracking-wider mb-3">Dining</h4>
              <p className="text-sm">
                Home to 200+ restaurants including RPM Italian, Girl & the Goat, and Gibsons Bar & Steakhouse. From casual cafes to fine dining, every craving is covered.
              </p>
            </div>

            <div className="bg-white p-6 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 text-primary mb-4">
                <Coffee className="w-7 h-7" />
              </div>
              <h4 className="text-xl uppercase tracking-wider mb-3">Coffee & Cafés</h4>
              <p className="text-sm">
                Artisan coffee shops on every corner. Start your morning at Intelligentsia, La Colombe, or Starbucks Reserve Roastery.
              </p>
            </div>

            <div className="bg-white p-6 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 text-primary mb-4">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <h4 className="text-xl uppercase tracking-wider mb-3">Shopping</h4>
              <p className="text-sm">
                The Magnificent Mile is minutes away, featuring luxury boutiques, flagship stores, and local designers. River North also hosts unique vintage shops and design studios.
              </p>
            </div>

            <div className="bg-white p-6 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 text-primary mb-4">
                <Music className="w-7 h-7" />
              </div>
              <h4 className="text-xl uppercase tracking-wider mb-3">Nightlife</h4>
              <p className="text-sm">
                Rooftop lounges, craft cocktail bars, live music venues, and nightclubs. The neighborhood comes alive after dark with endless entertainment options.
              </p>
            </div>

            <div className="bg-white p-6 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 text-primary mb-4">
                <Palmtree className="w-7 h-7" />
              </div>
              <h4 className="text-xl uppercase tracking-wider mb-3">Parks & Recreation</h4>
              <p className="text-sm">
                Lakefront Trail, Ohio Street Beach, and Milton Lee Olive Park are all nearby. Perfect for running, biking, or relaxing by Lake Michigan.
              </p>
            </div>

            <div className="bg-white p-6 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 text-primary mb-4">
                <Train className="w-7 h-7" />
              </div>
              <h4 className="text-xl uppercase tracking-wider mb-3">Transit</h4>
              <p className="text-sm">
                Walk to Red Line CTA stations, bus routes, and Divvy bike shares. Easy access to downtown, O'Hare, and every Chicago neighborhood.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h3 className="text-3xl uppercase tracking-wider mb-8 text-center">Walk Score: 98 / 100</h3>
          <p className="text-center text-lg mb-12">
            Exhibit on Superior has a Walker's Paradise score—daily errands do not require a car.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-xl uppercase tracking-wider mb-4">Nearby Highlights</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span>Magnificent Mile - 0.3 miles</span>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span>Navy Pier - 1.2 miles</span>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span>Millennium Park - 1.5 miles</span>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span>Museum of Contemporary Art - 0.6 miles</span>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span>Art Institute of Chicago - 2 miles</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl uppercase tracking-wider mb-4">Essential Services</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span>Whole Foods Market - 0.4 miles</span>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span>Walgreens - 0.2 miles</span>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span>Northwestern Memorial Hospital - 0.8 miles</span>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span>LA Fitness - 0.3 miles</span>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span>Chicago Red Line Station - 0.5 miles</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-dark-section">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="section-title text-white mb-6">Discover Your New Neighborhood</h2>
          <p className="text-lg leading-relaxed mb-8">
            Schedule a tour and explore River North for yourself. See why this is Chicago's most exciting place to live.
          </p>
          <a href="/schedule-a-tour" className="btn-gold-outline bg-primary text-white border-primary hover:bg-primary/90 inline-block">
            Schedule Your Tour
          </a>
        </div>
      </section>
    </div>
  );
}
