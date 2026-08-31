import { verifiedContent } from "../data/generated";
import { Check, Link } from "lucide-react";

export default function Amenities() {
  return (
    <div className="py-24 px-4 md:px-8 max-w-7xl mx-auto w-full">
      <header className="mb-16 md:mb-24 max-w-3xl">
        <h1 className="text-4xl md:text-6xl font-serif tracking-tight mb-6">Amenities</h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Curated spaces designed to elevate your everyday experience.
        </p>
      </header>

      {(!verifiedContent.amenities || verifiedContent.amenities.length === 0) ? (
        <div className="text-center py-24 text-muted-foreground border rounded-sm bg-secondary/10 max-w-2xl mx-auto">
          <p className="mb-4 text-lg">Amenities information is currently being updated.</p>
          <p>Please <Link href="/contact" className="text-primary hover:underline">contact our leasing team</Link> for a full list of community features.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {verifiedContent.amenities.map((amenity, i) => (
            <div key={i} className="group p-8 border bg-card rounded-sm hover:border-primary transition-colors">
              <div className="w-12 h-12 bg-secondary/50 rounded-full flex items-center justify-center mb-6 text-primary">
                <Check size={24} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-serif mb-3 text-foreground">{amenity.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {amenity.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}