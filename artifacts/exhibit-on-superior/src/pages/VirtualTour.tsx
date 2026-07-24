import { PageHero } from '../components/PageHero';
import { Link } from 'wouter';
import { Seo } from '../components/Seo';
import { QuickAnswer } from '../components/QuickAnswer';
import { FaqSection } from '../components/FaqSection';
import { SplitHeadline } from '../components/SplitHeadline';
import {
  lifeAtExhibitVideo,
  matterportTours,
  virtualToursJsonLd,
  virtualTourVideoJsonLd,
} from '../data/virtualTours';

export function VirtualTour() {
  return (
    <>
      <Seo path="/virtual-tour" extraJsonLd={[virtualToursJsonLd(), virtualTourVideoJsonLd()]} />
      <div>
        <PageHero
          image="/images/image-074-game-area-with-arcade-games-and-wall-scrabble-ej.jpg"
          alt="Virtual Tour | Exhibit On Superior in Chicago, Illinois"
          titleScript="See Yourself"
          title="Here"
          subtitle="Virtual Tour"
        />

        <QuickAnswer path="/virtual-tour" />

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <p className="text-lg leading-relaxed mb-6">
                Take a virtual tour of Exhibit On Superior in Chicago, Illinois. Our virtual tour is the next best thing to seeing it in person. See more of our amenities and in-home features by visiting us in person, or by heading to our Photo Gallery page for a more detailed look at our community. Reach out to our friendly leasing staff to schedule your tour today.
              </p>
              <div className="flex justify-center gap-4">
                <Link href="/photo-gallery" className="btn-gold-outline inline-block">
                  Photo Gallery
                </Link>
                <Link href="/contact-us" className="btn-gold-outline bg-primary text-white border-primary hover:bg-primary/90 inline-block">
                  Contact Us
                </Link>
              </div>
            </div>

            {/* Video Tours — rendered from the same shared data that feeds
                the page's VideoObject JSON-LD (virtualTourVideoJsonLd), so
                the visible embed and the schema can never drift. */}
            <div className="mb-12">
              <h3 className="text-2xl uppercase tracking-wider mb-6 text-center">{lifeAtExhibitVideo.name}</h3>
              <div className="aspect-video bg-black border border-border">
                <iframe
                  src={lifeAtExhibitVideo.embedUrl}
                  width={1280}
                  height={720}
                  className="w-full h-full"
                  allowFullScreen
                  title={lifeAtExhibitVideo.name}
                />
              </div>
            </div>

            {/* Matterport Embeds — rendered from the same shared data that
                feeds the page's JSON-LD (virtualToursJsonLd), so the visible
                headings and the schema can never drift. */}
            {matterportTours.map((tour) => (
              <div key={tour.url} className="mb-12">
                <h3 className="text-2xl uppercase tracking-wider mb-6 text-center">{tour.name}</h3>
                <div className="aspect-video bg-black border border-border">
                  <iframe
                    src={tour.url}
                    width={1280}
                    height={720}
                    className="w-full h-full"
                    allowFullScreen
                    allow="xr-spatial-tracking"
                    title={`Virtual Tour of ${tour.name}`}
                  />
                </div>
              </div>
            ))}

            <div className="text-center mt-16">
              <SplitHeadline script="Embrace Unbounded City Living" caps="At Exhibit On Superior" className="mb-6" />
              <Link href="/contact-us" className="btn-gold-outline bg-primary text-white border-primary hover:bg-primary/90 inline-block">
                Contact Us
              </Link>
            </div>
          </div>
        </section>
      </div>
        <FaqSection path="/virtual-tour" />
    </>
  );
}
