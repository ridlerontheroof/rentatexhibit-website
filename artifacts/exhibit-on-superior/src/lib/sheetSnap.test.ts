import { describe, expect, it } from 'vitest';
import {
  clampSheetDragHeight,
  decideSheetSnap,
  FLICK_VELOCITY,
  MIN_DRAG_FRACTION,
  sampleSheetVelocity,
  VELOCITY_SMOOTHING,
  VELOCITY_STALE_MS,
} from './sheetSnap';

// Snap points matching the sheet's 40dvh / 85dvh on an 800px viewport.
const collapsedPx = 320;
const expandedPx = 680;
const midpointPx = (collapsedPx + expandedPx) / 2; // 500

const base = { collapsedPx, expandedPx };

describe('decideSheetSnap', () => {
  it('fast upward flick expands even from a short drag (below midpoint)', () => {
    expect(
      decideSheetSnap({ ...base, velocity: 1.2, currentPx: 340, msSinceLastMove: 10 }),
    ).toBe(expandedPx);
  });

  it('fast downward flick collapses even when the sheet is nearly expanded', () => {
    expect(
      decideSheetSnap({ ...base, velocity: -1.2, currentPx: 660, msSinceLastMove: 10 }),
    ).toBe(collapsedPx);
  });

  it('velocity exactly at threshold counts as a flick (inclusive)', () => {
    expect(
      decideSheetSnap({ ...base, velocity: FLICK_VELOCITY, currentPx: 330 }),
    ).toBe(expandedPx);
    expect(
      decideSheetSnap({ ...base, velocity: -FLICK_VELOCITY, currentPx: 670 }),
    ).toBe(collapsedPx);
  });

  it('slow drag above midpoint expands', () => {
    expect(
      decideSheetSnap({ ...base, velocity: 0.1, currentPx: midpointPx + 1 }),
    ).toBe(expandedPx);
  });

  it('slow drag below midpoint collapses', () => {
    expect(
      decideSheetSnap({ ...base, velocity: -0.1, currentPx: midpointPx - 1 }),
    ).toBe(collapsedPx);
  });

  it('exact midpoint snaps expanded', () => {
    expect(decideSheetSnap({ ...base, velocity: 0, currentPx: midpointPx })).toBe(
      expandedPx,
    );
  });

  it('a >100ms pause before release ignores stale upward velocity', () => {
    // Fast flick velocity, but the pointer paused — falls back to midpoint,
    // and the sheet is below it, so it collapses.
    expect(
      decideSheetSnap({
        ...base,
        velocity: 2,
        currentPx: 340,
        msSinceLastMove: VELOCITY_STALE_MS + 1,
      }),
    ).toBe(collapsedPx);
  });

  it('a >100ms pause before release ignores stale downward velocity', () => {
    expect(
      decideSheetSnap({
        ...base,
        velocity: -2,
        currentPx: 660,
        msSinceLastMove: VELOCITY_STALE_MS + 1,
      }),
    ).toBe(expandedPx);
  });

  it('a pause of exactly the stale threshold still honours the flick', () => {
    expect(
      decideSheetSnap({
        ...base,
        velocity: 2,
        currentPx: 340,
        msSinceLastMove: VELOCITY_STALE_MS,
      }),
    ).toBe(expandedPx);
  });

  it('missing msSinceLastMove defaults to trusting the velocity', () => {
    expect(decideSheetSnap({ ...base, velocity: 1, currentPx: 340 })).toBe(expandedPx);
  });
});

describe('clampSheetDragHeight', () => {
  it('passes through heights inside the allowed range', () => {
    expect(clampSheetDragHeight(500, collapsedPx, expandedPx)).toBe(500);
  });

  it('never exceeds the expanded snap point', () => {
    expect(clampSheetDragHeight(5000, collapsedPx, expandedPx)).toBe(expandedPx);
  });

  it('never shrinks below 60% of the collapsed snap point', () => {
    expect(clampSheetDragHeight(-100, collapsedPx, expandedPx)).toBe(
      collapsedPx * MIN_DRAG_FRACTION,
    );
    expect(clampSheetDragHeight(0, collapsedPx, expandedPx)).toBe(
      collapsedPx * MIN_DRAG_FRACTION,
    );
  });

  it('returns the exact bounds when the height sits on them', () => {
    expect(clampSheetDragHeight(expandedPx, collapsedPx, expandedPx)).toBe(expandedPx);
    expect(
      clampSheetDragHeight(collapsedPx * MIN_DRAG_FRACTION, collapsedPx, expandedPx),
    ).toBe(collapsedPx * MIN_DRAG_FRACTION);
  });
});

describe('sampleSheetVelocity', () => {
  const start = { lastY: 500, lastTime: 1000, velocity: 0 };

  it('computes upward velocity as positive (pointer Y decreasing)', () => {
    // Moved up 70px over 10ms → instant = 7 px/ms, blended 0.3*0 + 0.7*7.
    const next = sampleSheetVelocity(start, 430, 1010);
    expect(next.velocity).toBeCloseTo(7 * (1 - VELOCITY_SMOOTHING));
    expect(next.lastY).toBe(430);
    expect(next.lastTime).toBe(1010);
  });

  it('computes downward velocity as negative', () => {
    const next = sampleSheetVelocity(start, 570, 1010);
    expect(next.velocity).toBeCloseTo(-7 * (1 - VELOCITY_SMOOTHING));
  });

  it('blends previous velocity at 0.3 with the new sample at 0.7', () => {
    const prev = { lastY: 500, lastTime: 1000, velocity: 2 };
    // instant = (500 - 490) / 10 = 1 px/ms
    const next = sampleSheetVelocity(prev, 490, 1010);
    expect(next.velocity).toBeCloseTo(2 * 0.3 + 1 * 0.7);
  });

  it('ignores samples with dt === 0 (no division by zero)', () => {
    const prev = { lastY: 500, lastTime: 1000, velocity: 1.5 };
    const next = sampleSheetVelocity(prev, 400, 1000);
    expect(next).toBe(prev);
    expect(next.velocity).toBe(1.5);
  });

  it('ignores samples where time went backwards (dt < 0)', () => {
    const prev = { lastY: 500, lastTime: 1000, velocity: 1.5 };
    const next = sampleSheetVelocity(prev, 400, 990);
    expect(next).toBe(prev);
  });

  it('a single jittery event does not dominate the smoothed velocity', () => {
    // Steady slow drag, then one wild spike: smoothed value stays well below
    // the spike's instantaneous velocity.
    let s = { lastY: 500, lastTime: 1000, velocity: 0.2 };
    s = sampleSheetVelocity(s, 480, 1100); // spike: instant = 0.2 → still calm
    const spike = sampleSheetVelocity(s, 380, 1105); // instant = 20 px/ms
    expect(spike.velocity).toBeLessThan(20);
    expect(spike.velocity).toBeCloseTo(s.velocity * 0.3 + 20 * 0.7);
  });
});
