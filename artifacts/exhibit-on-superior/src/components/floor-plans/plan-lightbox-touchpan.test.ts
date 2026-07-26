// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, type RenderResult } from '@testing-library/react';
import { createElement } from 'react';
import { PlanLightbox } from './PlanLightbox';
import { stubTransformAwareRects } from './lightbox-rect-stub';
import type { Plan, PlanGroup } from '../../data/floorPlans';

// ---------------------------------------------------------------------------
// Touch pan-release regression tests for the floor-plan lightbox.
//
// While pinch/double-tap zoomed in, a one-finger touch starts the 'pan'
// gesture. On touchend, a pan that moved more than TAP_MOVE_SLOP (12px) must
// end silently — no handleTap, so no single-tap coarse-zoom toggle and no
// double-tap reset — otherwise every pan release on a phone would flip zoom
// modes. A "pan" that moved less than the slop is really a tap: it must reach
// handleTap AND preventDefault the touchend so the browser's synthetic click
// doesn't fire handleTap a second time. Harness mirrors
// plan-lightbox-dragpan.test.ts / plan-lightbox-doubletap.test.ts.
// ---------------------------------------------------------------------------

const DOUBLE_TAP_SCALE = 2;

const VIEWER_W = 800;
const VIEWER_H = 600;
const CX = VIEWER_W / 2;
const CY = VIEWER_H / 2;

function makePlan(): Plan {
  return {
    id: 'unit-06-6-29',
    unit: 6,
    floorLabel: '6-29',
    floors: [6, 7, 8],
    floorMin: 6,
    floorMax: 29,
    mezzanine: false,
    category: '1br',
    typeLabel: '1 Bed / 1 Bath',
    beds: 1,
    baths: 1,
    den: false,
    sqft: 750,
    sqftMin: 750,
    images: {
      thumb: '/images/floor-plans/thumb.webp',
      detail: '/images/floor-plans/detail.webp',
      zoom: '/images/floor-plans/zoom.webp',
    },
  };
}

function makeGroup(): PlanGroup {
  const plan = makePlan();
  return {
    id: '6-1br-1-std',
    unit: plan.unit,
    category: plan.category,
    typeLabel: plan.typeLabel,
    beds: plan.beds,
    baths: plan.baths,
    den: plan.den,
    sqftMin: plan.sqft,
    sqftMax: plan.sqft,
    bands: [],
    floors: plan.floors,
    variants: [plan],
    images: plan.images,
  };
}

let view: RenderResult | null = null;

const sizeDescriptors: Array<{
  proto: object;
  prop: string;
  original: PropertyDescriptor | undefined;
}> = [];

function stubClientSize(proto: object, prop: string, value: number) {
  sizeDescriptors.push({
    proto,
    prop,
    original: Object.getOwnPropertyDescriptor(proto, prop),
  });
  Object.defineProperty(proto, prop, { configurable: true, get: () => value });
}

beforeEach(() => {
  vi.useFakeTimers();

  stubClientSize(HTMLElement.prototype, 'clientWidth', VIEWER_W);
  stubClientSize(HTMLElement.prototype, 'clientHeight', VIEWER_H);
  stubTransformAwareRects({ viewerWidth: VIEWER_W, viewerHeight: VIEWER_H });

  view = render(
    createElement(PlanLightbox, {
      group: makeGroup(),
      variantIndex: 0,
      position: { index: 0, total: 3 },
      onClose: vi.fn(),
      onNavigate: vi.fn(),
      onVariantChange: vi.fn(),
    }),
  );
});

afterEach(() => {
  view?.unmount();
  view = null;
  for (const { proto, prop, original } of sizeDescriptors.splice(0)) {
    if (original) Object.defineProperty(proto, prop, original);
    else delete (proto as Record<string, unknown>)[prop];
  }
  document.body.innerHTML = '';
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function planImage(): HTMLImageElement {
  const img = document.querySelector('img');
  if (!img) throw new Error('floor-plan image not rendered');
  return img;
}

function clickAt(x: number, y: number) {
  act(() => {
    planImage().dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, clientX: x, clientY: y }),
    );
  });
}

/** Two clicks at the same point, within the 300ms double-tap window. */
function doubleClickAt(x: number, y: number, gapMs = 100) {
  clickAt(x, y);
  act(() => {
    vi.advanceTimersByTime(gapMs);
  });
  clickAt(x, y);
}

/** Parse { scale, tx, ty } back out of the rendered transform. */
function readTransform() {
  const m = /translate\((-?[\d.]+)px, (-?[\d.]+)px\) scale\(([\d.]+)\)/.exec(
    planImage().style.transform,
  );
  if (!m) throw new Error(`unexpected transform: ${planImage().style.transform}`);
  return { tx: Number(m[1]), ty: Number(m[2]), scale: Number(m[3]) };
}

type FakeTouch = { clientX: number; clientY: number };

