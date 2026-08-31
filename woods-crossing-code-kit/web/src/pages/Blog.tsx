import { verifiedContent } from "../data/generated";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";

export default function Blog() {
  return (
    <div className="py-24 px-4 md:px-8 max-w-5xl mx-auto w-full">
      <header className="mb-16 md:mb-24">
        <h1 className="text-4xl md:text-6xl font-serif tracking-tight mb-6">Property Journal</h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Stories, updates, and news from our community.
        </p>
      </header>

      {(!verifiedContent.blog || verifiedContent.blog.length === 0) ? (
        <div className="text-center py-24 text-muted-foreground border rounded-sm bg-secondary/10 max-w-2xl mx-auto">
          <p className="mb-4 text-lg">Journal entries are currently being updated.</p>
          <p>Please check back later or <Link href="/contact" className="text-primary hover:underline">contact our leasing team</Link> for the latest news.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {verifiedContent.blog.map((article) => (
            <Link key={article.slug} href={`/blog/${article.slug}`}>
              <div className="group block border-b pb-12 cursor-pointer">
                <h3 className="text-3xl font-serif mb-4 text-foreground group-hover:text-primary transition-colors">{article.title}</h3>
                <p className="text-lg text-muted-foreground leading-relaxed mb-6 max-w-3xl">
                  {article.excerpt}
                </p>
                <div className="inline-flex items-center text-sm font-medium text-primary">
                  Read Full Story <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}