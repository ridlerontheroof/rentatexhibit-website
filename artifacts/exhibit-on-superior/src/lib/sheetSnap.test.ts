import { describe, expect, it } from 'vitest';
import {
  decideSheetSnap,
  FLICK_VELOCITY,
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
