import { Link } from 'wouter';
import { ArrowRight, MapPin, Phone } from 'lucide-react';
import { Seo } from '../components/Seo';
import { QuickAnswer } from '../components/QuickAnswer';
import { FaqSection } from '../components/FaqSection';
import { HeroSlider, type HeroSlide } from '../components/HeroSlider';
import { SmartImg } from '../components/SmartImg';

// Home hero carousel — same photos and order as the source rentatexhibit.com hero.
const HERO_SLIDES: HeroSlide[] = [
  { src: '/images/image-013-20170808-0861-n4esrp.jpg', alt: 'Large lap pool at Exhibit On Superior in Chicago, Illinois' },
  { src: '/images/image-014-exhibit-living-room-n5xrna.jpg', alt: 'Beautiful living room with large windows at Exhibit On Superior in Chicago, Illinois' },
  { src: '/images/image-015-work-spaces-with-blazing-fast-wifi-access-lzfatq.jpg', alt: 'Large meeting table in the clubhouse at Exhibit On Superior in Chicago, Illinois' },
  { src: '/images/image-016-012417-6396-e1vomm.jpg', alt: 'Expansive fitness center at Exhibit On Superior in Chicago, Illinois' },
  { src: '/images/image-017-012417-6521-i8yuom.jpg', alt: 'Resident lounge at Exhibit On Superior in Chicago, Illinois' },
  { src: '/images/image-018-lounge-with-fireplace-and-big-screen-tv-ymvrom.jpg', alt: 'Resident lounge with large TV and fireplace at Exhibit On Superior in Chicago, Illinois' },
  { src: '/images/image-019-game-area-with-arcade-games-and-wall-scrabble-oz.jpg', alt: 'Chess in the resident lounge with great views at Exhibit On Superior in Chicago, Illinois' },
  { src: '/images/image-020-dsc00806-yr6rhk.jpg', alt: 'Music studio at Exhibit On Superior in Chicago, Illinois' },
  { src: '/images/image-021-20170808-0852-sw1ncm.jpg', alt: 'Outdoor deck with firepit at Exhibit On Superior in Chicago, Illinois' },
];

