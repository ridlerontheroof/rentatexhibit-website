// extractLcpPreload derives each prerendered page's LCP preload hint from the
// markup SmartImg actually rendered. If SmartImg's output shape ever drifts
// (attribute order, casing, nesting), the extractor would return null and
// pages would silently ship without the hint — so these tests render real
// SmartImg SSR output (renderToString, the same renderer prerender.mjs uses)
// and assert extraction still works, plus the deliberate null cases.
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { extractLcpPreload } from './lcpPreload';

vi.mock('../data/imageManifest', () => ({
  IMAGE_MANIFEST: {
    '/images/hero.jpg': {
      width: 1600,
      height: 900,
      variants: [
        { src: '/images/hero-400w.webp', avif: '/images/hero-400w.avif', w: 400 },
        { src: '/images/hero-1600w.webp', avif: '/images/hero-1600w.avif', w: 1600 },
      ],
    },
    '/images/no-avif.jpg': {
      width: 800,
      height: 600,
      variants: [
        { src: '/images/no-avif-400w.webp', w: 400 },
        { src: '/images/no-avif-800w.webp', w: 800 },
      ],
    },
  },
}));

const { SmartImg } = await import('../components/SmartImg');

const eagerProps = { loading: 'eager', fetchPriority: 'high' } as const;

function ssr(...nodes: React.ReactElement[]) {
  return nodes.map((n) => renderToString(n)).join('\n');
}

describe('extractLcpPreload against real SmartImg SSR output', () => {
  it('extracts an AVIF imagesrcset preload from an eager high-priority SmartImg', () => {
    const html = ssr(
      createElement(SmartImg, {
        src: '/images/hero.jpg',
        alt: 'hero',
        sizes: '(min-width: 1024px) 50vw, 100vw',
        ...eagerProps,
      }),
    );
    const link = extractLcpPreload(html);
    expect(link).toBe(
      '<link rel="preload" as="image" type="image/avif" ' +
        'imagesrcset="/images/hero-400w.avif 400w, /images/hero-1600w.avif 1600w" ' +
        'imagesizes="(min-width: 1024px) 50vw, 100vw" fetchpriority="high">',
    );
    // The hint must be href-less so non-imagesrcset browsers skip it.
    expect(link).not.toMatch(/\bhref=/);
  });

  it('uses SmartImg default sizes (100vw) when none passed', () => {
    const html = ssr(
      createElement(SmartImg, { src: '/images/hero.jpg', alt: 'hero', ...eagerProps }),
    );
    expect(extractLcpPreload(html)).toContain('imagesizes="100vw"');
  });

  it('picks the first high-priority picture, ignoring earlier lazy ones', () => {
    const html = ssr(
      createElement(SmartImg, { src: '/images/hero.jpg', alt: 'lazy decorative' }),
      createElement(SmartImg, { src: '/images/hero.jpg', alt: 'the LCP', ...eagerProps }),
    );
    const link = extractLcpPreload(html);
    expect(link).toContain('imagesrcset="/images/hero-400w.avif 400w, /images/hero-1600w.avif 1600w"');
  });

  it('returns null when the eager image has no AVIF variants', () => {
    const html = ssr(
      createElement(SmartImg, { src: '/images/no-avif.jpg', alt: 'no avif', ...eagerProps }),
    );
    expect(extractLcpPreload(html)).toBeNull();
  });

  it('returns null when the page has no eager high-priority image at all', () => {
    const html = ssr(
      createElement(SmartImg, { src: '/images/hero.jpg', alt: 'lazy only' }),
    );
    expect(extractLcpPreload(html)).toBeNull();
  });

  it('returns null for an eager plain <img> outside a <picture> (unknown manifest path)', () => {
    const html = ssr(
      createElement(SmartImg, { src: '/images/unknown.jpg', alt: 'plain', ...eagerProps }),
    );
    expect(extractLcpPreload(html)).toBeNull();
  });
});

describe('extractLcpPreload shape variations', () => {
  const srcset = '/images/x-400w.avif 400w';

  it('tolerates reordered/case-varied attributes inside <source>', () => {
    const html =
      '<picture><source srcset="' + srcset + '" sizes="50vw" TYPE="image/avif"/>' +
      '<img src="/x.webp" loading="eager" fetchpriority="high"/></picture>';
    const link = extractLcpPreload(html);
    expect(link).toContain(`imagesrcset="${srcset}"`);
    expect(link).toContain('imagesizes="50vw"');
  });

  it('falls back to 100vw when the AVIF <source> omits sizes', () => {
    const html =
      '<picture><source type="image/avif" srcset="' + srcset + '"/>' +
      '<img src="/x.webp" fetchpriority="high"/></picture>';
    expect(extractLcpPreload(html)).toContain('imagesizes="100vw"');
  });

  it('returns null when the AVIF <source> has an empty srcset', () => {
    const html =
      '<picture><source type="image/avif" srcset=""/>' +
      '<img src="/x.webp" fetchpriority="high"/></picture>';
    expect(extractLcpPreload(html)).toBeNull();
  });
});
