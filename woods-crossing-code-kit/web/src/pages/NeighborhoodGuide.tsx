import { useParams, Link } from "wouter";
import { verifiedContent } from "../data/generated";

export default function NeighborhoodGuide() {
  const params = useParams();
  const guide = verifiedContent.neighborhoodGuides.find((a) => a.slug === params.slug);

  if (!guide) {
    return (
      <div className="py-24 px-4 md:px-8 max-w-3xl mx-auto w-full text-center">
        <h1 className="text-4xl font-serif mb-4">Guide Not Found</h1>
        <p className="text-muted-foreground mb-8">The guide you requested could not be found.</p>
        <Link href="/neighborhood-guides" className="text-primary hover:underline">Return to Neighborhood Guides</Link>
      </div>
    );
  }

  return (
    <article className="py-24 px-4 md:px-8 max-w-3xl mx-auto w-full">
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-serif tracking-tight mb-6">{guide.title}</h1>
        <p className="text-xl text-muted-foreground">{guide.excerpt}</p>
      </header>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <p>{guide.content}</p>
      </div>
    </article>
  );
}