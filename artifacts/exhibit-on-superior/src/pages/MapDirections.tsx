import { PageHero } from '../components/PageHero';
import { Car, Clock, MapPin, Navigation, TrainFront } from 'lucide-react';
import { Seo } from '../components/Seo';
import { QuickAnswer } from '../components/QuickAnswer';
import { FaqSection } from '../components/FaqSection';
import { Link } from 'wouter';
import { SplitHeadline } from '../components/SplitHeadline';
import { PropertyMap } from '../components/PropertyMap';
import {
  WALK_SCORE,
  TRANSIT_SCORE,
  BIKE_SCORE,
  WALK_SCORE_SOURCE_URL,
} from '../data/walkScores';
import { COMMUTE_ROWS } from '../data/commute';

export function MapDirections() {
  return (
    <>
      <Seo path="/map-directions" />
      <div>
        <PageHero
          image="/images/image-085-30-south-kis7bz.jpg"
          alt="Map + Directions | Exhibit On Superior in Chicago, Illinois"
          titleScript="Driving Directions"
          title="To Exhibit On Superior"
          subtitle="Map + Directions"
        />

        <QuickAnswer path="/map-directions" />

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <SplitHeadline script="165 W Superior St" caps="Chicago, IL 60654" className="mb-6" />
            <p className="text-lg leading-relaxed">
              Check out the Directions feature in the map below for turn-by-turn directions to our studio, convertible, 1, 2 & 3 bedroom apartments for rent in Chicago, Illinois. Exhibit On Superior sits at the corner of Superior and Wells in River North, a few blocks north of the Loop and steps from the neighborhood&rsquo;s galleries, cafes, and restaurants.
            </p>
          </div>
        </section>

        {/* Google Map */}
        <section className="py-12 px-4 bg-muted">
          <div className="container mx-auto max-w-5xl">
            <div className="aspect-video bg-white border border-border mb-8">
              <PropertyMap />
            </div>
            <div className="text-center">
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=Exhibit%20On%20Superior%2C%20165%20W%20Superior%20St%2C%20Chicago%2C%20IL%2060654"
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

        {/* Getting here */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-5xl">
            <h3 className="text-3xl uppercase tracking-wider mb-10 text-center">Getting Here</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-muted p-8 border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <Car className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg uppercase tracking-wider">By Car</h4>
                </div>
                <ul className="space-y-3 text-sm leading-relaxed">
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1 flex-shrink-0">•</span>
                    <span>
                      <strong>From I-90/94 (Kennedy Expressway):</strong> Take the Ohio Street exit eastbound, continue east on Ohio Street, turn left (north) on Wells Street, then continue to Superior Street. The building is at the corner of Superior and Wells.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1 flex-shrink-0">•</span>
                    <span>
                      <strong>From Lake Shore Drive (US-41):</strong> Exit at Ohio Street heading west, then turn right (north) on Wells Street and continue to Superior Street.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1 flex-shrink-0">•</span>
                    <span>
                      <strong>From the Loop:</strong> Head north on Wells Street across the Chicago River; Superior Street is about six blocks north of the river.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="bg-muted p-8 border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <TrainFront className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg uppercase tracking-wider">By Train or Bus</h4>
                </div>
                <ul className="space-y-3 text-sm leading-relaxed">
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1 flex-shrink-0">•</span>
                    <span>
                      <strong>CTA Brown & Purple Lines:</strong> The Chicago station on Franklin Street is a short walk from the building.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1 flex-shrink-0">•</span>
                    <span>
                      <strong>CTA Red Line:</strong> The Chicago/State station is an easy walk east along Superior or Chicago Avenue.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1 flex-shrink-0">•</span>
                    <span>
                      <strong>CTA Buses:</strong> Several CTA bus routes, including the #66 Chicago Avenue route, run near Superior and Wells.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
            {/* Citation-friendly commute table — rows from src/data/commute.ts */}
            <div className="mt-10 overflow-x-auto border border-border bg-white p-6">
              <table className="w-full text-left text-sm">
                <caption className="mb-4 text-left text-lg uppercase tracking-wider text-foreground">
                  Commute Times from 165 W Superior St, River North
                </caption>
                <thead>
                  <tr className="border-b border-border uppercase tracking-wider">
                    <th scope="col" className="py-2 pr-4">Destination</th>
                    <th scope="col" className="py-2 pr-4">How to Get There</th>
                    <th scope="col" className="py-2">Approx. Time</th>
                  </tr>
                </thead>
                <tbody>
                  {COMMUTE_ROWS.map((r) => (
                    <tr key={r.destination} className="border-b border-border/50">
                      <th scope="row" className="py-2 pr-4 font-normal">{r.destination}</th>
                      <td className="py-2 pr-4 text-muted-foreground">{r.transit}</td>
                      <td className="py-2">{r.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-sm text-muted-foreground text-center mt-8">
              However you arrive, the corner is easy to reach without a car &mdash; per{' '}
              <a
                href={WALK_SCORE_SOURCE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Walk Score
              </a>
              , the address rates a {WALK_SCORE.score}/100 Walk Score, a {TRANSIT_SCORE.score}/100
              Transit Score, and an {BIKE_SCORE.score}/100 Bike Score.
            </p>
            <p className="text-sm text-muted-foreground text-center mt-4">
              Routes, exits, and schedules can change — use the map above or your preferred navigation app for current turn-by-turn directions, and check transitchicago.com for CTA service details.
            </p>
          </div>
        </section>

        {/* Office hours */}
        <section className="py-16 px-4 bg-muted">
          <div className="container mx-auto max-w-3xl text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Clock className="w-6 h-6 text-primary" />
              <h3 className="text-3xl uppercase tracking-wider">Leasing Office Hours</h3>
            </div>
            <ul className="space-y-2 text-lg mb-8">
              <li>Monday – Friday: 9:00 AM – 6:00 PM</li>
              <li>Saturday: 10:00 AM – 5:00 PM</li>
              <li>Sunday: Closed</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              Planning a visit? <Link href="/available-units" className="text-primary underline">Schedule a tour</Link> ahead of time so our team is ready to show you around.
            </p>
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
              <Link href="/available-units" className="btn-gold-outline bg-primary text-white border-primary hover:bg-primary/90 inline-block">
                Schedule a Tour
              </Link>
            </div>
          </div>
        </section>
      </div>
        <FaqSection path="/map-directions" />
    </>
  );
}
