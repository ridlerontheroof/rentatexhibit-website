import { PageHero } from '../components/PageHero';
import { Seo } from '../components/Seo';
import { QuickAnswer } from '../components/QuickAnswer';
import { FaqSection } from '../components/FaqSection';
import { Link } from 'wouter';

export function Amenities() {
  return (
    <>
      <Seo path="/amenities" />
      <div>
        <PageHero
          image="/images/image-075-20170601-0036-z1fw1i.jpg"
          alt="Amenities | Exhibit On Superior in Chicago, Illinois"
          title="Endless opportunities Your urban playground"
          subtitle="Amenities"
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
                <img
                  src="/images/image-009-34-southeast-levwhc.jpg"
                  alt="Views for days"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 flex items-end p-6">
                  <h3 className="text-white text-2xl uppercase tracking-wider">Views for days</h3>
                </div>
              </div>
              <div className="relative h-[350px] overflow-hidden group">
                <img
                  src="/images/image-010-full-floor-amenity-deck-overlooking-the-city-and.jpg"
                  alt="Cozy comfort"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 flex items-end p-6">
                  <h3 className="text-white text-2xl uppercase tracking-wider">Cozy comfort</h3>
                </div>
              </div>
              <div className="relative h-[350px] overflow-hidden group">
                <img
                  src="/images/image-011-20170808-0713-n8k48b.jpg"
                  alt="Sun Soaked Vibes"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 flex items-end p-6">
                  <h3 className="text-white text-2xl uppercase tracking-wider">Sun Soaked Vibes</h3>
                </div>
              </div>
              <div className="relative h-[350px] overflow-hidden group">
                <img
                  src="/images/image-012-012417-6415-hgfghu.jpg"
                  alt="Sweat Session"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 flex items-end p-6">
                  <h3 className="text-white text-2xl uppercase tracking-wider">Sweat Session</h3>
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
                <h3 className="text-2xl uppercase tracking-wider mb-6">Apartment Features</h3>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Dramatic Floor-to-Ceiling Windows</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Private Balconies</span></li>
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
                <h3 className="text-2xl uppercase tracking-wider mb-6">Community Amenities</h3>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Full Floor Amenity Deck Overlooking The City And Private Park</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Fitness Center With Two Private Training Rooms</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Cardio Equipment And Spin Bikes</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Boxing Simulator</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Free Weights</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Tech Lounge With Charging Station And Kitchen</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Lounge With Fireplace And Big Screen TV</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Game Area With Arcade Games And Wall Scrabble</span></li>
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

        {/* Discover Beauty Section */}
        <section className="py-16 px-4 bg-dark-section">
          <div className="container mx-auto max-w-4xl text-center text-white">
            <h2 className="section-title text-white mb-6">Discover the Beauty Of Being at Home</h2>
            <p className="text-lg leading-relaxed mb-6">
              Home is more than just where you live, it’s where you thrive. Whether you're fueling up, working out, or winding down, everything you need to feel your best is just steps away.Start your day with an energizing workout at CycleBar or Club Pilates, then grab your favorite coffee and a sweet treat from Goddess and the Baker, all within the building. Reset and recharge with a session at LaPerior Foot Spa or challenge yourself at Train Moment for a next level fitness experience.
            </p>
            <p className="text-lg leading-relaxed mb-12">
              From wellness to indulgence, our on-site retail and lifestyle options bring everyday convenience right to your doorstep. Live well without the hassle, without the commute, and always on your terms. Because convenience isn’t an extra, it’s a way of life at Exhibit on Superior.
            </p>
            
            <h2 className="section-title text-white mb-6">Embrace Unbounded City Living At Exhibit On Superior</h2>
            <Link href="/contact-us" className="btn-gold-outline inline-block">
              Contact Us
            </Link>
          </div>
        </section>
      </div>
        <FaqSection path="/amenities" />
    </>
  );
}
