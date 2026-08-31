import { verifiedContent } from "../data/generated";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";

export default function Neighborhood() {
  const neighborhoodImage = verifiedContent.gallery?.find(img => img.category === 'Neighborhood' || img.category === 'Community');

  return (
    <div className="py-24 px-4 md:px-8 max-w-7xl mx-auto w-full">
      <header className="mb-16 md:mb-24 max-w-3xl">
        <h1 className="text-4xl md:text-6xl font-serif tracking-tight mb-6">Neighborhood</h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Perfectly positioned. Explore the culture, dining, and natural beauty surrounding our community.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-24">
        {neighborhoodImage ? (
          <div className="aspect-square md:aspect-[4/3] bg-secondary/50 rounded-sm overflow-hidden">
             <img 
                src={neighborhoodImage.src} 
                alt={neighborhoodImage.alt}
                width={neighborhoodImage.width}
                height={neighborhoodImage.height} 
                className="w-full h-full object-cover grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-700"
              />
          </div>
        ) : (
          <div className="aspect-square md:aspect-[4/3] bg-secondary/20 border rounded-sm flex items-center justify-center p-8 text-center text-muted-foreground">
             Explore our local neighborhood.
          </div>
        )}
        <div className="flex flex-col justify-center space-y-8">
          {(!verifiedContent.neighborhood || verifiedContent.neighborhood.length === 0) ? (
            <div className="text-muted-foreground p-6 border rounded-sm bg-secondary/10">
              <p className="mb-4">Neighborhood information is currently being updated.</p>
              <p>Please <Link href="/contact" className="text-primary hover:underline">contact our leasing team</Link> for details about our location.</p>
            </div>
          ) : (
            verifiedContent.neighborhood.map((item, i) => (
              <div key={i} className="pb-8 border-b last:border-0">
                <h3 className="text-2xl font-serif mb-3 text-foreground">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))
          )}
          <div className="pt-4">
             <Link href="/neighborhood-guides" className="inline-flex items-center text-primary font-medium hover:text-accent transition-colors group text-lg">
                View all neighborhood guides 
                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
          </div>
        </div>
      </div>
    </div>
  );
}