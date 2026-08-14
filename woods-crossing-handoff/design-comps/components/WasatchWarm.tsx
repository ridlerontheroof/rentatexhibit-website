import React from 'react';
import { property, photos, floorPlans, apartmentAmenities, communityAmenities, neighborhood, review } from './_shared/content';
import { MapPin, Phone, Mail, Clock, ChevronRight, Check, Star, Menu } from 'lucide-react';

export default function WasatchWarm() {
  return (
    <div 
      className="wasatch-warm min-h-screen bg-background text-foreground selection:bg-primary/20"
      style={{
        '--background': '40 33% 96%',
        '--foreground': '111 12% 19%',
        '--card': '0 0% 100%',
        '--card-foreground': '111 12% 19%',
        '--primary': '16 60% 49%',
        '--primary-foreground': '0 0% 100%',
        '--secondary': '108 10% 56%',
        '--secondary-foreground': '0 0% 100%',
        '--muted': '39 25% 88%',
        '--muted-foreground': '107 4% 41%',
        '--border': '44 21% 82%',
        '--font-sans': '"DM Sans", sans-serif',
        '--font-serif': '"Fraunces", serif',
      } as React.CSSProperties}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900&display=swap');
        .font-sans { font-family: var(--font-sans); }
        .font-serif { font-family: var(--font-serif); }
        .wasatch-warm { font-family: var(--font-sans); }
        .wasatch-warm h1, .wasatch-warm h2, .wasatch-warm h3 { font-family: var(--font-serif); }
      `}</style>
      
      {/* Navigation */}
      <nav className="fixed w-full z-50 transition-all duration-300 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex-shrink-0 flex items-center">
              <span className="font-serif text-2xl font-bold tracking-tight text-primary">
                Woods Crossing
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#floorplans" className="text-sm font-medium hover:text-primary transition-colors">Floor Plans</a>
              <a href="#amenities" className="text-sm font-medium hover:text-primary transition-colors">Amenities</a>
              <a href="#neighborhood" className="text-sm font-medium hover:text-primary transition-colors">Neighborhood</a>
              <a href={property.phoneHref} className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors">
                <Phone className="w-4 h-4" />
                {property.phone}
              </a>
              <button className="bg-primary text-primary-foreground px-6 py-2.5 rounded-md font-medium hover:bg-primary/90 transition-colors shadow-sm">
                Schedule a Tour
              </button>
            </div>
            <div className="md:hidden flex items-center">
              <button className="p-2 text-foreground">
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-32 flex items-center min-h-[90vh]">
        <div className="absolute inset-0 z-0 bg-muted/20">
          <img 
            src={photos.aerial} 
            alt="Woods Crossing Community" 
            className="w-full h-full object-cover object-center"
          />
          {/* Mobile scrim for text readability */}
          <div className="absolute inset-0 bg-background/85 md:hidden"></div>
          {/* Desktop gradient: protects text on the left, leaves the right side clear for the photo */}
          <div className="hidden md:block absolute inset-y-0 left-0 w-full md:w-[80%] lg:w-[65%] bg-gradient-to-r from-background via-background/95 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 mb-6">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium tracking-wide">North Salt Lake, UT</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] mb-6 text-foreground">
              {property.h1}
            </h1>
            <p className="text-lg md:text-xl text-foreground/80 mb-8 max-w-xl leading-relaxed">
              {property.eyebrow}. {property.intro}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-primary text-primary-foreground px-8 py-4 rounded-md font-medium text-lg hover:bg-primary/90 transition-all shadow-md flex items-center justify-center gap-2 group">
                Schedule a Tour
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="bg-white/80 backdrop-blur text-foreground border border-border px-8 py-4 rounded-md font-medium text-lg hover:bg-white transition-colors flex items-center justify-center">
                View Floor Plans
              </button>
            </div>
            
            <div className="mt-12 flex items-center gap-4 border-t border-border/50 pt-6">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center border-2 border-background">
                    <Star className="w-4 h-4 text-white fill-white" />
                  </div>
                ))}
              </div>
              <div className="text-sm text-foreground/80">
                <span className="font-medium text-foreground block">"{review.body}"</span>
                — Resident, {review.date}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Intro / Highlight */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="aspect-[4/3] rounded-lg overflow-hidden shadow-xl">
                <img src={photos.aerial} alt="Aerial view" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-6 -right-6 w-48 aspect-square rounded-lg overflow-hidden border-8 border-background shadow-lg hidden md:block">
                <img src={photos.monument} alt="Woods Crossing Sign" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="md:pl-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Honest Value on the Mountain Bench</h2>
              <p className="text-lg text-foreground/70 mb-6 leading-relaxed">
                We believe a great apartment doesn't need to be complicated. At Woods Crossing, you'll find everything you need for a comfortable life—without the inflated prices of downtown luxury high-rises.
              </p>
              <p className="text-lg text-foreground/70 mb-8 leading-relaxed">
                With covered parking included, spacious layouts, and the foothills right in your backyard, it's the perfect home base for commuters and families alike.
              </p>
              <ul className="space-y-3">
                {[
                  "Minutes from Downtown SLC",
                  `Starting at just ${property.startingRent}/mo`,
                  "Pet-friendly community"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-foreground font-medium">
                    <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-secondary" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Floor Plans */}
      <section id="floorplans" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Find Your Space</h2>
            <p className="text-lg text-foreground/70">
              Choose from our one and two-bedroom layouts. Every home includes large windows for natural light and a private balcony or patio to take in the fresh mountain air.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {floorPlans.map((plan, i) => (
              <div key={i} className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all group">
                <div className="aspect-[4/3] bg-muted/50 p-6 flex items-center justify-center border-b border-border">
                  <img 
                    src={plan.image} 
                    alt={plan.name} 
                    className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                      <p className="text-sm text-foreground/60">{plan.beds} • {plan.baths} • {plan.sqft}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-foreground/60 uppercase tracking-wider font-semibold">From</span>
                      <p className="text-lg font-bold text-primary">{plan.from}</p>
                    </div>
                  </div>
                  <button className="w-full py-2.5 rounded border border-primary text-primary font-medium hover:bg-primary hover:text-primary-foreground transition-colors">
                    Check Availability
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Amenities */}
      <section id="amenities" className="py-24 bg-foreground text-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            
            {/* Apartment Amenities */}
            <div>
              <div className="aspect-[4/3] rounded-xl overflow-hidden mb-8">
                <img src={photos.living} alt="Apartment interior" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-3xl font-serif font-bold mb-6">Inside Your Home</h3>
              <ul className="grid sm:grid-cols-2 gap-4">
                {apartmentAmenities.map((amenity, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-background/80">{amenity}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Community Amenities */}
            <div>
              <div className="aspect-[4/3] rounded-xl overflow-hidden mb-8">
                <img src={photos.pool} alt="Community pool" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-3xl font-serif font-bold mb-6">In The Community</h3>
              <ul className="grid sm:grid-cols-2 gap-4">
                {communityAmenities.map((amenity, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                    <span className="text-background/80">{amenity}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
          
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
            <img src={photos.kitchen} alt="Kitchen" className="w-full h-48 object-cover rounded-lg opacity-80 hover:opacity-100 transition-opacity" />
            <img src={photos.bedroom} alt="Bedroom" className="w-full h-48 object-cover rounded-lg opacity-80 hover:opacity-100 transition-opacity" />
            <img src={photos.clubhouse} alt="Clubhouse" className="w-full h-48 object-cover rounded-lg opacity-80 hover:opacity-100 transition-opacity" />
            <img src={photos.playground} alt="Playground" className="w-full h-48 object-cover rounded-lg opacity-80 hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </section>

      {/* Neighborhood */}
      <section id="neighborhood" className="py-24 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-12 gap-12 items-center">
            <div className="md:col-span-5">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Quietly Proud of the Mountains Next Door</h2>
              <p className="text-lg text-foreground/70 mb-8 leading-relaxed">
                Living on the bench means you're elevated above the valley smog, but still just a quick drive into the city. Enjoy weekend hikes, rounds of golf, and neighborhood parks—all within minutes of your front door.
              </p>
              
              <div className="space-y-6">
                {neighborhood.map((place, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-lg bg-card border border-border/50 shadow-sm hover:border-primary/30 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{place.name}</h4>
                      <p className="text-foreground/60 text-sm">{place.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="md:col-span-7">
              <div className="aspect-square md:aspect-[4/5] rounded-2xl overflow-hidden relative shadow-2xl">
                <img src={photos.exterior} alt="Property Exterior" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-8">
                  <div className="bg-white/95 backdrop-blur p-6 rounded-xl max-w-sm">
                    <h4 className="font-bold text-xl mb-2 text-foreground">Visit Us</h4>
                    <p className="text-foreground/70 mb-4">{property.address}</p>
                    <a href="#" className="inline-flex items-center gap-2 text-primary font-medium hover:underline">
                      Get Directions <ChevronRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img src={photos.hero} alt="" className="w-full h-full object-cover mix-blend-luminosity" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to see it for yourself?</h2>
          <p className="text-xl mb-10 text-primary-foreground/90 max-w-2xl mx-auto">
            Schedule a tour today and discover why Woods Crossing is the perfect place to call home.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-primary px-8 py-4 rounded-md font-bold text-lg hover:bg-white/90 transition-colors shadow-lg">
              Schedule a Tour
            </button>
            <a href={property.phoneHref} className="bg-primary-foreground/10 text-primary-foreground border border-primary-foreground/30 px-8 py-4 rounded-md font-medium text-lg hover:bg-primary-foreground/20 transition-colors flex items-center justify-center gap-2">
              <Phone className="w-5 h-5" />
              Call {property.phone}
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-foreground/40 py-16 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12 border-b border-white/10 pb-12">
            <div className="col-span-2 md:col-span-1">
              <span className="font-serif text-2xl font-bold tracking-tight text-white mb-6 block">
                Woods Crossing
              </span>
              <p className="text-sm mb-6 max-w-xs text-background/60">
                A community proud to offer honest value and comfortable living on the North Salt Lake mountain bench.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Contact</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 text-primary" />
                  <span className="text-background/60 hover:text-white transition-colors">{property.address}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" />
                  <a href={property.phoneHref} className="text-background/60 hover:text-white transition-colors">{property.phone}</a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  <a href={`mailto:${property.email}`} className="text-background/60 hover:text-white transition-colors">{property.email}</a>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Hours</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2 text-background/60">
                  <Clock className="w-4 h-4 text-primary" />
                  {property.officeHours}
                </li>
                <li className="text-background/60 pl-6">
                  Sat-Sun: Closed
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Quick Links</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#floorplans" className="text-background/60 hover:text-white transition-colors">Floor Plans</a></li>
                <li><a href="#amenities" className="text-background/60 hover:text-white transition-colors">Amenities</a></li>
                <li><a href="#neighborhood" className="text-background/60 hover:text-white transition-colors">Neighborhood</a></li>
                <li><a href="#" className="text-background/60 hover:text-white transition-colors">Resident Portal</a></li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-background/40">
            <p>&copy; {new Date().getFullYear()} Woods Crossing Apartments. All rights reserved.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Accessibility</a>
            </div>
          </div>
        </div>
      </footer>
      
    </div>
  );
}
