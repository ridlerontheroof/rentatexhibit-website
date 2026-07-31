import { Link } from 'wouter';
import { Building2, MapPin, Phone, Mail, Users, Clock } from 'lucide-react';
import { PageHero } from '../components/PageHero';
import { Seo } from '../components/Seo';
import { QuickAnswer } from '../components/QuickAnswer';
import { FaqSection } from '../components/FaqSection';
import { SplitHeadline } from '../components/SplitHeadline';
import { ADA_COUNTS } from '../data/ada';
import {
  OFFICE_HOURS_LINES,
  SQFT_MIN_DISPLAY,
  SQFT_MAX_DISPLAY,
  SQFT_RANGE_DISPLAY,
  UNIT_TOTAL,
} from '../data/propertyFacts';

/**
 * About page (/about): the property's story, management company, building
 * facts, and NAP — the E-E-A-T trust page search engines look for. Every fact
 * here comes from already-published site copy or live listing data (no
 * invented dates or numbers). The page's JSON-LD is typed AboutPage with the
 * Organization as its main entity (see buildJsonLd in data/seo.ts).
 */
export function About() {
  return (
    <>
      <Seo path="/about" />
      <div>
        <PageHero
          image="/images/image-002-gettyimages-1286580777-nvdupq.jpg"
          alt="Woman celebrating joyfully with gold confetti at Exhibit On Superior in River North Chicago"
          titleScript="The Story Behind"
          title="Exhibit On Superior"
          subtitle="About"
        />

        <QuickAnswer path="/about" />

        {/* The property story */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl uppercase tracking-wider mb-6 text-center">A River North Original</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              <p>
                Exhibit On Superior rises 34 stories above the corner of Superior and Wells in the
                heart of River North — Chicago&rsquo;s gallery district, where the city&rsquo;s art
                scene, its restaurant row, and the downtown business core meet. The tower holds {UNIT_TOTAL}
                residences, from {SQFT_MIN_DISPLAY}-square-foot studios to {SQFT_MAX_DISPLAY}-square-foot three-bedroom,
                three-bath penthouses on floors 30&ndash;34, each finished with driftwood plank
                floors, quartz countertops, stainless-steel appliances, in-home washers and dryers,
                and floor-to-ceiling windows framing the skyline.
              </p>
              <p>
                The building was designed around one idea: that everything a resident needs should
                live under one roof. A full floor is dedicated to amenities — a 75-foot lap pool,
                an outdoor hot tub, a fitness center with two private training rooms and a boxing
                simulator, private work and meeting rooms, a music studio, and a doggie spa with a
                gated outdoor dog walk. The ground floor carries on-site retail and wellness
                options, and the front desk is staffed 24 hours a day.
              </p>
              <p>
                Accessibility is built in, not bolted on: {ADA_COUNTS.total} of the {UNIT_TOTAL} apartments
                — more than 20% of the homes — carry an ADA designation per the as-built
                accessibility matrix.
              </p>
            </div>
          </div>
        </section>

        {/* Building facts */}
        <section className="py-16 px-4 bg-muted">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-3xl uppercase tracking-wider mb-10 text-center">Building Facts</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <p className="text-4xl text-primary mb-2">34</p>
                <p className="text-sm uppercase tracking-wider">Stories</p>
              </div>
              <div>
                <p className="text-4xl text-primary mb-2">{UNIT_TOTAL}</p>
                <p className="text-sm uppercase tracking-wider">Residences</p>
              </div>
              <div>
                <p className="text-4xl text-primary mb-2">{SQFT_RANGE_DISPLAY}</p>
                <p className="text-sm uppercase tracking-wider">Square Feet</p>
              </div>
              <div>
                <p className="text-4xl text-primary mb-2">20%+</p>
                <p className="text-sm uppercase tracking-wider">ADA-Designated Homes</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div className="bg-white p-8 border border-border text-center">
                <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-6 h-6" aria-hidden="true" />
                </div>
                <h3 className="text-lg uppercase tracking-wider mb-3">Homes</h3>
                <p className="text-sm leading-relaxed">
                  Studio, convertible, one, two, and three-bedroom apartments on floors 2&ndash;34,
                  nearly all with private balconies. Live pricing is published on the{' '}
                  <Link href="/available-units" className="text-primary underline underline-offset-4 hover:text-primary/80">
                    Available Units
                  </Link>{' '}
                  page.
                </p>
              </div>
              <div className="bg-white p-8 border border-border text-center">
                <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6" aria-hidden="true" />
                </div>
                <h3 className="text-lg uppercase tracking-wider mb-3">Amenities</h3>
                <p className="text-sm leading-relaxed">
                  A full amenity floor: 75-foot lap pool, outdoor hot tub, sauna, fitness center,
                  lounges, work rooms, music studio, four grilling stations, and four fire pits.
                  See the{' '}
                  <Link href="/amenities" className="text-primary underline underline-offset-4 hover:text-primary/80">
                    Amenities
                  </Link>{' '}
                  page.
                </p>
              </div>
              <div className="bg-white p-8 border border-border text-center">
                <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-6 h-6" aria-hidden="true" />
                </div>
                <h3 className="text-lg uppercase tracking-wider mb-3">Location</h3>
                <p className="text-sm leading-relaxed">
                  Two CTA rail stations, three grocery stores, and the Loop all within about a
                  mile. Explore the{' '}
                  <Link href="/neighborhood" className="text-primary underline underline-offset-4 hover:text-primary/80">
                    Neighborhood
                  </Link>{' '}
                  page.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Management company */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl uppercase tracking-wider mb-6 text-center">
              An On-Site Management Team
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              <p>
                Exhibit On Superior is professionally managed with a full-time leasing and
                management team on site. The same team that leases
                the building runs it day to day — the front desk is staffed around the clock,
                maintenance requests go through the resident portal, and urgent issues reach a
                live person at{' '}
                <a href="tel:312-883-5503" className="text-primary underline underline-offset-4 hover:text-primary/80">
                  (312) 883-5503
                </a>
                .
              </p>
              <p>
                The on-site team also maintains every fact published on this website: pricing and
                availability sync automatically from the leasing system, and the answers in the{' '}
                <Link href="/faq" className="text-primary underline underline-offset-4 hover:text-primary/80">
                  FAQ
                </Link>{' '}
                and{' '}
                <Link href="/knowledge" className="text-primary underline underline-offset-4 hover:text-primary/80">
                  Knowledge Center
                </Link>{' '}
                are reviewed by the leasing team, so what you read here matches what you&rsquo;ll
                hear in the leasing office.
              </p>
            </div>
          </div>
        </section>

        {/* NAP + hours */}
        <section className="py-16 px-4 bg-muted">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl uppercase tracking-wider mb-10 text-center">Visit Or Get In Touch</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 border border-border">
                <h3 className="text-lg uppercase tracking-wider mb-4">Exhibit On Superior</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-1 flex-shrink-0 text-primary" aria-hidden="true" />
                    <span>
                      165 W Superior St
                      <br />
                      Chicago, IL 60654
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Phone className="w-4 h-4 flex-shrink-0 text-primary" aria-hidden="true" />
                    <a href="tel:312-450-0635" className="text-primary underline underline-offset-4 hover:text-primary/80">
                      312-450-0635
                    </a>
                  </li>
                  <li className="flex items-center gap-2">
                    <Mail className="w-4 h-4 flex-shrink-0 text-primary" aria-hidden="true" />
                    <a href="mailto:exhibit@highlandptrs.com" className="text-primary underline underline-offset-4 hover:text-primary/80">
                      exhibit@highlandptrs.com
                    </a>
                  </li>
                </ul>
              </div>
              <div className="bg-white p-8 border border-border">
                <h3 className="text-lg uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" aria-hidden="true" /> Office Hours
                </h3>
                <ul className="space-y-2 text-sm">
                  {OFFICE_HOURS_LINES.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                  <li className="pt-2 text-muted-foreground">
                    Front desk staffed 24 hours a day, every day.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 bg-dark-section">
          <div className="container mx-auto max-w-3xl text-center">
            <SplitHeadline script="Come See It" caps="For Yourself" dark className="mb-6" />
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/schedule-a-tour" className="btn-gold-outline inline-block">
                Schedule a Tour
              </Link>
              <Link
                href="/available-units"
                className="btn-gold-outline bg-primary text-white border-primary hover:bg-primary/90 inline-block"
              >
                View Available Units
              </Link>
            </div>
          </div>
        </section>
      </div>
      <FaqSection path="/about" />
    </>
  );
}
