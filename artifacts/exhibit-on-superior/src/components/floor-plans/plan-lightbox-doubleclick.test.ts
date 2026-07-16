// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { cleanup, fireEvent, render, act } from '@testing-library/react';
import { PlanLightbox } from './PlanLightbox';
import { planGroups } from '../../data/floorPlans';

// Desktop double-click zoom regression tests. Clicks on the plan image are
// routed through the shared tap handler: two clicks within the 300ms
// double-tap window zoom ~2x toward the clicked point; a lone click (after
// the window elapses) toggles the coarse scroll-zoom mode instead.

const VIEWER_W = 1000;
const VIEWER_H = 800;

function stubMatchMedia() {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

function renderLightbox() {
  const view = render(
    createElement(PlanLightbox, {
      group: planGroups[0],
      variantIndex: 0,
      position: { index: 0, total: 1 },
      onClose: () => {},
      onNavigate: () => {},
      onVariantChange: () => {},
    }),
  );
  const img = document.querySelector('img[alt*="floor plan"]') as HTMLImageElement;
  expect(img).toBeTruthy();
  const viewer = img.parentElement as HTMLElement;

  // jsdom has no layout: give the viewer and image real dimensions so the
  // click-point math and pan clamping behave like in a browser.
  viewer.getBoundingClientRect = () =>
    ({ left: 0, top: 0, right: VIEWER_W, bottom: VIEWER_H, width: VIEWER_W, height: VIEWER_H, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
  for (const el of [viewer, img]) {
    Object.defineProperty(el, 'clientWidth', { value: VIEWER_W, configurable: true });
    Object.defineProperty(el, 'clientHeight', { value: VIEWER_H, configurable: true });
  }
  return { view, img, viewer };
}

function clickAt(img: HTMLElement, x: number, y: number) {
  fireEvent.click(img, { clientX: x, clientY: y });
}

beforeEach(() => {
  stubMatchMedia();
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  act(() => {
    vi.runOnlyPendingTimers();
  });
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('PlanLightbox desktop double-click zoom', () => {
  it('two rapid clicks zoom to 2x translated toward the clicked point', () => {
    const { img } = renderLightbox();

    // Click at (750, 600); viewer centre is (500, 400). Expected translation
    // pulls the clicked point toward the centre: -(x-cx)*(s-1) = -250, -200.
    clickAt(img, 750, 600);
    act(() => {
      vi.advanceTimersByTime(100); // still inside the 300ms double-click window
    });
    clickAt(img, 750, 600);

    expect(img.style.transform).toBe('translate(-250px, -200px) scale(2)');

    // The pending single-click timer must have been cancelled: the coarse
    // scroll-zoom mode (width 160%) must NOT engage afterwards.
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(img.style.width).not.toBe('160%');
    expect(img.style.transform).toBe('translate(-250px, -200px) scale(2)');
  });

  it('clamps the double-click translation so the image never leaves the frame', () => {
    const { img } = renderLightbox();

    // Clicking the extreme corner would want tx = -(1000-500) = -500, which is
    // exactly the hard clamp limit ((1000*2 - 1000)/2); nothing beyond it.
    clickAt(img, 1000, 800);
    act(() => {
      vi.advanceTimersByTime(50);
    });
    clickAt(img, 1000, 800);

    expect(img.style.transform).toBe('translate(-500px, -400px) scale(2)');
  });

  it('a lone click after the double-click window toggles the coarse zoom mode', () => {
    const { img } = renderLightbox();

    clickAt(img, 500, 400);
    // Not zoomed yet — the handler waits out the double-click window.
    expect(img.style.width).not.toBe('160%');

    act(() => {
      vi.advanceTimersByTime(300); // single-tap timer fires
    });
    // Coarse scroll-zoom mode: the image is rendered at 160% width.
    expect(img.style.width).toBe('160%');
  });

  it('double-click while pinch-zoomed returns to fit', () => {
    const { img } = renderLightbox();

    // Zoom in via double-click…
    clickAt(img, 750, 600);
    act(() => vi.advanceTimersByTime(100));
    clickAt(img, 750, 600);
    expect(img.style.transform).toBe('translate(-250px, -200px) scale(2)');

    // Wait past the double-tap window so the next pair is a fresh gesture.
    act(() => {
      vi.advanceTimersByTime(400);
    });

    // …then double-click again to reset to fit.
    clickAt(img, 300, 300);
    act(() => vi.advanceTimersByTime(100));
    clickAt(img, 300, 300);
    expect(img.style.transform).toBe('translate(0px, 0px) scale(1)');
    // Coarse zoom mode must stay off after the reset.
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(img.style.width).not.toBe('160%');
  });

  it('double-click while in coarse zoom mode returns to fit', () => {
    const { img } = renderLightbox();

    // Enter coarse zoom mode with a lone click.
    clickAt(img, 500, 400);
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(img.style.width).toBe('160%');

    // Double-click exits coarse zoom mode (200ms exit animation).
    clickAt(img, 500, 400);
    act(() => vi.advanceTimersByTime(100));
    clickAt(img, 500, 400);
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(img.style.width).not.toBe('160%');
    expect(img.style.transform).toBe('translate(0px, 0px) scale(1)');
  });
});
