// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, type RenderResult } from '@testing-library/react';
import { createElement } from 'react';
import { PlanLightbox } from './PlanLightbox';
import { stubTransformAwareRects } from './lightbox-rect-stub';
import type { Plan, PlanGroup } from '../../data/floorPlans';

// ---------------------------------------------------------------------------
// Touch pinch-zoom / pan regression tests for the floor-plan lightbox.
//
// The lightbox renders the image with
//   transform: translate(tx, ty) scale(scale), transform-origin: center center
// and the touch handlers (onTouchStart/Move/End) implement:
//   - two-finger pinch: scale follows finger distance, clamped to [1, 4],
//     translation from anchorPinchTranslation so the image point under the
//     pinch midpoint stays under the fingers,
//   - one-finger pan while pinch-zoomed, clamped with a 40px rubber-band
//     allowance during the gesture and hard-clamped on release,
//   - release near scale 1 (<= 1.05) snaps back to fit,
//   - lifting one finger of a pinch hands off to a one-finger pan.
// These tests dispatch synthetic TouchEvents and read state back from the
// rendered transform, so a refactor of the gesture state fails here.
// ---------------------------------------------------------------------------

const MAX_SCALE = 4;
const PAN_RUBBER_PX = 40;

// Layout used by the pan-bounds clamp. jsdom reports 0 for client sizes, so
// give the viewer and image a deterministic size via prototype getters.
// getBoundingClientRect uses the shared transform-aware stub, so the viewer
// centre sits at (CX, CY) = (400, 300) like a real layout. Touch points in
// these tests are written relative to that centre (touchList converts them
// to absolute screen coordinates), so the anchor-math expectations read as
// offsets from the centre.
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
let onNavigate: ReturnType<typeof vi.fn>;

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
  stubClientSize(HTMLElement.prototype, 'clientWidth', VIEWER_W);
  stubClientSize(HTMLElement.prototype, 'clientHeight', VIEWER_H);
  stubTransformAwareRects({ viewerWidth: VIEWER_W, viewerHeight: VIEWER_H });

  onNavigate = vi.fn();
  view = render(
    createElement(PlanLightbox, {
      group: makeGroup(),
      variantIndex: 0,
      position: { index: 0, total: 3 },
      onClose: vi.fn(),
      onNavigate,
      onVariantChange: vi.fn(),
    }),
  );
});

