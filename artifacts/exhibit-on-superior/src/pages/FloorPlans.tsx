import { PageHero } from '../components/PageHero';
import { Link } from 'wouter';
import { ArrowRight, Maximize, Home, Bath, Layers } from 'lucide-react';

export function FloorPlans() {
  return (
    <div>
      <PageHero
        image="/images/assets/images/image-030-012417-5663-hxwee6.jpg"
        alt="Floor Plans | Exhibit On Superior in Chicago, Illinois"
        title="Floor Plans"
        subtitle="Find Your Perfect Space"
      />

      {/* Intro */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <p className="text-lg leading-relaxed">
            Exhibit on Superior offers studio, one-bedroom, and two-bedroom apartments with modern layouts and luxury finishes. Each residence features floor-to-ceiling windows, quartz countertops, stainless steel appliances, and in-unit washer/dryer.
          </p>
        </div>
      </section>

      {/* Studio Floor Plans */}
      <section id="studio" className="py-16 px-4 bg-muted">
        <div className="container mx-auto">
          <h2 className="section-title mb-12">Studio Apartments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 border border-border">
              <div className="aspect-video bg-muted mb-4 flex items-center justify-center">
                <Home className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-2xl uppercase tracking-wider mb-4">Studio A</h3>
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <Maximize className="w-4 h-4 text-primary" />
                  <span>550 sq ft</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Bath className="w-4 h-4 text-primary" />
                  <span>1 Bathroom</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Layers className="w-4 h-4 text-primary" />
                  <span>Available on floors 3-28</span>
                </div>
              </div>
              <p className="text-sm mb-6">
                Open layout studio with modern kitchen, spacious bathroom, and abundant natural light. Perfect for urban professionals.
              </p>
              <Link href="/contact" className="btn-gold-outline inline-block w-full text-center">
                Check Availability
              </Link>
            </div>

            <div className="bg-white p-6 border border-border">
              <div className="aspect-video bg-muted mb-4 flex items-center justify-center">
                <Home className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-2xl uppercase tracking-wider mb-4">Studio B</h3>
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <Maximize className="w-4 h-4 text-primary" />
                  <span>625 sq ft</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Bath className="w-4 h-4 text-primary" />
                  <span>1 Bathroom</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Layers className="w-4 h-4 text-primary" />
                  <span>Available on floors 5-28</span>
                </div>
              </div>
              <p className="text-sm mb-6">
                Larger studio with dedicated dining area and enhanced closet space. Ideal for those seeking extra room.
              </p>
              <Link href="/contact" className="btn-gold-outline inline-block w-full text-center">
                Check Availability
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* One Bedroom Floor Plans */}
      <section id="one-bed" className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="section-title mb-12">One Bedroom Apartments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 border border-border">
              <img
                src="/images/assets/images/image-031-012417-5607-piqxtr.jpg"
                alt="Living room with blue accent wall at Exhibit On Superior in Chicago, Illinois"
                className="w-full aspect-video object-cover mb-4"
              />
              <h3 className="text-2xl uppercase tracking-wider mb-4">One Bed A</h3>
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <Maximize className="w-4 h-4 text-primary" />
                  <span>725 sq ft</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Bath className="w-4 h-4 text-primary" />
                  <span>1 Bathroom</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Layers className="w-4 h-4 text-primary" />
                  <span>Available on floors 3-28</span>
                </div>
              </div>
              <p className="text-sm mb-6">
                Spacious one bedroom with separate living area, gourmet kitchen, and luxury bathroom finishes.
              </p>
              <Link href="/contact" className="btn-gold-outline inline-block w-full text-center">
                Check Availability
              </Link>
            </div>

            <div className="bg-white p-6 border border-border">
              <img
                src="/images/assets/images/image-032-20170601-0544-qsvo3j.jpg"
                alt="Apartment living area with large windows at Exhibit On Superior in Chicago, Illinois"
                className="w-full aspect-video object-cover mb-4"
              />
              <h3 className="text-2xl uppercase tracking-wider mb-4">One Bed B</h3>
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <Maximize className="w-4 h-4 text-primary" />
                  <span>825 sq ft</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Bath className="w-4 h-4 text-primary" />
                  <span>1 Bathroom</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Layers className="w-4 h-4 text-primary" />
                  <span>Available on floors 8-28</span>
                </div>
              </div>
              <p className="text-sm mb-6">
                Enhanced one bedroom with expansive windows, walk-in closet, and chef-inspired kitchen.
              </p>
              <Link href="/contact" className="btn-gold-outline inline-block w-full text-center">
                Check Availability
              </Link>
            </div>

            <div className="bg-white p-6 border border-border">
              <div className="aspect-video bg-muted mb-4 flex items-center justify-center">
                <Home className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-2xl uppercase tracking-wider mb-4">One Bed C</h3>
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <Maximize className="w-4 h-4 text-primary" />
                  <span>900 sq ft</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Bath className="w-4 h-4 text-primary" />
                  <span>1 Bathroom</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Layers className="w-4 h-4 text-primary" />
                  <span>Available on floors 12-28</span>
                </div>
              </div>
              <p className="text-sm mb-6">
                Premium one bedroom with corner views, dining area, and superior finishes throughout.
              </p>
              <Link href="/contact" className="btn-gold-outline inline-block w-full text-center">
                Check Availability
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Two Bedroom Floor Plans */}
      <section id="two-bed" className="py-16 px-4 bg-muted">
        <div className="container mx-auto">
          <h2 className="section-title mb-12">Two Bedroom Apartments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 border border-border">
              <div className="aspect-video bg-muted mb-4 flex items-center justify-center">
                <Home className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-2xl uppercase tracking-wider mb-4">Two Bed A</h3>
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <Maximize className="w-4 h-4 text-primary" />
                  <span>1,050 sq ft</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Bath className="w-4 h-4 text-primary" />
                  <span>2 Bathrooms</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Layers className="w-4 h-4 text-primary" />
                  <span>Available on floors 5-28</span>
                </div>
              </div>
              <p className="text-sm mb-6">
                Two bedroom, two bath with split floor plan, providing privacy and comfort for roommates or families.
              </p>
              <Link href="/contact" className="btn-gold-outline inline-block w-full text-center">
                Check Availability
              </Link>
            </div>

            <div className="bg-white p-6 border border-border">
              <div className="aspect-video bg-muted mb-4 flex items-center justify-center">
                <Home className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-2xl uppercase tracking-wider mb-4">Two Bed B</h3>
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <Maximize className="w-4 h-4 text-primary" />
                  <span>1,200 sq ft</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Bath className="w-4 h-4 text-primary" />
                  <span>2 Bathrooms</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Layers className="w-4 h-4 text-primary" />
                  <span>Available on floors 10-28</span>
                </div>
              </div>
              <p className="text-sm mb-6">
                Spacious two bedroom with open living/dining, den space, and luxury master suite.
              </p>
              <Link href="/contact" className="btn-gold-outline inline-block w-full text-center">
                Check Availability
              </Link>
            </div>

            <div className="bg-white p-6 border border-border">
              <div className="aspect-video bg-muted mb-4 flex items-center justify-center">
                <Home className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-2xl uppercase tracking-wider mb-4">Two Bed C</h3>
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <Maximize className="w-4 h-4 text-primary" />
                  <span>1,400 sq ft</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Bath className="w-4 h-4 text-primary" />
                  <span>2.5 Bathrooms</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Layers className="w-4 h-4 text-primary" />
                  <span>Available on floors 15-28</span>
                </div>
              </div>
              <p className="text-sm mb-6">
                Penthouse-style two bedroom with corner panoramic views, expansive living space, and premium finishes.
              </p>
              <Link href="/contact" className="btn-gold-outline inline-block w-full text-center">
                Check Availability
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="section-title mb-6">Schedule a Personal Tour</h2>
          <p className="text-lg leading-relaxed mb-8">
            Experience these exceptional floor plans in person. Our leasing team is ready to help you find your perfect home.
          </p>
          <Link href="/schedule-a-tour" className="btn-gold-outline inline-flex items-center gap-2 bg-primary text-white border-primary hover:bg-primary/90">
            Schedule Your Tour
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
