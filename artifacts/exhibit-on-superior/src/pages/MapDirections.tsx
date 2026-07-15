import { PageHero } from '../components/PageHero';
import { MapPin, Navigation, Car, Train, Plane } from 'lucide-react';

export function MapDirections() {
  return (
    <div>
      <PageHero
        image="/images/assets/images/image-085-30-south-kis7bz.jpg"
        alt="Map + Directions | Exhibit On Superior in Chicago, Illinois"
        title="Map & Directions"
        subtitle="Find Your Way to Exhibit"
      />

      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <span className="eyebrow">Location</span>
          <h2 className="section-title mb-6">30 W. Superior St., Chicago, IL 60654</h2>
          <p className="text-lg leading-relaxed">
            Exhibit on Superior is located in the heart of River North, one of Chicago's most accessible neighborhoods. Whether you're driving, taking public transit, or walking from downtown, we're easy to reach.
          </p>
        </div>
      </section>

      {/* Google Map */}
      <section className="py-12 px-4 bg-muted">
        <div className="container mx-auto max-w-5xl">
          <div className="aspect-video bg-white border border-border mb-8">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2969.9876543210123!2d-87.6298!3d41.8959!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDHCsDUzJzQ1LjIiTiA4N8KwMzgnNDcuMyJX!5e0!3m2!1sen!2sus!4v1234567890"
              className="w-full h-full"
              allowFullScreen
              loading="lazy"
              title="Map of Exhibit On Superior"
            />
          </div>
          <div className="text-center">
            <a
              href="https://maps.google.com/?q=30+W+Superior+St+Chicago+IL+60654"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold-outline inline-flex items-center gap-2"
            >
              <Navigation className="w-4 h-4" />
              Get Directions
            </a>
          </div>
        </div>
      </section>

      {/* Directions */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <h3 className="text-3xl uppercase tracking-wider mb-12 text-center">How to Get Here</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-muted p-6 border border-border">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 text-primary mb-4">
                <Car className="w-7 h-7" />
              </div>
              <h4 className="text-xl uppercase tracking-wider mb-4">By Car</h4>
              <div className="text-sm space-y-3">
                <div>
                  <p className="font-semibold mb-1">From the North (via I-90/94):</p>
                  <p>Exit at Ohio Street, turn right on Orleans, left on Superior. Parking entrance on Superior.</p>
                </div>
                <div>
                  <p className="font-semibold mb-1">From the South (via I-90/94):</p>
                  <p>Exit at Ohio Street, turn left on Orleans, left on Superior.</p>
                </div>
                <div>
                  <p className="font-semibold mb-1">Parking:</p>
                  <p>Visitor parking available in our attached garage. Enter on Superior Street.</p>
                </div>
              </div>
            </div>

            <div className="bg-muted p-6 border border-border">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 text-primary mb-4">
                <Train className="w-7 h-7" />
              </div>
              <h4 className="text-xl uppercase tracking-wider mb-4">By CTA</h4>
              <div className="text-sm space-y-3">
                <div>
                  <p className="font-semibold mb-1">Red Line:</p>
                  <p>Exit at Chicago or Grand stations. 8-minute walk to Exhibit.</p>
                </div>
                <div>
                  <p className="font-semibold mb-1">Brown/Purple Lines:</p>
                  <p>Exit at Chicago station, walk east 10 minutes.</p>
                </div>
                <div>
                  <p className="font-semibold mb-1">Bus Routes:</p>
                  <p>#22 Clark, #36 Broadway stop nearby. Visit transitchicago.com for schedules.</p>
                </div>
              </div>
            </div>

            <div className="bg-muted p-6 border border-border">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 text-primary mb-4">
                <Plane className="w-7 h-7" />
              </div>
              <h4 className="text-xl uppercase tracking-wider mb-4">From Airports</h4>
              <div className="text-sm space-y-3">
                <div>
                  <p className="font-semibold mb-1">O'Hare International (ORD):</p>
                  <p>20 miles / 30-45 minutes by car or Blue Line CTA.</p>
                </div>
                <div>
                  <p className="font-semibold mb-1">Midway International (MDW):</p>
                  <p>12 miles / 25-35 minutes by car or Orange Line CTA + transfer.</p>
                </div>
                <div>
                  <p className="font-semibold mb-1">Rideshare:</p>
                  <p>Uber and Lyft pickups available from both airports.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Address & Contact */}
      <section className="py-16 px-4 bg-dark-section">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <MapPin className="w-6 h-6 text-primary" />
            <h2 className="text-3xl uppercase tracking-wider text-white">Exhibit On Superior</h2>
          </div>
          <p className="text-xl mb-8">
            30 W. Superior St.<br />
            Chicago, IL 60654
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="tel:312-450-0635" className="btn-gold-outline inline-block">
              Call: 312-450-0635
            </a>
            <a href="/schedule-a-tour" className="btn-gold-outline bg-primary text-white border-primary hover:bg-primary/90 inline-block">
              Schedule a Tour
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
