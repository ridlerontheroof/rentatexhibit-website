import { Helmet } from 'react-helmet-async';
import { PAGE_SEO, buildJsonLd, canonicalFor, DEFAULT_OG_IMAGE } from '../data/seo';

interface SeoProps {
  path: string;
  /** Override title (used for routes without a PAGE_SEO entry, e.g. 404). */
  title?: string;
  /** Override description. */
  description?: string;
  /** Serve robots noindex (and omit JSON-LD / canonical for unknown routes). */
  noindex?: boolean;
  /** Extra JSON-LD objects to append (e.g. an ItemList for the floor-plans gallery). */
  extraJsonLd?: Record<string, unknown>[];
}

export function Seo({ path, title, description, noindex, extraJsonLd }: SeoProps) {
  const page = PAGE_SEO[path];

  const resolvedTitle = title ?? page?.title;
  if (!resolvedTitle) return null;

  const resolvedDescription = description ?? page?.description ?? '';
  const isNoindex = noindex ?? page?.noindex ?? false;

  // Only emit a canonical for known routes; a 404 must not self-canonicalize a bad URL.
  const canonical = page ? canonicalFor(path) : undefined;
  const jsonLd = page && !isNoindex ? buildJsonLd(path) : null;

  return (
    <Helmet>
      <title>{resolvedTitle}</title>
      <meta name="description" content={resolvedDescription} />
      {canonical ? <link rel="canonical" href={canonical} /> : null}
      <meta name="robots" content={isNoindex ? 'noindex, follow' : 'index, follow'} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Exhibit On Superior" />
      <meta property="og:title" content={resolvedTitle} />
      <meta property="og:description" content={resolvedDescription} />
      {canonical ? <meta property="og:url" content={canonical} /> : null}
      <meta property="og:image" content={DEFAULT_OG_IMAGE} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={resolvedTitle} />
      <meta name="twitter:description" content={resolvedDescription} />
      <meta name="twitter:image" content={DEFAULT_OG_IMAGE} />

      {jsonLd ? (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      ) : null}
      {extraJsonLd?.map((obj, i) => (
        <script type="application/ld+json" key={i}>
          {JSON.stringify(obj)}
        </script>
      ))}
    </Helmet>
  );
}
