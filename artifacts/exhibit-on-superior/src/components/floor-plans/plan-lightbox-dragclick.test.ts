// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { cleanup, fireEvent, render, act } from '@testing-library/react';
import { PlanLightbox } from './PlanLightbox';
import { planGroups } from '../../data/floorPlans';

// Desktop drag-to-pan regression tests. Releasing a click-and-drag pan fires
// a synthetic click; the lightbox must suppress it (suppressClick ref) so the
// pan does not count as a tap and toggle zoom mid-gesture. A mousedown+mouseup
// without movement (under the 3px threshold) must still count as a tap.

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

/** Double-click at the viewer centre so the plan ends up pinch-zoomed at 2x with no translation. */
function zoomInAtCentre(img: HTMLElement) {
  clickAt(img, 500, 400);
  act(() => {
    vi.advanceTimersByTime(100);
  });
  clickAt(img, 500, 400);
  expect(img.style.transform).toBe('translate(0px, 0px) scale(2)');
  // Wait out the double-tap window so the following gesture is fresh.
  act(() => {
    vi.advanceTimersByTime(400);
  });
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

describe('PlanLightbox drag-to-pan click suppression', () => {
  it('the trailing click after a drag beyond 3px does not toggle zoom', () => {
    const { img, viewer } = renderLightbox();
    zoomInAtCentre(img);

    // Drag: mousedown on the viewer, move well past the 3px threshold, release.
    fireEvent.mouseDown(viewer, { button: 0, clientX: 500, clientY: 400 });
    act(() => {
      fireEvent.mouseMove(window, { clientX: 460, clientY: 370 });
    });
    // The pan follows the pointer: dx = -40, dy = -30.
    expect(img.style.transform).toBe('translate(-40px, -30px) scale(2)');
    act(() => {
      fireEvent.mouseUp(window, { clientX: 460, clientY: 370 });
    });

    // Browser fires a synthetic click after mouseup — it must be swallowed.
    clickAt(img, 460, 370);

    // Pinch/zoom state unchanged: still 2x at the panned position.
    expect(img.style.transform).toBe('translate(-40px, -30px) scale(2)');

    // No single-tap timer was scheduled, so the coarse scroll-zoom mode
    // (width 160%) must not engage later either.
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(img.style.width).not.toBe('160%');
    expect(img.style.transform).toBe('translate(-40px, -30px) scale(2)');
  });

  it('suppression is consumed once: the next real click still counts as a tap', () => {
    const { img, viewer } = renderLightbox();
    zoomInAtCentre(img);

    // Drag + trailing click (suppressed).
    fireEvent.mouseDown(viewer, { button: 0, clientX: 500, clientY: 400 });
    act(() => {
      fireEvent.mouseMove(window, { clientX: 450, clientY: 400 });
      fireEvent.mouseUp(window, { clientX: 450, clientY: 400 });
    });
    clickAt(img, 450, 400);
    expect(img.style.transform).toBe('translate(-50px, 0px) scale(2)');

    // A subsequent genuine double-click must work again: it resets to fit.
    clickAt(img, 500, 400);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    clickAt(img, 500, 400);
    expect(img.style.transform).toBe('translate(0px, 0px) scale(1)');
  });

  it('mousedown + mouseup without movement still counts as a tap', () => {
    const { img, viewer } = renderLightbox();
    zoomInAtCentre(img);

    // Press and release without any mousemove: no suppression.
    fireEvent.mouseDown(viewer, { button: 0, clientX: 500, clientY: 400 });
    act(() => {
      fireEvent.mouseUp(window, { clientX: 500, clientY: 400 });
    });
    clickAt(img, 500, 400);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    clickAt(img, 500, 400);

    // The two clicks registered as a double-tap: pinch zoom resets to fit.
    expect(img.style.transform).toBe('translate(0px, 0px) scale(1)');
  });

  it('movement within the 3px threshold does not suppress the tap', () => {
    const { img, viewer } = renderLightbox();
    zoomInAtCentre(img);

    fireEvent.mouseDown(viewer, { button: 0, clientX: 500, clientY: 400 });
    act(() => {
      fireEvent.mouseMove(window, { clientX: 502, clientY: 401 }); // ~2.2px, under threshold
      fireEvent.mouseUp(window, { clientX: 502, clientY: 401 });
    });
    clickAt(img, 502, 401);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    clickAt(img, 502, 401);

    // Registered as a double-tap: reset to fit.
    expect(img.style.transform).toBe('translate(0px, 0px) scale(1)');
  });
});
