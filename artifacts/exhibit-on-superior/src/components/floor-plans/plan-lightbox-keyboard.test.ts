// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, type RenderResult } from '@testing-library/react';
import { createElement } from 'react';
import { PlanLightbox } from './PlanLightbox';
import { stubTransformAwareRects } from './lightbox-rect-stub';
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
  // Without a rect stub, jsdom's zero-size rects silently exercise the
  // "no layout info" fallback in clampPan instead of the real offset path.
  stubTransformAwareRects({ viewerWidth: VIEWER_W, viewerHeight: VIEWER_H });

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

describe('click outside the shortcut legend', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function clickAt(target: Element, x = 400, y = 300) {
    act(() => {
      target.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true, clientX: x, clientY: y }),
      );
    });
  }

  function openLegend() {
    pressKey('?');
    expect(document.getElementById('plan-shortcuts-legend')).not.toBeNull();
  }

  it('a click on the plan dismisses the legend without toggling zoom', () => {
    openLegend();
    clickAt(planImage());
    expect(document.getElementById('plan-shortcuts-legend')).toBeNull();
    // The dismissing click must not also trigger the single-click zoom toggle.
    act(() => {
      vi.advanceTimersByTime(400); // past the 300ms single-tap window
    });
    expect(planImage().style.width).toBe(''); // coarse zoom not engaged
    expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: 1 });
  });

  it('the next click after dismissal toggles zoom as usual', () => {
    openLegend();
    clickAt(planImage());
    expect(document.getElementById('plan-shortcuts-legend')).toBeNull();
    clickAt(planImage());
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(planImage().style.width).toBe('160%');
  });

  it('one click on the next arrow dismisses the legend AND navigates', () => {
    openLegend();
    const next = document.querySelector<HTMLButtonElement>(
      'button[aria-label="Next floor plan"]',
    )!;
    clickAt(next);
    expect(document.getElementById('plan-shortcuts-legend')).toBeNull();
    expect(onNavigate).toHaveBeenCalledWith(1);
  });

  it('one click on the prev arrow dismisses the legend AND navigates', () => {
    openLegend();
    const prev = document.querySelector<HTMLButtonElement>(
      'button[aria-label="Previous floor plan"]',
    )!;
    clickAt(prev);
    expect(document.getElementById('plan-shortcuts-legend')).toBeNull();
    expect(onNavigate).toHaveBeenCalledWith(-1);
  });

  it('one click on the Zoom button dismisses the legend AND enters zoom mode', () => {
    openLegend();
    const zoomBtn = document.querySelector<HTMLButtonElement>(
      'button[aria-label="Zoom in"]',
    )!;
    clickAt(zoomBtn);
    expect(document.getElementById('plan-shortcuts-legend')).toBeNull();
    expect(planImage().style.width).toBe('160%'); // coarse zoom engaged
  });

  it('one click on an availability CTA dismisses the legend AND fires the link handler', () => {
    openLegend();
    const cta = Array.from(document.querySelectorAll('a')).find((a) =>
      a.textContent?.includes('Check Availability'),
    )!;
    clickAt(cta);
    expect(document.getElementById('plan-shortcuts-legend')).toBeNull();
    expect(onClose).toHaveBeenCalledTimes(1); // handleAvailabilityClick ran
  });

  it('a click inside the legend leaves it open', () => {
    openLegend();
    const legend = document.getElementById('plan-shortcuts-legend')!;
    clickAt(legend);
    expect(document.getElementById('plan-shortcuts-legend')).not.toBeNull();
  });

  it('the × button inside the legend still dismisses it', () => {
    openLegend();
    const dismiss = document.querySelector<HTMLButtonElement>(
      'button[aria-label="Dismiss keyboard shortcuts"]',
    )!;
    clickAt(dismiss);
    expect(document.getElementById('plan-shortcuts-legend')).toBeNull();
  });

  /** Re-render with a two-variant group so the "Flr" variant-picker buttons
   *  appear, capturing a fresh onVariantChange spy. */
  function renderMultiVariant() {
    view?.unmount();
    const a = makePlan();
    const b: Plan = {
      ...makePlan(),
      id: 'unit-06-30-45',
      floorLabel: '30-45',
      floors: [30, 31],
      floorMin: 30,
      floorMax: 45,
      sqft: 780,
      sqftMin: 780,
    };
    const group: PlanGroup = { ...makeGroup(), variants: [a, b] };
    const onVariantChange = vi.fn();
    view = render(
      createElement(PlanLightbox, {
        group,
        variantIndex: 0,
        position: { index: 0, total: 3 },
        onClose,
        onNavigate,
        onVariantChange,
      }),
    );
    return onVariantChange;
  }

  it('one click on a "Flr" variant button dismisses the legend AND switches the variant', () => {
    const onVariantChange = renderMultiVariant();
    openLegend();
    const flrButtons = Array.from(document.querySelectorAll('button')).filter((b) =>
      b.textContent?.startsWith('Flr'),
    );
    expect(flrButtons.length).toBe(2);
    clickAt(flrButtons[1]);
    expect(document.getElementById('plan-shortcuts-legend')).toBeNull();
    expect(onVariantChange).toHaveBeenCalledTimes(1);
    expect(onVariantChange).toHaveBeenCalledWith(1);
  });

  it('one click on the sheet handle dismisses the legend AND expands the sheet', () => {
    openLegend();
    const handle = document.querySelector<HTMLButtonElement>(
      'button[aria-label="Expand details"]',
    )!;
    expect(handle).not.toBeNull();
    clickAt(handle);
    expect(document.getElementById('plan-shortcuts-legend')).toBeNull();
    // The click acted: the handle now offers to collapse the expanded sheet.
    expect(
      document.querySelector('button[aria-label="Collapse details"]'),
    ).not.toBeNull();
    expect(document.querySelector('button[aria-label="Expand details"]')).toBeNull();
  });

  it('a pointer-drag on the sheet handle dismisses the legend AND still snaps the sheet', () => {
    openLegend();
    const handleArea = document.querySelector<HTMLButtonElement>(
      'button[aria-label="Expand details"]',
    )!.parentElement!;
    // Drag the handle upward (pointer events bypass the click-capture
    // dismiss logic entirely, so this exercises the drag-start dismissal).
    const pointer = (type: string, clientY: number) =>
      act(() => {
        handleArea.dispatchEvent(
          new MouseEvent(type, { bubbles: true, cancelable: true, clientY }),
        );
      });
    pointer('pointerdown', 600);
    // Legend clears as soon as the drag starts.
    expect(document.getElementById('plan-shortcuts-legend')).toBeNull();
    pointer('pointermove', 400);
    pointer('pointermove', 200);
    pointer('pointerup', 200);
    // The upward drag still snapped the sheet to expanded.
    expect(
      document.querySelector('button[aria-label="Collapse details"]'),
    ).not.toBeNull();
  });

  /** Dispatch a touch event with the given touch points. jsdom has no
   *  TouchEvent constructor, so fake one via a plain Event with touches
   *  attached — React's synthetic event reads them straight off the native
   *  event object. */
  function touch(
    target: Element,
    type: 'touchstart' | 'touchmove' | 'touchend',
    points: Array<{ clientX: number; clientY: number }>,
  ) {
    act(() => {
      const ev = new Event(type, { bubbles: true, cancelable: true });
      Object.assign(ev, { touches: points, changedTouches: points, targetTouches: points });
      target.dispatchEvent(ev);
    });
  }

  it('a one-finger swipe dismisses the legend AND still navigates to the next plan', () => {
    openLegend();
    const img = planImage();
    // Fully zoomed out: a horizontal swipe past the 50px threshold navigates.
    touch(img, 'touchstart', [{ clientX: 400, clientY: 300 }]);
    // Gesture start alone must not have dismissed it (only swipes navigate).
    expect(document.getElementById('plan-shortcuts-legend')).not.toBeNull();
    touch(img, 'touchmove', [{ clientX: 250, clientY: 300 }]);
    touch(img, 'touchend', [{ clientX: 250, clientY: 300 }]);
    // The swipe changed the plan underneath, so the legend must not stay
    // stranded on top — swipes never produce a click, bypassing the
    // click-capture dismiss path.
    expect(document.getElementById('plan-shortcuts-legend')).toBeNull();
    expect(onNavigate).toHaveBeenCalledWith(1);
  });

  it('a two-finger pinch start on the plan dismisses the legend AND the pinch still zooms', () => {
    openLegend();
    const img = planImage();
    // Two fingers down: gesture start alone dismisses the legend.
    touch(img, 'touchstart', [
      { clientX: 350, clientY: 300 },
      { clientX: 450, clientY: 300 },
    ]);
    expect(document.getElementById('plan-shortcuts-legend')).toBeNull();
    // Spread the fingers: the pinch itself keeps working (scale grows).
    touch(img, 'touchmove', [
      { clientX: 300, clientY: 300 },
      { clientX: 500, clientY: 300 },
    ]);
    expect(readTransform().scale).toBeCloseTo(2, 5);
    touch(img, 'touchend', []);
  });

  it('a one-finger pan start while pinch-zoomed dismisses the legend AND still pans', () => {
    pressKey('+'); // pinch-zoom in so a single finger pans
    openLegend();
    const img = planImage();
    touch(img, 'touchstart', [{ clientX: 400, clientY: 300 }]);
    expect(document.getElementById('plan-shortcuts-legend')).toBeNull();
    touch(img, 'touchmove', [{ clientX: 360, clientY: 300 }]);
    expect(readTransform().tx).toBe(-40);
  });

  it('the ? toggle button still toggles rather than close-then-reopen', () => {
    openLegend();
    const toggle = document.querySelector<HTMLButtonElement>(
      'button[aria-controls="plan-shortcuts-legend"]',
    )!;
    clickAt(toggle);
    expect(document.getElementById('plan-shortcuts-legend')).toBeNull();
    clickAt(toggle);
    expect(document.getElementById('plan-shortcuts-legend')).not.toBeNull();
  });
});

