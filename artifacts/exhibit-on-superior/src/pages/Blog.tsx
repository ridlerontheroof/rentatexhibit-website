import { Link } from 'wouter';
import { Seo } from '../components/Seo';
import { QuickAnswer } from '../components/QuickAnswer';
import { SplitHeadline } from '../components/SplitHeadline';
import {
  BLOG_ARTICLES,
  blogClusterOf,
  blogDateDisplay,
  blogDescription,
  blogHubJsonLd,
  blogPath,
  blogPillars,
} from '../data/blog';
import { BLOG_AUTHORS } from '../data/blogAuthors';

/**
 * Blog hub (/blog): renter guides grouped by topic cluster — each pillar
 * article leads its section with its cluster articles beneath it, so the
 * hub mirrors the internal-linking structure and is a complete crawlable
 * directory without JS.
 */
export function Blog() {
  return (
    <>
      <Seo path="/blog" extraJsonLd={[blogHubJsonLd()]} />
      <div>
        <section className="pt-28 pb-12 px-4 bg-dark-section text-center">
          <div className="container mx-auto max-w-3xl">
            <p className="eyebrow mb-3 text-primary-on-dark">Blog</p>
            <h1 className="text-3xl md:text-4xl uppercase tracking-wider text-white mb-4">
              Renter Guides From the Team That Lives It
            </h1>
            <p className="text-white/80 leading-relaxed">
              Practical guides to River North living, renting in Chicago, and high-rise life
              &mdash; written by the property manager and leasing team at Exhibit On Superior,
              using verified building facts.
            </p>
          </div>
        </section>

        <QuickAnswer path="/blog" />

        <section className="py-10 px-4">
          <div className="container mx-auto max-w-3xl">
            {blogPillars().map((pillar) => {
              const clusters = blogClusterOf(pillar.slug);
              return (
                <section key={pillar.slug} className="mb-12">
                  <article className="border border-border p-6">
                    <p className="eyebrow mb-2">Complete Guide</p>
                    <h2 className="text-2xl uppercase tracking-wider mb-2">
                      <Link
                        href={blogPath(pillar.slug)}
                        className="hover:text-primary underline-offset-4 hover:underline"
                      >
                        {pillar.title}
                      </Link>
                    </h2>
                    <p className="text-sm leading-relaxed text-muted-foreground mb-2">
                      {blogDescription(pillar)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      By {BLOG_AUTHORS[pillar.authorId].name} &middot;{' '}
                      <time dateTime={pillar.updated}>{blogDateDisplay(pillar.updated)}</time>
                    </p>
                  </article>
                  {clusters.length ? (
                    <ul className="divide-y divide-border border-x border-b border-border">
                      {clusters.map((a) => (
                        <li key={a.slug} className="p-6">
                          <Link
                            href={blogPath(a.slug)}
                            className="text-lg text-foreground hover:text-primary underline-offset-4 hover:underline"
                          >
                            {a.title}
                          </Link>
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            {blogDescription(a)}
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            By {BLOG_AUTHORS[a.authorId].name} &middot;{' '}
                            <time dateTime={a.updated}>{blogDateDisplay(a.updated)}</time>
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              );
            })}
            <p className="text-sm text-muted-foreground text-center">
              {BLOG_ARTICLES.length} guides published &mdash; more are on the way. Have a question
              we should answer? Email{' '}
              <a href="mailto:exhibit@highlandptrs.com" className="text-primary underline">
                exhibit@highlandptrs.com
              </a>
              .
            </p>
          </div>
        </section>

        <section className="py-12 px-4 border-t border-border">
          <div className="container mx-auto max-w-3xl">
            <p className="eyebrow mb-4 text-center">Ready to Take the Next Step?</p>
            <ul className="grid gap-3 sm:grid-cols-3">
              <li>
                <Link
                  href="/available-units"
                  className="block border border-border p-4 text-center text-sm uppercase tracking-wider hover:border-primary hover:text-primary transition-colors"
                >
                  See Available Apartments
                </Link>
              </li>
              <li>
                <Link
                  href="/knowledge"
                  className="block border border-border p-4 text-center text-sm uppercase tracking-wider hover:border-primary hover:text-primary transition-colors"
                >
                  Browse Quick Answers
                </Link>
              </li>
              <li>
                <Link
                  href="/schedule-a-tour"
                  className="block border border-border p-4 text-center text-sm uppercase tracking-wider hover:border-primary hover:text-primary transition-colors"
                >
                  Schedule a Tour
                </Link>
              </li>
            </ul>
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
