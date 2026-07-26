import { Link } from 'wouter';
import { PAGE_SEO } from '../data/seo';
import { knowledgePath } from '../data/knowledge';
import { Plus } from 'lucide-react';
import { SplitHeadline } from './SplitHeadline';

interface FaqSectionProps {
  path: string;
}

/** Visible FAQ block for long-tail renter questions (mirrors the FAQPage JSON-LD). */
export function FaqSection({ path }: FaqSectionProps) {
  const page = PAGE_SEO[path];
  if (!page || page.faqs.length === 0) return null;

  return (
    <section className="px-4 py-16">
      <div className="container mx-auto max-w-3xl">
        <p className="eyebrow mb-2 text-center">Good to Know</p>
        <SplitHeadline caps="Frequently Asked Questions" className="mb-8" />
        <div className="divide-y divide-border border-y border-border">
          {page.faqs.map((faq) => (
            <details key={faq.q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-lg text-foreground marker:content-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <span>{faq.q}</span>
                <Plus className="h-5 w-5 shrink-0 text-primary transition-transform duration-200 group-open:rotate-45" />
              </summary>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {faq.a}
                {faq.knowledgeSlug ? (
                  <>
                    {' '}
                    <Link
                      href={knowledgePath(faq.knowledgeSlug)}
                      className="whitespace-nowrap text-primary underline underline-offset-4 hover:text-primary/80"
                    >
                      Full answer &rarr;<span className="sr-only">{` (${faq.q})`}</span>
                    </Link>
                  </>
                ) : null}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
