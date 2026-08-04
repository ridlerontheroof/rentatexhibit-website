import { KnowledgeLinks } from '../components/KnowledgeLinks';
import { PageHero } from '../components/PageHero';
import { SmartImg } from '../components/SmartImg';
import { Seo } from '../components/Seo';
import { QuickAnswer } from '../components/QuickAnswer';
import { FaqSection } from '../components/FaqSection';
import { Link } from 'wouter';
import { SplitHeadline } from '../components/SplitHeadline';
import { ADA_COUNTS, ADA_KEY, ADA_DISCLAIMER } from '../data/ada';

export function Amenities() {
  return (
    <>
      <Seo path="/amenities" />
      <div>
        <PageHero
          image="/images/image-075-20170601-0036-z1fw1i.jpg"
          alt="Outdoor lap pool and sundeck with Chicago skyline views at Exhibit On Superior"
          titleScript="Endless Opportunities"
          title="Luxury River North Amenities"
          subtitle="Your urban playground at Exhibit On Superior"
        />

        <QuickAnswer path="/amenities" />

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <p className="text-lg leading-relaxed mb-6">
              At Exhibit on Superior, we want to expand your living space beyond your apartment. So, we’ve created what feels like your own private clubhouse, where every amenity is a masterpiece designed to inspire, energize, and elevate your lifestyle. From sunrise spin sessions to sunset sauna detoxes, our wellness offerings are stacked and ready to match your pace.
            </p>
            <p className="text-lg leading-relaxed mb-6">
              Whether you're soaking in the skyline from our full-floor amenity deck, powering through a workout in the professional-grade fitness center, or relaxing in the cozy tech lounge, each space is crafted to spark creativity, connection, and comfort.
            </p>
            <p className="text-lg leading-relaxed">
              At Exhibit, we believe in living beyond the expected. Let your imagination run wild, follow your whims, and redefine what home can be. Welcome to a life lived outside the box.
            </p>
          </div>
        </section>

        {/* Featured Amenity Images */}
        <section className="py-12 px-4 bg-muted">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <div className="relative h-[350px] overflow-hidden group">
                <SmartImg
                  src="/images/image-009-34-southeast-levwhc.jpg"
                  alt="Rooftop amenity deck with panoramic Chicago skyline views to the southeast"
                  loading="eager"
                  // Eager-but-low: can peek above the fold on tall screens,
                  // but must not outrank the hero (the LCP image) for
                  // Slow-4G bandwidth.
                  fetchPriority="low"
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 flex items-end p-6">
                  <p aria-hidden="true" className="text-white text-2xl uppercase tracking-wider">Views for days</p>
                </div>
              </div>
              <div className="relative h-[350px] overflow-hidden group">
                <SmartImg
                  src="/images/image-010-full-floor-amenity-deck-overlooking-the-city-and.jpg"
                  alt="Full-floor amenity deck lounge area overlooking the city and private park"
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 flex items-end p-6">
                  <p aria-hidden="true" className="text-white text-2xl uppercase tracking-wider">Cozy comfort</p>
                </div>
              </div>
              <div className="relative h-[350px] overflow-hidden group">
                <SmartImg
                  src="/images/image-011-20170808-0713-n8k48b.jpg"
                  alt="Outdoor amenity deck with sun loungers overlooking River North Chicago"
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 flex items-end p-6">
                  <p aria-hidden="true" className="text-white text-2xl uppercase tracking-wider">Sun Soaked Vibes</p>
                </div>
              </div>
              <div className="relative h-[350px] overflow-hidden group">
                <SmartImg
                  src="/images/image-012-012417-6415-hgfghu.jpg"
                  alt="Fitness center with cardio equipment and floor-to-ceiling windows"
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 flex items-end p-6">
                  <p aria-hidden="true" className="text-white text-2xl uppercase tracking-wider">Sweat Session</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features & Amenities Lists */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h2 className="text-2xl uppercase tracking-wider mb-6">Apartment Features</h2>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Dramatic Floor-to-Ceiling Windows</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Private balconies (nearly every home)</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Panoramic Views Of The Chicago Skyline</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Driftwood Plank Floors Throughout</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Energy Saving Stainless-Steel Appliances</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Front Control Gas Range And Oven</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Garbage Disposal</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>In-Home Washer/Dryer</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Modern Kitchen Cabinetry With Decorative Hardware</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Quartz Countertops</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Tiled Backsplash</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Undermount Sinks</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Sleek Modern Fixtures</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Closet Organizers In Select Units</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Double Vanities In Select Units</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Subway Tile Bath Surround</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Wired For 1GB</span></li>
                </ul>
                <Link href="/photo-gallery" className="btn-gold-outline inline-block">
                  View Photo Gallery
                </Link>
              </div>
              
              <div>
                <h2 className="text-2xl uppercase tracking-wider mb-6">Community Amenities</h2>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Full Floor Amenity Deck Overlooking The City And Private Park</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Fitness Center With Two Private Training Rooms</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Cardio Equipment And Spin Bikes</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Boxing Simulator</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Free Weights</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Tech Lounge With Charging Station And Kitchen</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Lounge With Fireplace And Big Screen TV</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Game Area With Arcade Games And Wall Scrabble</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Music Studio Room</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Private Work And Meeting Rooms</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Library Nook</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Private Dining Room And Party Suite</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Reading And Charging Alcoves</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Sauna And Wet Lounge Leading To Outdoor Deck</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>75' Lap Pool</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Outdoor Hot Tub</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Four Grilling Stations</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Four Fire Pits</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Doggie Spa And Lounge</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Gated Outdoor Dog Walk</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Private Park With One Of A Kind Sculpture From Internationally Acclaimed Sculptor Pal Svensson</span></li>
                </ul>
                <Link href="/photo-gallery" className="btn-gold-outline inline-block">
                  View Photo Gallery
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Where everything lives */}
        <section className="py-16 px-4 bg-muted">
          <div className="container mx-auto max-w-4xl">
            <SplitHeadline script="Find Your Way" caps="Where Everything Lives" className="mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-border p-6">
                <h3 className="text-lg uppercase tracking-wider mb-2">The Amenity Floor</h3>
                <p className="leading-relaxed text-muted-foreground">
                  A full floor dedicated to amenities, overlooking the city and the private park:
                  the fitness center with two private training rooms, cardio and spin equipment,
                  the boxing simulator, the sauna and wet lounge leading to the outdoor deck, the
                  75-foot lap pool, and the outdoor hot tub.
                </p>
              </div>
              <div className="bg-white border border-border p-6">
                <h3 className="text-lg uppercase tracking-wider mb-2">Lounge & Work Spaces</h3>
                <p className="leading-relaxed text-muted-foreground">
                  The tech lounge with charging stations and kitchen, the fireplace lounge with
                  big-screen TV, the game area with arcade games and wall Scrabble, the music
                  studio room, private work and meeting rooms, the library nook, and a private
                  dining room and party suite for hosting.
                </p>
              </div>
              <div className="bg-white border border-border p-6">
                <h3 className="text-lg uppercase tracking-wider mb-2">Outdoors</h3>
                <p className="leading-relaxed text-muted-foreground">
                  Four grilling stations and four fire pits on the outdoor deck, the gated outdoor
                  dog walk, and the private park with a one-of-a-kind sculpture by internationally
                  acclaimed sculptor Pal Svensson.
                </p>
              </div>
              <div className="bg-white border border-border p-6">
                <h3 className="text-lg uppercase tracking-wider mb-2">Accessibility</h3>
                <p className="leading-relaxed text-muted-foreground mb-3">
                  Per the building&rsquo;s as-built accessibility matrix, {ADA_COUNTS.total} apartments
                  &mdash; more than 20% of the homes &mdash; carry an ADA designation:{' '}
                  {ADA_COUNTS.a} Type A accessible/adaptable residences (A) and {ADA_COUNTS.ac} Type A
                  units with conduit line (AC). Use the ADA-accessible filter on the{' '}
                  <Link href="/available-units" className="text-primary underline">Available Units &amp; Floor Plans</Link>{' '}
                  page to see the designated floor plans and apartment numbers.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 mb-3">
                  {ADA_KEY.map((k) => (
                    <li key={k.code}>
                      <strong>{k.label}</strong>: {k.description}
                    </li>
                  ))}
                </ul>
                <p className="leading-relaxed text-muted-foreground">
                  {ADA_DISCLAIMER} To arrange a reasonable accommodation, contact the leasing team
                  at{' '}
                  <a href="mailto:exhibit@highlandptrs.com" className="text-primary underline">exhibit@highlandptrs.com</a>{' '}
                  or <a href="tel:312-450-0635" className="text-primary underline">312-450-0635</a>.
                  See also our{' '}
                  <Link href="/accessibility-statement" className="text-primary underline">Accessibility Statement</Link>.
                </p>
              </div>
              <div className="bg-white border border-border p-6">
                <h3 className="text-lg uppercase tracking-wider mb-2">Access & Hours</h3>
                <p className="leading-relaxed text-muted-foreground">
                  The front desk is staffed 24 hours a day. Indoor amenities are open 24/7, and
                  outdoor amenities close during quiet hours (10pm&ndash;6am). Grills and fire pits
                  are available year-round; the pool and hot tub are seasonal &mdash; the pool
                  closes in late September and the hot tub at the first snowfall. The Party Room is
                  reservable through the leasing/management office at $50/hour, and residents may
                  bring up to 2 guests to the pool. See it all on a{' '}
                  <Link href="/available-units" className="text-primary underline">tour</Link>, or
                  explore homes in the{' '}
                  <Link href="/apartment-guide" className="text-primary underline">Apartment Guide</Link>.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Discover Beauty Section */}
        <section className="py-16 px-4 bg-dark-section">
          <div className="container mx-auto max-w-4xl text-center text-white">
            <SplitHeadline script="Discover the Beauty" caps="Of Being at Home" dark className="mb-6" />
            <p className="text-lg leading-relaxed mb-6">
              Home is more than just where you live, it’s where you thrive. Whether you're fueling up, working out, or winding down, everything you need to feel your best is just steps away. Start your day with an energizing workout at CycleBar or Club Pilates, then grab your favorite coffee and a sweet treat from Goddess and the Baker, all within the building. Reset and recharge with a session at LaPerior Foot Spa or challenge yourself at Train Moment for a next level fitness experience.
            </p>
            <p className="text-lg leading-relaxed mb-12">
              From wellness to indulgence, our on-site retail and lifestyle options bring everyday convenience right to your doorstep. Live well without the hassle, without the commute, and always on your terms. Because convenience isn’t an extra, it’s a way of life at Exhibit on Superior.
            </p>
            
            <SplitHeadline script="Embrace Unbounded City Living" caps="At Exhibit On Superior" dark className="mb-6" />
            <Link href="/contact-us" className="btn-gold-outline inline-block">
              Contact Us
            </Link>
          </div>
        </section>
      </div>
        <FaqSection path="/amenities" />

        <KnowledgeLinks
          slugs={[
            'full-amenity-list',
            'is-there-a-pool',
            'amenity-hours',
            'party-room-reservation',
            'work-from-home-spaces',
            'pet-amenities',
          ]}
        />
    </>
  );
}