afterEach(() => {
  vi.useRealTimers();
  view?.unmount();
  view = null;
  for (const { proto, prop, original } of sizeDescriptors.splice(0)) {
    if (original) Object.defineProperty(proto, prop, original);
    else delete (proto as Record<string, unknown>)[prop];
  }
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

function planImage(): HTMLImageElement {
  const img = document.querySelector('img');
  if (!img) throw new Error('floor-plan image not rendered');
  return img;
}

/** The touch handlers live on the image's viewer container. */
function viewer(): HTMLElement {
  const el = planImage().parentElement;
  if (!el) throw new Error('viewer container not rendered');
  return el;
}

/** Parse { scale, tx, ty } back out of the rendered transform. */
function readTransform() {
  const m = /translate\((-?[\d.]+)px, (-?[\d.]+)px\) scale\(([\d.]+)\)/.exec(
    planImage().style.transform,
  );
  if (!m) throw new Error(`unexpected transform: ${planImage().style.transform}`);
  return { tx: Number(m[1]), ty: Number(m[2]), scale: Number(m[3]) };
}

type Pt = { x: number; y: number };

/** Points are centre-relative; convert to the stubbed layout's screen px. */
function touchList(points: Pt[]) {
  return points.map((p, i) => ({
    identifier: i,
    clientX: CX + p.x,
    clientY: CY + p.y,
  }));
}

/** jsdom has no TouchEvent constructor; a plain Event with touches attached
 *  works because React's synthetic event reads them off the native event. */
function fireTouch(
  type: 'touchstart' | 'touchmove' | 'touchend',
  touches: Pt[],
  changedTouches: Pt[] = touches,
) {
  act(() => {
    const e = new Event(type, { bubbles: true, cancelable: true });
    Object.assign(e, {
      touches: touchList(touches),
      changedTouches: touchList(changedTouches),
    });
    viewer().dispatchEvent(e);
  });
}

/** Symmetric pinch around the centre from distance 100 to 100 * factor,
 *  fingers left on screen. Leaves tx = ty = 0 (midpoint is the centre). */
function pinchTo(factor: number) {
  fireTouch('touchstart', [{ x: -50, y: 0 }, { x: 50, y: 0 }]);
  fireTouch('touchmove', [
    { x: -50 * factor, y: 0 },
    { x: 50 * factor, y: 0 },
  ]);
}

describe('two-finger pinch', () => {
  it('scale follows the finger distance ratio, clamped to [1, 4]', () => {
    pinchTo(2);
    expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: 2 });

    // Spread far beyond 4x: scale clamps at MAX_SCALE.
    fireTouch('touchmove', [{ x: -500, y: 0 }, { x: 500, y: 0 }]);
    expect(readTransform().scale).toBe(MAX_SCALE);

    // Contract below the starting distance: scale floors at 1 and pan resets.
    fireTouch('touchmove', [{ x: -10, y: 0 }, { x: 10, y: 0 }]);
    expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: 1 });
  });

  it('keeps the image point under the pinch midpoint anchored (anchorPinchTranslation)', () => {
    // Off-centre pinch: start mid (150, 100), dist ~141.42; double the spread
    // around the same midpoint => scale 2, mid unchanged.
    fireTouch('touchstart', [{ x: 100, y: 50 }, { x: 200, y: 150 }]);
    fireTouch('touchmove', [{ x: 50, y: 0 }, { x: 250, y: 200 }]);
    const t = readTransform();
    expect(t.scale).toBeCloseTo(2, 5);
    // t = mid - center - ratio * (startMid - center - t0), center = (0,0),
    // t0 = 0, ratio = 2 => tx = 150 - 2*150 = -150, ty = 100 - 2*100 = -100.
    expect(t.tx).toBeCloseTo(-150, 5);
    expect(t.ty).toBeCloseTo(-100, 5);
    // Property check: the image point q = (startMid - t0)/s0 still maps to the
    // midpoint: center + t + s*q === mid.
    expect(t.tx + t.scale * 150).toBeCloseTo(150, 5);
    expect(t.ty + t.scale * 100).toBeCloseTo(100, 5);
  });

  it('anchors around the image centre, not the viewer centre, when the two differ', () => {
    // Regression: with the floor-plan lightbox's padded, flex-centred layout
    // the image's centre can sit away from the viewer's rect centre; the old
    // math used the viewer centre as origin and drifted the image sideways.
    // Re-stub with a padded layout: the image's untransformed centre sits at
    // (+100, -60) from the viewer centre (all coordinates centre-relative).
    stubTransformAwareRects({
      viewerWidth: VIEWER_W,
      viewerHeight: VIEWER_H,
      imgOffsetX: 100,
      imgOffsetY: -60,
    });

    // Pinch symmetrically around the image centre: the image must stay put.
    fireTouch('touchstart', [{ x: 50, y: -60 }, { x: 150, y: -60 }]);
    fireTouch('touchmove', [{ x: 0, y: -60 }, { x: 200, y: -60 }]);
    let t = readTransform();
    expect(t.scale).toBeCloseTo(2, 5);
    expect(t.tx).toBeCloseTo(0, 5); // viewer-centre math would produce -100 here
    expect(t.ty).toBeCloseTo(0, 5);
    fireTouch('touchend', [], [{ x: 0, y: -60 }, { x: 200, y: -60 }]);

    // Off-centre pinch: the image point under the start midpoint stays under
    // the fingers: origin + t + s * q === mid, q = (startMid - origin - t0)/s0.
    // (Mid stays at (200, 40); spread grows 1.5x on start scale 2 => scale 3.)
    fireTouch('touchstart', [{ x: 150, y: -10 }, { x: 250, y: 90 }]);
    fireTouch('touchmove', [{ x: 125, y: -35 }, { x: 275, y: 115 }]);
    t = readTransform();
    expect(t.scale).toBeCloseTo(3, 5);
    const originX = 100; // image centre, relative to the viewer centre
    const originY = -60;
    const qx = (200 - originX - 0) / 2; // startMid 200, t0 = 0 after the hard clamp
    const qy = (40 - originY - 0) / 2;
    expect(originX + t.tx + t.scale * qx).toBeCloseTo(200, 5);
    expect(originY + t.ty + t.scale * qy).toBeCloseTo(40, 5);
  });

  it('rubber-bands the anchored translation during the gesture, hard-clamps on release', () => {
    // Pinch anchored far off-centre so the anchor formula overshoots the
    // pan bounds. At scale 2 the hard max |tx| is 800*(2-1)/2 = 400, with a
    // 40px rubber allowance while the fingers are down.
    fireTouch('touchstart', [{ x: 550, y: 0 }, { x: 650, y: 0 }]);
    fireTouch('touchmove', [{ x: 500, y: 0 }, { x: 700, y: 0 }]);
    let t = readTransform();
    expect(t.scale).toBeCloseTo(2, 5);
    // Unclamped anchor tx would be 600 - 2*600 = -600 => clamps to -(400+40).
    expect(t.tx).toBe(-(VIEWER_W / 2 + PAN_RUBBER_PX));

    fireTouch('touchend', [], [{ x: 500, y: 0 }]);
    t = readTransform();
    expect(t.tx).toBe(-VIEWER_W / 2); // hard clamp, allowance removed
    expect(t.scale).toBeCloseTo(2, 5);
  });

  it('release near scale 1 snaps back to fit', () => {
    pinchTo(1.04);
    expect(readTransform().scale).toBeCloseTo(1.04, 5);
    fireTouch('touchend', [], [{ x: -52, y: 0 }]);
    expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: 1 });
  });
});

