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
