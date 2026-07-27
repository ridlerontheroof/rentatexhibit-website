import { PageHero } from '../components/PageHero';
import { Link } from 'wouter';
import { Seo } from '../components/Seo';
import { QuickAnswer } from '../components/QuickAnswer';
import { FaqSection } from '../components/FaqSection';
import { SplitHeadline } from '../components/SplitHeadline';
import { EmbedFacade } from '../components/EmbedFacade';
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
                Take a virtual tour of Exhibit On Superior in Chicago, Illinois. Below you&rsquo;ll
                find the community video tour plus {matterportTours.length} interactive 3D
                Matterport walkthroughs covering apartment homes and amenity spaces in the
                34-story, 298-residence tower — move room to room at your own pace and see the
                driftwood plank floors, quartz countertops, and floor-to-ceiling skyline views
                exactly as they are. See more of our amenities and in-home features by visiting us
                in person, or by heading to our Photo Gallery page for a more detailed look at our
                community. Reach out to our friendly leasing staff to schedule your tour today.
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
              <h2 className="text-2xl uppercase tracking-wider mb-6 text-center">{lifeAtExhibitVideo.name}</h2>
              <div className="aspect-video bg-black border border-border">
                <EmbedFacade
                  poster={lifeAtExhibitVideo.poster}
                  posterAlt={`Preview of the ${lifeAtExhibitVideo.name} video`}
                  buttonLabel={`Play video: ${lifeAtExhibitVideo.name}`}
                  actionText="Play video"
                  embedUrl={lifeAtExhibitVideo.embedUrl}
                >
                  <iframe
                    src={`${lifeAtExhibitVideo.embedUrl}&autoplay=1`}
                    width={1280}
                    height={720}
                    className="w-full h-full"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    title={lifeAtExhibitVideo.name}
                  />
                </EmbedFacade>
              </div>
            </div>

            {/* Matterport Embeds — rendered from the same shared data that
                feeds the page's JSON-LD (virtualToursJsonLd), so the visible
                headings and the schema can never drift. */}
            {matterportTours.map((tour) => (
              <div key={tour.url} className="mb-12">
                <h2 className="text-2xl uppercase tracking-wider mb-6 text-center">{tour.name}</h2>
                <div className="aspect-video bg-black border border-border relative">
                  <EmbedFacade
                    poster={tour.poster}
                    posterAlt={`Preview of the ${tour.name} 3D tour`}
                    buttonLabel={`Explore in 3D: ${tour.name}`}
                    actionText="Explore in 3D"
                    embedUrl={tour.url}
                  >
                    <iframe
                      src={`${tour.url}&play=1`}
                      width={1280}
                      height={720}
                      className="w-full h-full"
                      allowFullScreen
                      allow="xr-spatial-tracking"
                      title={`Virtual Tour of ${tour.name}`}
                    />
                  </EmbedFacade>
                </div>
              </div>
            ))}

            {/* How to use these tours */}
            <div className="mt-16 max-w-3xl mx-auto">
              <h2 className="text-2xl uppercase tracking-wider mb-6 text-center">How To Use These Tours</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  These virtual tours let you preview Exhibit On Superior remotely. The video walks
                  you through life in the community, while the interactive Matterport tours let you
                  move room to room through apartment homes and the amenity spaces at 165 W Superior
                  St. Together they&apos;re the next best thing to visiting in person — explore layouts,
                  finishes, and views on your own schedule.
                </p>
                <p>
                  For a closer look at interiors and amenity spaces, visit the{' '}
                  <Link href="/photo-gallery" className="text-primary underline underline-offset-4 hover:text-primary/80">
                    Photo Gallery
                  </Link>{' '}
                  page. When you&apos;re ready, browse current homes with live pricing on the{' '}
                  <Link href="/available-units" className="text-primary underline underline-offset-4 hover:text-primary/80">
                    Available Units
                  </Link>{' '}
                  page, then{' '}
                  <Link href="/schedule-a-tour" className="text-primary underline underline-offset-4 hover:text-primary/80">
                    schedule a tour
                  </Link>{' '}
                  to see it in person.
                </p>
              </div>
            </div>

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