describe('one-finger pan while pinch-zoomed', () => {
  it('pans with the finger, rubber-bands past the bounds, and hard-clamps on release', () => {
    pinchTo(2);
    fireTouch('touchend', [], [{ x: -100, y: 0 }, { x: 100, y: 0 }]);
    expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: 2 });

    // Small pan stays 1:1 with the finger.
    fireTouch('touchstart', [{ x: 0, y: 0 }]);
    fireTouch('touchmove', [{ x: 30, y: -20 }]);
    let t = readTransform();
    expect(t.tx).toBe(30);
    expect(t.ty).toBe(-20);

    // Drag far past the bound: clamps to hard bound + rubber allowance
    // (max |tx| = 400, |ty| = 300 at scale 2).
    fireTouch('touchmove', [{ x: 1000, y: -1000 }]);
    t = readTransform();
    expect(t.tx).toBe(VIEWER_W / 2 + PAN_RUBBER_PX);
    expect(t.ty).toBe(-(VIEWER_H / 2 + PAN_RUBBER_PX));

    // Release: overshoot settles back inside the hard bounds.
    fireTouch('touchend', [], [{ x: 1000, y: -1000 }]);
    t = readTransform();
    expect(t.tx).toBe(VIEWER_W / 2);
    expect(t.ty).toBe(-(VIEWER_H / 2));
    expect(t.scale).toBeCloseTo(2, 5);
  });
});

