import { Helmet } from 'react-helmet-async';
import { buildSeoModel, type SeoModel, type SeoOptions } from '../data/seo';

interface SeoProps extends SeoOptions {
  path: string;
  /**
   * Pre-built head model (e.g. per-unit pages via buildUnitSeoModel). When
   * set, PAGE_SEO/`opts` are bypassed — the model is emitted as-is, matching
   * what the prerenderer wrote for the same path.
   */
  model?: SeoModel;
}

export function Seo({ path, model: modelProp, ...opts }: SeoProps) {
  const model = modelProp ?? buildSeoModel(path, opts);
  if (!model) return null;

  // During prerender (SSR) the head is emitted deterministically from the same
  // model via `renderHeadTags` (see entry-server.tsx). react-helmet-async does
  // not collect into the server context under React 19, so rendering Helmet on
  // the server would leak these tags into the body. On the client, Helmet owns
  // the live <head>.
  if (typeof window === 'undefined') return null;

  return (
    <Helmet>
      <title>{model.title}</title>
      {model.canonical ? <link rel="canonical" href={model.canonical} /> : null}
      {model.metas.map((m, i) =>
        m.name ? (
          <meta key={i} name={m.name} content={m.content} />
        ) : (
          <meta key={i} property={m.property} content={m.content} />
        ),
      )}
      {model.jsonLd.map((obj, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(obj)}
        </script>
      ))}
    </Helmet>
  );
}
