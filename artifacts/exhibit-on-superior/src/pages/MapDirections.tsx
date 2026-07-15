import { PageHero } from '../components/PageHero';
import { MapPin, Navigation, Car, Train, Plane } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export function MapDirections() {
  return (
    <>
      <Helmet>
        <title>Map & Directions | Exhibit On Superior Chicago IL</title>
        <meta name="description" content="Get map and direction information for Exhibit On Superior at 165 W Superior St in Chicago's River North neighborhood." />
      </Helmet>
      <div>
        <PageHero
          image="/images/image-085-30-south-kis7bz.jpg"
          alt="Map + Directions | Exhibit On Superior in Chicago, Illinois"
          title="Driving Directions to Exhibit On Superior"
          subtitle="Map + Directions"
        />

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="section-title mb-6">165 W Superior St Chicago, IL 60654</h2>
            <p className="text-lg leading-relaxed">
              Check out the Directions feature in the map below for turn-by-turn directions to our studio, 1, 2 & 3 bedroom apartments for rent in Chicago, Illinois.
            </p>
          </div>
        </section>

        {/* Google Map */}
        <section className="py-12 px-4 bg-muted">
          <div className="container mx-auto max-w-5xl">
            <div className="aspect-video bg-white border border-border mb-8">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d11880.89369931758!2d-87.633525!3d41.895395!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x880e2cb0cd222165%3A0xd3840af7e2b8eebe!2sExhibit%20on%20Superior!5e0!3m2!1sen!2sus!4v1715000000000!5m2!1sen!2sus"
                className="w-full h-full"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Map of Exhibit On Superior"
              />
            </div>
            <div className="text-center">
              <a
                href="https://www.google.com/maps?cid=15240815771270963454"
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

        {/* Address & Contact */}
        <section className="py-16 px-4 bg-dark-section">
          <div className="container mx-auto max-w-3xl text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <MapPin className="w-6 h-6 text-primary" />
              <h2 className="text-3xl uppercase tracking-wider text-white">Exhibit On Superior</h2>
            </div>
            <p className="text-xl mb-8">
              165 W Superior St<br />
              Chicago, IL 60654
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="tel:312-450-0635" className="btn-gold-outline inline-block">
                312-450-0635
              </a>
              <a href="/schedule-a-tour" className="btn-gold-outline bg-primary text-white border-primary hover:bg-primary/90 inline-block">
                Schedule a Tour
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
