import { useCallback, useEffect, useRef, useState } from 'react';
import { anchorPinchTranslation, clampPanTranslation } from '../lib/panBounds';

/**
 * Shared pinch-zoom / pan / double-tap gesture state machine used by both
 * the floor-plan lightbox (PlanLightbox) and the unit photo gallery
 * (UnitGalleryLightbox), so their zoom behavior stays identical by
 * construction:
 *
 *   - two-finger pinch: scale follows finger distance, clamped to
 *     [1, MAX_SCALE], anchored so the image point under the pinch midpoint
 *     stays under the fingers (anchorPinchTranslation),
 *   - one-finger pan while pinch-zoomed, with a PAN_RUBBER_PX rubber-band
 *     allowance during the gesture and a hard clamp on release
 *     (clampPanTranslation),
 *   - release near scale 1 (<= 1.05) snaps back to fit,
 *   - lifting one finger of a pinch hands off to a one-finger pan,
 *   - double-tap toggles between fit and DOUBLE_TAP_SCALE toward the tapped
 *     point; desktop double-click routes through the same handleTap,
 *   - horizontal swipe (> 50px) navigates only while fully zoomed out,
 *   - desktop wheel / ctrl+wheel (trackpad pinch) zooms toward the cursor,
 *   - desktop click-and-drag pans while zoomed (suppressing the follow-up
 *     click once the pointer moved more than ~3px),
 *   - keyboard zoom steps scale around the viewer centre.
 *
 * The consuming component renders the image with
 *   transform: translate(tx, ty) scale(scale); transform-origin: center center
 * and wires the returned touch/mouse handlers onto the viewer element.
 */

export const MAX_SCALE = 4;
/** Rubber-band slack while a gesture is in progress; gesture end hard-clamps. */
export const PAN_RUBBER_PX = 40;
export const DOUBLE_TAP_MS = 300;
export const DOUBLE_TAP_SLOP = 40;
export const TAP_MOVE_SLOP = 12;
export const DOUBLE_TAP_SCALE = 2;
export const KEY_ZOOM_STEP = 1.25;

export interface UsePinchZoomOptions {
  /**
   * When true, touch pinch/pan gestures are suspended (single-touch swipe
   * tracking still runs). Used by PlanLightbox while its scroll-zoom
   * ("zoomed") mode owns the viewport.
   */
  disabled?: boolean;
  /**
   * Re-attach dependency for the native wheel listener. Pass a value that
   * flips when the viewer element (re)appears — e.g. PlanLightbox renders
   * null without a group, so it passes the group. Defaults to true.
   */
  active?: unknown;
  /**
   * Called just before wheel/keyboard/double-tap zoom mutates the pinch
   * scale. PlanLightbox uses this to leave its scroll-zoom mode so the two
   * zoom systems never fight.
   */
  beforeZoomChange?: () => void;
  /**
   * Intercept a detected double-tap. Return true to consume it (the default
   * fit <-> DOUBLE_TAP_SCALE toggle is skipped). PlanLightbox consumes
   * double-taps while in scroll-zoom mode to animate back out.
   */
  onDoubleTap?: () => boolean;
  /**
   * When provided, a single tap (that is not followed by a second tap within
   * DOUBLE_TAP_MS) fires this callback. PlanLightbox toggles its scroll-zoom
   * mode; the gallery leaves it unset (single taps do nothing).
   */
  onSingleTap?: () => void;
  /**
   * Called when a touch pinch or pan gesture begins. Touch gestures never
   * end in a click, so click-based dismissal (e.g. of an open overlay like
   * PlanLightbox's shortcut legend) can't run — this hook lets the consumer
   * dismiss such UI at gesture start instead.
   */
  onGestureStart?: () => void;
  /**
   * Horizontal swipe (> 50px) while fully zoomed out and not disabled.
   * dir is 1 for a leftward swipe ("next"), -1 for rightward ("previous").
   */
  onSwipe?: (dir: -1 | 1) => void;
}

interface PinchState {
  scale: number;
  tx: number;
  ty: number;
}

