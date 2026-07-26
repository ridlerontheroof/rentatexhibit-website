import { PageHero } from '../components/PageHero';
import { Seo } from '../components/Seo';
import { QuickAnswer } from '../components/QuickAnswer';
import { FaqSection } from '../components/FaqSection';
import { Link } from 'wouter';
import { SplitHeadline } from '../components/SplitHeadline';
import { TrainFront, Bus, Car, Footprints } from 'lucide-react';

/**
 * Parking & Transportation. Transit, walking, and highway facts are publicly
 * verifiable (CTA stations, bus routes, street grid); on-site parking details
 * are deliberately deferred to the leasing team per the accuracy rule.
 */
export function ParkingTransportation() {
  return (
    <>
      <Seo path="/parking-transportation" />
      <div>
        <PageHero
          image="/images/image-055-dji-20230620092832-0149-d-yrh5eg.jpg"
          alt="Parking and Transportation | Exhibit On Superior in Chicago, Illinois"
          titleScript="Getting Around"
          title="Parking & Transportation"
          subtitle="Parking & Transportation"
        />

        <QuickAnswer path="/parking-transportation" />

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <p className="text-lg leading-relaxed">
              At Superior and Wells, you&rsquo;re on one of the best-connected corners in Chicago.
              Two CTA rail stations, multiple bus routes, and the Loop itself are all within an
              easy walk &mdash; and for drivers, the Kennedy Expressway and Lake Shore Drive are
              minutes away.
            </p>
          </div>
        </section>

        <section className="py-12 px-4 bg-muted">
          <div className="container mx-auto max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-border p-8">
                <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <TrainFront className="w-6 h-6" />
                </div>
                <h2 className="text-xl uppercase tracking-wider mb-4">CTA Trains</h2>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span><strong>Brown &amp; Purple Lines</strong> &mdash; Chicago station at Chicago &amp; Franklin, about two blocks away</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span><strong>Red Line</strong> &mdash; Chicago station at Chicago &amp; State, roughly 0.3 miles</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>One Brown Line stop drops you in the Loop</span></li>
                </ul>
              </div>
              <div className="bg-white border border-border p-8">
                <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Bus className="w-6 h-6" />
                </div>
                <h2 className="text-xl uppercase tracking-wider mb-4">CTA Buses</h2>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span><strong>#66 Chicago Avenue</strong> &mdash; one block north, running east&ndash;west across the city</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span><strong>#156 LaSalle</strong> and <strong>#22 Clark</strong> &mdash; within a few blocks, connecting to the Loop and the North Side</span></li>
                </ul>
              </div>
              <div className="bg-white border border-border p-8">
                <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Footprints className="w-6 h-6" />
                </div>
                <h2 className="text-xl uppercase tracking-wider mb-4">On Foot & Bike</h2>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>The Loop is roughly a mile south &mdash; about a 20-minute walk</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Whole Foods, Trader Joe&rsquo;s, and Jewel-Osco are all within about half a mile</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>The Chicago Riverwalk and lakefront are an easy walk or ride east and south</span></li>
                </ul>
              </div>
              <div className="bg-white border border-border p-8">
                <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Car className="w-6 h-6" />
                </div>
                <h2 className="text-xl uppercase tracking-wider mb-4">Driving & Parking</h2>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Kennedy Expressway (I-90/94) via the Ohio Street feeder, about a mile southwest</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Lake Shore Drive (US-41) east via Ontario and Ohio Streets</span></li>
                </ul>
                <ul className="mt-4 space-y-3">
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span><strong>On-site garage</strong> &mdash; indoor, attached multi-level garage; unreserved spaces are <strong>$335/month</strong>, subject to availability</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span><strong>EV charging</strong> &mdash; 3 UVBOX Level 2 charging stations serving 6 designated alternative-fuel/EV spaces; charging costs are set and billed directly by UVBOX</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span><strong>Guest / visitor parking</strong> &mdash; not offered in the garage; metered street parking is available on both sides of W Superior St in front of the building, and SpotHero lots are nearby</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span><strong>Bike storage</strong> &mdash; complimentary, on the ground floor</span></li>
                </ul>
                <p className="mt-4 text-sm text-muted-foreground">
                  For current garage availability, contact the leasing team at{' '}
                  <a href="mailto:exhibit@highlandptrs.com" className="text-primary underline">exhibit@highlandptrs.com</a>{' '}
                  or <a href="tel:312-450-0635" className="text-primary underline">312-450-0635</a>.
                </p>
              </div>
            </div>
            <p className="text-center mt-10 text-muted-foreground">
              Planning a visit? Get door-to-door directions on the{' '}
              <Link href="/map-directions" className="text-primary underline">Map &amp; Directions</Link> page.
            </p>
          </div>
        </section>

        <section className="py-16 px-4 bg-dark-section">
          <div className="container mx-auto max-w-3xl text-center">
            <SplitHeadline script="Embrace Unbounded City Living" caps="At Exhibit On Superior" dark className="mb-6" />
            <Link href="/available-units" className="btn-gold-outline inline-block">
              Schedule a Tour
            </Link>
          </div>
        </section>
      </div>
      <FaqSection path="/parking-transportation" />
    </>
  );
}
