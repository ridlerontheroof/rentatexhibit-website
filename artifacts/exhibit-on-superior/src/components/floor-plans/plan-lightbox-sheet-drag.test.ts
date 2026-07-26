// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, type RenderResult } from '@testing-library/react';
import { createElement } from 'react';
import { PlanLightbox } from './PlanLightbox';
import type { Plan, PlanGroup } from '../../data/floorPlans';

// ---------------------------------------------------------------------------
// Mobile bottom-sheet drag regression tests for the floor-plan lightbox.
//
// The details <aside> renders its height from the --sheet-h CSS variable:
//   - `${dragHeightPx}px` while a drag is in progress,
//   - `${sheetSnap}dvh` (40 or 85) once settled.
// The sticky summary bar is the drag handle (onPointerDown/Move/Up/Cancel in
// PlanLightbox.tsx). These tests dispatch pointer event sequences on the
// handle and assert the wiring around the pure snap math in lib/sheetSnap.ts:
//   - a fast upward flick from collapsed expands regardless of distance,
//   - a slow small drag returns to the nearest snap point,
//   - the px drag height is always cleared (back to a dvh snap) on release
//     or cancel, so the sheet can never be left stuck mid-drag.
// ---------------------------------------------------------------------------

const SHEET_COLLAPSED = 40; // dvh
const SHEET_EXPANDED = 85; // dvh
const VIEWPORT_H = 1000; // px, so collapsed = 400px, expanded = 850px
const COLLAPSED_PX = (SHEET_COLLAPSED / 100) * VIEWPORT_H;
const EXPANDED_PX = (SHEET_EXPANDED / 100) * VIEWPORT_H;
const MIN_DRAG_FRACTION = 0.6; // mirrors lib/sheetSnap.ts clamp floor

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
let originalInnerHeight: number;

beforeEach(() => {
  originalInnerHeight = window.innerHeight;
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    writable: true,
    value: VIEWPORT_H,
  });

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
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    writable: true,
    value: originalInnerHeight,
  });
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

/** The drag handle is the sticky summary bar containing the grabber button. */
function handle(): HTMLElement {
  const grabber = document.querySelector(
    'button[aria-label="Expand details"], button[aria-label="Collapse details"]',
  );
  const el = grabber?.parentElement;
  if (!el) throw new Error('sheet drag handle not rendered');
  return el as HTMLElement;
}

/** The sheet <aside> whose height is driven by the --sheet-h variable. */
function sheet(): HTMLElement {
  const el = document.querySelector('aside');
  if (!el) throw new Error('details sheet not rendered');
  return el as HTMLElement;
}

function sheetHeight(): string {
  return sheet().style.getPropertyValue('--sheet-h');
}

/** jsdom has no PointerEvent constructor with clientY; a plain Event with the
 *  pointer fields attached works because React's synthetic event reads them
 *  off the native event. timeStamp is read-only, so it is redefined. React
 *  falls back to Date.now() when timeStamp is 0 (falsy), so all test
 *  timestamps are offset by a nonzero base. */
const TIME_BASE = 10_000;

function firePointer(
  type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel',
  clientY: number,
  timeStamp: number,
) {
  act(() => {
    const e = new Event(type, { bubbles: true, cancelable: true });
    Object.assign(e, { clientX: 0, clientY, pointerId: 1, isPrimary: true });
    Object.defineProperty(e, 'timeStamp', { value: TIME_BASE + timeStamp });
    handle().dispatchEvent(e);
  });
}

