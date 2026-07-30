import { PageHero } from '../components/PageHero';
import { SmartImg } from '../components/SmartImg';
import { Seo } from '../components/Seo';
import { QuickAnswer } from '../components/QuickAnswer';
import { FaqSection } from '../components/FaqSection';
import { Link } from 'wouter';
import { SplitHeadline } from '../components/SplitHeadline';
import { Bike, Footprints, TrainFront } from 'lucide-react';
import {
  WALK_SCORES,
  WALK_SCORE_SOURCE_URL,
  WALK_SCORES_CHECKED,
} from '../data/walkScores';

const SCORE_ICONS = [Footprints, TrainFront, Bike];

export function Neighborhood() {
  return (
    <>
      <Seo path="/neighborhood" />
      <div>
        <PageHero
          image="/images/image-081-20170926-1450-wmbiod.jpg"
          alt="Panoramic Chicago downtown skyline view from Exhibit On Superior in River North"
          titleScript="Get Out and Explore"
          title="The Best of River North"
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

        {/* Walk / Transit / Bike Scores — data from src/data/walkScores.ts */}
        <section className="py-12 px-4 bg-dark-section">
          <div className="container mx-auto max-w-4xl text-center">
            <SplitHeadline script="By the Numbers" caps="Walk, Transit & Bike Scores" dark className="mb-8" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {WALK_SCORES.map((metric, i) => {
                const Icon = SCORE_ICONS[i];
                return (
                  <div key={metric.name} className="border border-white/20 p-6">
                    <Icon aria-hidden="true" className="w-8 h-8 text-primary mx-auto mb-3" />
                    <p className="text-4xl text-white mb-1">
                      {metric.score}
                      <span className="text-lg text-white/60">/100</span>
                    </p>
                    <p className="text-sm uppercase tracking-wider text-white/80 mb-1">{metric.name}</p>
                    <p className="text-sm text-primary">{metric.label}</p>
                  </div>
                );
              })}
            </div>
            <p className="mt-6 text-xs text-white/50">
              Source:{' '}
              <a
                href={WALK_SCORE_SOURCE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white/80"
              >
                Walk Score
              </a>{' '}
              &mdash; checked {WALK_SCORES_CHECKED}
            </p>
          </div>
        </section>

        <section className="py-12 px-4 bg-muted">
          <div className="container mx-auto max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <SplitHeadline script="Embrace the Energy" caps="Urban Living Perfected" align="left" className="mb-6" />
                <p className="text-lg leading-relaxed mb-6">
                  Feel the pulse of Chicago and turn up the volume on city living; where the skyline is your nightlight and the hum of the city is your soundtrack.
                </p>
                <p className="text-lg leading-relaxed mb-6">
                  There’s a reason River North is one of Chicago’s most coveted neighborhoods and at Exhibit on Superior, you’re right in the heart of it. From its vibrant art scene and cutting-edge dining to stylish nightlife and chic cafés, River North delivers nonstop energy with just the right amount of culture and calm.
                </p>
                <p className="text-lg leading-relaxed">
                  Also enjoy quick access to nearby hotspots like Fulton Market, Old Town, and the West Loop. Don't miss out on the action — see what's available today.
                </p>
                <div className="mt-8">
                  <Link href="/available-units" className="btn-gold-outline bg-primary text-white border-primary hover:bg-primary/90 inline-block">
                    View Available Units
                  </Link>
                </div>
              </div>
              <SmartImg
                src="/images/image-082-bt7b3562-adimkf.jpg"
                alt="Street view of the city near Exhibit On Superior in Chicago, Illinois"
                loading="eager"
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </section>

        {/* River North Living Guide — every named place verified via maps */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-5xl">
            <SplitHeadline script="Your Daily Orbit" caps="River North Living Guide" className="mb-4" />
            <p className="text-center text-lg leading-relaxed max-w-3xl mx-auto mb-10">
              Everything below is within roughly half a mile of your front door at 165 W Superior
              St &mdash; close enough that most days never need a car.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="border border-border p-6">
                <h3 className="text-lg uppercase tracking-wider mb-3">Groceries</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>Whole Foods Market &mdash; 3 W Chicago Ave (~0.3 mi)</li>
                  <li>Jewel-Osco &mdash; 550 N State St (~0.3 mi)</li>
                  <li>Trader Joe&rsquo;s &mdash; 44 E Ontario St (~0.4 mi)</li>
                  <li>Eataly &mdash; 43 E Ohio St (~0.4 mi)</li>
                </ul>
              </div>
              <div className="border border-border p-6">
                <h3 className="text-lg uppercase tracking-wider mb-3">Transit</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>CTA Brown/Purple Line &mdash; Chicago &amp; Franklin (~2 blocks)</li>
                  <li>CTA Red Line &mdash; Chicago &amp; State (~0.3 mi)</li>
                  <li>#66 Chicago Ave bus &mdash; one block north</li>
                </ul>
                <p className="mt-3 text-sm">
                  <Link href="/parking-transportation" className="text-primary underline">
                    Full parking &amp; transportation guide &rarr;
                  </Link>
                </p>
              </div>
              <div className="border border-border p-6">
                <h3 className="text-lg uppercase tracking-wider mb-3">Fitness</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>CycleBar, Club Pilates, Train Moment &mdash; in the building</li>
                  <li>East Bank Club &mdash; 500 N Kingsbury St (~0.5 mi)</li>
                  <li>Equinox Gold Coast &mdash; 900 N Michigan Ave (~0.6 mi)</li>
                </ul>
              </div>
              <div className="border border-border p-6">
                <h3 className="text-lg uppercase tracking-wider mb-3">Parks & Dogs</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>Washington Square Park &mdash; 901 N Clark St (~0.3 mi)</li>
                  <li>A. Montgomery Ward Park &mdash; 630 N Kingsbury St (~0.5 mi)</li>
                  <li>Ohio Place Dog Park &mdash; 360 W Ohio St (~0.3 mi)</li>
                  <li>Larrabee Dog Park &mdash; 652 N Larrabee St (~0.5 mi)</li>
                </ul>
              </div>
              <div className="border border-border p-6">
                <h3 className="text-lg uppercase tracking-wider mb-3">Healthcare</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>Northwestern Memorial Hospital &mdash; 251 E Huron St (~0.6 mi)</li>
                  <li>Northwestern Medicine Arkes Pavilion &mdash; 676 N St Clair St (~0.6 mi)</li>
                </ul>
              </div>
              <div className="border border-border p-6">
                <h3 className="text-lg uppercase tracking-wider mb-3">Work & Entertainment</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>THE MART (Merchandise Mart) &mdash; ~0.5 mi</li>
                  <li>The Loop &mdash; ~1 mi south, one Brown Line stop</li>
                  <li>River North gallery district, rooftop bars, and chef-driven dining &mdash; steps away</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-dark-section">
          <div className="container mx-auto max-w-3xl text-center">
            <SplitHeadline script="Embrace Unbounded City Living" caps="At Exhibit On Superior" dark className="mb-6" />
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
