import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { Search } from 'lucide-react';
import { Seo } from '../components/Seo';
import { QuickAnswer } from '../components/QuickAnswer';
import { SplitHeadline } from '../components/SplitHeadline';
import {
  KNOWLEDGE_ARTICLES,
  KNOWLEDGE_CATEGORIES,
  knowledgeDescription,
  knowledgePath,
} from '../data/knowledge';

/**
 * Knowledge Center hub (/knowledge): a browsable, categorized index of every
 * single-question article, with client-side search. Every article is linked
 * with a descriptive snippet so the hub is a complete crawlable directory
 * even without JS (search only filters the always-rendered list).
 */
export function Knowledge() {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      q
        ? KNOWLEDGE_ARTICLES.filter(
            (a) =>
              a.question.toLowerCase().includes(q) ||
              a.answer.toLowerCase().includes(q) ||
              a.category.toLowerCase().includes(q),
          )
        : KNOWLEDGE_ARTICLES,
    [q],
  );

  return (
    <>
      <Seo path="/knowledge" />
      <div>
        <section className="pt-28 pb-12 px-4 bg-dark-section text-center">
          <div className="container mx-auto max-w-3xl">
            <p className="eyebrow mb-3 text-primary">Knowledge Center</p>
            <h1 className="text-3xl md:text-4xl uppercase tracking-wider text-white mb-4">
              Every Question, Answered With Facts
            </h1>
            <p className="text-white/80 leading-relaxed">
              {KNOWLEDGE_ARTICLES.length} straight answers about living at Exhibit On Superior
              &mdash; pricing, floor plans, amenities, pets, parking, leasing, utilities, and the
              River North neighborhood.
            </p>
          </div>
        </section>

        <QuickAnswer path="/knowledge" />

        <section className="px-4 pb-4">
          <div className="container mx-auto max-w-3xl">
            <label className="flex items-center gap-3 border border-border px-4 py-3 focus-within:ring-2 focus-within:ring-ring">
              <Search className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <span className="sr-only">Search questions</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search questions — parking, pets, fees, pool…"
                className="w-full bg-transparent text-base focus:outline-none"
              />
            </label>
            {q ? (
              <p className="mt-3 text-sm text-muted-foreground" role="status">
                {filtered.length} question{filtered.length === 1 ? '' : 's'} match
                &ldquo;{query}&rdquo;
              </p>
            ) : (
              <nav aria-label="Categories" className="mt-6 flex flex-wrap justify-center gap-3">
                {KNOWLEDGE_CATEGORIES.map((c) => (
                  <a key={c} href={`#${categorySlug(c)}`} className="btn-gold-outline text-xs">
                    {c}
                  </a>
                ))}
              </nav>
            )}
          </div>
        </section>

        <section className="py-10 px-4">
          <div className="container mx-auto max-w-3xl">
            {KNOWLEDGE_CATEGORIES.map((category) => {
              const articles = filtered.filter((a) => a.category === category);
              if (articles.length === 0) return null;
              return (
                <section
                  key={category}
                  id={categorySlug(category)}
                  className="mb-12 scroll-mt-24"
                >
                  <h2 className="text-2xl uppercase tracking-wider mb-4">{category}</h2>
                  <ul className="divide-y divide-border border-y border-border">
                    {articles.map((a) => (
                      <li key={a.slug} className="py-4">
                        <Link
                          href={knowledgePath(a.slug)}
                          className="text-lg text-foreground hover:text-primary underline-offset-4 hover:underline"
                        >
                          {a.question}
                        </Link>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          {knowledgeDescription(a)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
            {filtered.length === 0 ? (
              <p className="text-center text-muted-foreground">
                No matching question. Email{' '}
                <a href="mailto:exhibit@highlandptrs.com" className="text-primary underline">
                  exhibit@highlandptrs.com
                </a>{' '}
                or call{' '}
                <a href="tel:312-450-0635" className="text-primary underline">
                  312-450-0635
                </a>{' '}
                &mdash; the leasing team answers directly.
              </p>
            ) : null}
          </div>
        </section>

        <section className="py-16 px-4 bg-dark-section">
          <div className="container mx-auto max-w-3xl text-center">
            <SplitHeadline script="Seen Enough?" caps="Come See It in Person" dark className="mb-6" />
            <Link href="/schedule-a-tour" className="btn-gold-outline inline-block">
              Schedule a Tour
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

function categorySlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
