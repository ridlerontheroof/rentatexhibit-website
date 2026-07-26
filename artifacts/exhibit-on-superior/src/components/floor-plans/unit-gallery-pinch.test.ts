// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, type RenderResult } from '@testing-library/react';
import { createElement } from 'react';
import { UnitGalleryLightbox } from './UnitGalleryLightbox';
import { stubTransformAwareRects } from './lightbox-rect-stub';
import type { AvailableUnit } from '../../hooks/use-availability';

// ---------------------------------------------------------------------------
// Touch pinch-zoom / pan regression tests for the unit photo gallery
// lightbox, mirroring plan-lightbox-pinch.test.ts. The gallery reuses the
// floor-plan lightbox gesture model (anchorPinchTranslation +
// clampPanTranslation from lib/panBounds.ts):
//   - two-finger pinch: scale clamps to [1, 4], anchored under the fingers,
//   - one-finger pan while pinch-zoomed, 40px rubber-band during the
//     gesture, hard-clamped on release,
//   - release near scale 1 (<= 1.05) snaps back to fit,
//   - double-tap toggles fit <-> 2x toward the tapped point,
//   - swipe changes photos only while fully zoomed out.
// ---------------------------------------------------------------------------

const MAX_SCALE = 4;
const PAN_RUBBER_PX = 40;

// getBoundingClientRect uses the shared transform-aware stub, so the viewer
// centre sits at (CX, CY) = (400, 300) like a real layout. Touch points in
// these tests are written relative to that centre (touchList converts them
// to absolute screen coordinates).
const VIEWER_W = 800;
const VIEWER_H = 600;
const CX = VIEWER_W / 2;
const CY = VIEWER_H / 2;

function makeUnit(): AvailableUnit {
  return {
    unit: '0606',
    bedrooms: 1,
    bathrooms: 1,
    sqft: 750,
    rent: 2500,
    availableOn: null,
    photoUrl: '/photos/1.jpg',
    listingUrl: null,
    videoUrl: null,
    photos: ['/photos/1.jpg', '/photos/2.jpg', '/photos/3.jpg'],
    details: [],
    marketingTitle: null,
    description: null,
  };
}

let view: RenderResult | null = null;
let onClose: ReturnType<typeof vi.fn>;

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

  onClose = vi.fn();
  view = render(createElement(UnitGalleryLightbox, { unit: makeUnit(), onClose }));
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

function photoImage(): HTMLImageElement {
  const img = document.querySelector('img');
  if (!img) throw new Error('gallery image not rendered');
  return img;
}

/** The touch handlers live on the image's viewer container. */
function viewer(): HTMLElement {
  const el = photoImage().parentElement;
  if (!el) throw new Error('viewer container not rendered');
  return el;
}

/** Which photo is showing, from the "1 / 3" counter. */
function shownIndex(): number {
  const m = /(\d+) \/ \d+/.exec(document.body.textContent ?? '');
  if (!m) throw new Error('photo counter not rendered');
  return Number(m[1]) - 1;
}

/** Parse { scale, tx, ty } back out of the rendered transform. */
function readTransform() {
  const m = /translate\((-?[\d.]+)px, (-?[\d.]+)px\) scale\(([\d.]+)\)/.exec(
    photoImage().style.transform,
  );
  if (!m) throw new Error(`unexpected transform: ${photoImage().style.transform}`);
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

    fireTouch('touchmove', [{ x: -500, y: 0 }, { x: 500, y: 0 }]);
    expect(readTransform().scale).toBe(MAX_SCALE);

    fireTouch('touchmove', [{ x: -10, y: 0 }, { x: 10, y: 0 }]);
    expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: 1 });
  });

  it('keeps the image point under the pinch midpoint anchored (anchorPinchTranslation)', () => {
    fireTouch('touchstart', [{ x: 100, y: 50 }, { x: 200, y: 150 }]);
    fireTouch('touchmove', [{ x: 50, y: 0 }, { x: 250, y: 200 }]);
    const t = readTransform();
    expect(t.scale).toBeCloseTo(2, 5);
    expect(t.tx).toBeCloseTo(-150, 5);
    expect(t.ty).toBeCloseTo(-100, 5);
    // Property check: the anchored image point still maps to the midpoint.
    expect(t.tx + t.scale * 150).toBeCloseTo(150, 5);
    expect(t.ty + t.scale * 100).toBeCloseTo(100, 5);
  });

  it('rubber-bands the anchored translation during the gesture, hard-clamps on release', () => {
    fireTouch('touchstart', [{ x: 550, y: 0 }, { x: 650, y: 0 }]);
    fireTouch('touchmove', [{ x: 500, y: 0 }, { x: 700, y: 0 }]);
    let t = readTransform();
    expect(t.scale).toBeCloseTo(2, 5);
    expect(t.tx).toBe(-(VIEWER_W / 2 + PAN_RUBBER_PX));

    fireTouch('touchend', [], [{ x: 500, y: 0 }]);
    t = readTransform();
    expect(t.tx).toBe(-VIEWER_W / 2);
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

    fireTouch('touchstart', [{ x: 0, y: 0 }]);
    fireTouch('touchmove', [{ x: 30, y: -20 }]);
    let t = readTransform();
    expect(t.tx).toBe(30);
    expect(t.ty).toBe(-20);

    fireTouch('touchmove', [{ x: 1000, y: -1000 }]);
    t = readTransform();
    expect(t.tx).toBe(VIEWER_W / 2 + PAN_RUBBER_PX);
    expect(t.ty).toBe(-(VIEWER_H / 2 + PAN_RUBBER_PX));

    fireTouch('touchend', [], [{ x: 1000, y: -1000 }]);
    t = readTransform();
    expect(t.tx).toBe(VIEWER_W / 2);
    expect(t.ty).toBe(-(VIEWER_H / 2));
    expect(t.scale).toBeCloseTo(2, 5);
  });
});

