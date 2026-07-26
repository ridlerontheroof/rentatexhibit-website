import { useCallback, useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import type { AvailableUnit } from '../../hooks/use-availability';
import { trackOutboundClick } from '../../lib/analytics';
import { anchorPinchTranslation, clampPanTranslation } from '../../lib/panBounds';
import { useReducedMotion } from '../../hooks/use-reduced-motion';

interface UnitGalleryLightboxProps {
  unit: AvailableUnit;
  onClose: () => void;
}

/**
 * Lead source reported to AppFolio for tours and applications originating
 * from this site, so the leasing team can attribute them. Keep in sync with
 * the guest-card `source` on the api-server.
 */
export const LEAD_SOURCE = 'Website (Exhibit)';
const LEAD_SOURCE_PARAM = encodeURIComponent(LEAD_SOURCE);

/**
 * Derive the AppFolio online rental application URL for a posted listing —
 * the same target as the "Apply Now" button on AppFolio's own listing page.
 */
export function applyUrlForListing(listingUrl: string): string | null {
  const parsed = parseListingUrl(listingUrl);
  if (!parsed) return null;
  return `${parsed.origin}/listings/rental_applications/new?listable_uid=${parsed.uid}&source=${LEAD_SOURCE_PARAM}`;
}

/**
 * Parse and validate a listing URL: must be https on an *.appfolio.com host
 * (the only place our API server sources listings from) with a
 * /listings/detail/<uuid> path. Anything else returns null so callers fall
 * back to internal pages instead of linking off-site.
 */
function parseListingUrl(listingUrl: string): { origin: string; uid: string } | null {
  let url: URL;
  try {
    url = new URL(listingUrl);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  if (!/(^|\.)appfolio\.com$/.test(url.hostname)) return null;
  const m = url.pathname.match(/^\/listings\/detail\/([a-f0-9-]+)$/);
  if (!m) return null;
  return { origin: url.origin, uid: m[1] };
}

/**
 * The listing's unit-specific tour scheduling URL — same target as the
 * "Schedule Showing" button on AppFolio's own listing page, so the showing
 * request is tied to this exact unit for the leasing team.
 */
export function tourUrlForListing(listingUrl: string): string | null {
  const parsed = parseListingUrl(listingUrl);
  if (!parsed) return null;
  return `${parsed.origin}/listings/showings/new?listable_uid=${parsed.uid}&source=${LEAD_SOURCE_PARAM}`;
}

/** The listing's contact form URL — same target as AppFolio's "Contact Us". */
export function contactUrlForListing(listingUrl: string): string | null {
  const parsed = parseListingUrl(listingUrl);
  if (!parsed) return null;
  return `${parsed.origin}/listings/detail/${parsed.uid}/contact_us_form`;
}

/**
 * In-site photo gallery for a live availability listing. Shows the unit's
 * full AppFolio photo set in the site's own design, with the same Apply Now
 * and Contact Us actions as AppFolio's hosted listing page.
 */
export function UnitGalleryLightbox({ unit, onClose }: UnitGalleryLightboxProps) {
  const [index, setIndex] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const reducedMotion = useReducedMotion();
  const count = unit.photos.length;

  const prev = useCallback(() => setIndex((i) => (i - 1 + count) % count), [count]);
  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count]);

  // ---------------------------------------------------------------------
  // Pinch-to-zoom / pan / double-tap gestures — same behavior as the
  // floor-plan lightbox (PlanLightbox), minus its scroll-zoom mode:
  //   - two-finger pinch, scale clamped to [1, 4], anchored under fingers,
  //   - one-finger pan while pinch-zoomed, 40px rubber-band during the
  //     gesture, hard-clamped on release,
  //   - double-tap toggles between fit and 2x toward the tapped point,
  //   - swipe navigation only while fully zoomed out.
  // ---------------------------------------------------------------------
  const [pinch, setPinch] = useState({ scale: 1, tx: 0, ty: 0 });
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const lastTap = useRef<{ time: number; x: number; y: number } | null>(null);
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

  const resetPinch = useCallback(() => {
    gesture.current.mode = null;
    mouseDrag.current = null;
    setMouseDragging(false);
    setPinch({ scale: 1, tx: 0, ty: 0 });
  }, []);

  // Reset zoom whenever the shown photo changes.
  useEffect(() => {
    resetPinch();
    lastTap.current = null;
  }, [index, resetPinch]);

  const PAN_RUBBER_PX = 40;
  const DOUBLE_TAP_MS = 300;
  const DOUBLE_TAP_SLOP = 40;
  const TAP_MOVE_SLOP = 12;
  const DOUBLE_TAP_SCALE = 2;

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

  const pinchZoomed = pinch.scale > 1.01;

  // ---------------------------------------------------------------------
  // Desktop zoom — same behavior as the floor-plan lightbox (PlanLightbox):
  //   - wheel / ctrl+wheel (trackpad pinch) zooms toward the cursor,
  //   - click-and-drag pans while zoomed (rubber-band, hard-clamp on release),
  //   - +/−/0 keyboard zoom steps around the viewer centre.
  // ---------------------------------------------------------------------

  // Wheel zoom is attached natively with { passive: false } so preventDefault
  // stops page scroll behind the lightbox.
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // ctrl+wheel (trackpad pinch) reports larger deltas; scale sensitivity down.
      const intensity = e.ctrlKey ? 0.01 : 0.002;
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
  }, [clampPan]);

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

  const keyboardZoom = useCallback(
    (dir: 1 | -1) => {
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
    [clampPan],
  );

  const touchDist = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.hypot(dx, dy);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const g = gesture.current;
    if (e.touches.length === 2) {
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
    if (pinchZoomed && e.touches.length === 1) {
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

  /** Handle a completed tap; returns true when it consumed a double-tap. */
  const handleTap = (x: number, y: number, container: HTMLElement): boolean => {
    const now = Date.now();
    const prevTap = lastTap.current;
    lastTap.current = { time: now, x, y };
    if (
      prevTap &&
      now - prevTap.time < DOUBLE_TAP_MS &&
      Math.hypot(x - prevTap.x, y - prevTap.y) < DOUBLE_TAP_SLOP
    ) {
      lastTap.current = null;
      if (pinchZoomed) {
        resetPinch();
      } else {
        const rect = container.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
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
    return false;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const g = gesture.current;
    if (g.mode === 'pinch' && e.touches.length === 2) {
      const scale = Math.min(4, Math.max(1, (g.startScale * touchDist(e)) / g.startDist));
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
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
    // Tap (little movement): check for a double-tap and suppress the synthetic click.
    if (Math.hypot(dx, dy) < TAP_MOVE_SLOP) {
      if (handleTap(t.clientX, t.clientY, e.currentTarget as HTMLElement)) {
        if (e.cancelable) e.preventDefault();
      }
      return;
    }
    // Swipe navigation only while fully zoomed out
    if (pinchZoomed) return;
    if (count > 1 && Math.abs(dx) > 50) {
      if (dx < 0) next();
      else prev();
    }
  };

  useEffect(() => {
    // Focus management: move focus into the dialog on open, trap Tab within
    // it, and restore focus to the opener on close.
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
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
        resetPinch();
        return;
      }
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || !dialogRef.current.contains(active))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (active === last || !dialogRef.current.contains(active))) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previouslyFocused?.focus();
    };
  }, [onClose, prev, next, keyboardZoom, resetPinch]);

  if (count === 0) return null;

  const applyUrl = unit.listingUrl ? applyUrlForListing(unit.listingUrl) : null;
  const contactUrl = unit.listingUrl ? contactUrlForListing(unit.listingUrl) : null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Photos of apartment ${unit.unit}`}
      className="fixed inset-0 z-50 flex flex-col bg-black/90!"
      onClick={onClose}
    >
      <div
        className="flex items-center justify-between gap-3 px-4 py-3"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-sm uppercase tracking-wider text-white">
          Apt {unit.unit} · {index + 1} / {count}
        </span>
        <div className="flex items-center gap-3">
          {contactUrl && (
            <a
              href={contactUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-white/60 px-4 py-2 text-xs uppercase tracking-wider text-white transition-colors hover:border-white"
            >
              Contact us
            </a>
          )}
          {applyUrl && (
            <a
              href={applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackOutboundClick('apply', applyUrl, 'unit_gallery', { floorPlan: unit.unit })
              }
              className="bg-primary px-4 py-2 text-xs uppercase tracking-wider text-white transition-opacity hover:opacity-90"
            >
              Apply now
            </a>
          )}
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close photo gallery"
            className="flex h-9 w-9 items-center justify-center text-white transition-opacity hover:opacity-70"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-4 pb-6">
        <div
          ref={viewerRef}
          className="flex h-full w-full items-center justify-center overflow-hidden"
          style={{ touchAction: pinchZoomed ? 'none' : 'pan-y' }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
        >
          <img
            ref={imgRef}
            src={unit.photos[index]}
            alt={`Apartment ${unit.unit}, photo ${index + 1} of ${count}`}
            className="max-h-full max-w-full object-contain"
            draggable={false}
            style={{
              transform: `translate(${pinch.tx}px, ${pinch.ty}px) scale(${pinch.scale})`,
              transformOrigin: 'center center',
              transition:
                reducedMotion || gesture.current.mode || mouseDragging
                  ? 'none'
                  : 'transform 200ms ease',
              cursor: pinchZoomed ? (mouseDragging ? 'grabbing' : 'grab') : undefined,
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              aria-label="Previous photo"
              className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-black/50! text-white transition-colors hover:bg-black/80!"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              aria-label="Next photo"
              className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-black/50! text-white transition-colors hover:bg-black/80!"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
        {/* Zoom toggle — visible control mirroring PlanLightbox, for visitors
            who don't know the pinch/double-tap gestures (and assistive tech). */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (pinchZoomed) {
              resetPinch();
            } else {
              setPinch({
                scale: DOUBLE_TAP_SCALE,
                ...clampPan(0, 0, DOUBLE_TAP_SCALE, 0),
              });
            }
          }}
          className="absolute bottom-4 left-4 flex min-h-11 items-center gap-2 bg-black/60! px-3 py-2 text-xs uppercase tracking-wider text-white transition-colors hover:bg-black/80!"
          aria-label={pinchZoomed ? 'Zoom out' : 'Zoom in'}
        >
          {pinchZoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
          {pinchZoomed ? 'Fit' : 'Zoom'}
        </button>
      </div>
    </div>
  );
}
