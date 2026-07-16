import { PAGE_SEO } from '../data/seo';

interface QuickAnswerProps {
  path: string;
}

/** Visible AEO "Quick Answer" block: puts the single most important fact near the top of the page. */
export function QuickAnswer({ path }: QuickAnswerProps) {
  const page = PAGE_SEO[path];
  if (!page) return null;

  return (
    <section className="px-4 py-8">
      <div className="container mx-auto max-w-3xl">
        <div className="border-l-2 border-primary bg-muted/50 px-6 py-5">
          <p className="eyebrow mb-2">Quick Answer</p>
          <p className="text-base leading-relaxed text-foreground">{page.quickAnswer}</p>
        </div>
      </div>
    </section>
  );
}
