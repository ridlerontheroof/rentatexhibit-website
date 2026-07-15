import { PageHero } from '../components/PageHero';
import { Link } from 'wouter';
import { Helmet } from 'react-helmet-async';

export function VirtualTour() {
  return (
    <>
      <Helmet>
        <title>Virtual Tours | Exhibit On Superior Apartments Chicago</title>
        <meta name="description" content="Take a virtual tour of Exhibit On Superior apartments and amenities in River North Chicago with video and Matterport tour embeds." />
      </Helmet>
      <div>
        <PageHero
          image="/images/image-074-game-area-with-arcade-games-and-wall-scrabble-ej.jpg"
          alt="Virtual Tour | Exhibit On Superior in Chicago, Illinois"
          title="See Yourself Here"
          subtitle="Virtual Tour"
        />

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

            {/* Video Tours */}
            <div className="mb-12">
              <h3 className="text-2xl uppercase tracking-wider mb-6 text-center">Life at Exhibit On Superior</h3>
              <div className="aspect-video bg-black border border-border">
                <iframe
                  src="https://player.vimeo.com/video/968009600?rel=0"
                  className="w-full h-full"
                  allowFullScreen
                  title="Life at Exhibit On Superior"
                />
              </div>
            </div>

            {/* Matterport Embeds */}
            <div className="mb-12">
              <h3 className="text-2xl uppercase tracking-wider mb-6 text-center">Exhibit 2104</h3>
              <div className="aspect-video bg-black border border-border">
                <iframe
                  src="https://my.matterport.com/show/?m=773kQcHxLnz"
                  className="w-full h-full"
                  allowFullScreen
                  allow="xr-spatial-tracking"
                  title="Virtual Tour of Exhibit 2104"
                />
              </div>
            </div>

            <div className="mb-12">
              <h3 className="text-2xl uppercase tracking-wider mb-6 text-center">Exhibit 605</h3>
              <div className="aspect-video bg-black border border-border">
                <iframe
                  src="https://my.matterport.com/show/?m=kthJKtuPTJ4"
                  className="w-full h-full"
                  allowFullScreen
                  allow="xr-spatial-tracking"
                  title="Virtual Tour of Exhibit 605"
                />
              </div>
            </div>

            <div className="mb-12">
              <h3 className="text-2xl uppercase tracking-wider mb-6 text-center">Amenities at Exhibit On Superior</h3>
              <div className="aspect-video bg-black border border-border">
                <iframe
                  src="https://my.matterport.com/show/?m=CiWCwCJuZ9c"
                  className="w-full h-full"
                  allowFullScreen
                  allow="xr-spatial-tracking"
                  title="Virtual Tour of Amenities"
                />
              </div>
            </div>

            <div className="text-center mt-16">
              <h2 className="section-title mb-6">Embrace Unbounded City Living At Exhibit On Superior</h2>
              <Link href="/contact-us" className="btn-gold-outline bg-primary text-white border-primary hover:bg-primary/90 inline-block">
                Contact Us
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
