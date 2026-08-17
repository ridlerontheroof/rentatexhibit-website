import { Link, useParams } from 'wouter';
import { Seo } from '../components/Seo';
import { SmartImg } from '../components/SmartImg';
import { SplitHeadline } from '../components/SplitHeadline';
import type { BlogImage } from '../data/blog';
import { NotFound } from './not-found';
import {
  blogArticle,
  blogAuthor,
  blogDateDisplay,
  blogPath,
  buildBlogSeoModel,
} from '../data/blog';
import { linkifyText } from '../data/blogLinkifier';

/**
 * One blog article: the title as the H1, a byline with a real author
 * (E-E-A-T), a self-contained 40–60-word summary first (the block AI
 * assistants retrieve and cite), then H2 sections with optional lists, an
 * FAQ block (mirrored by FAQPage JSON-LD), related articles in the same
 * topic cluster, onward CTAs, and cited sources for third-party claims.
 * Head + JSON-LD come from the shared model in data/blog.ts (also used by
 * the prerenderer), so the crawler head and hydrated head never drift.
 *
 * In-prose internal links: naturally occurring phrases in paragraphs and
 * list items are linked to the matching site pages (once per destination
 * per article) via `linkifyText`. The same component renders during SSR
 * prerender, so the links appear identically in the static HTML and in the
 * .md markdown twins (the html-to-markdown converter already handles <a>).
 */

/** Article photo with a visible caption (mirrored into the markdown twin). */
function ArticleFigure({ image }: { image: BlogImage }) {
  return (
    <figure className="my-8">
      <SmartImg
        src={image.src}
        alt={image.alt}
        sizes="(min-width: 768px) 768px, 100vw"
        className="w-full h-auto"
      />
      <figcaption className="mt-2 text-sm text-muted-foreground">{image.caption}</figcaption>
    </figure>
  );
}

/**
 * Render a prose string as a sequence of plain-text and internal-link
 * segments. Mutations to `usedDests` accumulate across every paragraph and
 * list item for this article so each destination is only linked once.
 *
 * Plain-text spans wrap their content in a <span> — transparent to the
 * html-to-markdown converter (which passes generic inline elements through).
 * Linked segments become <a> elements that the converter renders as
 * markdown links, so the .md twins automatically carry the same links.
 */