describe('horizontal swipe navigation', () => {
  it('a >50px horizontal swipe at scale 1 changes photos in the right direction', () => {
    expect(shownIndex()).toBe(0);
    // Swipe left (dx < 0): next photo.
    fireTouch('touchstart', [{ x: 200, y: 0 }]);
    fireTouch('touchend', [], [{ x: 100, y: 0 }]);
    expect(shownIndex()).toBe(1);

    // Swipe right (dx > 0): previous photo.
    fireTouch('touchstart', [{ x: 100, y: 0 }]);
    fireTouch('touchend', [], [{ x: 200, y: 0 }]);
    expect(shownIndex()).toBe(0);
  });

  it('swiping works again immediately after pinching back out to fit', () => {
    // Pinch in to 2x...
    pinchTo(2);
    expect(readTransform().scale).toBeCloseTo(2, 5);
    // ...then pinch back out to ~scale 1 and release: snaps to fit.
    fireTouch('touchmove', [{ x: -52, y: 0 }, { x: 52, y: 0 }]);
    expect(readTransform().scale).toBeCloseTo(1.04, 5);
    fireTouch('touchend', [], [{ x: -52, y: 0 }, { x: 52, y: 0 }]);
    expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: 1 });

    // A >50px horizontal swipe navigates to the next photo again.
    expect(shownIndex()).toBe(0);
    fireTouch('touchstart', [{ x: 200, y: 0 }]);
    fireTouch('touchend', [], [{ x: 100, y: 0 }]);
    expect(shownIndex()).toBe(1);
  });

  it('a short (<50px) swipe never navigates', () => {
    fireTouch('touchstart', [{ x: 0, y: 0 }]);
    fireTouch('touchend', [], [{ x: 40, y: 0 }]);
    expect(shownIndex()).toBe(0);
  });

  it('the same swipe while pinch-zoomed pans instead of navigating', () => {
    pinchTo(2);
    fireTouch('touchend', [], [{ x: -100, y: 0 }, { x: 100, y: 0 }]);
    expect(readTransform().scale).toBeCloseTo(2, 5);

    fireTouch('touchstart', [{ x: 0, y: 0 }]);
    fireTouch('touchmove', [{ x: -100, y: 0 }]);
    fireTouch('touchend', [], [{ x: -100, y: 0 }]);

    expect(shownIndex()).toBe(0); // still the first photo
    const t = readTransform();
    expect(t.scale).toBeCloseTo(2, 5);
    expect(t.tx).toBe(-100); // the gesture panned the photo
  });
});

// ---------------------------------------------------------------------------
// Double-tap zoom. handleTap uses Date.now for the double-tap window, so
// fake timers + setSystemTime control the timing. Tap points are
// centre-relative (see touchList), so the expected translation is simply
// -(tap) * (scale - 1).
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

  it('clamps the double-tap translation to the pan bounds', () => {
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

    // A >50px horizontal swipe navigates to the next photo again.
    // (Advance past the double-tap window so the swipe isn't a "tap".)
    vi.setSystemTime(Date.now() + 400);
    expect(shownIndex()).toBe(0);
    fireTouch('touchstart', [{ x: 200, y: 0 }]);
    fireTouch('touchend', [], [{ x: 100, y: 0 }]);
    expect(shownIndex()).toBe(1);
  });

  it('two taps slower than 300ms apart do not zoom', () => {
    tap({ x: 100, y: 50 });
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
    pinchTo(2);
    fireTouch('touchend', [{ x: -100, y: 0 }], [{ x: 100, y: 0 }]);
    expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: 2 });

    fireTouch('touchmove', [{ x: -70, y: 25 }]);
    let t = readTransform();
    expect(t.tx).toBe(30);
    expect(t.ty).toBe(25);
    expect(t.scale).toBeCloseTo(2, 5);

    fireTouch('touchend', [], [{ x: -70, y: 25 }]);
    t = readTransform();
    expect(t.tx).toBe(30);
    expect(t.ty).toBe(25);
    expect(t.scale).toBeCloseTo(2, 5);
  });
});

describe('photo change resets zoom', () => {
  it('navigating to the next photo via the arrow button resets to fit', () => {
    pinchTo(2);
    fireTouch('touchend', [], [{ x: -100, y: 0 }, { x: 100, y: 0 }]);
    expect(readTransform().scale).toBeCloseTo(2, 5);

    const nextBtn = document.querySelector<HTMLButtonElement>('[aria-label="Next photo"]');
    if (!nextBtn) throw new Error('next button not rendered');
    act(() => nextBtn.click());

    expect(shownIndex()).toBe(1);
    expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: 1 });
  });
});
