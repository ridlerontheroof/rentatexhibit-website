import { useParams, Link } from "wouter";
import { verifiedContent } from "../data/generated";

export default function KnowledgeArticle() {
  const params = useParams();
  const article = verifiedContent.knowledge.find((a) => a.slug === params.slug);

  if (!article) {
    return (
      <div className="py-24 px-4 md:px-8 max-w-3xl mx-auto w-full text-center">
        <h1 className="text-4xl font-serif mb-4">Article Not Found</h1>
        <p className="text-muted-foreground mb-8">The resource you requested could not be found.</p>
        <Link href="/knowledge" className="text-primary hover:underline">Return to Knowledge Center</Link>
      </div>
    );
  }

  return (
    <article className="py-24 px-4 md:px-8 max-w-3xl mx-auto w-full">
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-serif tracking-tight mb-6">{article.title}</h1>
        <p className="text-xl text-muted-foreground">{article.excerpt}</p>
      </header>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <p>{article.content}</p>
      </div>
    </article>
  );
}