function LinkedProse({
  text,
  usedDests,
  selfPath,
}: {
  text: string;
  usedDests: Set<string>;
  selfPath: string;
}) {
  const segments = linkifyText(text, usedDests, selfPath);
  return (
    <>
      {segments.map((seg, i) =>
        seg.href ? (
          <Link
            key={i}
            href={seg.href}
            className="text-primary underline underline-offset-4"
          >
            {seg.text}
          </Link>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  );
}

export function BlogArticle() {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? blogArticle(slug) : undefined;
  if (!article) return <NotFound />;
  const author = blogAuthor(article);
  const images = article.images ?? [];
  // Second photo lands after the middle section; first goes under the summary.
  const midSectionIndex = Math.max(0, Math.ceil(article.sections.length / 2) - 1);

  // Shared mutable set for the "once per destination" rule — created fresh
  // per render (deterministic in both SSR and CSR) and mutated sequentially
  // as each paragraph and list item is processed in section order.
  const usedDests = new Set<string>();
  const selfPath = blogPath(article.slug); // '/blog/<slug>'

  return (
    <>
      <Seo path={blogPath(article.slug)} model={buildBlogSeoModel(article)} />
      <div>
        <section className="pt-28 pb-10 px-4 bg-dark-section">
          <div className="container mx-auto max-w-3xl">
            <nav aria-label="Breadcrumb" className="mb-6 text-sm text-white/70">
              <ol className="flex flex-wrap items-center gap-2">
                <li>
                  <Link href="/" className="hover:text-white underline-offset-4 hover:underline">
                    Home
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li>
                  <Link href="/blog" className="hover:text-white underline-offset-4 hover:underline">
                    Blog
                  </Link>
                </li>
                {/* Current crumb mirrors the BreadcrumbList JSON-LD (Home /
                    Blog / <title>) so visible and structured breadcrumbs
                    never disagree. */}
                <li aria-hidden="true">/</li>
                <li aria-current="page" className="text-white/50">
                  {article.title}
                </li>
              </ol>
            </nav>
            <h1 className="text-3xl md:text-4xl uppercase tracking-wider text-white">
              {article.title}
            </h1>
            {/* Byline mirrors author/datePublished/dateModified in the
                Article JSON-LD (data/blog.ts) so visible attribution and
                structured data can never disagree. */}
            <p className="mt-4 text-sm text-white/60">
              By {author.name}, {author.role} &middot; Published{' '}
              <time dateTime={article.published}>{blogDateDisplay(article.published)}</time>
              {article.updated !== article.published ? (
                <>
                  {' '}
                  &middot; Updated{' '}
                  <time dateTime={article.updated}>{blogDateDisplay(article.updated)}</time>
                </>
              ) : null}
            </p>
          </div>
        </section>

        <section className="py-10 px-4">
          <div className="container mx-auto max-w-3xl">
            <div className="border-l-2 border-primary bg-muted/50 px-6 py-5">
              <p className="eyebrow mb-2">In Short</p>
              {/* Summary is the answer-first block AI assistants cite — keep
                  it plain text so it reads cleanly as a self-contained answer
                  without conversion-link noise. Not processed by linkifyText. */}
              <p className="text-lg leading-relaxed text-foreground">{article.summary}</p>
            </div>
            {images[0] ? <ArticleFigure image={images[0]} /> : null}
          </div>
        </section>

        <section className="pb-12 px-4">
          <div className="container mx-auto max-w-3xl space-y-8">
            {article.sections.map((s, i) => (
              <div key={s.heading ?? i}>
                {s.heading ? (
                  <h2 className="text-xl uppercase tracking-wider mb-3">{s.heading}</h2>
                ) : null}
                {s.paragraphs.map((p) => (
                  <p key={p.slice(0, 40)} className="leading-relaxed text-muted-foreground mb-4">
                    <LinkedProse text={p} usedDests={usedDests} selfPath={selfPath} />
                  </p>
                ))}
                {s.list ? (
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    {s.list.map((item) => (
                      <li key={item.slice(0, 40)} className="leading-relaxed">
                        <LinkedProse text={item} usedDests={usedDests} selfPath={selfPath} />
                      </li>
                    ))}
                  </ul>
                ) : null}
                {images[1] && i === midSectionIndex ? <ArticleFigure image={images[1]} /> : null}
              </div>
            ))}
          </div>
        </section>

        {article.faqs.length ? (
          <section className="pb-12 px-4">
            <div className="container mx-auto max-w-3xl">
              <h2 className="text-xl uppercase tracking-wider mb-4">Frequently Asked Questions</h2>
              <dl className="divide-y divide-border border-y border-border">
                {article.faqs.map((f) => (
                  <div key={f.question} className="py-4">
                    <dt className="text-lg text-foreground">{f.question}</dt>
                    {/* FAQ answers are also prose — apply linkification so
                        AI answer engines see labeled paths in the .md twin's
                        FAQ section as well. usedDests continues from sections
                        above so each destination is still only linked once. */}
                    <dd className="mt-2 leading-relaxed text-muted-foreground">
                      <LinkedProse text={f.answer} usedDests={usedDests} selfPath={selfPath} />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        ) : null}

        <section className="pb-12 px-4">
          <div className="container mx-auto max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl uppercase tracking-wider mb-4">Keep Reading</h2>
              <ul className="space-y-3">
                {article.related.map((relSlug) => {
                  const rel = blogArticle(relSlug);
                  if (!rel) return null;
                  return (
                    <li key={relSlug}>
                      <Link
                        href={blogPath(relSlug)}
                        className="text-primary underline underline-offset-4"
                      >
                        {rel.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div>
              <h2 className="text-xl uppercase tracking-wider mb-4">Take the Next Step</h2>
              <ul className="space-y-3">
                {article.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-primary underline underline-offset-4">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {article.sources.length ? (
          <section className="pb-12 px-4">
            <div className="container mx-auto max-w-3xl">
              {/* Cited sources for third-party claims (E-E-A-T) — mirrored by
                  the `citation` property in the Article JSON-LD. */}
              <h2 className="text-sm uppercase tracking-wider mb-3 text-muted-foreground">
                Sources
              </h2>
              <ul className="space-y-2 text-sm">
                {article.sources.map((s) => (
                  <li key={s.href}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline underline-offset-4"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        <section className="py-16 px-4 bg-dark-section">
          <div className="container mx-auto max-w-3xl text-center">
            <SplitHeadline
              script="See It for Yourself"
              caps="Tour Exhibit On Superior"
              dark
              className="mb-6"
            />
            <p className="text-white/80 mb-6">
              Email{' '}
              <a href="mailto:exhibit@highlandptrs.com" className="text-primary underline">
                exhibit@highlandptrs.com
              </a>{' '}
              or call{' '}
              <a href="tel:312-450-0635" className="text-primary underline">
                312-450-0635
              </a>
              .
            </p>
            <Link href="/schedule-a-tour" className="btn-gold-outline inline-block">
              Schedule a Tour
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
