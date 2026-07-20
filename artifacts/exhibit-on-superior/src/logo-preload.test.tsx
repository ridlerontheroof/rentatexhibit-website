import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { Router } from 'wouter';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

/**
 * Regression guard for the header/footer logo (task "Stop preloading the heavy
 * PNG logo when a far smaller version exists").
 *
 * A plain eager <img src="...logo....png"> makes React 19's SSR automatically
 * emit <link rel="preload" as="image" href="...png"> into every prerendered
 * page, so first-time visitors download the full-size PNG at high priority.
 * Rendering the logo through <SmartImg> (a <picture> with AVIF/WebP variants)
 * suppresses that auto-preload and serves a far smaller file.
 */
describe('logo rendering', () => {
  it('Header renders the logo inside a <picture> with variant sources, not a bare PNG <img>', () => {
    const html = renderToString(
      <Router ssrPath="/">
        <Header />
      </Router>,
    );
    // The logo must not be a plain <img> pointing at the original PNG —
    // that's what triggers React's automatic PNG preload during SSR.
    expect(html).not.toContain('a7pvg4.png');
    // It must go through SmartImg's <picture> with AVIF + WebP variants.
    expect(html).toMatch(/<picture><source type="image\/avif"[^>]*a7pvg4[^>]*>/);
    expect(html).toMatch(/<img[^>]*src[sS]et="[^"]*a7pvg4[^"]*\.webp/);
  });

  it('Footer renders the white SVG logo lazily so SSR emits no image preload', () => {
    const html = renderToString(
      <Router ssrPath="/">
        <Footer />
      </Router>,
    );
    // Footer uses the white-letters SVG on the dark band — no raster PNG.
    expect(html).not.toContain('a7pvg4.png');
    const match = html.match(/<img[^>]*exhibit-logo-white\.svg[^>]*>/);
    expect(match, 'Footer must render the white SVG logo').toBeTruthy();
    // The <img> must be lazy: an eager plain <img> makes React 19 SSR emit a
    // fixed-href preload into every prerendered head, which the prerender
    // guard rejects and which would fail the production build.
    expect(match![0]).toMatch(/loading="lazy"/);
  });
});
