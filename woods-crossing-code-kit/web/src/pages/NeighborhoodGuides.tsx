import { verifiedContent } from "../data/generated";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";

export default function NeighborhoodGuides() {
  return (
    <div className="py-24 px-4 md:px-8 max-w-5xl mx-auto w-full">
      <header className="mb-16 md:mb-24">
        <h1 className="text-4xl md:text-6xl font-serif tracking-tight mb-6">Neighborhood Guides</h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Curated recommendations and local insights.
        </p>
      </header>

      {(!verifiedContent.neighborhoodGuides || verifiedContent.neighborhoodGuides.length === 0) ? (
        <div className="text-center py-24 text-muted-foreground border rounded-sm bg-secondary/10 max-w-2xl mx-auto">
          <p className="mb-4 text-lg">Neighborhood guides are currently being updated.</p>
          <p>Please <Link href="/contact" className="text-primary hover:underline">contact our leasing team</Link> for local recommendations.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {verifiedContent.neighborhoodGuides.map((guide) => (
            <Link key={guide.slug} href={`/neighborhood-guides/${guide.slug}`}>
              <div className="group h-full p-8 border bg-card rounded-sm hover:border-primary transition-colors cursor-pointer flex flex-col justify-between">
                <div>
                  <h3 className="text-2xl font-serif mb-3 text-foreground group-hover:text-primary transition-colors">{guide.title}</h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    {guide.excerpt}
                  </p>
                </div>
                <div className="inline-flex items-center text-sm font-medium text-primary">
                  Explore Guide <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}