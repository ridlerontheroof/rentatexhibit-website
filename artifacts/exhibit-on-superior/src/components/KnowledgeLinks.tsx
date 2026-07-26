import { Link } from 'wouter';
import { knowledgeArticle, knowledgePath } from '../data/knowledge';

interface KnowledgeLinksProps {
  /** Knowledge article slugs — must resolve (enforced by knowledge.test.ts). */
  slugs: string[];
  /** Optional section intro override. */
  title?: string;
}

/**
 * "Common questions" block: contextual internal links from high-traffic pages
 * (home, amenities, fees, FAQ, floor plans…) into the Knowledge Center, using
 * the full question as descriptive anchor text.
 */
export function KnowledgeLinks({ slugs, title = 'Common Questions' }: KnowledgeLinksProps) {
  const articles = slugs
    .map((slug) => knowledgeArticle(slug))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));
  if (articles.length === 0) return null;

  return (
    <section className="px-4 py-12">
      <div className="container mx-auto max-w-3xl">
        <p className="eyebrow mb-2">From the Knowledge Center</p>
        <h2 className="text-2xl uppercase tracking-wider mb-6">{title}</h2>
        <ul className="divide-y divide-border border-y border-border">
          {articles.map((a) => (
            <li key={a.slug} className="py-3">
              <Link
                href={knowledgePath(a.slug)}
                className="text-foreground hover:text-primary underline-offset-4 hover:underline"
              >
                {a.question}
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/knowledge" className="mt-6 inline-block btn-gold-outline">
          Browse All Questions
        </Link>
      </div>
    </section>
  );
}
