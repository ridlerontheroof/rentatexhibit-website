// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, type RenderResult } from '@testing-library/react';
import { createElement } from 'react';
import { PlanLightbox } from './PlanLightbox';
import type { Plan, PlanGroup } from '../../data/floorPlans';

// ---------------------------------------------------------------------------
// Keyboard +/− zoom regression tests for the floor-plan lightbox.
//
// The lightbox renders the image with
//   transform: translate(tx, ty) scale(scale), transform-origin: center center
// and keyboard zoom steps the scale by 1.25 around the viewer centre
// (tx' = ratio * tx), clamped to [1, 4] and to clampPanTranslation bounds.
// These tests dispatch real keydown events and read the state back from the
// rendered transform, so any refactor of the pinch state or key handler that
// breaks keyboard-only access fails here.
// ---------------------------------------------------------------------------

const KEY_ZOOM_STEP = 1.25;
const MAX_SCALE = 4;

// Layout used by the pan-bounds clamp. jsdom reports 0 for client sizes, so
// give the viewer and image a deterministic size via prototype getters.
const VIEWER_W = 800;
const VIEWER_H = 600;

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
let onClose: ReturnType<typeof vi.fn>;
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
  // Both the viewer <div> and the <img> read clientWidth/clientHeight through
  // HTMLElement, so a single prototype stub covers both (same size => at
  // scale s the max pan is (size * (s - 1)) / 2 on each axis).
  stubClientSize(HTMLElement.prototype, 'clientWidth', VIEWER_W);
  stubClientSize(HTMLElement.prototype, 'clientHeight', VIEWER_H);

  onClose = vi.fn();
  onNavigate = vi.fn();
  view = render(
    createElement(PlanLightbox, {
      group: makeGroup(),
      variantIndex: 0,
      position: { index: 0, total: 3 },
      onClose,
      onNavigate,
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
});

/** Dispatch a bubbling keydown from deep in the DOM so it reaches both the
 *  component's window listener and Radix's document-level Escape handler. */
function pressKey(key: string, target: EventTarget = document.body) {
  act(() => {
    target.dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
    );
  });
}

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

describe('keyboard +/− zoom', () => {
  it('steps the scale by 1.25 per press and stays centred (tx = ty = 0)', () => {
    pressKey('+');
    expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: KEY_ZOOM_STEP });
    pressKey('=');
    expect(readTransform().scale).toBeCloseTo(KEY_ZOOM_STEP ** 2, 5);
    expect(readTransform().tx).toBe(0);
    expect(readTransform().ty).toBe(0);
  });

  it('clamps the scale at 4 no matter how many times + is pressed', () => {
    for (let i = 0; i < 12; i++) pressKey('+');
    expect(readTransform().scale).toBe(MAX_SCALE);
  });

  it('clamps at 1 and resets the pan when zooming all the way back out', () => {
    pressKey('+');
    pressKey('+');
    pressKey('ArrowLeft'); // pan so tx != 0
    expect(readTransform().tx).not.toBe(0);
    for (let i = 0; i < 12; i++) pressKey('-');
    expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: 1 });
    pressKey('_'); // shifted minus is a no-op at the floor
    expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: 1 });
  });

  it('scales an existing pan by the zoom ratio so the view stays anchored', () => {
    pressKey('+');
    pressKey('+'); // scale 1.5625, max pan = 800 * 0.5625 / 2 = 225
    pressKey('ArrowLeft'); // tx 60
    pressKey('ArrowLeft'); // tx 120
    const before = readTransform();
    expect(before.tx).toBe(120);
    pressKey('+'); // tx' = ratio * tx, well inside the clamp
    const after = readTransform();
    expect(after.tx).toBeCloseTo(before.tx * (after.scale / before.scale), 5);
  });

  it('clamps the scaled pan to the clampPanTranslation bounds when zooming out', () => {
    for (let i = 0; i < 12; i++) pressKey('+'); // scale 4, max pan 1200
    for (let i = 0; i < 25; i++) pressKey('ArrowLeft'); // pan hard to the clamp
    expect(readTransform().tx).toBe((VIEWER_W * (MAX_SCALE - 1)) / 2);
    pressKey('-'); // scale 3.2 => max pan (800 * 2.2) / 2 = 880 < ratio * tx
    const t = readTransform();
    expect(t.scale).toBeCloseTo(3.2, 5);
    expect(t.tx).toBeCloseTo((VIEWER_W * (t.scale - 1)) / 2, 5);
  });

  it('0 resets to fit from any zoom/pan state', () => {
    pressKey('+');
    pressKey('+');
    pressKey('ArrowUp');
    pressKey('0');
    expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: 1 });
  });

  it('ignores zoom keys typed into form fields', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    pressKey('+', input);
    expect(readTransform().scale).toBe(1);
  });
});

describe('arrow keys', () => {
  it('navigate prev/next while fully zoomed out', () => {
    pressKey('ArrowLeft');
    expect(onNavigate).toHaveBeenCalledWith(-1);
    pressKey('ArrowRight');
    expect(onNavigate).toHaveBeenCalledWith(1);
    expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: 1 });
  });

  it('pan the plan instead of navigating while zoomed in, clamped to bounds', () => {
    pressKey('+'); // scale 1.25, max pan = 800 * 0.25 / 2 = 100 (x), 75 (y)
    onNavigate.mockClear();
    pressKey('ArrowLeft');
    expect(readTransform().tx).toBe(60);
    pressKey('ArrowLeft'); // 120 clamps to 100
    expect(readTransform().tx).toBe(100);
    pressKey('ArrowRight');
    expect(readTransform().tx).toBe(40);
    pressKey('ArrowUp');
    expect(readTransform().ty).toBe(60);
    pressKey('ArrowDown');
    pressKey('ArrowDown'); // -60 within the 75 bound
    expect(readTransform().ty).toBe(-60);
    expect(onNavigate).not.toHaveBeenCalled();
  });
});

describe('zoom keys while the coarse click-zoom mode is active', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /** Single-click the plan image and let the single-tap timer elapse so the
   *  coarse scroll-zoom mode (image width 160%) engages. */
  function enterCoarseZoom() {
    act(() => {
      planImage().dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true, clientX: 400, clientY: 300 }),
      );
    });
    act(() => {
      vi.advanceTimersByTime(400); // past the 300ms double-tap window
    });
    expect(planImage().style.width).toBe('160%');
  }

  it("'+' exits coarse mode and takes over with the stepped fine zoom", () => {
    enterCoarseZoom();
    pressKey('+');
    const img = planImage();
    expect(img.style.width).not.toBe('160%');
    expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: KEY_ZOOM_STEP });
    // Only the fine zoom is applied — no coarse width stacking on top.
    expect(img.style.width).toBe('');
  });

  it("'-' exits coarse mode and lands on fit (scale stays clamped at 1)", () => {
    enterCoarseZoom();
    pressKey('-');
    expect(planImage().style.width).toBe('');
    expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: 1 });
  });

  it("'0' fully resets from coarse mode: width back to fit, scale 1, no translation", () => {
    enterCoarseZoom();
    pressKey('0');
    expect(planImage().style.width).toBe('');
    expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: 1 });
  });
});

describe('Escape', () => {
  it('first resets a keyboard zoom to fit without closing; second closes', () => {
    pressKey('+');
    pressKey('ArrowLeft');
    pressKey('Escape');
    expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: 1 });
    expect(onClose).not.toHaveBeenCalled();
    pressKey('Escape');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