export function Home() {
  return (
    <>
      <Seo path="/" />
      <div>
        {/* Hero Section */}
        <HeroSlider slides={HERO_SLIDES}>
          <div className="text-center text-white px-4">
            <h1 className="text-5xl md:text-7xl font-light uppercase tracking-[15px] mb-6">
              Urban Living Never Looked So Good
            </h1>
            <p className="text-xl md:text-2xl mb-8 tracking-wide">
              Sleek Design for Modern Living Chicago Apartments
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/schedule-a-tour" className="btn-gold-outline bg-black/50! text-white border-primary hover:bg-black/70!">
                Schedule a Tour
              </Link>
              <Link href="/floor-plans" className="btn-gold-outline bg-black/50! text-white hover:bg-black/70!">
                View Floor Plans
              </Link>
            </div>
          </div>
        </HeroSlider>

        <QuickAnswer path="/" />

        {/* Welcome Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="section-title">Less clutter. Less "stuff" More time. More Freedom</h2>
            <p className="text-lg leading-relaxed mb-6">
              Discover the perfect fit for your on-the-go lifestyle at Exhibit on Superior, where modern apartments in Chicago’s vibrant River North neighborhood put everything within reach. From fitness to food to relaxation, CycleBar, Club Pilates, Goddess and the Baker, Train Moment, and LaPerior Foot Spa are all right here in the building. This is your social hub, entertainment zone, wellness retreat, and relaxing oasis all rolled into one, with endless amenities at every turn. At Exhibit on Superior, every day is anything but ordinary.
            </p>
            <p className="text-lg leading-relaxed mb-8">
              Exhibit on Superior is not one-size fits all. It’s designed to be a true original, every bit as unique as you are. Living here is all about creating a complete lifestyle that lets you be you while efficiently using your time and space how you want. Our sleek, contemporary homes are meant for relaxed lounging, formal entertaining, and everything in between. Choose from stylishly appointed studio, one, two, and three-bedroom apartments designed with comfort and brimming with style.
            </p>
            <p className="text-lg leading-relaxed mb-8">
              Want to learn more? Start the conversation today with one of our leasing agents.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/amenities" className="btn-gold-outline">
                View our amenities
              </Link>
              <Link href="/floor-plans" className="btn-gold-outline bg-primary text-white border-primary hover:bg-primary/90">
                View floor plans
              </Link>
            </div>
          </div>
        </section>

        {/* Featured Amenities Grid */}
        <section className="py-20 bg-muted">
          <div className="container mx-auto px-4">
            <h2 className="section-title mb-12 text-center">Get A Glimpse Of the Exhibit On Superior Lifestyle</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="relative h-[350px] overflow-hidden group">
                <SmartImg
                  src="/images/image-009-34-southeast-levwhc.jpg"
                  alt="City view at Exhibit On Superior in Chicago, Illinois"
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 flex items-end p-6">
                  <h3 className="text-white text-2xl uppercase tracking-wider">Views for days</h3>
                </div>
              </div>

              <div className="relative h-[350px] overflow-hidden group">
                <SmartImg
                  src="/images/image-010-full-floor-amenity-deck-overlooking-the-city-and.jpg"
                  alt="Well-furnished modern apartment at Exhibit On Superior in Chicago, Illinois"
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 flex items-end p-6">
                  <h3 className="text-white text-2xl uppercase tracking-wider">Cozy comfort</h3>
                </div>
              </div>

              <div className="relative h-[350px] overflow-hidden group">
                <SmartImg
                  src="/images/image-011-20170808-0713-n8k48b.jpg"
                  alt="Picturesque swimming pool at Exhibit On Superior in Chicago, Illinois"
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 flex items-end p-6">
                  <h3 className="text-white text-2xl uppercase tracking-wider">Sun soaked vibes</h3>
                </div>
              </div>

              <div className="relative h-[350px] overflow-hidden group">
                <SmartImg
                  src="/images/image-012-012417-6415-hgfghu.jpg"
                  alt="Fitness center at Exhibit On Superior in Chicago, Illinois"
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 flex items-end p-6">
                  <h3 className="text-white text-2xl uppercase tracking-wider">Sweat Session</h3>
                </div>
              </div>
            </div>

            <div className="text-center mt-12">
              <Link href="/photo-gallery" className="btn-gold-outline inline-flex items-center gap-2">
                Photo Gallery
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Location Highlight */}
        <section className="py-20 bg-dark-section">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="section-title text-white text-left mb-6">Urban Bliss Just Outside Your Door</h2>
                <p className="text-lg leading-relaxed mb-6 text-white">
                  Make the most of the vibrant city with a home base that puts everything at your fingertips. From cozy cafés and trendy restaurants to sprawling parks and convenient shops, you’ll find it all just steps away. Take a quick trip to Target or spend the afternoon along the Chicago River.
                </p>
                <p className="text-lg leading-relaxed mb-8 text-white">
                  Located in River North, our welcoming neighborhood offers the perfect blend of energy and ease with West Loop, Old Town, and Fulton Market just minutes away for even more dining, shopping, and cultural experiences. When it’s time to head out, nearby access to major roadways and public transit makes getting around the city a breeze.
                </p>
                <p className="text-lg leading-relaxed mb-8 text-white">
                  Exhibit on Superior is your urban hub for fun and convenience in the heart of Chicago.
                </p>
                <Link href="/neighborhood" className="btn-gold-outline inline-flex items-center gap-2">
                  Explore The Neighborhood
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <SmartImg
                  src="/images/image-023-gettyimages-639122762-qpfmh0.jpg"
                  alt="Resident listening to music near the water by Exhibit On Superior in Chicago, Illinois"
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="w-full h-[250px] object-cover"
                />
                <SmartImg
                  src="/images/image-024-gettyimages-1464613356-q7z583.jpg"
                  alt="A concert nearby Exhibit On Superior in Chicago, Illinois"
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="w-full h-[250px] object-cover"
                />
                <SmartImg
                  src="/images/image-025-gettyimages-1694195877-kb4dln.jpg"
                  alt="Resident carrying shopping bags near Exhibit On Superior in Chicago, Illinois"
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="w-full h-[250px] object-cover"
                />
                <SmartImg
                  src="/images/image-026-gettyimages-2169911981-his7ly.jpg"
                  alt="Wine bar near Exhibit On Superior in Chicago, Illinois"
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="w-full h-[250px] object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="section-title mb-6">Embrace Unbounded City Living At Exhibit On Superior</h2>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8">
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" />
                <a href="tel:312-450-0635" className="text-lg hover:text-primary transition-colors">
                  312-450-0635
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                <span className="text-lg">
                  165 W Superior St, Chicago, IL 60654
                </span>
              </div>
            </div>
            <div className="mt-8 flex justify-center gap-4">
              <Link href="/contact-us" className="btn-gold-outline bg-primary text-white border-primary hover:bg-primary/90 inline-block">
                Contact Us
              </Link>
            </div>
          </div>
        </section>

        <FaqSection path="/" />
      </div>
    </>
  );
}
