import { Link } from 'wouter';
import { ArrowRight, MapPin, Phone, Mail } from 'lucide-react';

export function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-[600px] lg:h-[700px] overflow-hidden">
        <img
          src="/images/assets/images/image-002-gettyimages-1286580777-nvdupq.jpg"
          alt="Apartments at Exhibit On Superior in Chicago, Illinois"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-5xl md:text-7xl font-light uppercase tracking-[15px] mb-6">
              Exhibit On Superior
            </h1>
            <p className="text-xl md:text-2xl mb-8 tracking-wide">
              Luxury Living in the Heart of River North
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/schedule-a-tour" className="btn-gold-outline bg-primary text-white border-primary hover:bg-primary/90">
                Schedule a Tour
              </Link>
              <Link href="/floor-plans" className="btn-gold-outline">
                View Floor Plans
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Welcome Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <span className="eyebrow">Welcome Home</span>
          <h2 className="section-title">Modern Living Redefined</h2>
          <p className="text-lg leading-relaxed mb-8">
            Exhibit on Superior brings together the best of urban luxury and contemporary design. Located in Chicago's vibrant River North neighborhood, our apartments offer stunning skyline views, world-class amenities, and a lifestyle that celebrates art, culture, and connection.
          </p>
          <p className="text-lg leading-relaxed">
            With studio, one-bedroom, and two-bedroom floor plans featuring high-end finishes, floor-to-ceiling windows, and state-of-the-art appliances, every detail has been crafted for those who demand excellence.
          </p>
        </div>
      </section>

      {/* Featured Amenities Grid */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <span className="eyebrow">Lifestyle Amenities</span>
          <h2 className="section-title mb-12">Designed for How You Live</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="relative h-[350px] overflow-hidden group">
              <img
                src="/images/assets/images/image-009-34-southeast-levwhc.jpg"
                alt="City view at Exhibit On Superior in Chicago, Illinois"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 flex items-end p-6">
                <h3 className="text-white text-2xl uppercase tracking-wider">Panoramic Views</h3>
              </div>
            </div>

            <div className="relative h-[350px] overflow-hidden group">
              <img
                src="/images/assets/images/image-010-full-floor-amenity-deck-overlooking-the-city-and.jpg"
                alt="Well-furnished modern apartment at Exhibit On Superior in Chicago, Illinois"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 flex items-end p-6">
                <h3 className="text-white text-2xl uppercase tracking-wider">Rooftop Deck</h3>
              </div>
            </div>

            <div className="relative h-[350px] overflow-hidden group">
              <img
                src="/images/assets/images/image-011-20170808-0713-n8k48b.jpg"
                alt="Picturesque swimming pool at Exhibit On Superior in Chicago, Illinois"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 flex items-end p-6">
                <h3 className="text-white text-2xl uppercase tracking-wider">Outdoor Pool</h3>
              </div>
            </div>

            <div className="relative h-[350px] overflow-hidden group">
              <img
                src="/images/assets/images/image-012-012417-6415-hgfghu.jpg"
                alt="Fitness center at Exhibit On Superior in Chicago, Illinois"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 flex items-end p-6">
                <h3 className="text-white text-2xl uppercase tracking-wider">Fitness Center</h3>
              </div>
            </div>

            <div className="relative h-[350px] overflow-hidden group">
              <img
                src="/images/assets/images/image-017-012417-6521-i8yuom.jpg"
                alt="Resident lounge at Exhibit On Superior in Chicago, Illinois"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 flex items-end p-6">
                <h3 className="text-white text-2xl uppercase tracking-wider">Resident Lounge</h3>
              </div>
            </div>

            <div className="relative h-[350px] overflow-hidden group">
              <img
                src="/images/assets/images/image-020-dsc00806-yr6rhk.jpg"
                alt="Music studio at Exhibit On Superior in Chicago, Illinois"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 flex items-end p-6">
                <h3 className="text-white text-2xl uppercase tracking-wider">Music Studio</h3>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link href="/amenities" className="btn-gold-outline inline-flex items-center gap-2">
              Explore All Amenities
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
              <span className="eyebrow">Prime Location</span>
              <h2 className="section-title text-white text-left mb-6">River North at Your Doorstep</h2>
              <p className="text-lg leading-relaxed mb-6">
                Exhibit on Superior is perfectly positioned in one of Chicago's most dynamic neighborhoods. Steps from world-renowned restaurants, galleries, nightlife, and the Magnificent Mile, you're at the center of it all.
              </p>
              <p className="text-lg leading-relaxed mb-8">
                Enjoy easy access to public transit, lakefront trails, and the cultural richness that makes Chicago an unmatched place to call home.
              </p>
              <Link href="/neighborhood" className="btn-gold-outline inline-flex items-center gap-2">
                Discover the Neighborhood
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <img
                src="/images/assets/images/image-023-gettyimages-639122762-qpfmh0.jpg"
                alt="Resident listening to music near the water by Exhibit On Superior in Chicago, Illinois"
                className="w-full h-[250px] object-cover"
              />
              <img
                src="/images/assets/images/image-024-gettyimages-1464613356-q7z583.jpg"
                alt="A concert nearby Exhibit On Superior in Chicago, Illinois"
                className="w-full h-[250px] object-cover"
              />
              <img
                src="/images/assets/images/image-025-gettyimages-1694195877-kb4dln.jpg"
                alt="Resident carrying shopping bags near Exhibit On Superior in Chicago, Illinois"
                className="w-full h-[250px] object-cover"
              />
              <img
                src="/images/assets/images/image-026-gettyimages-2169911981-his7ly.jpg"
                alt="Wine bar near Exhibit On Superior in Chicago, Illinois"
                className="w-full h-[250px] object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="section-title mb-6">Ready to Experience Exhibit?</h2>
          <p className="text-lg leading-relaxed mb-8">
            Schedule a personal tour and discover why Exhibit on Superior is Chicago's premier luxury apartment community.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary" />
              <a href="tel:312-450-0635" className="text-lg hover:text-primary transition-colors">
                312-450-0635
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              <a href="mailto:exhibit@highlandptrs.com" className="text-lg hover:text-primary transition-colors">
                exhibit@highlandptrs.com
              </a>
            </div>
          </div>
          <div className="mt-8">
            <Link href="/schedule-a-tour" className="btn-gold-outline bg-primary text-white border-primary hover:bg-primary/90 inline-block">
              Schedule Your Tour Today
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
