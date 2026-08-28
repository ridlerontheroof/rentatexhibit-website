import { Link, useParams } from 'wouter';
import { Seo } from '../components/Seo';
import { SplitHeadline } from '../components/SplitHeadline';
import { NotFound } from './not-found';
import {
  buildKnowledgeSeoModel,
  CHANGEABLE_FACTS_NOTE_PARTS,
  knowledgeArticle,
  knowledgePath,
  knowledgeUpdatedDisplay,
  knowledgeUpdated,
} from '../data/knowledge';
import { linkifyText } from '../data/blogLinkifier';

/**
 * Render Knowledge Center prose as plain text plus naturally occurring
 * internal links. The destination set is shared by every expanded paragraph
 * so each destination is linked at most once per article. The direct answer
 * remains one literal text node so it mirrors the FAQPage JSON-LD exactly.
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
          <Link key={i} href={seg.href} className="text-primary underline underline-offset-4">
            {seg.text}
          </Link>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  );
}

/**
 * One Knowledge Center article: the question as the H1, a direct under-100-word
 * answer first (the block AI assistants retrieve and cite), then expanded
 * detail, related questions, and links deeper into the site. Head + JSON-LD
 * come from the shared model in data/knowledge.ts (also used by the
 * prerenderer), so the crawler head and hydrated head never drift.
 */
export function KnowledgeArticle() {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? knowledgeArticle(slug) : undefined;
  if (!article) return <NotFound />;
  // Created fresh per render and consumed in document order so the first
  // natural phrase gets each destination link in both SSR and the browser.
  const usedDests = new Set<string>();
  const selfPath = knowledgePath(article.slug);

  return (
    <>
      <Seo path={knowledgePath(article.slug)} model={buildKnowledgeSeoModel(article)} />
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
                  <Link
                    href="/knowledge"
                    className="hover:text-white underline-offset-4 hover:underline"
                  >
                    Knowledge Center
                  </Link>
                </li>
                {/* Current crumb mirrors the BreadcrumbList JSON-LD (Home /
                    Knowledge Center / <question>) so visible and structured
                    breadcrumbs never disagree. */}
                <li aria-hidden="true">/</li>
                <li aria-current="page" className="text-white/50">
                  {article.question}
                </li>
              </ol>
            </nav>
            <h1 className="text-3xl md:text-4xl uppercase tracking-wider text-white">
              {article.question}
            </h1>
            {/* Byline mirrors author/dateModified in the article JSON-LD
                (data/knowledge.ts) so the visible attribution and the
                structured data can never disagree. */}
            <p className="mt-4 text-sm text-white/60">
              Reviewed by the Exhibit On Superior leasing team &middot; Updated{' '}
              <time dateTime={knowledgeUpdated(article)}>{knowledgeUpdatedDisplay(article)}</time>
            </p>
          </div>
        </section>

        <section className="py-10 px-4">
          <div className="container mx-auto max-w-3xl">
            <div className="border-l-2 border-primary bg-muted/50 px-6 py-5">
              <p className="eyebrow mb-2">Answer</p>
              <p className="text-lg leading-relaxed text-foreground">{article.answer}</p>
            </div>
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
              </div>
            ))}
          </div>
        </section>

        {article.changeableFacts ? (
          <section className="pb-12 px-4">
            <div className="container mx-auto max-w-3xl">
              {/* Shared qualifier for fact-heavy answers (pricing, fees,
                  policies) — text lives in data/knowledge.ts so every
                  article renders the identical sentence. */}
              <p className="border-t border-border pt-4 text-sm text-muted-foreground">
                {CHANGEABLE_FACTS_NOTE_PARTS.before}
                <Link
                  href={CHANGEABLE_FACTS_NOTE_PARTS.linkHref}
                  className="text-primary underline underline-offset-4"
                >
                  {CHANGEABLE_FACTS_NOTE_PARTS.linkLabel}
                </Link>
                {CHANGEABLE_FACTS_NOTE_PARTS.after}
              </p>
            </div>
          </section>
        ) : null}

        <section className="pb-12 px-4">
          <div className="container mx-auto max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl uppercase tracking-wider mb-4">Related Questions</h2>
              <ul className="space-y-3">
                {article.related.map((slug) => {
                  const rel = knowledgeArticle(slug);
                  if (!rel) return null;
                  return (
                    <li key={slug}>
                      <Link
                        href={knowledgePath(slug)}
                        className="text-primary underline underline-offset-4"
                      >
                        {rel.question}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div>
              <h2 className="text-xl uppercase tracking-wider mb-4">Go Deeper</h2>
              <ul className="space-y-3">
                {article.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-primary underline underline-offset-4">
                      {l.label}
                    </Link>
                  </li>
                ))}
                {(article.externalLinks ?? []).map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline underline-offset-4"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-dark-section">
          <div className="container mx-auto max-w-3xl text-center">
            <SplitHeadline script="Still Have Questions?" caps="Ask the Leasing Team" dark className="mb-6" />
            <p className="text-white/80 mb-6">
              Email{' '}
              <a href="mailto:exhibit@highlandptrs.com" className="text-primary-on-dark underline">
                exhibit@highlandptrs.com
              </a>{' '}
              or call{' '}
              <a href="tel:312-450-0635" className="text-primary-on-dark underline">
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
