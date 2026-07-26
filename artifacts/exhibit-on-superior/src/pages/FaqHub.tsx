import { PageHero } from '../components/PageHero';
import { Seo } from '../components/Seo';
import { QuickAnswer } from '../components/QuickAnswer';
import { Link } from 'wouter';
import { SplitHeadline } from '../components/SplitHeadline';
import { Plus } from 'lucide-react';
import { FAQ_HUB_TOPICS } from '../data/seo';
import { knowledgePath } from '../data/knowledge';
import { KnowledgeLinks } from '../components/KnowledgeLinks';

/**
 * FAQ hub: every verified Q&A, grouped by topic, each topic linking to its
 * detail page. The FAQPage JSON-LD mirrors these via PAGE_SEO['/faq'].faqs.
 * Renders its own grouped layout instead of the flat <FaqSection>.
 */
export function FaqHub() {
  return (
    <>
      <Seo path="/faq" />
      <div>
        <PageHero
          image="/images/image-033-lounge-mfioa0.jpg"
          alt="Frequently Asked Questions | Exhibit On Superior in Chicago, Illinois"
          titleScript="Ask Away"
          title="Frequently Asked Questions"
          subtitle="FAQ"
        />

        <QuickAnswer path="/faq" />

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-3xl">
            <nav aria-label="FAQ topics" className="mb-12 flex flex-wrap justify-center gap-3">
              {FAQ_HUB_TOPICS.map((t) => (
                <a key={t.title} href={`#${slug(t.title)}`} className="btn-gold-outline text-xs">
                  {t.title}
                </a>
              ))}
            </nav>

            {FAQ_HUB_TOPICS.map((topic) => (
              <section key={topic.title} id={slug(topic.title)} className="mb-14 scroll-mt-24">
                <div className="flex items-baseline justify-between gap-4 mb-4">
                  <h2 className="text-2xl uppercase tracking-wider">{topic.title}</h2>
                  <Link href={topic.link} className="text-sm text-primary underline whitespace-nowrap">
                    {topic.linkLabel} &rarr;
                  </Link>
                </div>
                <div className="divide-y divide-border border-y border-border">
                  {topic.faqs.map((faq) => (
                    <details key={faq.q} className="group py-4">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-lg text-foreground marker:content-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <span>{faq.q}</span>
                        <Plus className="h-5 w-5 shrink-0 text-primary transition-transform duration-200 group-open:rotate-45" />
                      </summary>
                      <p className="mt-3 leading-relaxed text-muted-foreground">{faq.a}</p>
                      {faq.knowledgeSlug ? (
                        <p className="mt-2">
                          <Link
                            href={knowledgePath(faq.knowledgeSlug)}
                            className="text-sm text-primary underline underline-offset-4"
                          >
                            Full answer &rarr;
                          </Link>
                        </p>
                      ) : null}
                    </details>
                  ))}
                </div>
              </section>
            ))}

            <p className="text-center text-muted-foreground">
              Didn&rsquo;t find your answer? Email{' '}
              <a href="mailto:exhibit@highlandptrs.com" className="text-primary underline">exhibit@highlandptrs.com</a>{' '}
              or call <a href="tel:312-450-0635" className="text-primary underline">312-450-0635</a>.
            </p>
          </div>
        </section>

        <KnowledgeLinks
          title="Dig Deeper in the Knowledge Center"
          slugs={[
            'total-move-in-cost',
            'credit-score-required',
            'lease-terms',
            'what-utility-fee-covers',
            'breed-and-weight-rules',
            'amenity-hours',
          ]}
        />

        <section className="py-16 px-4 bg-dark-section">
          <div className="container mx-auto max-w-3xl text-center">
            <SplitHeadline script="Still Curious?" caps="Come See It in Person" dark className="mb-6" />
            <Link href="/available-units" className="btn-gold-outline inline-block">
              Schedule a Tour
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

function slug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
