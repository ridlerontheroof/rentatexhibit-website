import { Link } from "wouter";
import { config, verifiedContent } from "../data/generated";
import { ArrowRight } from "lucide-react";

export default function Home() {
  const homeContent = (verifiedContent as any).home || {
    heading: config.property.name,
    description: config.seo.defaultDescription
  };
  
  const heroImage = verifiedContent.gallery?.find(img => img.category === 'Community' || img.category === 'Exterior') || verifiedContent.gallery?.[0];
  const secondaryImage = verifiedContent.gallery?.find(img => img !== heroImage) || heroImage;

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className={`relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-primary text-primary-foreground ${!heroImage ? 'bg-secondary text-foreground' : ''}`}>
        {heroImage && (
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-primary/70 z-10 mix-blend-multiply" />
            <img 
              src={heroImage.src} 
              alt={heroImage.alt} 
              width={heroImage.width}
              height={heroImage.height}
              className="w-full h-full object-cover object-center"
            />
          </div>
        )}
        
        <div className="container relative z-10 px-4 md:px-8 max-w-4xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-medium tracking-tight leading-none text-balance">
            {homeContent.heading}
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto font-medium opacity-90">
            {homeContent.description}
          </p>
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/floor-plans" className={`h-14 px-8 inline-flex items-center justify-center rounded-sm text-sm font-medium tracking-wide transition-colors w-full sm:w-auto ${heroImage ? 'bg-accent text-accent-foreground hover:bg-accent/90' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`} data-testid="link-view-availability">
              View Availability
            </Link>
            <Link href="/gallery" className={`h-14 px-8 inline-flex items-center justify-center border rounded-sm text-sm font-medium tracking-wide transition-colors w-full sm:w-auto ${heroImage ? 'bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10' : 'border-primary text-primary hover:bg-primary/5'}`} data-testid="link-explore-gallery">
              Explore Gallery
            </Link>
          </div>
        </div>
      </section>

      {/* Intro Section */}
      <section className="py-24 md:py-32 px-4 md:px-8 bg-background">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-serif tracking-tight text-foreground text-balance">
                Experience {config.property.shortName}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Discover our community and explore what we have to offer.
              </p>
              <div className="pt-4">
                <Link href="/amenities" className="inline-flex items-center text-primary font-medium hover:text-accent transition-colors group">
                  Discover our amenities 
                  <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
            {secondaryImage ? (
              <div className="aspect-[4/5] bg-secondary/50 rounded-sm overflow-hidden">
                <img 
                  src={secondaryImage.src} 
                  alt={secondaryImage.alt} 
                  width={secondaryImage.width}
                  height={secondaryImage.height}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-[4/5] bg-secondary/20 border rounded-sm flex items-center justify-center p-8 text-center text-muted-foreground">
                Explore our community and amenities.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Floor Plans Teaser */}
      <section className="py-24 md:py-32 px-4 md:px-8 bg-secondary/30 border-y">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif tracking-tight text-foreground mb-4">Floor Plans</h2>
              <p className="text-muted-foreground max-w-xl text-lg">Choose from our available layouts.</p>
            </div>
            <Link href="/floor-plans" className="inline-flex items-center justify-center border border-primary text-primary h-12 px-6 rounded-sm text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors shrink-0">
              View All Plans
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {verifiedContent.floorPlans?.map((plan) => (
              <div key={plan.id} className="group cursor-pointer">
                {plan.image ? (
                  <div className="aspect-[4/3] bg-background border rounded-sm flex items-center justify-center mb-6 overflow-hidden relative p-4">
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <img src={plan.image} alt={plan.name} className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="aspect-[4/3] bg-background border rounded-sm flex items-center justify-center mb-6 overflow-hidden relative">
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="font-serif text-3xl text-muted-foreground/30 font-bold">{plan.name}</span>
                  </div>
                )}
                <h3 className="text-xl font-serif mb-2 group-hover:text-accent transition-colors">{plan.name}</h3>
                <p className="text-muted-foreground">
                  {plan.beds !== undefined && `${plan.beds} Bed`}
                  {plan.beds !== undefined && plan.baths !== undefined && ' • '}
                  {plan.baths !== undefined && `${plan.baths} Bath`}
                  {(plan.beds !== undefined || plan.baths !== undefined) && plan.sqft !== undefined && ' • '}
                  {plan.sqft !== undefined && `${plan.sqft} sq ft`}
                </p>
              </div>
            ))}
            {(!verifiedContent.floorPlans || verifiedContent.floorPlans.length === 0) && (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                Floor plan details coming soon.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}