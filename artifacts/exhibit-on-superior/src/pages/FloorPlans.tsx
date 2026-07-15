import { PageHero } from '../components/PageHero';
import { Link } from 'wouter';
import { Helmet } from 'react-helmet-async';

export function FloorPlans() {
  return (
    <>
      <Helmet>
        <title>Studio, 1, 2 & 3 Bedroom Floor Plans | Exhibit On Superior</title>
        <meta name="description" content="Review studio, one, two, and three-bedroom floor plan content for Exhibit On Superior in River North Chicago, then check current availability through Highland." />
      </Helmet>
      <div>
        <PageHero
          image="/images/image-030-012417-5663-hxwee6.jpg"
          alt="Floor Plans | Exhibit On Superior in Chicago, Illinois"
          title="Smartly Designed Residences Studio, 1, 2 & 3 Bedroom Apartments"
          subtitle="Floor Plans"
        />

        <section className="py-16 px-4 bg-muted">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-center text-3xl uppercase tracking-wider mb-6">Live smart, Live Beautifully Studio, 1, 2 & 3 Bedroom Floor Plans</h2>
            <p className="text-center text-lg leading-relaxed mb-12">
              Choose your perfect floor plan and step up to a trend-forward home that provides the ultimate respite from the hustle and bustle of Chicago. Packed with stylish features and life-enhancing extras, the studio, one, two, and three bedroom apartments at Exhibit On Superior are designed for ultimate modern living. Enjoy a space that's uniquely yours, perfect for both relaxing and entertaining right here at Exhibit.
            </p>
            <div className="text-center mb-12">
              <a href="https://www.highlandptrs.com/chicago-availability?search=exhibit" target="_blank" rel="noopener noreferrer" className="btn-gold-outline bg-primary text-white border-primary hover:bg-primary/90 inline-block">
                Apply Now
              </a>
            </div>

            <div className="aspect-video bg-white border border-border mb-16">
              <iframe
                src="https://sightmap.com/embed/r5v516ejwny"
                className="w-full h-full"
                allowFullScreen
                title="Exhibit On Superior site map"
              />
            </div>
            
            <div className="text-center max-w-4xl mx-auto">
              <h2 className="text-3xl uppercase tracking-wider mb-6">Your Space, Your Style Where creativity and city life collide</h2>
              <p className="text-lg leading-relaxed mb-8">
                Welcome home to your high-rise hideaway to a living space as vibrant as Chicago itself. Our apartments strike the perfect balance of style, comfort, and functionality in the heart of River North. Retreat to your personal sanctuary, where thoughtfully designed bedrooms feature floor-to-ceiling windows that frame stunning city views, ensuring that your private oasis is as beautiful as it is comfortable. Your dream home is just a move away!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                <Link href="/photo-gallery" className="btn-gold-outline inline-block">
                  See More Photos
                </Link>
                <a href="https://www.highlandptrs.com/chicago-availability?search=exhibit" target="_blank" rel="noopener noreferrer" className="btn-gold-outline inline-block">
                  View Available Units
                </a>
              </div>

              <h2 className="section-title mb-6">Embrace Unbounded City Living At Exhibit On Superior</h2>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact-us" className="btn-gold-outline inline-block">
                  Contact Us
                </Link>
                <a href="https://www.highlandptrs.com/chicago-availability?search=exhibit" target="_blank" rel="noopener noreferrer" className="btn-gold-outline bg-primary text-white border-primary hover:bg-primary/90 inline-block">
                  Apply Now
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