describe('Escape', () => {
  it('first dismisses the shortcut legend without closing; second closes', () => {
    pressKey('?');
    expect(document.getElementById('plan-shortcuts-legend')).not.toBeNull();
    pressKey('Escape');
    expect(document.getElementById('plan-shortcuts-legend')).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
    pressKey('Escape');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('dismisses the legend before resetting zoom: legend, then zoom, then close', () => {
    pressKey('+');
    pressKey('?');
    pressKey('Escape'); // 1: legend only
    expect(document.getElementById('plan-shortcuts-legend')).toBeNull();
    expect(readTransform().scale).toBeCloseTo(KEY_ZOOM_STEP, 5);
    expect(onClose).not.toHaveBeenCalled();
    pressKey('Escape'); // 2: reset zoom
    expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: 1 });
    expect(onClose).not.toHaveBeenCalled();
    pressKey('Escape'); // 3: close
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('first resets a keyboard zoom to fit without closing; second closes', () => {
    pressKey('+');
    pressKey('ArrowLeft');
    pressKey('Escape');
    expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: 1 });
    expect(onClose).not.toHaveBeenCalled();
    pressKey('Escape');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('first backs out of the coarse click-zoom without closing; second closes', () => {
    vi.useFakeTimers();
    try {
      // Enter coarse mode: single click, then let the single-tap timer elapse.
      act(() => {
        planImage().dispatchEvent(
          new MouseEvent('click', { bubbles: true, cancelable: true, clientX: 400, clientY: 300 }),
        );
      });
      act(() => {
        vi.advanceTimersByTime(400); // past the 300ms double-tap window
      });
      expect(planImage().style.width).toBe('160%');

      pressKey('Escape');
      // Escape resets coarse mode instantly (no exit animation).
      expect(planImage().style.width).toBe('');
      expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: 1 });
      expect(onClose).not.toHaveBeenCalled();

      pressKey('Escape');
      expect(onClose).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