export function usePinchZoom(options: UsePinchZoomOptions = {}) {
  // Handlers close over the latest options via a ref so stable callbacks
  // (keyboardZoom, the wheel listener) never go stale.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Pinch-to-zoom state. scale === 1 means "fit".
  const [pinch, setPinch] = useState<PinchState>({ scale: 1, tx: 0, ty: 0 });
  // Live mirror of the pinch state so stable callbacks (clampPan) can read
  // the current translation without re-creating on every state change.
  const pinchRef = useRef(pinch);
  pinchRef.current = pinch;
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Swipe tracking (single touch, no gesture in progress).
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Double-tap detection (touch devices) + desktop double-click.
  const lastTap = useRef<{ time: number; x: number; y: number } | null>(null);
  const singleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const gesture = useRef<{
    mode: 'pinch' | 'pan' | null;
    startDist: number;
    startScale: number;
    startTx: number;
    startTy: number;
    startMidX: number;
    startMidY: number;
    /**
     * The image's untransformed centre (screen px), captured at pinch start.
     * This is the coordinate origin the translate/scale transform is applied
     * around (transform-origin: center center), so the anchor math must use
     * it — the viewer's rect centre can differ from it (e.g. the floor-plan
     * lightbox's padded, flex-centred layout), which made the image drift
     * sideways instead of staying under the fingers.
     */
    originX: number;
    originY: number;
    panStartX: number;
    panStartY: number;
  }>({
    mode: null,
    startDist: 0,
    startScale: 1,
    startTx: 0,
    startTy: 0,
    startMidX: 0,
    startMidY: 0,
    originX: 0,
    originY: 0,
    panStartX: 0,
    panStartY: 0,
  });

  // Mouse drag-to-pan state (desktop). Mirrors the touch "pan" gesture.
  const mouseDrag = useRef<{
    startX: number;
    startY: number;
    startTx: number;
    startTy: number;
    moved: boolean;
  } | null>(null);
  const [mouseDragging, setMouseDragging] = useState(false);
  /**
   * Set when a real drag ends so the browser's follow-up click on the image
   * can be swallowed instead of reaching a click/tap handler.
   */
  const suppressClick = useRef(false);

  const resetPinch = useCallback(() => {
    gesture.current.mode = null;
    mouseDrag.current = null;
    setMouseDragging(false);
    setPinch({ scale: 1, tx: 0, ty: 0 });
  }, []);

  const clearSingleTapTimer = useCallback(() => {
    if (singleTapTimer.current !== null) {
      clearTimeout(singleTapTimer.current);
      singleTapTimer.current = null;
    }
  }, []);

  useEffect(() => clearSingleTapTimer, [clearSingleTapTimer]);

  /** Forget any pending single tap / half of a double-tap (e.g. on image change). */
  const resetTap = useCallback(() => {
    clearSingleTapTimer();
    lastTap.current = null;
  }, [clearSingleTapTimer]);

  const clampPan = useCallback(
    (tx: number, ty: number, scale: number, allowance: number) => {
      const viewer = viewerRef.current;
      const img = imgRef.current;
      if (!viewer || !img) return { tx, ty };
      // The image's untransformed centre can be offset from the viewer's
      // centre in padded/flex layouts (same measurement as the pinch
      // anchor): current rect centre minus the live translation gives the
      // untransformed centre — scaling about the centre doesn't move it.
      let offsetX = 0;
      let offsetY = 0;
      const imgRect = img.getBoundingClientRect();
      if (imgRect.width > 0 && imgRect.height > 0) {
        const viewerRect = viewer.getBoundingClientRect();
        const p = pinchRef.current;
        offsetX =
          imgRect.left + imgRect.width / 2 - p.tx - (viewerRect.left + viewerRect.width / 2);
        offsetY =
          imgRect.top + imgRect.height / 2 - p.ty - (viewerRect.top + viewerRect.height / 2);
      }
      return clampPanTranslation(
        tx,
        ty,
        scale,
        img.clientWidth,
        img.clientHeight,
        viewer.clientWidth,
        viewer.clientHeight,
        allowance,
        offsetX,
        offsetY,
      );
    },
    [],
  );

  const pinchZoomed = pinch.scale > 1.01;

  // Desktop: wheel / ctrl+wheel (trackpad pinch) zooms toward the cursor.
  // Attached natively with { passive: false } so preventDefault stops page scroll.
  const active = options.active ?? true;
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // ctrl+wheel (trackpad pinch) reports larger deltas; scale sensitivity down.
      const intensity = e.ctrlKey ? 0.01 : 0.002;
      optionsRef.current.beforeZoomChange?.();
      setPinch((p) => {
        const scale = Math.min(
          MAX_SCALE,
          Math.max(1, p.scale * Math.exp(-e.deltaY * intensity)),
        );
        if (scale <= 1) return { scale: 1, tx: 0, ty: 0 };
        const rect = viewer.getBoundingClientRect();
        // Keep the image point under the cursor stationary while scaling.
        const px = e.clientX - (rect.left + rect.width / 2);
        const py = e.clientY - (rect.top + rect.height / 2);
        const ratio = scale / p.scale;
        return {
          scale,
          ...clampPan(px - ratio * (px - p.tx), py - ratio * (py - p.ty), scale, 0),
        };
      });
    };
    viewer.addEventListener('wheel', onWheel, { passive: false });
    return () => viewer.removeEventListener('wheel', onWheel);
  }, [clampPan, active]);

  // Desktop: click-and-drag pans while zoomed in.
  const onMouseDown = (e: React.MouseEvent) => {
    // A drag's synthetic click (if any) fires before the next mousedown; a
    // still-set flag means the click never arrived (e.g. mouseup happened off
    // the image), so clear it here rather than letting it swallow this
    // interaction's deliberate click.
    suppressClick.current = false;
    if (e.button !== 0 || pinch.scale <= 1) return;
    e.preventDefault();
    mouseDrag.current = {
      startX: e.clientX,
      startY: e.clientY,
      startTx: pinch.tx,
      startTy: pinch.ty,
      moved: false,
    };
    setMouseDragging(true);
  };

  useEffect(() => {
    if (!mouseDragging) return;
    const onMove = (e: MouseEvent) => {
      const d = mouseDrag.current;
      if (!d) return;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      if (!d.moved && Math.hypot(dx, dy) > 3) d.moved = true;
      setPinch((p) => ({
        ...p,
        ...clampPan(d.startTx + dx, d.startTy + dy, p.scale, PAN_RUBBER_PX),
      }));
    };
    const onUp = () => {
      if (mouseDrag.current?.moved) suppressClick.current = true;
      mouseDrag.current = null;
      setMouseDragging(false);
      // Settle any rubber-band overshoot back inside the hard pan bounds.
      setPinch((p) => ({ ...p, ...clampPan(p.tx, p.ty, p.scale, 0) }));
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [mouseDragging, clampPan]);

  // Keyboard zoom: step scale around the viewer centre, reusing the shared
  // pinch state and clampPanTranslation bounds (matches the wheel-zoom math
  // with the cursor at the centre, where tx' = ratio * tx).
  const keyboardZoom = useCallback(
    (dir: 1 | -1) => {
      optionsRef.current.beforeZoomChange?.();
      setPinch((p) => {
        const scale = Math.min(
          MAX_SCALE,
          Math.max(1, dir === 1 ? p.scale * KEY_ZOOM_STEP : p.scale / KEY_ZOOM_STEP),
        );
        if (scale <= 1) return { scale: 1, tx: 0, ty: 0 };
        const ratio = scale / p.scale;
        return { scale, ...clampPan(p.tx * ratio, p.ty * ratio, scale, 0) };
      });
    },
    [clampPan],
  );

  /** Pan by a fixed offset (hard-clamped) — e.g. arrow keys while zoomed. */
  const panBy = useCallback(
    (dx: number, dy: number) => {
      setPinch((p) => ({ ...p, ...clampPan(p.tx + dx, p.ty + dy, p.scale, 0) }));
    },
    [clampPan],
  );

  const touchDist = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.hypot(dx, dy);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const g = gesture.current;
    const disabled = optionsRef.current.disabled === true;
    if (!disabled && e.touches.length === 2) {
      // Begin pinch
      optionsRef.current.onGestureStart?.();
      g.mode = 'pinch';
      g.startDist = touchDist(e);
      g.startScale = pinch.scale;
      g.startTx = pinch.tx;
      g.startTy = pinch.ty;
      g.startMidX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      g.startMidY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      // Anchor origin: the image's untransformed centre. Its current rect
      // centre is (untransformed centre + current translation) — scaling
      // about the centre doesn't move it — so subtract the live translation.
      // Fall back to the viewer's rect centre if the image ref is missing.
      const imgRect = imgRef.current?.getBoundingClientRect();
      if (imgRect) {
        g.originX = imgRect.left + imgRect.width / 2 - pinch.tx;
        g.originY = imgRect.top + imgRect.height / 2 - pinch.ty;
      } else {
        const rect = viewerRef.current?.getBoundingClientRect();
        g.originX = rect ? rect.left + rect.width / 2 : 0;
        g.originY = rect ? rect.top + rect.height / 2 : 0;
      }
      touchStartX.current = null;
      return;
    }
    if (!disabled && pinchZoomed && e.touches.length === 1) {
      // One-finger pan while pinch-zoomed
      optionsRef.current.onGestureStart?.();
      g.mode = 'pan';
      g.panStartX = e.touches[0].clientX;
      g.panStartY = e.touches[0].clientY;
      g.startTx = pinch.tx;
      g.startTy = pinch.ty;
      touchStartX.current = null;
      return;
    }
    g.mode = null;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  /**
   * Handle a completed tap at (x, y) inside the viewer container. Returns
   * true when it consumed a double-tap. Also routes desktop clicks so
   * double-click zooms toward the cursor like a mobile double-tap.
   */
  const handleTap = (x: number, y: number, container: HTMLElement): boolean => {
    const now = Date.now();
    const prevTap = lastTap.current;
    lastTap.current = { time: now, x, y };
    if (
      prevTap &&
      now - prevTap.time < DOUBLE_TAP_MS &&
      Math.hypot(x - prevTap.x, y - prevTap.y) < DOUBLE_TAP_SLOP
    ) {
      // Double-tap: toggle between fit and DOUBLE_TAP_SCALE toward the tapped point.
      clearSingleTapTimer();
      lastTap.current = null;
      if (optionsRef.current.onDoubleTap?.()) return true;
      if (pinchZoomed) {
        resetPinch();
      } else {
        // Zoom origin: the image's untransformed centre — same approach as
        // the pinch anchor fix. The transform is applied around the image's
        // own centre (transform-origin: center center), which can sit away
        // from the viewer container's rect centre in padded/flex layouts;
        // using the container centre made double-tap land slightly off the
        // tapped spot. Subtract the live translation to recover the
        // untransformed centre; fall back to the container's rect centre
        // when the image rect is missing or has no size (no layout info).
        const imgRect = imgRef.current?.getBoundingClientRect();
        let cx: number;
        let cy: number;
        if (imgRect && imgRect.width > 0 && imgRect.height > 0) {
          cx = imgRect.left + imgRect.width / 2 - pinch.tx;
          cy = imgRect.top + imgRect.height / 2 - pinch.ty;
        } else {
          const rect = container.getBoundingClientRect();
          cx = rect.left + rect.width / 2;
          cy = rect.top + rect.height / 2;
        }
        optionsRef.current.beforeZoomChange?.();
        setPinch({
          scale: DOUBLE_TAP_SCALE,
          ...clampPan(
            -(x - cx) * (DOUBLE_TAP_SCALE - 1),
            -(y - cy) * (DOUBLE_TAP_SCALE - 1),
            DOUBLE_TAP_SCALE,
            0,
          ),
        });
      }
      return true;
    }
    // Single tap: wait to see whether a second tap follows before acting.
    clearSingleTapTimer();
    if (optionsRef.current.onSingleTap) {
      singleTapTimer.current = setTimeout(() => {
        singleTapTimer.current = null;
        optionsRef.current.onSingleTap?.();
      }, DOUBLE_TAP_MS);
    }
    return false;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const g = gesture.current;
    if (g.mode === 'pinch' && e.touches.length === 2) {
      const scale = Math.min(
        MAX_SCALE,
        Math.max(1, (g.startScale * touchDist(e)) / g.startDist),
      );
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      // Keep the image point that was under the pinch midpoint anchored under
      // the fingers (see anchorPinchTranslation in lib/panBounds.ts), using
      // the image's own untransformed centre (captured at gesture start) as
      // the transform origin — not the viewer's rect centre, which can be
      // offset from it and made the image drift sideways while pinching.
      const anchored = anchorPinchTranslation(
        midX,
        midY,
        g.startMidX,
        g.startMidY,
        g.originX,
        g.originY,
        scale,
        g.startScale,
        g.startTx,
        g.startTy,
      );
      const clamped = clampPan(anchored.tx, anchored.ty, scale, PAN_RUBBER_PX);
      setPinch({ scale, ...clamped });
    } else if (g.mode === 'pan' && e.touches.length === 1) {
      const touch = e.touches[0];
      setPinch((p) => ({
        ...p,
        ...clampPan(
          g.startTx + (touch.clientX - g.panStartX),
          g.startTy + (touch.clientY - g.panStartY),
          p.scale,
          PAN_RUBBER_PX,
        ),
      }));
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const g = gesture.current;
    if (g.mode) {
      if (e.touches.length === 0) {
        const wasPan = g.mode === 'pan';
        const t = e.changedTouches[0];
        g.mode = null;
        // A "pan" that barely moved is a tap — allow double-tap-to-fit while pinch-zoomed.
        if (
          wasPan &&
          t &&
          Math.hypot(t.clientX - g.panStartX, t.clientY - g.panStartY) < TAP_MOVE_SLOP
        ) {
          if (handleTap(t.clientX, t.clientY, e.currentTarget as HTMLElement)) {
            if (e.cancelable) e.preventDefault();
            return;
          }
          if (e.cancelable) e.preventDefault();
        }
        // Snap back to fit when nearly zoomed out; otherwise settle any
        // rubber-band overshoot back inside the hard pan bounds.
        setPinch((p) =>
          p.scale <= 1.05
            ? { scale: 1, tx: 0, ty: 0 }
            : { ...p, ...clampPan(p.tx, p.ty, p.scale, 0) },
        );
      } else if (g.mode === 'pinch' && e.touches.length === 1) {
        // Hand off from pinch to one-finger pan
        g.mode = 'pan';
        g.panStartX = e.touches[0].clientX;
        g.panStartY = e.touches[0].clientY;
        setPinch((p) => {
          g.startTx = p.tx;
          g.startTy = p.ty;
          return p;
        });
      }
      return;
    }
    if (touchStartX.current === null) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX.current;
    const dy = touchStartY.current === null ? 0 : t.clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    // Tap (little movement): check for a double-tap and suppress the synthetic
    // click when the tap did something (double-tap, or a pending single-tap action).
    if (Math.hypot(dx, dy) < TAP_MOVE_SLOP) {
      const consumed = handleTap(t.clientX, t.clientY, e.currentTarget as HTMLElement);
      if ((consumed || optionsRef.current.onSingleTap) && e.cancelable) {
        e.preventDefault();
      }
      return;
    }
    // Swipe navigation only while fully zoomed out
    if (optionsRef.current.disabled === true || pinchZoomed) return;
    if (Math.abs(dx) > 50) optionsRef.current.onSwipe?.(dx < 0 ? 1 : -1);
  };

  /** Whether a touch pinch/pan gesture is currently in progress (for CSS transitions). */
  const isGesturing = () => gesture.current.mode !== null;

  return {
    pinch,
    setPinch,
    pinchZoomed,
    viewerRef,
    imgRef,
    resetPinch,
    resetTap,
    clampPan,
    keyboardZoom,
    panBy,
    handleTap,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onMouseDown,
    mouseDragging,
    suppressClick,
    isGesturing,
  };
}
