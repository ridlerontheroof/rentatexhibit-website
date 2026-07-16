import { PageHero } from '../components/PageHero';
import { Seo } from '../components/Seo';
import { QuickAnswer } from '../components/QuickAnswer';
import { FaqSection } from '../components/FaqSection';
import { Link } from 'wouter';

export function Neighborhood() {
  return (
    <>
      <Seo path="/neighborhood" />
      <div>
        <PageHero
          image="/images/image-081-20170926-1450-wmbiod.jpg"
          alt="Neighborhood | Exhibit On Superior in Chicago, Illinois"
          title="Get out and Explore The Best of River North"
          subtitle="Neighborhood"
        />

        <QuickAnswer path="/neighborhood" />

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <p className="text-lg leading-relaxed mb-6">
              At Superior and Wells, you’re truly at the center of it all. Spend your days exploring world-class galleries, browsing boutique studios, and discovering trendy shops. When night falls, indulge in rooftop cocktails, chef-driven restaurants, intimate speakeasies, and live music venues.
            </p>
            <p className="text-lg leading-relaxed mb-6">
              Exhibit puts you in a prime location for both work and play. Whether you’re commuting to the office, meeting friends for dinner, or catching a show, everything you love about city living is right outside your door.
            </p>
            <p className="text-lg leading-relaxed">
              This is urban living at its finest. You live in this city for a reason, Exhibit lets you make the most of it.
            </p>
          </div>
        </section>

        <section className="py-12 px-4 bg-muted">
          <div className="container mx-auto max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl uppercase tracking-wider mb-6">Embrace the Energy Urban living Perfected</h2>
                <p className="text-lg leading-relaxed mb-6">
                  Feel the pulse of Chicago and turn up the volume on city living; where the skyline is your nightlight and the hum of the city is your soundtrack.
                </p>
                <p className="text-lg leading-relaxed mb-6">
                  There’s a reason River North is one of Chicago’s most coveted neighborhoods and at Exhibit on Superior, you’re right in the heart of it. From its vibrant art scene and cutting-edge dining to stylish nightlife and chic cafés, River North delivers nonstop energy with just the right amount of culture and calm.
                </p>
                <p className="text-lg leading-relaxed">
                  Also enjoy quick access to nearby hotspots like Fulton Market, Old Town, and the West Loop. Don't miss out on the action, schedule a tour today
                </p>
                <div className="mt-8">
                  <Link href="/schedule-a-tour" className="btn-gold-outline bg-primary text-white border-primary hover:bg-primary/90 inline-block">
                    Schedule a Tour
                  </Link>
                </div>
              </div>
              <img
                src="/images/image-082-bt7b3562-adimkf.jpg"
                alt="Street view of the city near Exhibit On Superior in Chicago, Illinois"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-dark-section">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="section-title text-white mb-6">Embrace Unbounded City Living At Exhibit On Superior</h2>
            <Link href="/contact-us" className="btn-gold-outline inline-block">
              Contact Us
            </Link>
          </div>
        </section>
      </div>
        <FaqSection path="/neighborhood" />
    </>
  );
}
