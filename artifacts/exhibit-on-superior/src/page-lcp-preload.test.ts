import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';
import { extractLcpPreload } from './lib/lcpPreload';
import { PageHero } from './components/PageHero';
import { HeroSlider } from './components/HeroSlider';
import { HERO_SLIDES } from './pages/Home';
import { IMAGE_MANIFEST } from './data/imageManifest';

/**
 * Guard for the per-page LCP preload the prerenderer injects (companion to
 * hero-lcp-preload.test.ts, which pins the home template's static hint).
 *
 * The prerenderer calls extractLcpPreload() on each page's SSR markup and
 * rewrites the <!-- lcp:start -->/<!-- lcp:end --> block with the result. For
 * the preload to be a pure win (no double download), the extracted
 * imagesrcset/imagesizes must be byte-for-byte what <SmartImg>'s AVIF <source>
 * renders for that page's eager, high-priority image.
 */

const artifactRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function expectedAvifSrcSet(src: string): string {
  const meta = IMAGE_MANIFEST[src];
  expect(meta, `${src} missing from image manifest`).toBeTruthy();
  return meta.variants
    .filter((v) => v.avif)
    .map((v) => `${v.avif} ${v.w}w`)
    .join(', ');
}

describe('extractLcpPreload', () => {
  it('derives a preload from PageHero markup matching SmartImg exactly', () => {
    const src = '/images/image-002-gettyimages-1286580777-nvdupq.jpg';
    const html = renderToString(createElement(PageHero, { image: src, alt: 'x', title: 'T' }));
    const link = extractLcpPreload(html);
    expect(link).toBe(
      `<link rel="preload" as="image" type="image/avif" imagesrcset="${expectedAvifSrcSet(src)}" imagesizes="100vw" fetchpriority="high">`,
    );
  });

  it('picks only the first slide from the home HeroSlider (matches index.html hint)', () => {
    const html = renderToString(createElement(HeroSlider, { slides: HERO_SLIDES }));
    const link = extractLcpPreload(html);

    // Must agree with the static template hint guarded by hero-lcp-preload.test.ts,
    // so re-injecting the block on the home page is a no-op change in content.
    const template = readFileSync(path.join(artifactRoot, 'index.html'), 'utf8');
    const templateLink = template
      .match(/<!--\s*lcp:start\s*-->([\s\S]*?)<!--\s*lcp:end\s*-->/)![1]
      .match(/<link\b[^>]*>/)![0];
    expect(link).toBe(templateLink);
  });

  it('ignores lazy pictures and returns null when no eager AVIF image exists', () => {
    const lazy = renderToString(
      createElement(PageHero, { image: '/images/nonexistent.jpg', alt: 'x', title: 'T' }),
    );
    // nonexistent image -> plain <img>, no <picture> at all
    expect(extractLcpPreload(lazy)).toBeNull();

    const html =
      '<picture><source type="image/avif" srcset="/a.avif 800w" sizes="100vw"/><img src="/a.webp" loading="lazy"/></picture>';
    expect(extractLcpPreload(html)).toBeNull();
  });

  it('never emits an href (browsers without imagesrcset must skip the hint)', () => {
    const src = '/images/image-002-gettyimages-1286580777-nvdupq.jpg';
    const html = renderToString(createElement(PageHero, { image: src, alt: 'x', title: 'T' }));
    expect(extractLcpPreload(html)).not.toMatch(/\bhref=/);
  });
});