/**
 * jsdom has no Touch/TouchEvent constructors; build a plain Event and graft
 * the touch lists on. React reads `touches` / `changedTouches` straight off
 * the native event, so this reaches onTouchStart/Move/End unchanged.
 */
function touchEvent(type: string, touches: FakeTouch[], changedTouches: FakeTouch[]): Event {
  const e = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(e, { touches, changedTouches });
  return e;
}

function touchStartAt(points: FakeTouch[]) {
  act(() => {
    planImage().dispatchEvent(touchEvent('touchstart', points, points));
  });
}

function touchMoveTo(points: FakeTouch[]) {
  act(() => {
    planImage().dispatchEvent(touchEvent('touchmove', points, points));
  });
}

/** Lift all fingers; returns the dispatched event so preventDefault can be asserted. */
function touchEndAt(changed: FakeTouch[]): Event {
  const e = touchEvent('touchend', [], changed);
  act(() => {
    planImage().dispatchEvent(e);
  });
  return e;
}

/** Zoom to scale 2 anchored at the centre so tx = ty = 0. */
function zoomInAtCentre() {
  doubleClickAt(CX, CY);
  expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: DOUBLE_TAP_SCALE });
  // Let the consumed double-tap window fully lapse before the pan tests.
  act(() => {
    vi.advanceTimersByTime(400);
  });
}

describe('touch pan release tap suppression', () => {
  it('a one-finger pan (>12px) pans the plan and its release never fires a tap', () => {
    zoomInAtCentre();
    touchStartAt([{ clientX: CX, clientY: CY }]);
    touchMoveTo([{ clientX: CX + 50, clientY: CY + 30 }]);
    // The pan applied while the finger was down.
    expect(readTransform()).toEqual({ tx: 50, ty: 30, scale: DOUBLE_TAP_SCALE });
    touchEndAt([{ clientX: CX + 50, clientY: CY + 30 }]);
    act(() => {
      vi.advanceTimersByTime(400); // past the single-tap timer window
    });
    // No coarse scroll-zoom toggle (width would become '160%')...
    expect(planImage().style.width).toBe('');
    // ...and no double-tap reset: pan and scale survive the release clamp.
    expect(readTransform()).toEqual({ tx: 50, ty: 30, scale: DOUBLE_TAP_SCALE });
  });

  it('a big pan release does not arm a double-tap: a quick tap right after is a single tap', () => {
    zoomInAtCentre();
    touchStartAt([{ clientX: CX, clientY: CY }]);
    touchMoveTo([{ clientX: CX - 40, clientY: CY }]);
    touchEndAt([{ clientX: CX - 40, clientY: CY }]);
    expect(readTransform()).toEqual({ tx: -40, ty: 0, scale: DOUBLE_TAP_SCALE });
    // A tap 100ms later at (nearly) the same point must NOT combine with the
    // pan release into a double-tap (which would reset pinch to fit).
    act(() => {
      vi.advanceTimersByTime(100);
    });
    touchStartAt([{ clientX: CX - 38, clientY: CY }]);
    touchEndAt([{ clientX: CX - 38, clientY: CY }]);
    // Still pinch-zoomed and panned — no double-tap reset fired.
    expect(readTransform()).toEqual({ tx: -40, ty: 0, scale: DOUBLE_TAP_SCALE });
  });

  it('a pan that moved <12px is still a tap: handleTap runs and touchend is preventDefaulted', () => {
    zoomInAtCentre();
    touchStartAt([{ clientX: CX, clientY: CY }]);
    touchMoveTo([{ clientX: CX + 5, clientY: CY }]); // 5px < 12px slop
    const end = touchEndAt([{ clientX: CX + 5, clientY: CY }]);
    // preventDefault so the browser's synthetic click can't double-fire the tap.
    expect(end.defaultPrevented).toBe(true);
    act(() => {
      vi.advanceTimersByTime(400); // single-tap timer elapses
    });
    // The lone tap toggled the coarse scroll-zoom mode (which resets pinch).
    expect(planImage().style.width).toBe('160%');
  });

  it('two quick sub-slop pans are a double-tap: pinch zoom resets to fit', () => {
    zoomInAtCentre();
    touchStartAt([{ clientX: CX, clientY: CY }]);
    touchMoveTo([{ clientX: CX + 4, clientY: CY }]);
    const first = touchEndAt([{ clientX: CX + 4, clientY: CY }]);
    expect(first.defaultPrevented).toBe(true);
    act(() => {
      vi.advanceTimersByTime(100); // inside the 300ms double-tap window
    });
    touchStartAt([{ clientX: CX + 4, clientY: CY }]);
    touchMoveTo([{ clientX: CX + 8, clientY: CY }]);
    const second = touchEndAt([{ clientX: CX + 8, clientY: CY }]);
    expect(second.defaultPrevented).toBe(true);
    // Double-tap while pinch-zoomed resets to fit...
    expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: 1 });
    // ...and consumes the taps: no coarse toggle fires afterwards.
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(planImage().style.width).toBe('');
  });
});
