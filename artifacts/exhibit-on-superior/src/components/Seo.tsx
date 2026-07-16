import { Helmet } from 'react-helmet-async';
import { PAGE_SEO, buildJsonLd, canonicalFor, DEFAULT_OG_IMAGE } from '../data/seo';

interface SeoProps {
  path: string;
  /** Extra JSON-LD objects to append (e.g. an ItemList for the floor-plans gallery). */
  extraJsonLd?: Record<string, unknown>[];
}

export function Seo({ path, extraJsonLd }: SeoProps) {
  const page = PAGE_SEO[path];
  if (!page) return null;

  const canonical = canonicalFor(path);
  const jsonLd = buildJsonLd(path);

  return (
    <Helmet>
      <title>{page.title}</title>
      <meta name="description" content={page.description} />
      <link rel="canonical" href={canonical} />
      <meta name="robots" content="index, follow" />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Exhibit On Superior" />
      <meta property="og:title" content={page.title} />
      <meta property="og:description" content={page.description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={DEFAULT_OG_IMAGE} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={page.title} />
      <meta name="twitter:description" content={page.description} />
      <meta name="twitter:image" content={DEFAULT_OG_IMAGE} />

      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      {extraJsonLd?.map((obj, i) => (
        <script type="application/ld+json" key={i}>
          {JSON.stringify(obj)}
        </script>
      ))}
    </Helmet>
  );
}