describe('mobile sheet drag snapping', () => {
  it('starts collapsed at 40dvh', () => {
    expect(sheetHeight()).toBe(`${SHEET_COLLAPSED}dvh`);
  });

  it('tracks the finger in px mid-drag, clamped to the drag bounds', () => {
    // Collapsed = 400px. Drag up 100px → 500px.
    firePointer('pointerdown', 800, 0);
    firePointer('pointermove', 700, 100);
    expect(sheetHeight()).toBe(`${COLLAPSED_PX + 100}px`);

    // Drag far below the collapsed height: clamps at 60% of collapsed (240px).
    firePointer('pointermove', 1500, 200);
    expect(sheetHeight()).toBe(`${COLLAPSED_PX * MIN_DRAG_FRACTION}px`);

    // Drag far above the expanded height: clamps at 850px.
    firePointer('pointermove', -1000, 300);
    expect(sheetHeight()).toBe(`${EXPANDED_PX}px`);

    firePointer('pointerup', -1000, 310);
  });

  it('a fast upward flick from collapsed expands, even over a short distance', () => {
    // 40px in 20ms = 2 px/ms, well past the 0.5 px/ms flick threshold; the
    // sheet is nowhere near the midpoint (440px << 625px) so distance alone
    // would have snapped it back.
    firePointer('pointerdown', 800, 0);
    firePointer('pointermove', 760, 20);
    expect(sheetHeight()).toBe(`${COLLAPSED_PX + 40}px`);
    firePointer('pointerup', 760, 30);
    expect(sheetHeight()).toBe(`${SHEET_EXPANDED}dvh`);
  });

  it('a fast downward flick from expanded collapses', () => {
    // Expand first via a flick.
    firePointer('pointerdown', 800, 0);
    firePointer('pointermove', 760, 20);
    firePointer('pointerup', 760, 30);
    expect(sheetHeight()).toBe(`${SHEET_EXPANDED}dvh`);

    firePointer('pointerdown', 200, 1000);
    firePointer('pointermove', 240, 1020);
    firePointer('pointerup', 240, 1030);
    expect(sheetHeight()).toBe(`${SHEET_COLLAPSED}dvh`);
  });

  it('a slow small drag returns to the nearest snap point (never stuck in px)', () => {
    // 10px over 100ms = 0.1 px/ms — no flick; 410px is below the 625px
    // midpoint, so the sheet settles back to collapsed.
    firePointer('pointerdown', 800, 0);
    firePointer('pointermove', 790, 100);
    expect(sheetHeight()).toBe(`${COLLAPSED_PX + 10}px`);
    firePointer('pointerup', 790, 150);
    expect(sheetHeight()).toBe(`${SHEET_COLLAPSED}dvh`);
  });

  it('a slow drag past the midpoint snaps to expanded', () => {
    // Drag up 300px slowly → 700px, above the 625px midpoint.
    firePointer('pointerdown', 800, 0);
    firePointer('pointermove', 650, 300);
    firePointer('pointermove', 500, 600);
    firePointer('pointerup', 500, 650);
    expect(sheetHeight()).toBe(`${SHEET_EXPANDED}dvh`);
  });

  it('a fast flick followed by a pause before release ignores the stale velocity', () => {
    // Flick-speed move, but release 200ms later (> 100ms staleness window):
    // treated as a slow drag, and 440px < midpoint → collapses.
    firePointer('pointerdown', 800, 0);
    firePointer('pointermove', 760, 20);
    firePointer('pointerup', 760, 220);
    expect(sheetHeight()).toBe(`${SHEET_COLLAPSED}dvh`);
  });

  it('pointercancel mid-drag still snaps and clears the px height', () => {
    // Slow drag up 100px (0.33 px/ms, below the flick threshold) → 500px,
    // still under the 625px midpoint.
    firePointer('pointerdown', 800, 0);
    firePointer('pointermove', 700, 300);
    expect(sheetHeight()).toBe(`${COLLAPSED_PX + 100}px`);
    firePointer('pointercancel', 700, 350);
    // Never left mid-drag: height is a dvh snap point again.
    expect(sheetHeight()).toBe(`${SHEET_COLLAPSED}dvh`);
  });

  it('pointermove without a preceding pointerdown never enters drag state', () => {
    firePointer('pointermove', 700, 100);
    expect(sheetHeight()).toBe(`${SHEET_COLLAPSED}dvh`);
    firePointer('pointerup', 700, 150);
    expect(sheetHeight()).toBe(`${SHEET_COLLAPSED}dvh`);
  });
});

/** The grabber button at the top of the sheet (its aria-label reflects state). */
function grabber(): HTMLButtonElement {
  const el = document.querySelector(
    'button[aria-label="Expand details"], button[aria-label="Collapse details"]',
  );
  if (!el) throw new Error('grabber button not rendered');
  return el as HTMLButtonElement;
}

