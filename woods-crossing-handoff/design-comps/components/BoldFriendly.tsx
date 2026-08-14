import React from "react";
import { property, photos, floorPlans, apartmentAmenities, communityAmenities, neighborhood, review } from "./_shared/content";
import { MapPin, Phone, Mail, Clock, ArrowRight, CheckCircle2, Menu, Star, ChevronRight, Home, Trees, Map, Car } from "lucide-react";

export default function BoldFriendly() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700;12..96,800&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,700&display=swap');
        
        .theme-bold-friendly {
          --background: 40 33% 98%;
          --foreground: 220 40% 15%;
          --card: 0 0% 100%;
          --card-foreground: 220 40% 15%;
          --popover: 0 0% 100%;
          --popover-foreground: 220 40% 15%;
          --primary: 220 45% 20%;
          --primary-foreground: 40 33% 98%;
          --secondary: 42 95% 55%;
          --secondary-foreground: 220 50% 10%;
          --muted: 35 25% 92%;
          --muted-foreground: 220 20% 45%;
          --accent: 12 85% 62%;
          --accent-foreground: 0 0% 100%;
          --border: 35 20% 88%;
          --input: 35 20% 88%;
          --ring: 42 95% 55%;
          --radius: 1.5rem;
          --font-display: 'Bricolage Grotesque', sans-serif;
          --font-sans: 'DM Sans', sans-serif;
        }
        .theme-bold-friendly h1, 
        .theme-bold-friendly h2, 
        .theme-bold-friendly h3, 
        .theme-bold-friendly h4 {
          font-family: var(--font-display);
        }
      `}</style>
      <div className="theme-bold-friendly min-h-[100dvh] flex flex-col font-sans overflow-x-hidden bg-background text-foreground selection:bg-secondary selection:text-secondary-foreground">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-secondary rotate-3">
              <Home className="w-6 h-6" />
            </div>
            <span className="font-display font-bold text-2xl tracking-tight text-primary">
              Woods Crossing
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#floorplans" className="font-medium text-foreground hover:text-accent transition-colors">Floor Plans</a>
            <a href="#amenities" className="font-medium text-foreground hover:text-accent transition-colors">Amenities</a>
            <a href="#neighborhood" className="font-medium text-foreground hover:text-accent transition-colors">Neighborhood</a>
            <a href="#contact" className="font-medium text-foreground hover:text-accent transition-colors">Contact</a>
          </nav>
          
          <div className="flex items-center gap-4">
            <a href={property.phoneHref} className="hidden lg:flex items-center gap-2 font-bold text-primary hover:text-accent transition-colors">
              <Phone className="w-5 h-5" />
              {property.phone}
            </a>
            <button className="hidden md:flex items-center gap-2 bg-secondary text-secondary-foreground px-6 py-3 rounded-full font-bold hover:bg-secondary/90 hover:scale-105 active:scale-95 transition-all shadow-sm">
              Schedule a Tour
              <ArrowRight className="w-4 h-4" />
            </button>
            <button className="md:hidden p-2 text-foreground">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-12 pb-24 md:pt-20 md:pb-32 px-6 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <div className="space-y-8 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-full font-bold text-sm tracking-wide">
                <MapPin className="w-4 h-4" />
                {property.eyebrow}
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-extrabold leading-[1.1] text-primary">
                {property.name} <br/>
                <span className="text-foreground/80 text-4xl sm:text-5xl lg:text-6xl font-semibold">in North Salt Lake, UT</span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                {property.intro}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-secondary text-secondary-foreground px-8 py-4 rounded-full font-bold text-lg hover:bg-secondary/90 hover:-translate-y-1 hover:shadow-xl transition-all">
                  Schedule a Tour
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white text-primary border-2 border-primary/10 px-8 py-4 rounded-full font-bold text-lg hover:border-primary/30 hover:bg-muted/50 transition-all">
                  View Floor Plans
                </button>
              </div>

              <div className="flex items-center gap-4 pt-8 border-t border-border/60">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-primary flex items-center justify-center border-2 border-background text-secondary">
                      <Star className="w-4 h-4 fill-current" />
                    </div>
                  ))}
                </div>
                <div>
                  <p className="font-bold text-primary">"{review.body}"</p>
                  <p className="text-sm text-muted-foreground">— Resident, {review.date}</p>
                </div>
              </div>
            </div>

            <div className="relative relative-h">
              {/* Decorative shapes */}
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-secondary rounded-full blur-2xl opacity-50"></div>
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-accent rounded-full blur-3xl opacity-30"></div>
              
              <div className="relative aspect-[4/5] sm:aspect-square lg:aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-friendly transform lg:rotate-2 hover:rotate-0 transition-transform duration-500">
                <img 
                  src={photos.hero} 
                  alt={`${property.name} exterior`} 
                  className="w-full h-full object-cover"
                />
                
                {/* Floating Badge */}
                <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm p-6 rounded-3xl shadow-xl border border-white/20">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Starting Rent</p>
                      <p className="text-4xl font-display font-extrabold text-primary">{property.startingRent}</p>
                    </div>
                    <div className="w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center shadow-lg -rotate-12">
                      <Home className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Floor Plans Section */}
        <section id="floorplans" className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[50vw] h-full bg-white/5 rounded-l-[100px] pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
              <div className="max-w-2xl">
                <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">Find Your Perfect Fit</h2>
                <p className="text-lg text-primary-foreground/80">
                  Spacious 1 & 2 bedroom homes featuring large private balconies, walk-in closets, and natural light.
                </p>
              </div>
              <button className="inline-flex items-center gap-2 text-secondary font-bold hover:text-white transition-colors group">
                See availability
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {floorPlans.map((plan) => (
                <div key={plan.name} className="bg-white rounded-[2rem] p-6 text-foreground shadow-xl transform transition-transform hover:-translate-y-2 duration-300 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="font-display font-bold text-2xl mb-1 text-primary">{plan.name}</h3>
                      <p className="font-medium text-muted-foreground">{plan.beds} • {plan.baths}</p>
                    </div>
                    <div className="bg-muted px-3 py-1.5 rounded-full text-sm font-bold">
                      {plan.sqft}
                    </div>
                  </div>
                  
                  <div className="flex-1 bg-muted/50 rounded-2xl mb-6 p-4 flex items-center justify-center min-h-[200px]">
                    <img src={plan.image} alt={`${plan.name} floor plan`} className="max-w-full max-h-[200px] object-contain mix-blend-multiply" />
                  </div>
                  
                  <div className="mt-auto">
                    <p className="text-sm font-bold text-muted-foreground mb-1">Starting from</p>
                    <div className="flex items-end justify-between">
                      <p className="text-3xl font-display font-extrabold text-primary">{plan.from}</p>
                      <button className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Amenities Section */}
        <section id="amenities" className="py-24 max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-primary mb-6">Everything you need, right here.</h2>
            <p className="text-lg text-muted-foreground">
              Whether you're relaxing by the pool or enjoying the mountain views from your private balcony, Woods Crossing is designed for comfortable living.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <img src={photos.pool} alt="Swimming pool" className="w-full h-48 md:h-64 object-cover rounded-[2rem]" />
                <img src={photos.clubhouse} alt="Clubhouse exterior" className="w-full h-32 md:h-48 object-cover rounded-[1.5rem]" />
              </div>
              <div className="space-y-4 pt-12">
                <img src={photos.lounge} alt="Clubhouse lounge" className="w-full h-40 md:h-56 object-cover rounded-[1.5rem]" />
                <img src={photos.playground} alt="Playground" className="w-full h-40 md:h-56 object-cover rounded-[2rem]" />
              </div>
            </div>

            <div className="lg:col-span-7 lg:pl-12 space-y-12">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                    <Trees className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-bold text-3xl text-primary">Community Perks</h3>
                </div>
                <ul className="grid sm:grid-cols-2 gap-4">
                  {communityAmenities.map((amenity, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-secondary shrink-0" />
                      <span className="font-medium text-foreground">{amenity}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-secondary/20 flex items-center justify-center text-secondary-foreground">
                    <Home className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-bold text-3xl text-primary">Apartment Features</h3>
                </div>
                <ul className="grid sm:grid-cols-2 gap-4">
                  {apartmentAmenities.map((amenity, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-accent shrink-0" />
                      <span className="font-medium text-foreground">{amenity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Neighborhood Section */}
        <section id="neighborhood" className="py-24 bg-muted">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white text-primary rounded-full font-bold text-sm tracking-wide mb-8 shadow-sm">
                  <Map className="w-4 h-4" />
                  North Salt Lake, UT
                </div>
                <h2 className="text-4xl md:text-5xl font-display font-bold text-primary mb-6">
                  Minutes from Downtown. Steps from the mountain.
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Enjoy the quiet convenience of the mountain bench with direct access to Hwy 89. Commuting to Salt Lake City is a breeze.
                </p>

                <div className="space-y-4">
                  {neighborhood.map((place, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl flex items-center gap-4 shadow-sm hover:shadow-friendly transition-shadow cursor-default">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-primary shrink-0">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-primary">{place.name}</h4>
                        <p className="text-muted-foreground">{place.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="relative aspect-square lg:aspect-auto lg:h-[700px] rounded-[3rem] overflow-hidden shadow-xl">
                <img src={photos.aerial} alt="Aerial view of the neighborhood" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent"></div>
                <div className="absolute bottom-10 left-10 right-10">
                  <div className="bg-white/95 backdrop-blur p-6 rounded-3xl flex items-center gap-4">
                    <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center text-secondary-foreground">
                      <Car className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-xl text-primary">Easy Commute</h4>
                      <p className="text-muted-foreground font-medium">Quick access to I-15 & Hwy 89</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer id="contact" className="bg-primary text-primary-foreground pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-secondary-foreground rotate-3">
                  <Home className="w-6 h-6" />
                </div>
                <span className="font-display font-bold text-2xl tracking-tight text-white">
                  Woods Crossing
                </span>
              </div>
              <p className="text-primary-foreground/70 text-lg max-w-sm mb-8">
                Friendly, comfortable, and perfectly located in North Salt Lake. We can't wait to show you around.
              </p>
              <div className="flex gap-4">
                <button className="bg-secondary text-secondary-foreground px-6 py-3 rounded-full font-bold hover:bg-white hover:text-primary transition-colors">
                  Schedule a Tour
                </button>
                <button className="bg-primary-foreground/10 text-white px-6 py-3 rounded-full font-bold hover:bg-primary-foreground/20 transition-colors">
                  Apply Now
                </button>
              </div>
            </div>
            
            <div>
              <h4 className="font-display font-bold text-xl mb-6 text-white">Contact Us</h4>
              <ul className="space-y-4">
                <li>
                  <a href={property.phoneHref} className="flex items-center gap-3 text-primary-foreground/80 hover:text-secondary transition-colors">
                    <Phone className="w-5 h-5" />
                    {property.phone}
                  </a>
                </li>
                <li>
                  <a href={`mailto:${property.email}`} className="flex items-center gap-3 text-primary-foreground/80 hover:text-secondary transition-colors">
                    <Mail className="w-5 h-5" />
                    {property.email}
                  </a>
                </li>
                <li className="flex items-start gap-3 text-primary-foreground/80 pt-2 border-t border-white/10">
                  <MapPin className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{property.address}</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-display font-bold text-xl mb-6 text-white">Office Hours</h4>
              <div className="flex items-start gap-3 text-primary-foreground/80 bg-white/5 p-4 rounded-2xl border border-white/10">
                <Clock className="w-5 h-5 shrink-0 mt-0.5 text-secondary" />
                <span>{property.officeHours}</span>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-primary-foreground/60">
            <p>&copy; {new Date().getFullYear()} {property.name}. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Accessibility</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}