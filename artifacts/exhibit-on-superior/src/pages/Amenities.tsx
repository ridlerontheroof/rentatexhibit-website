import { PageHero } from '../components/PageHero';
import { Waves, Dumbbell, Wifi, Music, Users, Coffee, Car, Package, Wind, Shield, Clock, Sparkles } from 'lucide-react';

export function Amenities() {
  return (
    <div>
      <PageHero
        image="/images/assets/images/image-075-20170601-0036-z1fw1i.jpg"
        alt="Amenities | Exhibit On Superior in Chicago, Illinois"
        title="Amenities"
        subtitle="Luxury Living Elevated"
      />

      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <span className="eyebrow">World-Class Features</span>
          <h2 className="section-title mb-6">Everything You Need, All in One Place</h2>
          <p className="text-lg leading-relaxed">
            Exhibit on Superior offers an unparalleled collection of resort-style amenities designed to enhance your lifestyle. From fitness and wellness to entertainment and work spaces, every detail has been thoughtfully curated.
          </p>
        </div>
      </section>

      {/* Featured Amenity Images */}
      <section className="py-12 px-4 bg-muted">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <img
              src="/images/assets/images/image-009-34-southeast-levwhc.jpg"
              alt="City view at Exhibit On Superior in Chicago, Illinois"
              className="w-full h-[400px] object-cover"
            />
            <img
              src="/images/assets/images/image-010-full-floor-amenity-deck-overlooking-the-city-and.jpg"
              alt="Well-furnished modern apartment at Exhibit On Superior in Chicago, Illinois"
              className="w-full h-[400px] object-cover"
            />
            <img
              src="/images/assets/images/image-076-012417-5680-yegi2f.jpg"
              alt="Kitchen with stainless-steel hardware and appliances at Exhibit On Superior in Chicago, Illinois"
              className="w-full h-[400px] object-cover"
            />
            <img
              src="/images/assets/images/image-077-20170808-0721-c60hfw.jpg"
              alt="Poolside lounge seating at Exhibit On Superior in Chicago, Illinois"
              className="w-full h-[400px] object-cover"
            />
          </div>
        </div>
      </section>

      {/* Amenity Categories */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Recreation */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 text-primary mb-4">
                <Waves className="w-8 h-8" />
              </div>
              <h3 className="text-xl uppercase tracking-wider mb-3">Outdoor Pool & Deck</h3>
              <p className="text-sm">
                Full-floor rooftop amenity deck with heated outdoor lap pool, sundeck, fire pits, grilling stations, and panoramic city views.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 text-primary mb-4">
                <Dumbbell className="w-8 h-8" />
              </div>
              <h3 className="text-xl uppercase tracking-wider mb-3">Fitness Center</h3>
              <p className="text-sm">
                State-of-the-art fitness center with cardio equipment, free weights, yoga studio, and on-demand training programs.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 text-primary mb-4">
                <Music className="w-8 h-8" />
              </div>
              <h3 className="text-xl uppercase tracking-wider mb-3">Music Studio</h3>
              <p className="text-sm">
                Private soundproof music studio for residents to practice instruments, record, or jam with friends.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 text-primary mb-4">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl uppercase tracking-wider mb-3">Resident Lounge</h3>
              <p className="text-sm">
                Expansive resident lounge with fireplace, big-screen TV, game tables, and comfortable seating for entertaining guests.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 text-primary mb-4">
                <Wifi className="w-8 h-8" />
              </div>
              <h3 className="text-xl uppercase tracking-wider mb-3">Co-Working Spaces</h3>
              <p className="text-sm">
                Professional co-working areas with high-speed WiFi, charging stations, private conference rooms, and collaboration zones.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 text-primary mb-4">
                <Coffee className="w-8 h-8" />
              </div>
              <h3 className="text-xl uppercase tracking-wider mb-3">Coffee Bar</h3>
              <p className="text-sm">
                Complimentary coffee bar in the lobby with premium espresso, tea, and refreshments available daily.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 text-primary mb-4">
                <Car className="w-8 h-8" />
              </div>
              <h3 className="text-xl uppercase tracking-wider mb-3">Parking Garage</h3>
              <p className="text-sm">
                Secure attached parking garage with reserved and valet options, plus electric vehicle charging stations.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 text-primary mb-4">
                <Package className="w-8 h-8" />
              </div>
              <h3 className="text-xl uppercase tracking-wider mb-3">Package Service</h3>
              <p className="text-sm">
                24/7 package receiving and secure storage with text notifications when deliveries arrive.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 text-primary mb-4">
                <Wind className="w-8 h-8" />
              </div>
              <h3 className="text-xl uppercase tracking-wider mb-3">Sauna</h3>
              <p className="text-sm">
                Relaxing sauna for post-workout recovery and wellness rituals.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 text-primary mb-4">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-xl uppercase tracking-wider mb-3">24/7 Security</h3>
              <p className="text-sm">
                Controlled access entry, security cameras, and on-site management for peace of mind.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 text-primary mb-4">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="text-xl uppercase tracking-wider mb-3">Concierge Services</h3>
              <p className="text-sm">
                Professional concierge team available to assist with reservations, recommendations, and day-to-day needs.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 text-primary mb-4">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-xl uppercase tracking-wider mb-3">Resident Events</h3>
              <p className="text-sm">
                Regular community events, happy hours, and activities to connect with neighbors and build friendships.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* In-Unit Features */}
      <section className="py-16 px-4 bg-dark-section">
        <div className="container mx-auto max-w-4xl">
          <span className="eyebrow">In Every Apartment</span>
          <h2 className="section-title text-white mb-12">Premium In-Unit Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>Floor-to-ceiling windows with stunning city views</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>Quartz countertops and modern cabinetry</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>Stainless steel Energy Star appliances</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>In-unit washer and dryer</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>Designer plank flooring throughout</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>Walk-in closets with custom shelving</span>
              </li>
            </ul>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>Spa-inspired bathrooms with soaking tubs</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>Smart home technology and keyless entry</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>Central heating and air conditioning</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>High-speed internet ready</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>Private balconies available in select units</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>USB charging outlets</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="section-title mb-6">Experience the Difference</h2>
          <p className="text-lg leading-relaxed mb-8">
            See these exceptional amenities for yourself. Schedule a tour and discover why Exhibit on Superior sets the standard for luxury living.
          </p>
          <a href="/schedule-a-tour" className="btn-gold-outline bg-primary text-white border-primary hover:bg-primary/90 inline-block">
            Schedule Your Tour
          </a>
        </div>
      </section>
    </div>
  );
}
