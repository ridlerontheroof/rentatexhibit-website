import React from 'react';
import { ArrowRight, MapPin, Phone, Mail, CheckCircle2, ChevronRight, Menu, X, Star } from 'lucide-react';
import { property, photos, floorPlans, apartmentAmenities, communityAmenities, neighborhood, review } from './_shared/content';

export default function CleanContemporary() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="font-sans text-foreground bg-background min-h-screen flex flex-col selection:bg-primary/20">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
              <span className="font-display font-bold text-primary-foreground text-lg tracking-tight">W</span>
            </div>
            <span className="font-display font-medium text-xl tracking-tight">{property.name}</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#floorplans" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">Floor Plans</a>
            <a href="#amenities" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">Amenities</a>
            <a href="#neighborhood" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">Neighborhood</a>
            <a href="#contact" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">Contact</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <a href={property.phoneHref} className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1.5">
              <Phone className="w-4 h-4" />
              {property.phone}
            </a>
            <button className="bg-primary text-primary-foreground px-5 py-2.5 rounded text-sm font-medium hover:bg-primary/90 transition-colors">
              Schedule a Tour
            </button>
          </div>

          <button 
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-24 lg:pt-20 lg:pb-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            <div className="lg:col-span-5 relative z-10 flex flex-col items-start">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 text-secondary-foreground/80 text-xs font-semibold uppercase tracking-wider mb-6">
                <MapPin className="w-3.5 h-3.5" /> North Salt Lake, UT
              </div>
              <h1 className="text-5xl lg:text-6xl/tight font-display font-medium mb-6 text-foreground">
                {property.eyebrow}.
              </h1>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-lg">
                {property.intro}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <button className="bg-primary text-primary-foreground px-8 py-3.5 rounded text-base font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 group">
                  Schedule a Tour
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <a href="#floorplans" className="px-8 py-3.5 rounded text-base font-medium border border-border hover:bg-secondary/50 transition-colors flex items-center justify-center">
                  View Floor Plans
                </a>
              </div>
              
              <div className="mt-12 flex items-center gap-6 pt-8 border-t border-border/60">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Starting At</div>
                  <div className="text-2xl font-display font-medium">{property.startingRent}</div>
                </div>
                <div className="w-px h-10 bg-border/60"></div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Bedrooms</div>
                  <div className="text-2xl font-display font-medium">1 & 2</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 relative">
              <div className="aspect-[4/3] lg:aspect-[16/11] rounded-2xl overflow-hidden relative">
                <img 
                  src={photos.hero} 
                  alt={property.h1}
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-foreground/10 to-transparent"></div>
              </div>
              
              {/* Floating review card */}
              <div className="absolute -bottom-8 -left-8 lg:bottom-12 lg:-left-12 bg-card p-6 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] max-w-sm border border-border/40 hidden md:block">
                <div className="flex gap-1 text-primary mb-3">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-sm font-medium italic text-foreground/90 leading-relaxed mb-3">
                  "{review.body}"
                </p>
                <div className="text-xs text-muted-foreground font-medium">
                  Resident Review &bull; {review.date}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Floor Plans Section */}
      <section id="floorplans" className="py-24 bg-secondary/30 border-y border-border/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-2xl">
              <h2 className="text-3xl lg:text-4xl font-display font-medium mb-4">Floor Plans</h2>
              <p className="text-muted-foreground text-lg">Honest value and generous space. Find the layout that fits your life.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {floorPlans.map((plan, i) => (
              <div key={i} className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col group">
                <div className="aspect-[4/3] p-6 bg-white flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors z-0"></div>
                  <img src={plan.image} alt={plan.name} className="w-full h-full object-contain relative z-10 mix-blend-multiply" />
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-display font-medium mb-1">{plan.name}</h3>
                  <div className="text-sm text-muted-foreground mb-4">
                    {plan.beds} &bull; {plan.baths} &bull; {plan.sqft}
                  </div>
                  <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                    <div className="font-medium text-lg">{plan.from}</div>
                    <button className="text-primary text-sm font-semibold hover:underline flex items-center gap-1">
                      Details <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Amenities Section */}
      <section id="amenities" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
            <div className="order-2 lg:order-1 relative">
              <div className="grid grid-cols-2 gap-4">
                <img src={photos.kitchen} alt="Apartment Kitchen" className="rounded-xl w-full h-64 object-cover" />
                <img src={photos.living} alt="Apartment Living Room" className="rounded-xl w-full h-64 object-cover translate-y-8" />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl lg:text-4xl font-display font-medium mb-6">Apartment Features</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Thoughtfully designed spaces that make coming home the best part of your day. Large windows and open layouts provide generous breathing room.
              </p>
              <ul className="grid sm:grid-cols-2 gap-4">
                {apartmentAmenities.map((amenity, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-foreground/90 font-medium">{amenity}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-display font-medium mb-6">Community Amenities</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Everything you need just steps from your front door. Enjoy our mountain-bench setting with spaces to relax, play, and connect.
              </p>
              <ul className="grid sm:grid-cols-2 gap-4">
                {communityAmenities.map((amenity, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-foreground/90 font-medium">{amenity}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden">
                <img src={photos.pool} alt="Community Pool" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-6 -left-6 w-1/2 aspect-square rounded-xl overflow-hidden border-4 border-background hidden md:block">
                <img src={photos.clubhouse} alt="Clubhouse" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Neighborhood Section */}
      <section id="neighborhood" className="py-24 bg-foreground text-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-display font-medium mb-4 text-white">The Mountain Bench</h2>
            <p className="text-muted text-lg">
              Located in North Salt Lake, providing quick access to downtown while keeping the quiet, elevated feel of the bench.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-white/5">
              <img src={photos.aerial} alt="Aerial view of neighborhood" className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity duration-500" />
            </div>
            <div className="flex flex-col gap-8">
              {neighborhood.map((place, i) => (
                <div key={i} className="group">
                  <h3 className="text-xl font-display font-medium text-white mb-2 flex items-center justify-between">
                    {place.name}
                    <ArrowRight className="w-4 h-4 text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </h3>
                  <p className="text-muted pb-6 border-b border-white/10 group-last:border-0 group-last:pb-0">{place.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-primary text-primary-foreground text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl lg:text-5xl font-display font-medium mb-6">Ready to see it for yourself?</h2>
          <p className="text-lg text-primary-foreground/80 mb-10">
            Our leasing team is ready to show you around. Schedule an in-person or virtual tour today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-primary px-8 py-4 rounded text-lg font-semibold hover:bg-secondary transition-colors">
              Schedule a Tour
            </button>
            <a href={property.phoneHref} className="px-8 py-4 rounded text-lg font-semibold border border-white/30 hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
              <Phone className="w-5 h-5" />
              Call Us
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-background pt-16 pb-8 border-t border-border px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
                <span className="font-display font-bold text-primary-foreground text-lg tracking-tight">W</span>
              </div>
              <span className="font-display font-medium text-xl tracking-tight">{property.name}</span>
            </div>
            <p className="text-muted-foreground mb-6">
              {property.intro.split('—')[0].trim()}
            </p>
          </div>

          <div>
            <h4 className="font-display font-medium text-lg mb-6">Contact</h4>
            <div className="flex flex-col gap-4 text-muted-foreground">
              <a href={property.phoneHref} className="hover:text-primary transition-colors flex items-center gap-2">
                <Phone className="w-4 h-4" /> {property.phone}
              </a>
              <a href={`mailto:${property.email}`} className="hover:text-primary transition-colors flex items-center gap-2">
                <Mail className="w-4 h-4" /> {property.email}
              </a>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-1 shrink-0" />
                <span>{property.address}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-display font-medium text-lg mb-6">Office Hours</h4>
            <div className="text-muted-foreground flex items-center gap-2">
              <span>{property.officeHours}</span>
            </div>
          </div>

          <div>
            <h4 className="font-display font-medium text-lg mb-6">Links</h4>
            <div className="flex flex-col gap-3 text-muted-foreground">
              <a href="#floorplans" className="hover:text-primary transition-colors">Floor Plans</a>
              <a href="#amenities" className="hover:text-primary transition-colors">Amenities</a>
              <a href="#neighborhood" className="hover:text-primary transition-colors">Neighborhood</a>
              <a href="#" className="hover:text-primary transition-colors">Resident Portal</a>
            </div>
          </div>

        </div>
        
        <div className="max-w-7xl mx-auto pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div>&copy; {new Date().getFullYear()} {property.name}. All rights reserved.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-foreground transition-colors">Accessibility</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
