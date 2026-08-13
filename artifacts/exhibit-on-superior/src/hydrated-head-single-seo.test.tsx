// @vitest-environment jsdom
// A hydrated page must expose exactly ONE set of OG/Twitter/canonical/title
// tags. The static index.html (and every prerendered page) ships a full SEO
// block between the seo:start/seo:end head markers; on boot the client strips
// that block (stripPrerenderedSeo, called from main.tsx) before Helmet emits
// the current route's tags. Without the strip, JS-executing preview scrapers
// (iMessage's WebKit load, rendered crawls) saw two different og:image tags —
// the homepage card plus the route's own — and rendered a two-image share
// card. This guard fails if a hydrated head ever ends up with duplicates
// again.
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { Seo } from './components/Seo';
import { stripPrerenderedSeo } from './lib/stripPrerenderedSeo';

// Mirrors the static homepage block in index.html (the exact tags a dev/SPA
// fallback load carries before hydration), plus a data-ssr-jsonld script like
// prerendered pages have.
const STATIC_SEO_BLOCK = `
  <meta charset="UTF-8" />
  <!-- seo:start -->
  <title>Luxury Apartments in River North Chicago | Exhibit On Superior</title>
  <meta name="description" content="Static homepage description." />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <link rel="canonical" href="https://www.rentatexhibit.com/" />
  <meta property="og:title" content="Static homepage og title" />
  <meta property="og:description" content="Static homepage description." />
  <meta property="og:image" content="https://www.rentatexhibit.com/images/og/home.jpg?v=8" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Static homepage twitter title" />
  <meta name="twitter:image" content="https://www.rentatexhibit.com/images/og/home.jpg?v=8" />
  <script type="application/ld+json" data-ssr-jsonld>{"@type":"ApartmentComplex"}</script>
  <!-- seo:end -->
  <link rel="icon" href="/favicon.ico" />
`;

function seedStaticHead() {
  document.head.innerHTML = STATIC_SEO_BLOCK;
}

function bootStrip() {
  // Same order as main.tsx: JSON-LD strip, then the SEO block strip.
  document.querySelectorAll('script[data-ssr-jsonld]').forEach((el) => el.remove());
  stripPrerenderedSeo();
}

function count(selector: string) {
  return document.head.querySelectorAll(selector).length;
}

afterEach(() => {
  cleanup();
  document.head.innerHTML = '';
});

describe('hydrated head carries exactly one SEO tag set', () => {
  const routes = ['/', '/amenities', '/pet-friendly', '/contact-us'];

  for (const path of routes) {
    it(`route ${path} has single og:image/og:title/canonical/twitter:image/title`, async () => {
      seedStaticHead();
      bootStrip();
      const view = render(
        <HelmetProvider>
          <Seo path={path} />
        </HelmetProvider>,
      );
      await waitFor(() => expect(count('meta[property="og:image"]')).toBe(1));
      expect(count('meta[property="og:title"]')).toBe(1);
      expect(count('meta[property="og:description"]')).toBe(1);
      expect(count('meta[name="twitter:image"]')).toBe(1);
      expect(count('meta[name="twitter:title"]')).toBe(1);
      expect(count('link[rel="canonical"]')).toBe(1);
      expect(count('meta[name="description"]')).toBe(1);
      expect(count('meta[name="robots"]')).toBe(1);
      expect(count('title')).toBe(1);
      view.unmount();
    });
  }

  it('non-home routes end up with their own og:image, not the homepage card', async () => {
    seedStaticHead();
    bootStrip();
    const view = render(
      <HelmetProvider>
        <Seo path="/amenities" />
      </HelmetProvider>,
    );
    await waitFor(() => expect(count('meta[property="og:image"]')).toBe(1));
    const og = document.head.querySelector('meta[property="og:image"]');
    expect(og?.getAttribute('content')).toContain('/images/og/amenities.jpg');
    view.unmount();
  });

  it('strip preserves the markers and non-SEO head tags', () => {
    seedStaticHead();
    bootStrip();
    expect(count('meta[charset]')).toBe(1);
    expect(count('link[rel="icon"]')).toBe(1);
    const comments = Array.from(document.head.childNodes)
      .filter((n) => n.nodeType === Node.COMMENT_NODE)
      .map((n) => n.textContent?.trim());
    expect(comments).toContain('seo:start');
    expect(comments).toContain('seo:end');
    expect(count('meta[property="og:image"]')).toBe(0);
  });
});
