// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, type RenderResult } from '@testing-library/react';
import { createElement } from 'react';
import { PlanLightbox } from './PlanLightbox';
import type { Plan, PlanGroup } from '../../data/floorPlans';

// ---------------------------------------------------------------------------
// Desktop drag-to-pan click-suppression regression tests.
//
// While pinch/double-click zoomed in, onMouseDown starts a drag; once the
// pointer moves more than ~3px the drag is flagged as `moved`, and on mouseup
// suppressClick is set so the browser's follow-up click on the <img> is
// swallowed instead of reaching handleTap (which would toggle a zoom mode —
// the viewer "jumping" after every pan). A sub-threshold wiggle (<3px) must
// NOT be suppressed: its click is still a tap. Harness mirrors
// plan-lightbox-doubletap.test.ts.
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
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: VIEWER_W,
    bottom: VIEWER_H,
    width: VIEWER_W,
    height: VIEWER_H,
    toJSON: () => ({}),
  } as DOMRect);

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

function mouseDownAt(x: number, y: number) {
  act(() => {
    planImage().dispatchEvent(
      new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        button: 0,
        clientX: x,
        clientY: y,
      }),
    );
  });
}

// The move/up listeners are attached to window while dragging.
function mouseMoveTo(x: number, y: number) {
  act(() => {
    window.dispatchEvent(
      new MouseEvent('mousemove', { bubbles: true, clientX: x, clientY: y }),
    );
  });
}

function mouseUp() {
  act(() => {
    window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 }));
  });
}

/** Zoom to scale 2 anchored at the centre so tx = ty = 0. */
function zoomInAtCentre() {
  doubleClickAt(CX, CY);
  expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: DOUBLE_TAP_SCALE });
  // Let the consumed double-tap window fully lapse before the drag tests.
  act(() => {
    vi.advanceTimersByTime(400);
  });
}

describe('drag-to-pan click suppression', () => {
  it('a real drag (>3px) pans, and the release click does not toggle any zoom mode', () => {
    zoomInAtCentre();
    mouseDownAt(CX, CY);
    mouseMoveTo(CX + 50, CY + 30);
    mouseUp();
    // The pan applied and survived the settle clamp (well within bounds).
    expect(readTransform()).toEqual({ tx: 50, ty: 30, scale: DOUBLE_TAP_SCALE });
    // Browser fires a click after mouseup — it must be suppressed.
    clickAt(CX + 50, CY + 30);
    act(() => {
      vi.advanceTimersByTime(400); // past the single-tap timer window
    });
    // No coarse scroll-zoom toggle (width would become '160%')...
    expect(planImage().style.width).toBe('');
    // ...and no double-tap reset/re-anchor: pan and scale are untouched.
    expect(readTransform()).toEqual({ tx: 50, ty: 30, scale: DOUBLE_TAP_SCALE });
  });

  it('suppression is consumed by one click only — the next click is a normal tap again', () => {
    zoomInAtCentre();
    mouseDownAt(CX, CY);
    mouseMoveTo(CX - 40, CY);
    mouseUp();
    clickAt(CX - 40, CY); // suppressed release click
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(readTransform()).toEqual({ tx: -40, ty: 0, scale: DOUBLE_TAP_SCALE });
    // A fresh double-click afterwards must still work (resets to fit while
    // pinch-zoomed), proving suppressClick was consumed, not left latched.
    doubleClickAt(CX, CY);
    expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: 1 });
  });

  it('a sub-threshold wiggle (<3px) is still a tap: the click fires the single-tap toggle', () => {
    zoomInAtCentre();
    mouseDownAt(CX, CY);
    mouseMoveTo(CX + 2, CY); // 2px < 3px threshold => moved stays false
    mouseUp();
    // Barely moved: pan settles at the tiny offset, no suppression armed.
    expect(readTransform()).toEqual({ tx: 2, ty: 0, scale: DOUBLE_TAP_SCALE });
    clickAt(CX + 2, CY);
    act(() => {
      vi.advanceTimersByTime(400); // single-tap timer elapses
    });
    // The lone tap toggled the coarse scroll-zoom mode (which resets pinch).
    expect(planImage().style.width).toBe('160%');
  });

  it('mousedown while not zoomed in never starts a drag or suppresses the click', () => {
    // scale === 1 => onMouseDown bails; the click is an ordinary tap.
    mouseDownAt(CX, CY);
    mouseMoveTo(CX + 100, CY);
    mouseUp();
    expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: 1 });
    clickAt(CX, CY);
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(planImage().style.width).toBe('160%');
  });
});
