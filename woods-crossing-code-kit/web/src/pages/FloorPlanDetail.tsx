import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { verifiedContent } from "../data/generated";
import { Button } from "../components/ui/button";
import { AvailabilityPayload } from "./FloorPlans";
import { ArrowLeft } from "lucide-react";

const apiBase = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export default function FloorPlanDetail() {
  const params = useParams();
  // Safe matching assuming slug might be present, or fallback to derived slug
  const plan = verifiedContent.floorPlans?.find((fp: any) => 
    (fp.slug && fp.slug === params.slug) || 
    fp.id.toLowerCase().replace(/[^a-z0-9]+/g, '-') === params.slug
  );

  const { data, isLoading, error } = useQuery<AvailabilityPayload>({
    queryKey: ["availability"],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/api/availability`);
      if (!res.ok) throw new Error("Failed to fetch availability");
      return res.json();
    },
    enabled: !!plan
  });

  if (!plan) {
    return (
      <div className="py-24 px-4 md:px-8 max-w-3xl mx-auto w-full text-center">
        <h1 className="text-4xl font-serif mb-4">Floor Plan Not Found</h1>
        <p className="text-muted-foreground mb-8">The floor plan you requested could not be found.</p>
        <Link href="/floor-plans" className="text-primary hover:underline">Return to Floor Plans</Link>
      </div>
    );
  }

  const planUnits = data?.units?.filter((u) => {
    const bedMatch = plan.beds === undefined || u.bedrooms === plan.beds;
    const bathMatch = plan.baths === undefined || u.bathrooms === plan.baths;
    const sqftMatch = plan.sqft === undefined || u.sqft === plan.sqft;
    return bedMatch && bathMatch && sqftMatch;
  }) || [];

  return (
    <div className="py-24 px-4 md:px-8 max-w-5xl mx-auto w-full">
      <div className="mb-12">
        <Link href="/floor-plans" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to All Floor Plans
        </Link>
        <h1 className="text-4xl md:text-5xl font-serif tracking-tight mb-4">{plan.name}</h1>
        <p className="text-xl text-muted-foreground">
          {plan.beds !== undefined && `${plan.beds} Bedroom`}
          {plan.beds !== undefined && plan.baths !== undefined && ' × '}
          {plan.baths !== undefined && `${plan.baths} Bathroom`}
          {(plan.beds !== undefined || plan.baths !== undefined) && plan.sqft !== undefined && ' × '}
          {plan.sqft !== undefined && `${plan.sqft} SF`}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mb-24">
        <div>
          {plan.image ? (
            <div className="aspect-[4/3] bg-background border flex items-center justify-center rounded-sm p-6">
              <img src={plan.image} alt={`${plan.name} floor plan layout`} className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="aspect-[4/3] bg-secondary/20 border flex items-center justify-center rounded-sm">
              <span className="font-serif text-3xl text-muted-foreground/40">{plan.name}</span>
            </div>
          )}
        </div>
        
        <div>
          <div className="border rounded-sm overflow-hidden bg-card">
            <div className="bg-secondary/30 px-6 py-4 border-b">
              <h2 className="font-medium text-lg">Live Availability</h2>
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
                  <div key={unit.unit} className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6 hover:bg-secondary/10 transition-colors" data-testid={`detail-unit-${unit.unit}`}>
                    <div>
                      <p className="font-medium text-lg mb-1">Apartment {unit.unit}</p>
                      {unit.availableOn && (
                        <p className="text-sm text-muted-foreground">Available {unit.availableOn}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-6 w-full sm:w-auto">
                      {unit.rent !== undefined && (
                        <p className="font-serif text-xl tracking-tight text-right w-full sm:w-auto whitespace-nowrap">
                          ${unit.rent}
                        </p>
                      )}
                      <Button asChild className="w-full sm:w-auto shrink-0">
                        {unit.listingUrl ? (
                          <a href={unit.listingUrl} target="_blank" rel="noopener noreferrer">Apply Now</a>
                        ) : (
                          <Link href={`/contact?unit=${unit.unit}`}>Apply Now</Link>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
                {planUnits.length === 0 && (
                  <div className="p-12 text-center text-muted-foreground">
                    No units currently available for this floor plan.
                    <div className="mt-6">
                      <Button variant="outline" asChild>
                        <Link href="/contact">Join Waitlist</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}