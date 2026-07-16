// @vitest-environment jsdom
// SmartImg must never ship a broken <picture>: the AVIF <source> may only
// list rungs that actually have an avif file, the WebP srcSet always lists
// every rung, and when no rung has avif the <source> is omitted entirely.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { cleanup, render } from '@testing-library/react';

vi.mock('../data/imageManifest', () => ({
  IMAGE_MANIFEST: {
    '/images/mixed.jpg': {
      width: 1600,
      height: 900,
      variants: [
        { src: '/images/mixed-400w.webp', avif: '/images/mixed-400w.avif', w: 400 },
        // AVIF rung dropped: couldn't beat the WebP twin.
        { src: '/images/mixed-800w.webp', w: 800 },
        { src: '/images/mixed-1600w.webp', avif: '/images/mixed-1600w.avif', w: 1600 },
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

import { SmartImg } from './SmartImg';

afterEach(() => cleanup());

describe('SmartImg picture output', () => {
  it('mixed manifest: AVIF <source> lists only avif rungs; WebP srcSet lists all rungs', () => {
    const { container } = render(
      createElement(SmartImg, { src: '/images/mixed.jpg', alt: 'mixed' }),
    );
    const picture = container.querySelector('picture');
    expect(picture).not.toBeNull();

    const source = picture!.querySelector('source');
    expect(source).not.toBeNull();
    expect(source!.getAttribute('type')).toBe('image/avif');
    expect(source!.getAttribute('srcset')).toBe(
      '/images/mixed-400w.avif 400w, /images/mixed-1600w.avif 1600w',
    );

    const img = picture!.querySelector('img');
    expect(img).not.toBeNull();
    expect(img!.getAttribute('srcset')).toBe(
      '/images/mixed-400w.webp 400w, /images/mixed-800w.webp 800w, /images/mixed-1600w.webp 1600w',
    );
    // Falls back to the largest WebP rung with intrinsic dimensions (no CLS).
    expect(img!.getAttribute('src')).toBe('/images/mixed-1600w.webp');
    expect(img!.getAttribute('width')).toBe('1600');
    expect(img!.getAttribute('height')).toBe('900');
  });

  it('no rung has avif: renders no <source> at all, WebP fallback intact', () => {
    const { container } = render(
      createElement(SmartImg, { src: '/images/no-avif.jpg', alt: 'no avif' }),
    );
    const picture = container.querySelector('picture');
    expect(picture).not.toBeNull();
    expect(picture!.querySelector('source')).toBeNull();

    const img = picture!.querySelector('img');
    expect(img!.getAttribute('srcset')).toBe(
      '/images/no-avif-400w.webp 400w, /images/no-avif-800w.webp 800w',
    );
    expect(img!.getAttribute('src')).toBe('/images/no-avif-800w.webp');
  });

  it('path missing from manifest: plain <img>, no <picture>', () => {
    const { container } = render(
      createElement(SmartImg, { src: '/images/unknown.jpg', alt: 'unknown' }),
    );
    expect(container.querySelector('picture')).toBeNull();
    const img = container.querySelector('img');
    expect(img!.getAttribute('src')).toBe('/images/unknown.jpg');
    // No empty srcset must ever be emitted.
    expect(img!.getAttribute('srcset')).toBeNull();
  });
});
