// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, type RenderResult } from '@testing-library/react';
import { createElement } from 'react';
import { PlanLightbox } from './PlanLightbox';
import { stubTransformAwareRects } from './lightbox-rect-stub';
import type { Plan, PlanGroup } from '../../data/floorPlans';

// ---------------------------------------------------------------------------
// Double-click / double-tap zoom regression tests for the floor-plan lightbox.
//
// handleTap in PlanLightbox.tsx treats two taps within DOUBLE_TAP_MS (300ms)
// and DOUBLE_TAP_SLOP (40px) as a double-tap: zoom to scale 2 anchored toward
// the tapped point (tx = -(x - cx) * (scale - 1), clamped to the
// clampPanTranslation bounds), or back to fit when already pinch-zoomed.
// Two clicks farther apart than the slop are two single taps, so the coarse
// scroll-zoom mode toggles instead. These tests dispatch real click events
// under fake timers (which also freeze Date.now) and read the state back from
// the rendered transform.
// ---------------------------------------------------------------------------

const DOUBLE_TAP_SCALE = 2;

// Layout used by the pan-bounds clamp. jsdom reports 0 for client sizes and
// bounding rects, so stub deterministic values via prototype getters.
const VIEWER_W = 800;
const VIEWER_H = 600;
// Viewer centre with the rect stubbed at (0, 0, 800, 600):
const CX = VIEWER_W / 2;
const CY = VIEWER_H / 2;
// Max pan at scale 2 with img size === viewer size: (size * (scale - 1)) / 2.
const MAX_TX = (VIEWER_W * (DOUBLE_TAP_SCALE - 1)) / 2;
const MAX_TY = (VIEWER_H * (DOUBLE_TAP_SCALE - 1)) / 2;

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
    vi.advanceTimersByTime(gapMs); // advances the mocked Date.now too
  });
  clickAt(x, y);
}

function pressKey(key: string) {
  act(() => {
    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
    );
  });
}

/** Parse { scale, tx, ty } back out of the rendered transform. */
function readTransform() {
  const m = /translate\((-?[\d.]+)px, (-?[\d.]+)px\) scale\(([\d.]+)\)/.exec(
    planImage().style.transform,
  );
  if (!m) throw new Error(`unexpected transform: ${planImage().style.transform}`);
  return { tx: Number(m[1]), ty: Number(m[2]), scale: Number(m[3]) };
}

describe('double-click zoom', () => {
  it('zooms to scale 2 anchored toward the clicked point', () => {
    // 100px right of and 50px below centre => image shifts left/up by
    // offset * (scale - 1) so the clicked point moves toward the centre.
    doubleClickAt(CX + 100, CY + 50);
    expect(readTransform()).toEqual({
      tx: -100 * (DOUBLE_TAP_SCALE - 1),
      ty: -50 * (DOUBLE_TAP_SCALE - 1),
      scale: DOUBLE_TAP_SCALE,
    });
    // The consumed double-tap must not later fire the single-tap coarse toggle.
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(planImage().style.width).toBe('');
    expect(readTransform().scale).toBe(DOUBLE_TAP_SCALE);
  });

  it('a double-click at the exact centre stays centred', () => {
    doubleClickAt(CX, CY);
    expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: DOUBLE_TAP_SCALE });
  });

  it('clamps the anchor translation to the pan bounds', () => {
    // Way outside the reachable offset range => raw tx/ty exceed the
    // clampPanTranslation bounds of ±(size * (scale - 1)) / 2 and get clamped.
    doubleClickAt(CX + MAX_TX + 200, CY + MAX_TY + 200);
    expect(readTransform()).toEqual({
      tx: -MAX_TX,
      ty: -MAX_TY,
      scale: DOUBLE_TAP_SCALE,
    });
  });

  it('a second double-click returns to fit', () => {
    doubleClickAt(CX + 100, CY + 50);
    expect(readTransform().scale).toBe(DOUBLE_TAP_SCALE);
    act(() => {
      vi.advanceTimersByTime(400); // well past the window; next pair is fresh
    });
    doubleClickAt(CX - 60, CY + 20);
    expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: 1 });
    // ...and the follow-up single-tap timer must not re-enter coarse mode.
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(planImage().style.width).toBe('');
  });

  it('double-click while pinch/keyboard-zoomed resets to fit instead of re-anchoring', () => {
    pressKey('+');
    pressKey('+');
    pressKey('ArrowLeft'); // pan so tx != 0
    expect(readTransform().scale).toBeCloseTo(1.5625, 5);
    expect(readTransform().tx).not.toBe(0);
    doubleClickAt(CX + 150, CY);
    expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: 1 });
  });

  it('two quick clicks farther apart than the 40px slop are single taps (coarse mode toggles)', () => {
    clickAt(CX - 100, CY);
    act(() => {
      vi.advanceTimersByTime(100); // still inside the 300ms window
    });
    clickAt(CX + 100, CY); // 200px apart > 40px slop => not a double-tap
    // No anchored zoom happened...
    expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: 1 });
    // ...and the second tap's single-tap timer elapses into the coarse
    // scroll-zoom mode (image width 160%) instead.
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(planImage().style.width).toBe('160%');
  });

  it('clicks slower than the 300ms window never combine into a double-tap zoom', () => {
    clickAt(CX + 100, CY);
    act(() => {
      vi.advanceTimersByTime(350); // first tap already toggled coarse mode
    });
    expect(planImage().style.width).toBe('160%');
    clickAt(CX + 100, CY);
    act(() => {
      // Single-tap timer (300ms) plus the 200ms exit animation phase.
      vi.advanceTimersByTime(600); // second lone tap toggles coarse mode off
    });
    expect(planImage().style.width).toBe('');
    expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: 1 });
  });
});
