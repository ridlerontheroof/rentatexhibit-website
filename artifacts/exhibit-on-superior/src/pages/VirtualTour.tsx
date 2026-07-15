import { PageHero } from '../components/PageHero';

export function VirtualTour() {
  return (
    <div>
      <PageHero
        image="/images/assets/images/image-074-game-area-with-arcade-games-and-wall-scrabble-ej.jpg"
        alt="Virtual Tour | Exhibit On Superior in Chicago, Illinois"
        title="Virtual Tour"
        subtitle="Experience Exhibit from Anywhere"
      />

      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <span className="eyebrow">Immersive Experience</span>
            <h2 className="section-title mb-6">Explore Our Community</h2>
            <p className="text-lg leading-relaxed">
              Take a 360-degree virtual tour of Exhibit on Superior and explore our stunning apartments, amenities, and common areas from the comfort of your home.
            </p>
          </div>

          {/* Matterport Embed */}
          <div className="aspect-video bg-muted mb-12 border border-border">
            <iframe
              src="https://my.matterport.com/show/?m=example"
              className="w-full h-full"
              allowFullScreen
              allow="xr-spatial-tracking"
              title="Virtual Tour of Exhibit On Superior"
            />
          </div>

          {/* Video Tours */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div>
              <h3 className="text-2xl uppercase tracking-wider mb-4">Amenity Walkthrough</h3>
              <div className="aspect-video bg-muted border border-border">
                <iframe
                  src="https://player.vimeo.com/video/example1"
                  className="w-full h-full"
                  allowFullScreen
                  title="Amenity Walkthrough"
                />
              </div>
            </div>
            <div>
              <h3 className="text-2xl uppercase tracking-wider mb-4">Model Apartment Tour</h3>
              <div className="aspect-video bg-muted border border-border">
                <iframe
                  src="https://player.vimeo.com/video/example2"
                  className="w-full h-full"
                  allowFullScreen
                  title="Model Apartment Tour"
                />
              </div>
            </div>
          </div>

          {/* SightMap Interactive Floor Plans */}
          <div className="mb-12">
            <h3 className="text-2xl uppercase tracking-wider mb-6 text-center">Interactive Floor Plans</h3>
            <div className="aspect-video bg-muted border border-border">
              <iframe
                src="https://sightmap.com/embed/example"
                className="w-full h-full"
                allowFullScreen
                title="Interactive Floor Plans"
              />
            </div>
          </div>

          <div className="text-center">
            <p className="text-lg mb-6">
              Ready to see it in person? Schedule a tour with our leasing team.
            </p>
            <a href="/schedule-a-tour" className="btn-gold-outline bg-primary text-white border-primary hover:bg-primary/90 inline-block">
              Schedule Your Tour
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
