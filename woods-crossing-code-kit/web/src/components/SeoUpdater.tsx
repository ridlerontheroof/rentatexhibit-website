import { useEffect } from "react";
import { useLocation } from "wouter";
import { buildSeo } from "../lib/seo";

export function SeoUpdater() {
  const [location] = useLocation();

  useEffect(() => {
    const model = buildSeo(location);
    
    document.title = model.title;
    
    const setMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('description', model.description);
    setMeta('og:title', model.title, true);
    setMeta('og:description', model.description, true);
    setMeta('og:url', model.canonical, true);
    setMeta('twitter:title', model.title);
    setMeta('twitter:description', model.description);

    let canEl = document.querySelector('link[rel="canonical"]');
    if (!canEl) {
      canEl = document.createElement('link');
      canEl.setAttribute('rel', 'canonical');
      document.head.appendChild(canEl);
    }
    canEl.setAttribute('href', model.canonical);
    
    // JSON-LD is intentionally omitted from the client updater to avoid injecting duplicate tags
    // on SPA navigations, since bots read the SSR HTML anyway.

  }, [location]);

  return null;
}
