/**
 * Pure snap-decision logic for the mobile floor-plan bottom sheet.
 *
 * A fast flick wins regardless of how far the sheet has travelled; slow drags
 * snap to whichever snap point is nearest by midpoint. A pause before release
 * means the last-sampled velocity is stale, so it's treated as a slow drag.
 */

/** A flick faster than this (px/ms) snaps in the flick's direction. */
export const FLICK_VELOCITY = 0.5;

/** Releases more than this many ms after the last move ignore stale velocity. */
export const VELOCITY_STALE_MS = 100;

export interface SnapDecisionInput {
  /** Smoothed drag velocity in px/ms; positive = moving up (sheet growing). */
  velocity: number;
  /** Current sheet height in px at release time. */
  currentPx: number;
  /** Collapsed snap point in px. */
  collapsedPx: number;
  /** Expanded snap point in px. */
  expandedPx: number;
  /** ms elapsed between the last sampled move and the release. */
  msSinceLastMove?: number;
}

/**
 * Decide which snap point the sheet should settle at when a drag ends.
 * Returns the chosen snap point in px (either collapsedPx or expandedPx).
 */
/** Fraction of the collapsed height the sheet may shrink below while dragging. */
export const MIN_DRAG_FRACTION = 0.6;

/** Weight given to the previous smoothed velocity sample (new sample gets the rest). */
export const VELOCITY_SMOOTHING = 0.3;

/**
 * Clamp a dragged sheet height between 60% of the collapsed snap point and
 * the expanded snap point, so the sheet can never be dragged off-screen.
 */
export function clampSheetDragHeight(
  heightPx: number,
  collapsedPx: number,
  expandedPx: number,
): number {
  return Math.min(expandedPx, Math.max(collapsedPx * MIN_DRAG_FRACTION, heightPx));
}

export interface VelocitySample {
  lastY: number;
  lastTime: number;
  /** Smoothed velocity in px/ms; positive = moving up (sheet growing). */
  velocity: number;
}

/**
 * Blend a new pointer sample into the smoothed drag velocity
 * (0.3 previous / 0.7 instantaneous) so a single jittery event doesn't
 * dominate. Samples with dt <= 0 are ignored (returned unchanged) to avoid
 * division by zero or time going backwards.
 */
export function sampleSheetVelocity(
  prev: VelocitySample,
  clientY: number,
  timeStamp: number,
): VelocitySample {
  const dt = timeStamp - prev.lastTime;
  if (dt <= 0) return prev;
  const instant = (prev.lastY - clientY) / dt;
  return {
    lastY: clientY,
    lastTime: timeStamp,
    velocity: prev.velocity * VELOCITY_SMOOTHING + instant * (1 - VELOCITY_SMOOTHING),
  };
}

export function decideSheetSnap({
  velocity,
  currentPx,
  collapsedPx,
  expandedPx,
  msSinceLastMove = 0,
}: SnapDecisionInput): number {
  // Stale velocity (pointer paused before release) → treat as a slow drag.
  const effectiveVelocity = msSinceLastMove > VELOCITY_STALE_MS ? 0 : velocity;
  if (effectiveVelocity >= FLICK_VELOCITY) return expandedPx;
  if (effectiveVelocity <= -FLICK_VELOCITY) return collapsedPx;
  const midpointPx = (collapsedPx + expandedPx) / 2;
  return currentPx >= midpointPx ? expandedPx : collapsedPx;
}