function clickGrabber() {
  act(() => {
    grabber().dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
}

describe('grabber button tap toggle', () => {
  it('a click expands the collapsed sheet and flips the aria-label', () => {
    expect(sheetHeight()).toBe(`${SHEET_COLLAPSED}dvh`);
    expect(grabber().getAttribute('aria-label')).toBe('Expand details');

    clickGrabber();
    expect(sheetHeight()).toBe(`${SHEET_EXPANDED}dvh`);
    expect(grabber().getAttribute('aria-label')).toBe('Collapse details');
  });

  it('a second click collapses the expanded sheet back to 40dvh', () => {
    clickGrabber();
    expect(sheetHeight()).toBe(`${SHEET_EXPANDED}dvh`);

    clickGrabber();
    expect(sheetHeight()).toBe(`${SHEET_COLLAPSED}dvh`);
    expect(grabber().getAttribute('aria-label')).toBe('Expand details');
  });
});

describe('drag release does not re-toggle via the synthetic click', () => {
  // On real touch devices, lifting the finger after a drag fires a synthetic
  // click on the grabber button under the finger. That click must not flip
  // the snap point the drag just chose.
  it('a fast upward flick followed by a click stays expanded', () => {
    firePointer('pointerdown', 800, 0);
    firePointer('pointermove', 760, 20);
    firePointer('pointerup', 760, 30);
    expect(sheetHeight()).toBe(`${SHEET_EXPANDED}dvh`);

    clickGrabber(); // synthetic click from the same touch lift
    expect(sheetHeight()).toBe(`${SHEET_EXPANDED}dvh`);
  });

  it('a slow drag that snaps back, followed by a click, stays collapsed', () => {
    firePointer('pointerdown', 800, 0);
    firePointer('pointermove', 790, 100);
    firePointer('pointerup', 790, 150);
    expect(sheetHeight()).toBe(`${SHEET_COLLAPSED}dvh`);

    clickGrabber();
    expect(sheetHeight()).toBe(`${SHEET_COLLAPSED}dvh`);
  });

  it('only the one synthetic click is swallowed — the next tap toggles again', () => {
    firePointer('pointerdown', 800, 0);
    firePointer('pointermove', 760, 20);
    firePointer('pointerup', 760, 30);
    clickGrabber(); // swallowed synthetic click
    expect(sheetHeight()).toBe(`${SHEET_EXPANDED}dvh`);

    clickGrabber(); // deliberate later tap
    expect(sheetHeight()).toBe(`${SHEET_COLLAPSED}dvh`);
  });

  it('a plain tap (pointer down/up without movement) still toggles via click', () => {
    firePointer('pointerdown', 800, 0);
    firePointer('pointerup', 800, 50);
    expect(sheetHeight()).toBe(`${SHEET_COLLAPSED}dvh`);

    clickGrabber(); // the tap's click must NOT be suppressed
    expect(sheetHeight()).toBe(`${SHEET_EXPANDED}dvh`);
  });

  it('a drag with no follow-up click does not swallow the next tap-toggle', () => {
    // Real drag ends (flag set) but no synthetic click follows (e.g. the
    // finger lifted off the grabber). A later deliberate tap (pointer
    // down/up + click) must still toggle.
    firePointer('pointerdown', 800, 0);
    firePointer('pointermove', 760, 20);
    firePointer('pointerup', 760, 30);
    expect(sheetHeight()).toBe(`${SHEET_EXPANDED}dvh`);

    firePointer('pointerdown', 200, 1000);
    firePointer('pointerup', 200, 1050);
    clickGrabber();
    expect(sheetHeight()).toBe(`${SHEET_COLLAPSED}dvh`);
  });

  it('a keyboard toggle right after a drag with no synthetic click is not swallowed', () => {
    // Real drag ends (flag set) but no synthetic click follows. A keyboard
    // user then presses Enter on the grabber: that fires a click WITHOUT a
    // preceding pointerdown, so the stale flag must be cleared on keydown
    // instead — the first keyboard toggle must not be silently swallowed.
    firePointer('pointerdown', 800, 0);
    firePointer('pointermove', 760, 20);
    firePointer('pointerup', 760, 30);
    expect(sheetHeight()).toBe(`${SHEET_EXPANDED}dvh`);

    act(() => {
      grabber().dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
      );
      // Browsers fire the activation click after keydown/keyup on a button.
      grabber().dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });
    expect(sheetHeight()).toBe(`${SHEET_COLLAPSED}dvh`);
  });

  it('movement within the 5px tap slop does not suppress the click', () => {
    firePointer('pointerdown', 800, 0);
    firePointer('pointermove', 797, 30); // 3px — jitter, not a drag
    firePointer('pointerup', 797, 60);
    expect(sheetHeight()).toBe(`${SHEET_COLLAPSED}dvh`);

    clickGrabber();
    expect(sheetHeight()).toBe(`${SHEET_EXPANDED}dvh`);
  });
});

describe('sheet reset on plan-group change', () => {
  it('collapses an expanded sheet when a different group id is shown', () => {
    clickGrabber();
    expect(sheetHeight()).toBe(`${SHEET_EXPANDED}dvh`);

    const otherGroup = { ...makeGroup(), id: '7-2br-1-std' };
    act(() => {
      view!.rerender(
        createElement(PlanLightbox, {
          group: otherGroup,
          variantIndex: 0,
          position: { index: 1, total: 3 },
          onClose: vi.fn(),
          onNavigate: vi.fn(),
          onVariantChange: vi.fn(),
        }),
      );
    });

    expect(sheetHeight()).toBe(`${SHEET_COLLAPSED}dvh`);
    expect(grabber().getAttribute('aria-label')).toBe('Expand details');
  });

  it('re-rendering with the same group id keeps the expanded sheet open', () => {
    clickGrabber();
    expect(sheetHeight()).toBe(`${SHEET_EXPANDED}dvh`);

    act(() => {
      view!.rerender(
        createElement(PlanLightbox, {
          group: makeGroup(), // same id, fresh object
          variantIndex: 0,
          position: { index: 0, total: 3 },
          onClose: vi.fn(),
          onNavigate: vi.fn(),
          onVariantChange: vi.fn(),
        }),
      );
    });

    expect(sheetHeight()).toBe(`${SHEET_EXPANDED}dvh`);
  });
});