describe('horizontal swipe navigation', () => {
  it('a >50px horizontal swipe at scale 1 navigates in the right direction', () => {
    // Swipe left (finger moves left, dx < 0): next plan.
    fireTouch('touchstart', [{ x: 200, y: 0 }]);
    fireTouch('touchend', [], [{ x: 100, y: 0 }]);
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenLastCalledWith(1);

    // Swipe right (dx > 0): previous plan.
    fireTouch('touchstart', [{ x: 100, y: 0 }]);
    fireTouch('touchend', [], [{ x: 200, y: 0 }]);
    expect(onNavigate).toHaveBeenCalledTimes(2);
    expect(onNavigate).toHaveBeenLastCalledWith(-1);
  });

  it('a short (<50px) swipe never navigates', () => {
    // Move > tap slop so it is not a tap, but under the 50px swipe threshold.
    fireTouch('touchstart', [{ x: 0, y: 0 }]);
    fireTouch('touchend', [], [{ x: 40, y: 0 }]);
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('the same swipe while pinch-zoomed pans instead of navigating', () => {
    // Pinch to 2x and lift both fingers.
    pinchTo(2);
    fireTouch('touchend', [], [{ x: -100, y: 0 }, { x: 100, y: 0 }]);
    expect(readTransform().scale).toBeCloseTo(2, 5);

    // One-finger horizontal drag > 50px: becomes a pan gesture.
    fireTouch('touchstart', [{ x: 0, y: 0 }]);
    fireTouch('touchmove', [{ x: -100, y: 0 }]);
    fireTouch('touchend', [], [{ x: -100, y: 0 }]);

    expect(onNavigate).not.toHaveBeenCalled();
    const t = readTransform();
    expect(t.scale).toBeCloseTo(2, 5);
    expect(t.tx).toBe(-100); // the gesture panned the plan
  });
});

// ---------------------------------------------------------------------------
// Double-tap zoom. handleTap uses Date.now for the double-tap window and a
// setTimeout for the deferred single-tap toggle, so fake timers control both
// (vi.setSystemTime moves Date.now without firing the single-tap timer).
// Tap points are centre-relative (see touchList), so the expected
// translation is simply -(tap) * (scale - 1).
// ---------------------------------------------------------------------------
const DOUBLE_TAP_SCALE = 2;

/** A quick tap: touchstart + touchend at the same point (no movement). */
function tap(p: Pt) {
  fireTouch('touchstart', [p]);
  fireTouch('touchend', [], [p]);
}

describe('double-tap zoom', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('zooms to 2x toward the tapped point: t = -(tap - center) * (scale - 1)', () => {
    tap({ x: 100, y: 50 });
    expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: 1 }); // waits for 2nd tap
    tap({ x: 100, y: 50 });
    const t = readTransform();
    expect(t.scale).toBe(DOUBLE_TAP_SCALE);
    expect(t.tx).toBe(-100 * (DOUBLE_TAP_SCALE - 1));
    expect(t.ty).toBe(-50 * (DOUBLE_TAP_SCALE - 1));
  });

  it('zooms toward the tapped point relative to the image centre, not the viewer centre', () => {
    // Regression: mirror the pinch "anchors around the image centre" test.
    // Re-stub with a padded layout: the image's untransformed centre sits at
    // (+100, -60) from the viewer centre. The double-tap origin must be the
    // image centre, so t = -(tap - imgCentre) * (scale - 1).
    stubTransformAwareRects({
      viewerWidth: VIEWER_W,
      viewerHeight: VIEWER_H,
      imgOffsetX: 100,
      imgOffsetY: -60,
    });

    tap({ x: 200, y: 40 });
    tap({ x: 200, y: 40 });
    const t = readTransform();
    expect(t.scale).toBe(DOUBLE_TAP_SCALE);
    // Viewer-centre math would give (-200, -40); image-centre origin
    // (+100, -60) => -(100, 100) * (2 - 1).
    expect(t.tx).toBe(-100 * (DOUBLE_TAP_SCALE - 1));
    expect(t.ty).toBe(-100 * (DOUBLE_TAP_SCALE - 1));
  });

  it('clamps the double-tap translation to the pan bounds', () => {
    // At scale 2 the hard bounds are |tx| <= 400, |ty| <= 300. A tap at
    // (500, 350) would want (-500, -350) unclamped.
    tap({ x: 500, y: 350 });
    tap({ x: 500, y: 350 });
    const t = readTransform();
    expect(t.scale).toBe(DOUBLE_TAP_SCALE);
    expect(t.tx).toBe(-VIEWER_W / 2);
    expect(t.ty).toBe(-VIEWER_H / 2);
  });

  it('a second double-tap while pinch-zoomed resets to fit', () => {
    tap({ x: 100, y: 50 });
    tap({ x: 100, y: 50 });
    expect(readTransform().scale).toBe(DOUBLE_TAP_SCALE);

    // While pinch-zoomed a one-finger touch takes the "pan" path; a barely
    // moved pan still counts as a tap, and the second one resets to fit.
    tap({ x: 20, y: 10 });
    tap({ x: 20, y: 10 });
    expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: 1 });
  });

  it('swiping works again immediately after double-tapping back out to fit', () => {
    // Double-tap in to 2x...
    tap({ x: 100, y: 50 });
    tap({ x: 100, y: 50 });
    expect(readTransform().scale).toBe(DOUBLE_TAP_SCALE);

    // ...then a second double-tap resets to fit.
    tap({ x: 100, y: 50 });
    tap({ x: 100, y: 50 });
    expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: 1 });

    // A >50px horizontal swipe navigates to the next plan again.
    // (Advance past the double-tap window so the swipe isn't a "tap".)
    vi.setSystemTime(Date.now() + 400);
    fireTouch('touchstart', [{ x: 200, y: 0 }]);
    fireTouch('touchend', [], [{ x: 100, y: 0 }]);
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenLastCalledWith(1);
  });

  it('two taps slower than 300ms apart do not zoom', () => {
    tap({ x: 100, y: 50 });
    // Move Date.now past the double-tap window without firing the pending
    // single-tap timer (which would toggle the scroll-zoom mode instead).
    vi.setSystemTime(Date.now() + 400);
    tap({ x: 100, y: 50 });
    expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: 1 });
  });

  it('two quick taps farther apart than the 40px slop do not zoom', () => {
    tap({ x: 0, y: 0 });
    tap({ x: 60, y: 0 });
    expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: 1 });
  });
});

describe('pinch → one-finger handoff', () => {
  it('lifting one finger keeps panning smoothly from the remaining finger', () => {
    // Pinch to 2x (fingers still down), then lift the right finger.
    pinchTo(2);
    fireTouch('touchend', [{ x: -100, y: 0 }], [{ x: 100, y: 0 }]);
    expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: 2 });

    // The remaining finger pans from its lift-off position with no jump.
    fireTouch('touchmove', [{ x: -70, y: 25 }]);
    let t = readTransform();
    expect(t.tx).toBe(30);
    expect(t.ty).toBe(25);
    expect(t.scale).toBeCloseTo(2, 5);

    // Lifting the last finger (moved > tap slop, so no tap fires) hard-clamps.
    fireTouch('touchend', [], [{ x: -70, y: 25 }]);
    t = readTransform();
    expect(t.tx).toBe(30);
    expect(t.ty).toBe(25);
    expect(t.scale).toBeCloseTo(2, 5);
  });
});
