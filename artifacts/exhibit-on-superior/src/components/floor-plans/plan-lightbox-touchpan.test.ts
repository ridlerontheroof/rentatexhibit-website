// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { cleanup, fireEvent, render, act } from '@testing-library/react';
import { PlanLightbox } from './PlanLightbox';
import { planGroups } from '../../data/floorPlans';

// Touch pan regression tests. A one-finger pan while pinch-zoomed (gesture
// mode 'pan') must never register as a tap on touchend — no single-tap timer
// may be scheduled, so the coarse scroll-zoom mode must not engage later.
// A stationary touch while zoomed must still count as a tap.

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

function touch(x: number, y: number) {
  return { clientX: x, clientY: y };
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

describe('PlanLightbox one-finger touch pan tap suppression', () => {
  it('touchend after a one-finger pan does not schedule a single-tap zoom toggle', () => {
    const { img, viewer } = renderLightbox();
    zoomInAtCentre(img);

    // One-finger pan while pinch-zoomed: start, move well past the 12px slop, lift.
    fireEvent.touchStart(viewer, { touches: [touch(500, 400)], changedTouches: [touch(500, 400)] });
    act(() => {
      fireEvent.touchMove(viewer, { touches: [touch(460, 370)], changedTouches: [touch(460, 370)] });
    });
    // The pan follows the finger: dx = -40, dy = -30.
    expect(img.style.transform).toBe('translate(-40px, -30px) scale(2)');
    act(() => {
      fireEvent.touchEnd(viewer, { touches: [], changedTouches: [touch(460, 370)] });
    });

    // Still 2x at the panned position — the pan did not count as a tap.
    expect(img.style.transform).toBe('translate(-40px, -30px) scale(2)');

    // No single-tap timer was scheduled, so the coarse scroll-zoom mode
    // (width 160%) must not engage later either.
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(img.style.width).not.toBe('160%');
    expect(img.style.transform).toBe('translate(-40px, -30px) scale(2)');
  });

  it('a pan under the 12px tap slop still counts as a tap (double-tap resets to fit)', () => {
    const { img, viewer } = renderLightbox();
    zoomInAtCentre(img);

    // Two stationary taps in quick succession while pinch-zoomed.
    fireEvent.touchStart(viewer, { touches: [touch(500, 400)], changedTouches: [touch(500, 400)] });
    act(() => {
      fireEvent.touchEnd(viewer, { touches: [], changedTouches: [touch(500, 400)] });
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    fireEvent.touchStart(viewer, { touches: [touch(503, 402)], changedTouches: [touch(503, 402)] });
    act(() => {
      fireEvent.touchEnd(viewer, { touches: [], changedTouches: [touch(503, 402)] });
    });

    // Registered as a double-tap: pinch zoom resets to fit.
    expect(img.style.transform).toBe('translate(0px, 0px) scale(1)');
  });

  it('a lone stationary tap after a pan still schedules the single-tap zoom toggle', () => {
    const { img, viewer } = renderLightbox();
    zoomInAtCentre(img);

    // Pan (suppressed as a tap)...
    fireEvent.touchStart(viewer, { touches: [touch(500, 400)], changedTouches: [touch(500, 400)] });
    act(() => {
      fireEvent.touchMove(viewer, { touches: [touch(440, 400)], changedTouches: [touch(440, 400)] });
      fireEvent.touchEnd(viewer, { touches: [], changedTouches: [touch(440, 400)] });
    });
    expect(img.style.transform).toBe('translate(-60px, 0px) scale(2)');

    // ...then a genuine stationary tap: the single-tap timer must fire and
    // toggle the coarse scroll-zoom mode.
    fireEvent.touchStart(viewer, { touches: [touch(400, 300)], changedTouches: [touch(400, 300)] });
    act(() => {
      fireEvent.touchEnd(viewer, { touches: [], changedTouches: [touch(400, 300)] });
    });
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(img.style.width).toBe('160%');
  });
});

describe('PlanLightbox pinch → pan handoff', () => {
  it('lifting one finger after a pinch continues panning from the re-baselined start and the final lift is not a tap', () => {
    const { img, viewer } = renderLightbox();

    // Two-finger pinch out from fit: fingers spread symmetrically around the
    // viewer centre so the midpoint stays put and the scale doubles.
    fireEvent.touchStart(viewer, {
      touches: [touch(400, 400), touch(600, 400)],
      changedTouches: [touch(400, 400), touch(600, 400)],
    });
    act(() => {
      fireEvent.touchMove(viewer, {
        touches: [touch(300, 400), touch(700, 400)],
        changedTouches: [touch(300, 400), touch(700, 400)],
      });
    });
    expect(img.style.transform).toBe('translate(0px, 0px) scale(2)');

    // Lift the second finger: gesture hands off pinch → pan, re-baselining the
    // pan start at the remaining finger (300, 400).
    act(() => {
      fireEvent.touchEnd(viewer, {
        touches: [touch(300, 400)],
        changedTouches: [touch(700, 400)],
      });
    });
    // Handoff alone must not move the image (no jump).
    expect(img.style.transform).toBe('translate(0px, 0px) scale(2)');

    // Keep moving the remaining finger: the pan tracks the delta from the
    // re-baselined start (dx = -40, dy = -30), not the original pinch touch.
    act(() => {
      fireEvent.touchMove(viewer, {
        touches: [touch(260, 370)],
        changedTouches: [touch(260, 370)],
      });
    });
    expect(img.style.transform).toBe('translate(-40px, -30px) scale(2)');

    // Final lift after the continued pan: moved well past the tap slop, so it
    // must not register as a tap.
    act(() => {
      fireEvent.touchEnd(viewer, { touches: [], changedTouches: [touch(260, 370)] });
    });
    expect(img.style.transform).toBe('translate(-40px, -30px) scale(2)');

    // No single-tap timer scheduled: the coarse scroll-zoom mode (width 160%)
    // must not engage later.
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(img.style.width).not.toBe('160%');
    expect(img.style.transform).toBe('translate(-40px, -30px) scale(2)');
  });

  it('a barely-moved remaining finger after handoff still counts as a tap', () => {
    const { img, viewer } = renderLightbox();

    // Pinch out to 2x, then lift one finger to hand off to pan.
    fireEvent.touchStart(viewer, {
      touches: [touch(400, 400), touch(600, 400)],
      changedTouches: [touch(400, 400), touch(600, 400)],
    });
    act(() => {
      fireEvent.touchMove(viewer, {
        touches: [touch(300, 400), touch(700, 400)],
        changedTouches: [touch(300, 400), touch(700, 400)],
      });
    });
    act(() => {
      fireEvent.touchEnd(viewer, {
        touches: [touch(300, 400)],
        changedTouches: [touch(700, 400)],
      });
    });

    // Lift the remaining finger with movement under the 12px slop: this is a
    // tap, so the single-tap timer schedules the scroll-zoom toggle.
    act(() => {
      fireEvent.touchEnd(viewer, { touches: [], changedTouches: [touch(303, 402)] });
    });
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(img.style.width).toBe('160%');
  });
});
