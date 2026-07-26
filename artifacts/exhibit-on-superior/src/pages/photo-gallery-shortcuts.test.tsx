// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, act } from '@testing-library/react';

/**
 * Touch-gesture and keyboard-shortcut legend tests for the site-wide Photo
 * Gallery page's lightbox, mirroring unit-gallery-shortcuts.test.tsx — the
 * gallery reuses the same usePinchZoom gesture model and desktop legend as
 * the unit photo gallery, so the same contracts apply:
 *
 *  - a horizontal touch swipe changes photos (and dismisses the legend),
 *  - the "?" key / button toggles a legend that lists exactly the handled
 *    shortcuts,
 *  - Escape first closes the legend, then the lightbox.
 */

import { PhotoGallery, lightboxImages } from './PhotoGallery';

vi.mock('../components/Seo', () => ({ Seo: () => null }));
vi.mock('../components/QuickAnswer', () => ({ QuickAnswer: () => null }));
vi.mock('../components/FaqSection', () => ({ FaqSection: () => null }));

function openLightbox() {
  render(<PhotoGallery />);
  // Click the grid thumbnail for the first lightbox image so the counter
  // starts at "1 / N".
  const thumbs = screen.getAllByRole('button');
  const first = thumbs.find((b) =>
    b.querySelector(`img[alt="${lightboxImages[0].alt}"]`),
  );
  if (!first) throw new Error('first gallery thumbnail not rendered');
  fireEvent.click(first);
}

beforeEach(() => {
  window.history.replaceState(null, '', '/photo-gallery');
});
afterEach(() => cleanup());

function pressKey(key: string) {
  act(() => {
    fireEvent.keyDown(document.body, { key, bubbles: true });
  });
}

/** Which photo is showing, from the "1 / N" counter. */
function shownCounter(): string {
  const m = /(\d+ \/ \d+)/.exec(document.body.textContent ?? '');
  if (!m) throw new Error('photo counter not rendered');
  return m[1];
}

type Pt = { x: number; y: number };

function touchList(points: Pt[]) {
  return points.map((p, i) => ({ identifier: i, clientX: p.x, clientY: p.y }));
}

/** jsdom has no TouchEvent constructor; a plain Event with touches attached
 *  works because React's synthetic event reads them off the native event.
 *  Dispatched on the lightbox image; it bubbles to the viewer container
 *  where the touch handlers live. */
function fireTouch(
  type: 'touchstart' | 'touchmove' | 'touchend',
  touches: Pt[],
  changedTouches: Pt[] = touches,
) {
  const img = document.querySelector('.fixed.inset-0 img');
  if (!img) throw new Error('lightbox image not rendered');
  act(() => {
    const e = new Event(type, { bubbles: true, cancelable: true });
    Object.assign(e, {
      touches: touchList(touches),
      changedTouches: touchList(changedTouches),
    });
    img.dispatchEvent(e);
  });
}

describe('photo gallery lightbox touch swipe', () => {
  it('a >50px horizontal swipe changes the photo', () => {
    openLightbox();
    expect(shownCounter()).toBe(`1 / ${lightboxImages.length}`);

    fireTouch('touchstart', [{ x: 200, y: 100 }]);
    fireTouch('touchmove', [{ x: 100, y: 100 }]);
    fireTouch('touchend', [], [{ x: 100, y: 100 }]);
    expect(shownCounter()).toBe(`2 / ${lightboxImages.length}`);

    // Rightward swipe goes back.
    fireTouch('touchstart', [{ x: 100, y: 100 }]);
    fireTouch('touchmove', [{ x: 200, y: 100 }]);
    fireTouch('touchend', [], [{ x: 200, y: 100 }]);
    expect(shownCounter()).toBe(`1 / ${lightboxImages.length}`);
  });
});

