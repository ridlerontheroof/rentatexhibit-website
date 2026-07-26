import { useCallback, useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../ui/dialog';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { unitNumbersForPlan, planSqftLabel, type PlanGroup } from '../../data/floorPlans';
import { usePinchZoom } from '../../hooks/use-pinch-zoom';
import { useReducedMotion } from '../../hooks/use-reduced-motion';
import {
  clampSheetDragHeight,
  decideSheetSnap,
  sampleSheetVelocity,
} from '../../lib/sheetSnap';


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
  const [, navigate] = useLocation();
  /**
   * The availability CTAs point at the #available-units section, which only
   * exists on the Floor Plans page. When the lightbox is opened elsewhere
   * (e.g. Unit Detail), fall back to navigating to /available-units.
   */
  const handleAvailabilityClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      onClose();
      if (!document.getElementById('available-units')) {
        event.preventDefault();
        navigate('/available-units');
      }
    },
    [onClose, navigate],
  );
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

  const clearZoomExitTimer = useCallback(() => {
    if (zoomExitTimer.current !== null) {
      clearTimeout(zoomExitTimer.current);
      zoomExitTimer.current = null;
    }
  }, []);

  // Shared pinch/pan/double-tap gesture state machine (same as the unit
  // photo gallery), extended here with the scroll-zoom ("zoomed") mode:
  // touch gestures are suspended while zoomed, any pinch-style zoom leaves
  // zoomed mode first, and single taps / double-taps while zoomed toggle it.
  const {
    pinch,
    pinchZoomed,
    viewerRef,
    imgRef,
    resetPinch,
    resetTap,
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
  } = usePinchZoom({
    disabled: zoomed,
    active: group,
    beforeZoomChange: () => {
      clearZoomExitTimer();
      setZoomed(false);
      setZoomPhase('idle');
    },
    onDoubleTap: () => {
      // Double-tap while in scroll-zoom mode animates back out instead of
      // starting a pinch-style zoom.
      if (zoomedRef.current) {
        animateZoomToggle();
        return true;
      }
      return false;
    },
    onSingleTap: () => animateZoomToggle(),
    onSwipe: (dir) => {
      // A swipe never produces a click, so it bypasses the click-capture
      // dismiss (dismissLegendOnOutsideClick). Clear the shortcut legend here
      // like onGestureStart does — otherwise the plan would change underneath
      // while the legend stays stranded on top. (Arrow-key navigation
      // deliberately keeps it open for keyboard users; a swipe is a touch
      // gesture, so no keyboard user is served by leaving it up.)
      setShowShortcuts(false);
      onNavigate(dir);
    },
    // Touch pinch/pan gestures never end in a click, so the click-capture
    // dismiss (dismissLegendOnOutsideClick) can't run — clear the shortcut
    // legend at gesture start too, matching sheet drags.
    onGestureStart: () => setShowShortcuts(false),
  });

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
    moved: boolean; // finger travelled past the tap slop → treat as a drag
  } | null>(null);
  /**
   * On touch devices, lifting the finger after a sheet drag fires a synthetic
   * click on the grabber button underneath, which would immediately re-toggle
   * the snap point the drag just chose. Mirrors the desktop-pan suppressClick.
   */
  const suppressSheetClick = useRef(false);
  const SHEET_TAP_SLOP_PX = 5;

  // Flick threshold & snap decision live in lib/sheetSnap.ts (pure, unit-tested).

  // Desktop-only keyboard shortcut legend (toggled by the "?" button or key).
  const [showShortcuts, setShowShortcuts] = useState(false);

  /**
   * Clicking anywhere outside the open legend dismisses it, matching common
   * overlay behavior. Runs in the capture phase so the dismissing click never
   * reaches the plan image's onClick (which would toggle zoom mode). Clicks
   * inside the legend and on the "?" toggle are excluded so their own click
   * handlers keep working (the toggle would otherwise close-then-reopen).
   *
   * Clicks on clearly interactive controls (prev/next arrows, the Zoom/Fit
   * button, CTA links, etc.) both dismiss the legend AND perform their action:
   * the swallow (preventDefault + stopPropagation) applies only to
   * non-interactive targets like the plan image, where a stray click would
   * otherwise toggle zoom mode.
   */
  const dismissLegendOnOutsideClick = useCallback(
    (e: React.MouseEvent) => {
      if (!showShortcuts) return;
      const target = e.target as HTMLElement | null;
      if (
        target?.closest('#plan-shortcuts-legend') ||
        target?.closest('[aria-controls="plan-shortcuts-legend"]')
      ) {
        return;
      }
      if (target?.closest('button, a, [role="button"]')) {
        // Interactive control: dismiss the legend but let the click through.
        setShowShortcuts(false);
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      setShowShortcuts(false);
    },
    [showShortcuts],
  );

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

  // Reset zoom whenever the shown plan changes.
  useEffect(() => {
    setZoomed(false);
    setZoomPhase('idle');
    clearZoomExitTimer();
    resetPinch();
    resetTap();
  }, [group?.id, variantIndex, resetPinch, resetTap, clearZoomExitTimer]);

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
    // Pointer drags on the handle bypass the click-capture dismiss logic
    // (dismissLegendOnOutsideClick), so clear the shortcut legend here too —
    // otherwise a drag would expand/collapse the sheet with the legend left
    // stranded on top. Taps also pass through here, matching the click path.
    setShowShortcuts(false);
    // Any synthetic click from a previous drag fires before the next
    // pointerdown; a still-set flag means no click followed, so clear it here
    // rather than letting it swallow this interaction's deliberate tap.
    suppressSheetClick.current = false;
    const startHeightPx =
      dragHeightPx ?? (sheetSnap / 100) * viewportH();
    dragRef.current = {
      startY: e.clientY,
      startHeightPx,
      lastY: e.clientY,
      lastTime: e.timeStamp,
      velocity: 0,
      moved: false,
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
    if (!d.moved && Math.abs(dy) > SHEET_TAP_SLOP_PX) d.moved = true;
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
    // A real drag (moved past the tap slop) may be followed by a synthetic
    // click on the grabber; swallow that click so it can't re-toggle the snap
    // the drag just chose. Plain taps (no movement) keep toggling via onClick.
    if (dragRef.current.moved) suppressSheetClick.current = true;
    dragRef.current = null;
  };

  // Wheel zoom, drag-to-pan, and keyboard zoom live in usePinchZoom; the
  // beforeZoomChange option leaves scroll-zoom mode before any of them run.
  const KEY_PAN_STEP = 60;

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
          panBy(dx, dy);
          return;
        }
        if (zoomed) return; // scroll-zoom mode: let the browser scroll the viewer
        if (e.key === 'ArrowLeft') onNavigate(-1);
        else if (e.key === 'ArrowRight') onNavigate(1);
      }
    },
    [group, onNavigate, keyboardZoom, panBy, resetPinch, clearZoomExitTimer, pinch.scale, zoomed],
  );

  useEffect(() => {
    if (!group) return;
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [group, handleKey]);

  if (!group) return null;

  const variant = group.variants[variantIndex] ?? group.variants[0];
  const sqftLabel = `${planSqftLabel(variant)} sq ft`;
  /** Non-PII plan identifier attached to availability clicks from the lightbox. */
  const planLabel = `${variant.typeLabel} · Unit ${String(variant.unit).padStart(2, '0')}`;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        onEscapeKeyDown={(e) => {
          // First Escape dismisses the shortcut legend if it is open.
          if (showShortcuts) {
            e.preventDefault();
            setShowShortcuts(false);
            return;
          }
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

        <div
          onClickCapture={dismissLegendOnOutsideClick}
          className="flex h-screen supports-[height:100svh]:h-[100svh] supports-[height:100dvh]:h-[100dvh] flex-col lg:grid lg:h-screen lg:grid-cols-[1fr_360px] lg:grid-rows-1"
        >
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
                          reducedMotion || isGesturing() || mouseDragging
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
                onKeyDown={() => {
                  // A keyboard activation (Enter/Space) fires a click with no
                  // preceding pointerdown, so a stale suppress flag from a
                  // drag that produced no synthetic click would swallow it.
                  // Clear the flag here as well.
                  suppressSheetClick.current = false;
                }}
                onClick={() => {
                  if (suppressSheetClick.current) {
                    suppressSheetClick.current = false;
                    return;
                  }
                  setSheetSnap((s) => (s === SHEET_EXPANDED ? SHEET_COLLAPSED : SHEET_EXPANDED));
                }}
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
                  href="#available-units"
                  className="btn-gold-outline flex min-h-11 shrink-0 items-center bg-primary px-4 text-center text-xs text-white hover:bg-primary/90"
                  onClick={handleAvailabilityClick}
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
                <dd className="text-xl font-semibold text-foreground">{planSqftLabel(variant)}</dd>
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
                      <span className="ml-1 opacity-70">{planSqftLabel(v)} sf</span>
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
                href="#available-units"
                className="btn-gold-outline hidden bg-primary text-center text-white hover:bg-primary/90 lg:block"
                onClick={handleAvailabilityClick}
              >
                Check Availability
              </a>
              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href="#available-units"
                  onClick={handleAvailabilityClick}
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
