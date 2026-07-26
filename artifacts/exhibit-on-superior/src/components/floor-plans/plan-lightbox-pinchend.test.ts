// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, type RenderResult } from '@testing-library/react';
import { createElement } from 'react';
import { PlanLightbox } from './PlanLightbox';
import { stubTransformAwareRects } from './lightbox-rect-stub';
import type { Plan, PlanGroup } from '../../data/floorPlans';

// ---------------------------------------------------------------------------
// Pinch-release regression tests for the floor-plan lightbox.
//
// Two-finger pinch → one finger lifts → gesture re-bases as a one-finger
// 'pan' (onTouchEnd handoff branch). The re-based panStartX/panStartY and
// startTx/startTy bookkeeping must make the continued pan pick up exactly
// where the pinch left the plan (no jump), and the final release must end
// silently — no handleTap, so no single-tap coarse-zoom toggle and no
// double-tap reset. Likewise a pinch where both fingers lift at once must
// never resolve to a tap. Harness mirrors plan-lightbox-touchpan.test.ts.
// ---------------------------------------------------------------------------

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

/**
 * End a touch with `changed` fingers lifting and `remaining` still down.
 * Returns the dispatched event so preventDefault can be asserted.
 */
function touchEnd(remaining: FakeTouch[], changed: FakeTouch[]): Event {
  const e = touchEvent('touchend', remaining, changed);
  act(() => {
    planImage().dispatchEvent(e);
  });
  return e;
}

/**
 * Symmetric two-finger pinch around the viewer centre: fingers spread from
 * ±50px to ±100px horizontally, so scale doubles and the anchored midpoint
 * stays at the centre (tx = ty = 0).
 */
const FINGER_A = { clientX: CX - 100, clientY: CY };
const FINGER_B = { clientX: CX + 100, clientY: CY };

function pinchToDouble() {
  touchStartAt([
    { clientX: CX - 50, clientY: CY },
    { clientX: CX + 50, clientY: CY },
  ]);
  touchMoveTo([FINGER_A, FINGER_B]);
  expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: 2 });
}

describe('pinch release and pinch→pan handoff tap suppression', () => {
  it('lifting one finger hands off to pan with no jump; continued pan tracks the finger', () => {
    pinchToDouble();
    // Finger B lifts; finger A stays down. Gesture re-bases as 'pan'.
    touchEnd([FINGER_A], [FINGER_B]);
    // A move that goes nowhere must not move the plan (no jump on handoff).
    touchMoveTo([FINGER_A]);
    expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: 2 });
    // Continued one-finger pan continues smoothly from the pinch result.
    touchMoveTo([{ clientX: FINGER_A.clientX + 40, clientY: FINGER_A.clientY + 20 }]);
    expect(readTransform()).toEqual({ tx: 40, ty: 20, scale: 2 });
  });

  it('the final release after a pinch→pan never fires a tap or toggles zoom mode', () => {
    pinchToDouble();
    touchEnd([FINGER_A], [FINGER_B]);
    const endPoint = { clientX: FINGER_A.clientX + 40, clientY: FINGER_A.clientY + 20 };
    touchMoveTo([endPoint]);
    touchEnd([], [endPoint]);
    act(() => {
      vi.advanceTimersByTime(400); // past the single-tap timer window
    });
    // No coarse scroll-zoom toggle (width would become '160%')...
    expect(planImage().style.width).toBe('');
    // ...and the pan/scale survive the release clamp — no double-tap reset.
    expect(readTransform()).toEqual({ tx: 40, ty: 20, scale: 2 });
  });

  it('a pinch that ends with both fingers lifting at once fires no tap', () => {
    pinchToDouble();
    touchEnd([], [FINGER_A, FINGER_B]);
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(planImage().style.width).toBe('');
    expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: 2 });
  });

  it('a pinch release does not arm a double-tap: a quick tap right after is a single tap', () => {
    pinchToDouble();
    touchEnd([], [FINGER_A, FINGER_B]);
    // A tap 100ms later near a lifted finger must NOT combine with the pinch
    // release into a double-tap (which would reset pinch to fit).
    act(() => {
      vi.advanceTimersByTime(100);
    });
    touchStartAt([FINGER_A]);
    touchEnd([], [FINGER_A]);
    // Still pinch-zoomed — no double-tap reset fired.
    expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: 2 });
  });
});
