// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { cleanup, fireEvent, render, act } from '@testing-library/react';
import { PlanLightbox } from './PlanLightbox';
import { planGroups } from '../../data/floorPlans';

// Escape-key regression tests. While zoomed (pinch or coarse scroll-zoom
// mode), the first Escape must reset the plan to fit WITHOUT closing the
// lightbox; only a follow-up Escape (while fully zoomed out) closes it.
// This two-step behavior lives in DialogContent's onEscapeKeyDown.

const VIEWER_W = 1000;
const VIEWER_H = 800;

function stubMatchMedia() {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

function renderLightbox() {
  const onClose = vi.fn();
  const view = render(
    createElement(PlanLightbox, {
      group: planGroups[0],
      variantIndex: 0,
      position: { index: 0, total: 1 },
      onClose,
      onNavigate: () => {},
      onVariantChange: () => {},
    }),
  );
  const img = document.querySelector('img[alt*="floor plan"]') as HTMLImageElement;
  expect(img).toBeTruthy();
  const viewer = img.parentElement as HTMLElement;

  // jsdom has no layout: give the viewer and image real dimensions so the
  // click-point math and pan clamping behave like in a browser.
  viewer.getBoundingClientRect = () =>
    ({ left: 0, top: 0, right: VIEWER_W, bottom: VIEWER_H, width: VIEWER_W, height: VIEWER_H, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
  for (const el of [viewer, img]) {
    Object.defineProperty(el, 'clientWidth', { value: VIEWER_W, configurable: true });
    Object.defineProperty(el, 'clientHeight', { value: VIEWER_H, configurable: true });
  }
  return { view, img, viewer, onClose };
}

function clickAt(img: HTMLElement, x: number, y: number) {
  fireEvent.click(img, { clientX: x, clientY: y });
}

/** Dispatch Escape the way a browser does: keydown on the focused element,
 * bubbling to document where Radix's dismissable layer listens. */
function pressEscape() {
  fireEvent.keyDown(document.activeElement ?? document.body, {
    key: 'Escape',
    code: 'Escape',
  });
}

beforeEach(() => {
  stubMatchMedia();
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  act(() => {
    vi.runOnlyPendingTimers();
  });
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('PlanLightbox Escape two-step behavior', () => {
  it('first Escape while pinch-zoomed resets to fit without closing; second Escape closes', () => {
    const { img, onClose } = renderLightbox();

    // Zoom in via double-click (pinch state, scale 2).
    clickAt(img, 750, 600);
    act(() => vi.advanceTimersByTime(100));
    clickAt(img, 750, 600);
    expect(img.style.transform).toBe('translate(-250px, -200px) scale(2)');

    // First Escape: reset to fit, viewer stays open.
    pressEscape();
    expect(img.style.transform).toBe('translate(0px, 0px) scale(1)');
    expect(onClose).not.toHaveBeenCalled();

    // Second Escape: now the viewer closes.
    pressEscape();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('first Escape while in coarse scroll-zoom mode exits zoom without closing; second Escape closes', () => {
    const { img, onClose } = renderLightbox();

    // Enter coarse zoom mode with a lone click (single-tap timer fires at 300ms).
    clickAt(img, 500, 400);
    act(() => vi.advanceTimersByTime(300));
    expect(img.style.width).toBe('160%');

    // First Escape: leaves coarse zoom mode, viewer stays open.
    pressEscape();
    expect(img.style.width).not.toBe('160%');
    expect(onClose).not.toHaveBeenCalled();

    // Second Escape: closes.
    pressEscape();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Escape while not zoomed closes immediately', () => {
    const { onClose } = renderLightbox();
    pressEscape();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
