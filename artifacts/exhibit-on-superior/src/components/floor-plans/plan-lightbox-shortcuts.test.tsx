// @vitest-environment jsdom
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, act } from '@testing-library/react';

/**
 * Keyboard-shortcut legend accuracy tests for the floor-plan lightbox.
 *
 * The lightbox shows a desktop legend (toggled by the "?" button/key) listing
 * its keyboard shortcuts. If a future change adds, removes, or remaps a
 * shortcut in the key handler without updating the legend (or vice versa),
 * the visible legend silently drifts out of sync and misleads visitors.
 *
 * These tests lock both halves together:
 *  1. The legend lists exactly the expected shortcut rows (no more, no less).
 *  2. Every key the legend advertises actually triggers its behaviour:
 *     + / − zoom, 0 resets, ←/→ navigate, arrows pan while zoomed,
 *     Esc fits-then-closes, ? toggles the panel.
 */

import { PlanLightbox } from './PlanLightbox';
import { planGroups } from '../../data/floorPlans';

// jsdom reports 0 for element dimensions; the pan clamp (clampPanTranslation)
// needs a real viewer/image size or every pan is clamped straight back to 0.
const dimensionSpies: Array<{ restore: () => void }> = [];
beforeAll(() => {
  for (const [prop, value] of [
    ['clientWidth', 1000],
    ['clientHeight', 800],
  ] as const) {
    const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, prop);
    Object.defineProperty(HTMLElement.prototype, prop, {
      configurable: true,
      get: () => value,
    });
    dimensionSpies.push({
      restore: () => {
        if (original) Object.defineProperty(HTMLElement.prototype, prop, original);
        else delete (HTMLElement.prototype as Record<string, unknown>)[prop];
      },
    });
  }
});
afterAll(() => dimensionSpies.forEach((s) => s.restore()));

const onClose = vi.fn();
const onNavigate = vi.fn();
const onVariantChange = vi.fn();

function renderLightbox() {
  return render(
    <PlanLightbox
      group={planGroups[0]}
      variantIndex={0}
      position={{ index: 0, total: planGroups.length }}
      onClose={onClose}
      onNavigate={onNavigate}
      onVariantChange={onVariantChange}
    />,
  );
}

function pressKey(key: string) {
  act(() => {
    // The shortcut handler listens on window; Radix's Escape handling listens
    // on the document — a bubbled keydown from body reaches both.
    fireEvent.keyDown(document.body, { key, bubbles: true });
  });
}

/** The floor-plan image inside the viewer (portal-rendered by Radix). */
function planImage(): HTMLImageElement {
  const img = document.querySelector('[role="dialog"] img');
  expect(img, 'expected the plan image inside the dialog').toBeTruthy();
  return img as HTMLImageElement;
}

function scaleOf(img: HTMLImageElement): number {
  const m = /scale\(([\d.]+)\)/.exec(img.style.transform);
  return m ? parseFloat(m[1]) : 1;
}

function translateOf(img: HTMLImageElement): { tx: number; ty: number } {
  const m = /translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/.exec(img.style.transform);
  return m ? { tx: parseFloat(m[1]), ty: parseFloat(m[2]) } : { tx: 0, ty: 0 };
}

beforeEach(() => {
  onClose.mockClear();
  onNavigate.mockClear();
  onVariantChange.mockClear();
});

afterEach(() => cleanup());

describe('shortcut legend contents', () => {
  it('opens via the "?" key and lists exactly the handled shortcuts', () => {
    renderLightbox();
    expect(document.getElementById('plan-shortcuts-legend')).toBeNull();

    pressKey('?');
    const legend = document.getElementById('plan-shortcuts-legend');
    expect(legend, 'legend should appear after pressing ?').toBeTruthy();

    // The exact rows the legend advertises. If a shortcut is added, removed,
    // or remapped in handleKey, update BOTH the legend markup and this list —
    // and add/adjust a behaviour test below proving the key actually works.
    const keys = Array.from(legend!.querySelectorAll('dt')).map((dt) =>
      dt.textContent?.trim(),
    );
    expect(keys).toEqual(['+ / −', '0', '← →', 'Arrows', 'Esc', '?']);

    // "?" toggles the panel closed again — the legend's own last row.
    pressKey('?');
    expect(document.getElementById('plan-shortcuts-legend')).toBeNull();
  });

  it('has a "?" toggle button wired to the same legend', () => {
    renderLightbox();
    const btn = screen.getByRole('button', { name: /show keyboard shortcuts/i });
    expect(btn.getAttribute('aria-controls')).toBe('plan-shortcuts-legend');
    fireEvent.click(btn);
    expect(document.getElementById('plan-shortcuts-legend')).toBeTruthy();
  });
});

describe('advertised shortcuts actually work', () => {
  it('+ zooms in, − zooms out, 0 resets', () => {
    renderLightbox();
    const img = planImage();
    expect(scaleOf(img)).toBe(1);

    pressKey('+');
    expect(scaleOf(img)).toBeCloseTo(1.25);
    pressKey('+');
    expect(scaleOf(img)).toBeCloseTo(1.5625);

    pressKey('-');
    expect(scaleOf(img)).toBeCloseTo(1.25);

    pressKey('+');
    pressKey('0');
    expect(scaleOf(img)).toBe(1);
  });

  it('= and _ work as unshifted aliases of + and −', () => {
    renderLightbox();
    const img = planImage();
    pressKey('=');
    expect(scaleOf(img)).toBeCloseTo(1.25);
    pressKey('_');
    expect(scaleOf(img)).toBe(1);
  });

  it('← and → navigate between plans while zoomed out', () => {
    renderLightbox();
    pressKey('ArrowRight');
    expect(onNavigate).toHaveBeenLastCalledWith(1);
    pressKey('ArrowLeft');
    expect(onNavigate).toHaveBeenLastCalledWith(-1);
    expect(onNavigate).toHaveBeenCalledTimes(2);
  });

  it('arrows pan (not navigate) while zoomed in', () => {
    renderLightbox();
    const img = planImage();
    pressKey('+'); // scale 1.25 → pan bounds are non-zero with stubbed dimensions
    const before = translateOf(img);

    pressKey('ArrowLeft');
    const after = translateOf(img);
    expect(after.tx).toBeGreaterThan(before.tx); // pans the plan, ...
    expect(onNavigate).not.toHaveBeenCalled(); // ... does not switch plans

    pressKey('ArrowUp');
    expect(translateOf(img).ty).toBeGreaterThan(after.ty);
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('Esc first resets zoom to fit, second Esc closes the lightbox', () => {
    renderLightbox();
    const img = planImage();
    pressKey('+');
    expect(scaleOf(img)).toBeCloseTo(1.25);

    pressKey('Escape');
    expect(scaleOf(img)).toBe(1); // fit ...
    expect(onClose).not.toHaveBeenCalled(); // ... but still open

    pressKey('Escape');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ignores shortcuts while typing in an input', () => {
    renderLightbox();
    const input = document.createElement('input');
    document.body.appendChild(input);
    act(() => {
      fireEvent.keyDown(input, { key: '?', bubbles: true });
    });
    expect(document.getElementById('plan-shortcuts-legend')).toBeNull();
    input.remove();
  });
});
