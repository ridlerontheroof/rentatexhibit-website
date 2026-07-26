// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, type RenderResult } from '@testing-library/react';
import { createElement } from 'react';
import { UnitGalleryLightbox } from './UnitGalleryLightbox';
import { stubTransformAwareRects } from './lightbox-rect-stub';
import type { AvailableUnit } from '../../hooks/use-availability';

// ---------------------------------------------------------------------------
// Pinch-release regression tests for the unit photo gallery lightbox,
// mirroring plan-lightbox-pinchend.test.ts.
//
// Two-finger pinch → one finger lifts → gesture re-bases as a one-finger
// 'pan' (onTouchEnd handoff branch). The re-based panStartX/panStartY and
// startTx/startTy bookkeeping must make the continued pan pick up exactly
// where the pinch left the photo (no jump), and the final release must end
// silently — no handleTap, so nothing can arm or complete a double-tap reset
// back to fit. Likewise a pinch where both fingers lift at once must never
// resolve to a tap. Harness mirrors unit-gallery-pinch.test.ts.
// ---------------------------------------------------------------------------

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

  view = render(createElement(UnitGalleryLightbox, { unit: makeUnit(), onClose: vi.fn() }));
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

/**
 * Symmetric two-finger pinch around the viewer centre (points are
 * centre-relative; the transform-aware rect stub puts the centre at
 * (CX, CY)): fingers spread from ±50px to ±100px horizontally, so scale
 * doubles and the anchored midpoint stays at the centre (tx = ty = 0).
 * Fingers left on screen.
 */
const FINGER_A: Pt = { x: -100, y: 0 };
const FINGER_B: Pt = { x: 100, y: 0 };

function pinchToDouble() {
  fireTouch('touchstart', [{ x: -50, y: 0 }, { x: 50, y: 0 }]);
  fireTouch('touchmove', [FINGER_A, FINGER_B]);
  expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: 2 });
}

describe('pinch release and pinch→pan handoff tap suppression', () => {
  it('lifting one finger hands off to pan with no jump; continued pan tracks the finger', () => {
    pinchToDouble();
    // Finger B lifts; finger A stays down. Gesture re-bases as 'pan'.
    fireTouch('touchend', [FINGER_A], [FINGER_B]);
    // A move that goes nowhere must not move the photo (no jump on handoff).
    fireTouch('touchmove', [FINGER_A]);
    expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: 2 });
    // Continued one-finger pan continues smoothly from the pinch result.
    fireTouch('touchmove', [{ x: FINGER_A.x + 40, y: FINGER_A.y + 20 }]);
    expect(readTransform()).toEqual({ tx: 40, ty: 20, scale: 2 });
  });

  it('the final release after a pinch→pan fires no tap: it cannot arm or complete a double-tap', () => {
    pinchToDouble();
    fireTouch('touchend', [FINGER_A], [FINGER_B]);
    const endPoint: Pt = { x: FINGER_A.x + 40, y: FINGER_A.y + 20 };
    fireTouch('touchmove', [endPoint]);
    fireTouch('touchend', [], [endPoint]);
    // The pan/scale survive the release clamp — no reset to fit.
    expect(readTransform()).toEqual({ tx: 40, ty: 20, scale: 2 });
    // The release must not have registered as the first tap of a double-tap:
    // a quick tap at the same spot right after would otherwise reset to fit.
    act(() => {
      vi.advanceTimersByTime(100);
    });
    fireTouch('touchstart', [endPoint]);
    fireTouch('touchend', [], [endPoint]);
    expect(readTransform()).toEqual({ tx: 40, ty: 20, scale: 2 });
  });

  it('a pinch that ends with both fingers lifting at once fires no tap', () => {
    pinchToDouble();
    fireTouch('touchend', [], [FINGER_A, FINGER_B]);
    act(() => {
      vi.advanceTimersByTime(400);
    });
    // Still pinch-zoomed, no navigation, no reset.
    expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: 2 });
    expect(shownIndex()).toBe(0);
  });

  it('a pinch release does not arm a double-tap: a quick tap right after is a single tap', () => {
    pinchToDouble();
    fireTouch('touchend', [], [FINGER_A, FINGER_B]);
    // A tap 100ms later near a lifted finger must NOT combine with the pinch
    // release into a double-tap (which would reset pinch to fit).
    act(() => {
      vi.advanceTimersByTime(100);
    });
    fireTouch('touchstart', [FINGER_A]);
    fireTouch('touchend', [], [FINGER_A]);
    // Still pinch-zoomed — no double-tap reset fired.
    expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: 2 });
  });
});
