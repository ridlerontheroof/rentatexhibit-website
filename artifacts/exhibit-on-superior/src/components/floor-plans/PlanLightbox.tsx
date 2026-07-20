import { useCallback, useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../ui/dialog';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Link } from 'wouter';
import { unitNumbersForPlan, type PlanGroup } from '../../data/floorPlans';
import { anchorPinchTranslation, clampPanTranslation } from '../../lib/panBounds';
import { trackOutboundClick } from '../../lib/analytics';
import { useReducedMotion } from '../../hooks/use-reduced-motion';
import {
  clampSheetDragHeight,
  decideSheetSnap,
  sampleSheetVelocity,
} from '../../lib/sheetSnap';

import { AVAILABILITY_URL, TOUR_URL } from '../../data/seo';

interface PlanLightboxProps {
  group: PlanGroup | null;
  variantIndex: number;
  position: { index: number; total: number };
  onClose: () => void;
  onNavigate: (dir: -1 | 1) => void;
  onVariantChange: (index: number) => void;
}

export function PlanLightbox({
  group,
  variantIndex,
  position,
  onClose,
  onNavigate,
  onVariantChange,
}: PlanLightboxProps) {
  const reducedMotion = useReducedMotion();
  const reducedMotionRef = useRef(reducedMotion);
  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
  }, [reducedMotion]);
  const [zoomed, setZoomed] = useState(false);
  const zoomedRef = useRef(false);
  useEffect(() => {
    zoomedRef.current = zoomed;
  }, [zoomed]);
  // Animation phase for the scroll-zoom ("zoomed") mode toggle:
  // 'enter' = first frame after zooming in (scaled down, no transition),
  // 'exit' = animating back down before leaving zoomed mode.
  const [zoomPhase, setZoomPhase] = useState<'idle' | 'enter' | 'exit'>('idle');
  const zoomExitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Double-tap detection (touch devices).
  const lastTap = useRef<{ time: number; x: number; y: number } | null>(null);
  const singleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Mobile bottom-sheet drag state. Snap points are expressed in dvh.
  const SHEET_COLLAPSED = 40;
  const SHEET_EXPANDED = 85;
  const [sheetSnap, setSheetSnap] = useState<number>(SHEET_COLLAPSED);
  const [dragHeightPx, setDragHeightPx] = useState<number | null>(null);
  const dragRef = useRef<{
    startY: number;
    startHeightPx: number;
    lastY: number;
    lastTime: number;
    velocity: number; // px/ms; positive = moving up (sheet growing)
  } | null>(null);

  // Flick threshold & snap decision live in lib/sheetSnap.ts (pure, unit-tested).

  // Pinch-to-zoom state (touch devices). scale === 1 means "fit".
  const [pinch, setPinch] = useState({ scale: 1, tx: 0, ty: 0 });
  const gesture = useRef<{
    mode: 'pinch' | 'pan' | null;
    startDist: number;
    startScale: number;
    startTx: number;
    startTy: number;
    startMidX: number;
    startMidY: number;
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
  const suppressClick = useRef(false);

  // Desktop-only keyboard shortcut legend (toggled by the "?" button or key).
  const [showShortcuts, setShowShortcuts] = useState(false);

  const resetPinch = useCallback(() => {
    gesture.current.mode = null;
    mouseDrag.current = null;
    setMouseDragging(false);
    setPinch({ scale: 1, tx: 0, ty: 0 });
  }, []);

  const clearZoomExitTimer = useCallback(() => {
    if (zoomExitTimer.current !== null) {
      clearTimeout(zoomExitTimer.current);
      zoomExitTimer.current = null;
    }
  }, []);

  /** Toggle the scroll-zoom mode with a ~200ms scale animation in each direction. */
  const animateZoomToggle = useCallback(() => {
    if (zoomExitTimer.current !== null) return; // already animating out
    if (reducedMotionRef.current) {
      // Instant toggle, no scale animation.
      if (zoomedRef.current) {
        setZoomed(false);
      } else {
        resetPinch();
        setZoomed(true);
      }
      setZoomPhase('idle');
      return;
    }
    if (zoomedRef.current) {
      setZoomPhase('exit');
      zoomExitTimer.current = setTimeout(() => {
        zoomExitTimer.current = null;
        setZoomed(false);
        setZoomPhase('idle');
      }, 200);
    } else {
      resetPinch();
      setZoomed(true);
      setZoomPhase('enter');
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setZoomPhase('idle')),
      );
    }
  }, [resetPinch]);

  const clearSingleTapTimer = useCallback(() => {
    if (singleTapTimer.current !== null) {
      clearTimeout(singleTapTimer.current);
      singleTapTimer.current = null;
    }
  }, []);

  useEffect(() => clearSingleTapTimer, [clearSingleTapTimer]);

  // Reset zoom whenever the shown plan changes.
  useEffect(() => {
    setZoomed(false);
    setZoomPhase('idle');
    clearZoomExitTimer();
    resetPinch();
    clearSingleTapTimer();
    lastTap.current = null;
  }, [group?.id, variantIndex, resetPinch, clearSingleTapTimer, clearZoomExitTimer]);

  useEffect(() => clearZoomExitTimer, [clearZoomExitTimer]);

  // Collapse the sheet when a different plan group is opened.
  useEffect(() => {
    setSheetSnap(SHEET_COLLAPSED);
    setDragHeightPx(null);
    dragRef.current = null;
  }, [group?.id]);

  const viewportH = () =>
    typeof window !== 'undefined' ? window.innerHeight : 800;

  const onSheetDragStart = (e: React.PointerEvent) => {
    const startHeightPx =
      dragHeightPx ?? (sheetSnap / 100) * viewportH();
    dragRef.current = {
      startY: e.clientY,
      startHeightPx,
      lastY: e.clientY,
      lastTime: e.timeStamp,
      velocity: 0,
    };
    // Keep receiving move/up events even when the pointer leaves the handle.
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onSheetDragMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const d = dragRef.current;
    // Track instantaneous velocity (px/ms, positive = upward), smoothed so a
    // single jittery event doesn't dominate (see lib/sheetSnap.ts).
    const sampled = sampleSheetVelocity(d, e.clientY, e.timeStamp);
    d.lastY = sampled.lastY;
    d.lastTime = sampled.lastTime;
    d.velocity = sampled.velocity;
    const dy = d.startY - e.clientY;
    const vh = viewportH();
    setDragHeightPx(
      clampSheetDragHeight(
        d.startHeightPx + dy,
        (SHEET_COLLAPSED / 100) * vh,
        (SHEET_EXPANDED / 100) * vh,
      ),
    );
  };
  const onSheetDragEnd = (e?: React.PointerEvent) => {
    if (!dragRef.current) return;
    const vh = viewportH();
    const currentPx = dragHeightPx ?? (sheetSnap / 100) * vh;
    const snapPx = decideSheetSnap({
      velocity: dragRef.current.velocity,
      currentPx,
      collapsedPx: (SHEET_COLLAPSED / 100) * vh,
      expandedPx: (SHEET_EXPANDED / 100) * vh,
      msSinceLastMove: e ? e.timeStamp - dragRef.current.lastTime : 0,
    });
    setSheetSnap(snapPx === (SHEET_EXPANDED / 100) * vh ? SHEET_EXPANDED : SHEET_COLLAPSED);
    setDragHeightPx(null);
    dragRef.current = null;
  };

  // Rubber-band slack while a gesture is in progress; gesture end hard-clamps.
  const PAN_RUBBER_PX = 40;

  const clampPan = useCallback((tx: number, ty: number, scale: number, allowance: number) => {
    const viewer = viewerRef.current;
    const img = imgRef.current;
    if (!viewer || !img) return { tx, ty };
    return clampPanTranslation(
      tx,
      ty,
      scale,
      img.clientWidth,
      img.clientHeight,
      viewer.clientWidth,
      viewer.clientHeight,
      allowance,
    );
  }, []);

  // Desktop: wheel / ctrl+wheel (trackpad pinch) zooms toward the cursor.
  // Attached natively with { passive: false } so preventDefault stops page scroll.
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // ctrl+wheel (trackpad pinch) reports larger deltas; scale sensitivity down.
      const intensity = e.ctrlKey ? 0.01 : 0.002;
      clearZoomExitTimer();
      setZoomed(false);
      setZoomPhase('idle');
      setPinch((p) => {
        const scale = Math.min(4, Math.max(1, p.scale * Math.exp(-e.deltaY * intensity)));
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
  }, [clampPan, group, clearZoomExitTimer]);

  // Desktop: click-and-drag pans while zoomed in.
  const onMouseDown = (e: React.MouseEvent) => {
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
  const KEY_ZOOM_STEP = 1.25;
  const KEY_PAN_STEP = 60;

  const keyboardZoom = useCallback(
    (dir: 1 | -1) => {
      clearZoomExitTimer();
      setZoomed(false);
      setZoomPhase('idle');
      setPinch((p) => {
        const scale = Math.min(
          4,
          Math.max(1, dir === 1 ? p.scale * KEY_ZOOM_STEP : p.scale / KEY_ZOOM_STEP),
        );
        if (scale <= 1) return { scale: 1, tx: 0, ty: 0 };
        const ratio = scale / p.scale;
        return { scale, ...clampPan(p.tx * ratio, p.ty * ratio, scale, 0) };
      });
    },
    [clampPan, clearZoomExitTimer],
  );

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (!group) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (e.key === '?') {
        e.preventDefault();
        setShowShortcuts((s) => !s);
        return;
      }
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        keyboardZoom(1);
        return;
      }
      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        keyboardZoom(-1);
        return;
      }
      if (e.key === '0') {
        e.preventDefault();
        clearZoomExitTimer();
        setZoomed(false);
        setZoomPhase('idle');
        resetPinch();
        return;
      }
      if (e.key.startsWith('Arrow')) {
        // While pinch-zoomed in, arrows pan the plan instead of navigating.
        if (pinch.scale > 1.01) {
          e.preventDefault();
          const dx = e.key === 'ArrowLeft' ? KEY_PAN_STEP : e.key === 'ArrowRight' ? -KEY_PAN_STEP : 0;
          const dy = e.key === 'ArrowUp' ? KEY_PAN_STEP : e.key === 'ArrowDown' ? -KEY_PAN_STEP : 0;
          setPinch((p) => ({ ...p, ...clampPan(p.tx + dx, p.ty + dy, p.scale, 0) }));
          return;
        }
        if (zoomed) return; // scroll-zoom mode: let the browser scroll the viewer
        if (e.key === 'ArrowLeft') onNavigate(-1);
        else if (e.key === 'ArrowRight') onNavigate(1);
      }
    },
    [group, onNavigate, keyboardZoom, clampPan, resetPinch, clearZoomExitTimer, pinch.scale, zoomed],
  );

  useEffect(() => {
    if (!group) return;
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [group, handleKey]);

  if (!group) return null;

  const variant = group.variants[variantIndex] ?? group.variants[0];
  const sqftLabel = `${variant.sqft.toLocaleString()} sq ft`;
  /** Non-PII plan identifier attached to availability clicks from the lightbox. */
  const planLabel = `${variant.typeLabel} · Unit ${String(variant.unit).padStart(2, '0')}`;

  const pinchZoomed = pinch.scale > 1.01;

  const touchDist = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.hypot(dx, dy);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const g = gesture.current;
    if (!zoomed && e.touches.length === 2) {
      // Begin pinch
      g.mode = 'pinch';
      g.startDist = touchDist(e);
      g.startScale = pinch.scale;
      g.startTx = pinch.tx;
      g.startTy = pinch.ty;
      g.startMidX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      g.startMidY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      touchStartX.current = null;
      return;
    }
    if (!zoomed && pinchZoomed && e.touches.length === 1) {
      // One-finger pan while pinch-zoomed
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

  const DOUBLE_TAP_MS = 300;
  const DOUBLE_TAP_SLOP = 40;
  const TAP_MOVE_SLOP = 12;
  const DOUBLE_TAP_SCALE = 2;

  /** Handle a completed tap at (x, y) inside the viewer container. Returns true when it consumed a double-tap. */
  const handleTap = (x: number, y: number, container: HTMLElement): boolean => {
    const now = Date.now();
    const prev = lastTap.current;
    lastTap.current = { time: now, x, y };
    if (prev && now - prev.time < DOUBLE_TAP_MS && Math.hypot(x - prev.x, y - prev.y) < DOUBLE_TAP_SLOP) {
      // Double-tap: toggle between fit and ~2x zoom toward the tapped point.
      clearSingleTapTimer();
      lastTap.current = null;
      if (zoomed) {
        animateZoomToggle();
      } else if (pinchZoomed) {
        resetPinch();
      } else {
        const rect = container.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        setZoomed(false);
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
    // Single tap: wait to see whether a second tap follows before toggling zoom.
    clearSingleTapTimer();
    singleTapTimer.current = setTimeout(() => {
      singleTapTimer.current = null;
      animateZoomToggle();
    }, DOUBLE_TAP_MS);
    return false;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const g = gesture.current;
    if (g.mode === 'pinch' && e.touches.length === 2) {
      const scale = Math.min(4, Math.max(1, (g.startScale * touchDist(e)) / g.startDist));
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      // Keep the image point that was under the pinch midpoint anchored under
      // the fingers (see anchorPinchTranslation in lib/panBounds.ts).
      const viewer = viewerRef.current;
      const rect = viewer?.getBoundingClientRect();
      const cx = rect ? rect.left + rect.width / 2 : 0;
      const cy = rect ? rect.top + rect.height / 2 : 0;
      const anchored = anchorPinchTranslation(
        midX,
        midY,
        g.startMidX,
        g.startMidY,
        cx,
        cy,
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
    // Tap (little movement): handle single/double tap ourselves and suppress the synthetic click.
    if (Math.hypot(dx, dy) < TAP_MOVE_SLOP) {
      handleTap(t.clientX, t.clientY, e.currentTarget as HTMLElement);
      if (e.cancelable) e.preventDefault();
      return;
    }
    // Swipe navigation only while fully zoomed out
    if (zoomed || pinchZoomed) return;
    if (Math.abs(dx) > 50) onNavigate(dx < 0 ? 1 : -1);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        onEscapeKeyDown={(e) => {
          // First Escape while zoomed resets to fit; a second Escape closes.
          if (pinch.scale > 1.01 || zoomed) {
            e.preventDefault();
            clearZoomExitTimer();
            setZoomed(false);
            setZoomPhase('idle');
            resetPinch();
          }
        }}
        className="max-w-none w-screen h-screen max-h-screen supports-[height:100svh]:h-[100svh] supports-[height:100svh]:max-h-[100svh] supports-[height:100dvh]:h-[100dvh] supports-[height:100dvh]:max-h-[100dvh] translate-x-[-50%] translate-y-[-50%] gap-0 border-0 bg-[#111] p-0 sm:rounded-none"
      >
        <DialogTitle className="sr-only">
          {variant.typeLabel}, Unit {variant.unit}, floors {variant.floorLabel}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {sqftLabel}. Use the left and right arrow keys or swipe to move between floor plans. Press
          plus or minus to zoom, 0 to reset, and the arrow keys to pan while zoomed. Press question
          mark to toggle the shortcut legend. Press Escape to close.
        </DialogDescription>

        <div className="flex h-screen supports-[height:100svh]:h-[100svh] supports-[height:100dvh]:h-[100dvh] flex-col lg:grid lg:h-screen lg:grid-cols-[1fr_360px] lg:grid-rows-1">
          {/* Image viewer */}
          <div className="relative flex min-h-0 flex-1 items-center justify-center bg-[#111] lg:flex-none">
            <div
              ref={viewerRef}
              className={`h-full w-full ${zoomed ? 'overflow-auto' : 'overflow-hidden flex items-center justify-center p-4 sm:p-8'}`}
              style={!zoomed ? { touchAction: pinchZoomed ? 'none' : 'pan-y' } : undefined}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onMouseDown={onMouseDown}
            >
              <img
                ref={imgRef}
                key={variant.id}
                src={zoomed || pinchZoomed ? variant.images.zoom : variant.images.detail}
                alt={`${variant.typeLabel} floor plan, Unit ${variant.unit}, floors ${variant.floorLabel}, ${sqftLabel}`}
                onClick={(e) => {
                  if (suppressClick.current) {
                    suppressClick.current = false;
                    return;
                  }
                  // Route clicks through the shared tap handler so desktop
                  // double-click zooms toward the cursor (matching mobile
                  // double-tap) while a lone click still toggles zoom mode.
                  const container = viewerRef.current ?? (e.currentTarget as HTMLElement);
                  handleTap(e.clientX, e.clientY, container);
                }}
                draggable={false}
                className={
                  zoomed
                    ? 'max-w-none cursor-zoom-out'
                    : `mx-auto max-h-full max-w-full object-contain ${
                        pinchZoomed
                          ? mouseDragging
                            ? 'cursor-grabbing'
                            : 'cursor-grab'
                          : 'cursor-zoom-in'
                      }`
                }
                style={
                  zoomed
                    ? {
                        width: '160%',
                        transformOrigin: 'top left',
                        transform: zoomPhase === 'idle' ? 'scale(1)' : 'scale(0.625)',
                        transition:
                          reducedMotion || zoomPhase === 'enter'
                            ? 'none'
                            : 'transform 200ms ease',
                      }
                    : {
                        transform: `translate(${pinch.tx}px, ${pinch.ty}px) scale(${pinch.scale})`,
                        transformOrigin: 'center center',
                        transition:
                          reducedMotion || gesture.current.mode || mouseDragging
                            ? 'none'
                            : 'transform 200ms ease',
                      }
                }
              />
            </div>

            {/* Zoom toggle */}
            <button
              type="button"
              onClick={() => {
                if (pinchZoomed) {
                  resetPinch();
                } else {
                  animateZoomToggle();
                }
              }}
              className="absolute bottom-4 left-4 flex min-h-11 items-center gap-2 bg-black/60 px-3 py-2 text-xs uppercase tracking-wider text-white transition-colors hover:bg-black/80"
              aria-label={zoomed || pinchZoomed ? 'Zoom out' : 'Zoom in'}
            >
              {zoomed || pinchZoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
              {zoomed || pinchZoomed ? 'Fit' : 'Zoom'}
            </button>

            {/* Keyboard shortcuts hint (desktop / fine-pointer only) */}
            <button
              type="button"
              onClick={() => setShowShortcuts((s) => !s)}
              aria-expanded={showShortcuts}
              aria-controls="plan-shortcuts-legend"
              aria-label={showShortcuts ? 'Hide keyboard shortcuts' : 'Show keyboard shortcuts'}
              className="absolute bottom-4 left-[7.5rem] hidden min-h-11 min-w-11 items-center justify-center bg-black/60 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-black/80 pointer-fine:lg:flex"
            >
              ?
            </button>
            {showShortcuts && (
              <div
                id="plan-shortcuts-legend"
                role="region"
                aria-label="Keyboard shortcuts"
                className="absolute bottom-16 left-4 z-10 hidden w-60 bg-black/80 p-4 text-white backdrop-blur-sm pointer-fine:lg:block"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-[2px] text-white/70">
                    Keyboard shortcuts
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowShortcuts(false)}
                    aria-label="Dismiss keyboard shortcuts"
                    className="-mr-1 -mt-1 px-1 text-white/60 transition-colors hover:text-white"
                  >
                    ×
                  </button>
                </div>
                <dl className="space-y-1.5 text-xs">
                  {[
                    ['+ / −', 'Zoom in / out'],
                    ['0', 'Reset zoom'],
                    ['← →', 'Next / previous plan'],
                    ['Arrows', 'Pan while zoomed'],
                    ['Esc', 'Fit, then close'],
                    ['?', 'Toggle this panel'],
                  ].map(([key, desc]) => (
                    <div key={key} className="flex items-center justify-between gap-3">
                      <dt className="whitespace-nowrap border border-white/25 px-1.5 py-0.5 font-mono text-[11px] text-white/90">
                        {key}
                      </dt>
                      <dd className="text-right text-white/70">{desc}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {/* Prev / next */}
            {position.total > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => onNavigate(-1)}
                  className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-black/50 text-white transition-colors hover:bg-black/80"
                  aria-label="Previous floor plan"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate(1)}
                  className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-black/50 text-white transition-colors hover:bg-black/80"
                  aria-label="Next floor plan"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
                <span className="absolute bottom-4 right-16 bg-black/60 px-3 py-2 text-xs tracking-wider text-white">
                  {position.index + 1} / {position.total}
                </span>
              </>
            )}
          </div>

          {/* Details panel */}
          <aside
            className={`flex min-h-0 shrink-0 flex-col overflow-y-auto bg-white h-[var(--sheet-h)] max-h-[var(--sheet-h)] lg:h-auto lg:max-h-none lg:shrink ${
              dragHeightPx === null && !reducedMotion
                ? 'transition-[height,max-height] duration-300 ease-out'
                : ''
            }`}
            style={
              {
                '--sheet-h':
                  dragHeightPx !== null ? `${dragHeightPx}px` : `${sheetSnap}dvh`,
              } as React.CSSProperties
            }
          >
            {/* Mobile compact summary + primary CTA, pinned at the top of the sheet.
                Also acts as the drag handle for expanding/collapsing the sheet. */}
            <div
              className="sticky top-0 z-10 touch-none border-b border-border bg-white px-4 pb-3 pt-2 shadow-sm lg:hidden"
              onPointerDown={onSheetDragStart}
              onPointerMove={onSheetDragMove}
              onPointerUp={onSheetDragEnd}
              onPointerCancel={onSheetDragEnd}
            >
              <button
                type="button"
                aria-label={sheetSnap === SHEET_EXPANDED ? 'Collapse details' : 'Expand details'}
                onClick={() =>
                  setSheetSnap((s) => (s === SHEET_EXPANDED ? SHEET_COLLAPSED : SHEET_EXPANDED))
                }
                className="mx-auto -mt-1 mb-1 flex h-6 w-full items-center justify-center"
              >
                <span aria-hidden className="h-1 w-10 rounded-full bg-border" />
              </button>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[2px] text-primary">
                    Unit {String(variant.unit).padStart(2, '0')}
                  </p>
                  <p className="truncate text-sm text-foreground">
                    {variant.typeLabel} · {sqftLabel} · {variant.baths}{' '}
                    {variant.baths === 1 ? 'bath' : 'baths'}
                  </p>
                </div>
                <a
                  href={AVAILABILITY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-gold-outline flex min-h-11 shrink-0 items-center bg-primary px-4 text-center text-xs text-white hover:bg-primary/90"
                  onClick={() =>
                    trackOutboundClick('availability', AVAILABILITY_URL, 'plan_lightbox', {
                      floorPlan: planLabel,
                    })
                  }
                >
                  Check Availability
                </a>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-5 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:p-8 lg:pb-8">
            <div className="hidden lg:block">
              <p className="text-xs font-semibold uppercase tracking-[2px] text-primary">
                Unit {String(variant.unit).padStart(2, '0')}
              </p>
              <h2 className="mt-1 text-2xl uppercase tracking-wider text-foreground">
                {variant.typeLabel}
              </h2>
            </div>

            <dl className="grid grid-cols-2 gap-4 border-y border-border py-5">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Square Feet</dt>
                <dd className="text-xl font-semibold text-foreground">{variant.sqft.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Bathrooms</dt>
                <dd className="text-xl font-semibold text-foreground">{variant.baths}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Floors</dt>
                <dd className="text-xl font-semibold text-foreground">
                  {variant.floorLabel.replace(/-/g, '\u2013')}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Exposure</dt>
                <dd className="text-xl font-semibold text-foreground">See plan</dd>
              </div>
            </dl>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[2px] text-muted-foreground">
                Unit Numbers
              </p>
              <div className="flex flex-wrap gap-2">
                {unitNumbersForPlan(variant).map((n) => (
                  <span
                    key={n}
                    className="border border-border px-2.5 py-1 text-sm font-medium tabular-nums text-foreground"
                  >
                    {n}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Floor number + unit line {String(variant.unit).padStart(2, '0')}.
              </p>
            </div>

            {group.variants.length > 1 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[2px] text-muted-foreground">
                  Available on floors
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.variants.map((v, i) => (
                    <button
                      key={v.id}
                      type="button"
                      aria-pressed={i === variantIndex}
                      onClick={() => onVariantChange(i)}
                      className={`px-3 py-2 text-xs uppercase tracking-wide transition-colors ${
                        i === variantIndex
                          ? 'bg-primary text-white'
                          : 'border border-border hover:border-primary'
                      }`}
                    >
                      Flr {v.floorLabel.replace(/-/g, '\u2013')}
                      <span className="ml-1 opacity-70">{v.sqft.toLocaleString()} sf</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className="text-sm leading-relaxed text-muted-foreground">
              Each plan sheet includes the building stacking diagram with this unit highlighted
              and a north orientation arrow. Zoom in to explore dimensions and layout in detail.
            </p>

            <div className="mt-auto flex flex-col gap-3 pt-2">
              <a
                href={AVAILABILITY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold-outline hidden bg-primary text-center text-white hover:bg-primary/90 lg:block"
                onClick={() =>
                  trackOutboundClick('availability', AVAILABILITY_URL, 'plan_lightbox', {
                    floorPlan: planLabel,
                  })
                }
              >
                Check Availability
              </a>
              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href={TOUR_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onClose}
                  className="btn-gold-outline flex-1 text-center"
                >
                  Schedule a Tour
                </a>
                <Link href="/contact-us" onClick={onClose} className="btn-gold-outline flex-1 text-center">
                  Contact Us
                </Link>
              </div>
            </div>
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}
