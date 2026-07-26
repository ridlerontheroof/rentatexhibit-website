// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, type RenderResult } from '@testing-library/react';
import { createElement } from 'react';
import { PlanLightbox } from './PlanLightbox';
import type { Plan, PlanGroup } from '../../data/floorPlans';

// ---------------------------------------------------------------------------
// Desktop drag-to-pan click-suppression regression tests.
//
// After a mouse drag-to-pan, the browser fires a synthetic click on the plan
// image; PlanLightbox swallows it via the suppressClick ref so the drag can't
// accidentally toggle scroll-zoom mode. But if the mouseup lands OFF the
// image (a common way to end a pan), no synthetic click ever arrives — the
// flag must not stay set and swallow the user's NEXT deliberate click.
// Mirrors the mobile sheet's suppressSheetClick pointerdown-clear fix.
// ---------------------------------------------------------------------------

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

beforeEach(() => {
  vi.useFakeTimers();
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
  document.body.innerHTML = '';
  vi.useRealTimers();
  vi.restoreAllMocks();
});

/** The plan image inside the viewer. */
function planImg(): HTMLImageElement {
  const el = document.querySelector('img[alt*="floor plan"]');
  if (!el) throw new Error('plan image not rendered');
  return el as HTMLImageElement;
}

/** Scroll-zoom ("zoomed") mode gives the image the max-w-none class. */
function inScrollZoomMode(): boolean {
  return planImg().className.includes('max-w-none');
}

/** Pinch/keyboard zoom in so drag-to-pan is armed (onMouseDown requires scale > 1). */
function zoomInViaKeyboard() {
  act(() => {
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: '+', bubbles: true, cancelable: true }),
    );
  });
  // cursor-grab confirms pinch.scale > 1 (pan-ready state).
  expect(planImg().className).toContain('cursor-grab');
}

function mouseDownOnImg(clientX: number, clientY: number) {
  act(() => {
    planImg().dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0, clientX, clientY }),
    );
  });
}

/** Move/up handlers are attached to window while a drag is in progress. */
function windowMouse(type: 'mousemove' | 'mouseup', clientX: number, clientY: number) {
  act(() => {
    window.dispatchEvent(
      new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, clientX, clientY }),
    );
  });
}

function clickImg(clientX = 0, clientY = 0) {
  act(() => {
    planImg().dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, clientX, clientY }),
    );
  });
}

/** A lone click toggles zoom mode only after the 300ms double-tap window. */
function flushSingleTapTimer() {
  act(() => {
    vi.advanceTimersByTime(350);
  });
}

describe('desktop pan click suppression', () => {
  it('a plain click (no drag) toggles scroll-zoom mode', () => {
    expect(inScrollZoomMode()).toBe(false);
    clickImg();
    flushSingleTapTimer();
    expect(inScrollZoomMode()).toBe(true);
  });

  it('the synthetic click right after a drag is swallowed (no zoom toggle)', () => {
    zoomInViaKeyboard();
    mouseDownOnImg(100, 100);
    windowMouse('mousemove', 150, 150); // > 3px slop → a real drag
    windowMouse('mouseup', 150, 150);
    clickImg(150, 150); // synthetic click from the same mouse release
    flushSingleTapTimer();
    expect(inScrollZoomMode()).toBe(false);
  });

  it('a drag whose mouseup lands off the image (no synthetic click) does not swallow the next deliberate click', () => {
    zoomInViaKeyboard();
    // Drag-to-pan, ending with the cursor off the image: the window-level
    // mouseup sets the suppress flag, but no click follows.
    mouseDownOnImg(100, 100);
    windowMouse('mousemove', 300, 300);
    windowMouse('mouseup', 300, 300);

    // Later deliberate click on the plan image (mousedown → mouseup → click,
    // no movement). It must toggle scroll-zoom mode, not be swallowed by the
    // stale flag.
    mouseDownOnImg(120, 120);
    windowMouse('mouseup', 120, 120);
    clickImg(120, 120);
    flushSingleTapTimer();
    expect(inScrollZoomMode()).toBe(true);
  });

  it('a non-drag mousedown/up (within the 3px slop) still lets the click through', () => {
    zoomInViaKeyboard();
    mouseDownOnImg(100, 100);
    windowMouse('mousemove', 101, 101); // jitter, not a drag
    windowMouse('mouseup', 101, 101);
    clickImg(101, 101);
    flushSingleTapTimer();
    expect(inScrollZoomMode()).toBe(true);
  });
});
