import { useQuery } from "@tanstack/react-query";
import { verifiedContent } from "../data/generated";
import { Link } from "wouter";
import { Button } from "../components/ui/button";

export interface AvailableUnit {
  unit: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  rent: number;
  availableOn: string;
  photoUrl?: string;
  listingUrl?: string;
  videoUrl?: string;
  photos?: string[];
  details?: string[];
  marketingTitle?: string;
  description?: string;
}

export interface AvailabilityPayload {
  units: AvailableUnit[];
  updatedAt: string;
}

const apiBase = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export default function FloorPlans() {
  const { data, isLoading, error } = useQuery<AvailabilityPayload>({
    queryKey: ["availability"],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/api/availability`);
      if (!res.ok) throw new Error("Failed to fetch availability");
      return res.json();
    }
  });

  return (
    <div className="py-24 px-4 md:px-8 max-w-7xl mx-auto w-full">
      <header className="mb-16 md:mb-24 max-w-3xl">
        <h1 className="text-4xl md:text-6xl font-serif tracking-tight mb-6">Residences</h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Explore our collection of floor plans. Find the perfect space to call home.
        </p>
      </header>

      {(!verifiedContent.floorPlans || verifiedContent.floorPlans.length === 0) ? (
        <div className="py-24 text-center border rounded-sm bg-secondary/10 max-w-2xl mx-auto">
          <p className="mb-4 text-lg text-muted-foreground">Floor plan information is currently being updated.</p>
          <p>Please <Link href="/contact" className="text-primary hover:underline">contact our leasing team</Link> for current availability.</p>
        </div>
      ) : (
        <div className="space-y-24">
          {verifiedContent.floorPlans.map((plan) => {
            // Find units for this specific plan matching by exact beds, baths, and sqft if configured
            const planUnits = data?.units?.filter((u) => {
              const bedMatch = plan.beds === undefined || u.bedrooms === plan.beds;
              const bathMatch = plan.baths === undefined || u.bathrooms === plan.baths;
              const sqftMatch = plan.sqft === undefined || u.sqft === plan.sqft;
              return bedMatch && bathMatch && sqftMatch;
            }) || [];

            return (
              <section key={plan.id} className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                <div className="lg:col-span-5 space-y-6">
                  <Link href={`/floor-plans/${(plan as any).slug || plan.id.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="block group">
                    {plan.image ? (
                      <div className="aspect-[4/3] bg-background border flex items-center justify-center rounded-sm p-6 group-hover:border-primary transition-colors">
                        <img src={plan.image} alt={plan.name} className="w-full h-full object-contain transition-transform group-hover:scale-105" />
                      </div>
                    ) : (
                      <div className="aspect-[4/3] bg-secondary/20 border flex items-center justify-center rounded-sm group-hover:border-primary transition-colors">
                        <span className="font-serif text-3xl text-muted-foreground/40">{plan.name}</span>
                      </div>
                    )}
                  </Link>
                  <div>
                    <h2 className="text-3xl font-serif mb-2">
                      <Link href={`/floor-plans/${(plan as any).slug || plan.id.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="hover:text-primary transition-colors">
                        {plan.name}
                      </Link>
                    </h2>
                    <p className="text-muted-foreground text-lg">
                      {plan.beds !== undefined && `${plan.beds} Bedroom`}
                      {plan.beds !== undefined && plan.baths !== undefined && ' × '}
                      {plan.baths !== undefined && `${plan.baths} Bathroom`}
                      {(plan.beds !== undefined || plan.baths !== undefined) && plan.sqft !== undefined && ' × '}
                      {plan.sqft !== undefined && `${plan.sqft} SF`}
                    </p>
                  </div>
                </div>
                
                <div className="lg:col-span-7">
                  <div className="border rounded-sm overflow-hidden bg-card">
                    <div className="bg-secondary/30 px-6 py-4 border-b">
                      <h3 className="font-medium">Live Availability</h3>
                    </div>
                    
                    {isLoading ? (
                      <div className="p-12 text-center text-muted-foreground animate-pulse">
                        Loading live availability...
                      </div>
                    ) : error ? (
                      <div className="p-12 text-center text-destructive">
                        Unable to load availability right now. Please contact the leasing office.
                      </div>
                    ) : (
                      <div className="divide-y">
                        {planUnits.map((unit) => (
                          <div key={unit.unit} className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6 hover:bg-secondary/10 transition-colors" data-testid={`unit-row-${unit.unit}`}>
                            <div>
                              <p className="font-medium text-lg mb-1" data-testid={`text-unit-number-${unit.unit}`}>Apartment {unit.unit}</p>
                              {unit.availableOn && (
                                <p className="text-sm text-muted-foreground" data-testid={`text-unit-available-${unit.unit}`}>Available {unit.availableOn}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-6 w-full sm:w-auto">
                              {unit.rent !== undefined && (
                                <p className="font-serif text-xl tracking-tight text-right w-full sm:w-auto whitespace-nowrap" data-testid={`text-unit-rent-${unit.unit}`}>
                                  ${unit.rent}
                                </p>
                              )}
                              <Button asChild className="w-full sm:w-auto shrink-0">
                                {unit.listingUrl ? (
                                  <a href={unit.listingUrl} target="_blank" rel="noopener noreferrer" data-testid={`link-apply-${unit.unit}`}>Apply Now</a>
                                ) : (
                                  <Link href={`/contact?unit=${unit.unit}`} data-testid={`link-contact-${unit.unit}`}>Apply Now</Link>
                                )}
                              </Button>
                            </div>
                          </div>
                        ))}
                        {planUnits.length === 0 && (
                          <div className="p-12 text-center text-muted-foreground" data-testid="empty-units-state">
                            No units currently available for this floor plan.
                            <div className="mt-6">
                              <Button variant="outline" asChild>
                                <Link href="/contact" data-testid="link-join-waitlist">Join Waitlist</Link>
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}