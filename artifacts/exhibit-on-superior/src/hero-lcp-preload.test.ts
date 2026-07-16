import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HERO_SLIDES } from './pages/Home';
import { IMAGE_MANIFEST } from './data/imageManifest';

/**
 * Regression guard for the home-hero LCP preload (task "Serve smaller AVIF
 * hero images to first-time visitors faster").
 *
 * index.html carries a <link rel="preload" as="image" type="image/avif">
 * hint inside <!-- lcp:start --> / <!-- lcp:end --> markers. For the preload
 * to be a pure win (no double download), its imagesrcset/imagesizes must be
 * byte-for-byte what <SmartImg>'s AVIF <source> renders for HERO_SLIDES[0] —
 * the browser then reuses the preloaded response for the <picture> request.
 *
 * If the first hero slide or its manifest variants change, this test fails
 * until index.html is updated to match.
 */

const artifactRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(path.join(artifactRoot, 'index.html'), 'utf8');

describe('home hero LCP preload', () => {
  const block = html.match(/<!--\s*lcp:start\s*-->([\s\S]*?)<!--\s*lcp:end\s*-->/)?.[1];

  it('has the lcp marker block with a single AVIF image preload', () => {
    expect(block).toBeTruthy();
    const links = [...block!.matchAll(/<link\b[^>]*>/g)].map((m) => m[0]);
    expect(links).toHaveLength(1);
    const link = links[0];
    expect(link).toContain('rel="preload"');
    expect(link).toContain('as="image"');
    expect(link).toContain('type="image/avif"');
    expect(link).toContain('fetchpriority="high"');
    // No href: browsers without imagesrcset support must skip the hint
    // entirely instead of preloading a single fixed URL they may not use.
    expect(link).not.toMatch(/\bhref=/);
  });

  it('imagesrcset/imagesizes exactly match what SmartImg renders for the first slide', () => {
    const link = block!.match(/<link\b[^>]*>/)![0];
    const imagesrcset = link.match(/imagesrcset="([^"]*)"/)?.[1];
    const imagesizes = link.match(/imagesizes="([^"]*)"/)?.[1];

    const meta = IMAGE_MANIFEST[HERO_SLIDES[0].src];
    expect(meta, `first hero slide ${HERO_SLIDES[0].src} missing from image manifest`).toBeTruthy();

    // Mirror SmartImg's AVIF srcSet construction exactly.
    const expectedSrcSet = meta.variants.map((v) => `${v.avif} ${v.w}w`).join(', ');
    expect(imagesrcset).toBe(expectedSrcSet);

    // HeroSlider passes sizes="100vw" to SmartImg.
    expect(imagesizes).toBe('100vw');
  });

  it('every preloaded AVIF variant file exists in public/', () => {
    const meta = IMAGE_MANIFEST[HERO_SLIDES[0].src];
    for (const v of meta.variants) {
      expect(
        () => readFileSync(path.join(artifactRoot, 'public', v.avif.replace(/^\//, ''))),
        `${v.avif} missing from public/`,
      ).not.toThrow();
    }
  });
});