describe('photo gallery shortcut legend contents', () => {
  it('opens via the "?" key and lists exactly the handled shortcuts', () => {
    openLightbox();
    expect(document.getElementById('photo-gallery-shortcuts-legend')).toBeNull();

    pressKey('?');
    const legend = document.getElementById('photo-gallery-shortcuts-legend');
    expect(legend, 'legend should appear after pressing ?').toBeTruthy();

    // The exact rows the legend advertises. If a shortcut is added, removed,
    // or remapped in the key handler, update BOTH the legend markup and this
    // list.
    const keys = Array.from(legend!.querySelectorAll('dt')).map((dt) => dt.textContent?.trim());
    expect(keys).toEqual(['+ / −', '0', '← →', 'Arrows', 'Esc', '?']);

    // "?" toggles the panel closed again — the legend's own last row.
    pressKey('?');
    expect(document.getElementById('photo-gallery-shortcuts-legend')).toBeNull();
  });

  it('has a "?" toggle button wired to the same legend', () => {
    openLightbox();
    const btn = screen.getByRole('button', { name: /show keyboard shortcuts/i });
    expect(btn.getAttribute('aria-controls')).toBe('photo-gallery-shortcuts-legend');
    fireEvent.click(btn);
    expect(document.getElementById('photo-gallery-shortcuts-legend')).toBeTruthy();
  });
});

describe('legend dismiss behavior mirrors the unit gallery', () => {
  it('Escape first closes the legend, second Escape closes the lightbox', () => {
    openLightbox();
    pressKey('?');
    expect(document.getElementById('photo-gallery-shortcuts-legend')).toBeTruthy();

    pressKey('Escape');
    expect(document.getElementById('photo-gallery-shortcuts-legend')).toBeNull();
    // Lightbox still open.
    expect(document.querySelector('.fixed.inset-0 img')).toBeTruthy();

    pressKey('Escape');
    expect(document.querySelector('.fixed.inset-0 img')).toBeNull();
  });

  it('a click outside the legend dismisses it without closing the lightbox', () => {
    openLightbox();
    pressKey('?');
    expect(document.getElementById('photo-gallery-shortcuts-legend')).toBeTruthy();

    // Click on a non-interactive part of the lightbox (the photo image).
    const img = document.querySelector('.fixed.inset-0 img')!;
    fireEvent.click(img);
    expect(document.getElementById('photo-gallery-shortcuts-legend')).toBeNull();
    expect(document.querySelector('.fixed.inset-0 img')).toBeTruthy();
  });

  it('a touch swipe changes the photo AND dismisses the legend (tablet flow)', () => {
    openLightbox();
    pressKey('?');
    expect(document.getElementById('photo-gallery-shortcuts-legend')).toBeTruthy();
    expect(shownCounter()).toBe(`1 / ${lightboxImages.length}`);

    // >50px horizontal swipe at scale 1: navigates to the next photo.
    // Touch gestures never end in a click, so the click-capture dismiss
    // can't run — the swipe handler itself must clear the legend.
    fireTouch('touchstart', [{ x: 200, y: 100 }]);
    fireTouch('touchmove', [{ x: 100, y: 100 }]);
    fireTouch('touchend', [], [{ x: 100, y: 100 }]);

    expect(shownCounter()).toBe(`2 / ${lightboxImages.length}`);
    expect(document.getElementById('photo-gallery-shortcuts-legend')).toBeNull();
  });

  it('arrow-key navigation keeps the legend open', () => {
    openLightbox();
    pressKey('?');
    expect(shownCounter()).toBe(`1 / ${lightboxImages.length}`);

    pressKey('ArrowRight');
    expect(shownCounter()).toBe(`2 / ${lightboxImages.length}`);
    expect(document.getElementById('photo-gallery-shortcuts-legend')).toBeTruthy();

    pressKey('ArrowLeft');
    expect(shownCounter()).toBe(`1 / ${lightboxImages.length}`);
    expect(document.getElementById('photo-gallery-shortcuts-legend')).toBeTruthy();
  });

  it('clicks inside the legend keep it open; its × button closes it', () => {
    openLightbox();
    pressKey('?');
    const legend = document.getElementById('photo-gallery-shortcuts-legend')!;

    fireEvent.click(legend);
    expect(document.getElementById('photo-gallery-shortcuts-legend')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /dismiss keyboard shortcuts/i }));
    expect(document.getElementById('photo-gallery-shortcuts-legend')).toBeNull();
  });
});
