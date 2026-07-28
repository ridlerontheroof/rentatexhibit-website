import { useCallback, useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { LightboxShortcutControls } from '../LightboxShortcutControls';
import type { AvailableUnit } from '../../hooks/use-availability';
import { trackOutboundClick } from '../../lib/analytics';
import { DOUBLE_TAP_SCALE, usePinchZoom } from '../../hooks/use-pinch-zoom';
import { clearLegendOnTouchGestures } from '../../hooks/clear-legend-on-touch-gestures';
import { useReducedMotion } from '../../hooks/use-reduced-motion';
import { tabbableIn, useLightboxShortcutKeys } from '../../hooks/use-lightbox-shortcut-keys';
import { useDismissLegendOnOutsideClick } from '../../hooks/use-dismiss-legend-on-outside-click';
import { getVisitSource } from '../../lib/visitSource';

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

/**
 * The `source` query param for AppFolio-hosted links: the visit's remembered
 * campaign attribution (e.g. "Google Ads — spring promo") when the visitor
 * landed with UTM tags, otherwise the long-standing default label.
 */
function leadSourceParam(): string {
  return encodeURIComponent(getVisitSource() ?? LEAD_SOURCE);
}

/**
 * Derive the AppFolio online rental application URL for a posted listing —
 * the same target as the "Apply Now" button on AppFolio's own listing page.
 */
export function applyUrlForListing(listingUrl: string): string | null {
  const parsed = parseListingUrl(listingUrl);
  if (!parsed) return null;
  return `${parsed.origin}/listings/rental_applications/new?listable_uid=${parsed.uid}&source=${leadSourceParam()}`;
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
  return `${parsed.origin}/listings/showings/new?listable_uid=${parsed.uid}&source=${leadSourceParam()}`;
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

  // Desktop-only keyboard shortcut legend (toggled by the "?" button or key),
  // mirroring PlanLightbox.
  const [showShortcuts, setShowShortcuts] = useState(false);

  const prev = useCallback(() => setIndex((i) => (i - 1 + count) % count), [count]);
  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count]);

  // ---------------------------------------------------------------------
  // Pinch-to-zoom / pan / double-tap / wheel / keyboard zoom gestures —
  // shared with the floor-plan lightbox (PlanLightbox) via usePinchZoom,
  // minus its scroll-zoom mode (no onSingleTap / onDoubleTap /
  // beforeZoomChange hooks needed here). Swipe changes photos only while
  // fully zoomed out.
  // ---------------------------------------------------------------------
  const {
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
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onMouseDown,
    mouseDragging,
    isGesturing,
  } = usePinchZoom(
    // Touch gestures never end in a click, so the click-capture dismiss
    // (dismissLegendOnOutsideClick) can't run — the shared wrapper clears the
    // shortcut legend at gesture start / on swipe, matching PlanLightbox.
    clearLegendOnTouchGestures(setShowShortcuts, {
      onSwipe: (dir) => {
        if (count > 1) {
          if (dir === 1) next();
          else prev();
        }
      },
    }),
  );

  // Reset zoom whenever the shown photo changes.
  useEffect(() => {
    resetPinch();
    resetTap();
  }, [index, resetPinch, resetTap]);

  // Shared keyboard shortcuts (?, +/−, 0, arrow pan/navigate, Escape
  // dismisses the legend first) — identical to PlanLightbox and the Photo
  // Gallery page by construction. The Tab focus trap is viewer-specific and
  // rides along via onOtherKey.
  useLightboxShortcutKeys({
    active: true,
    showShortcuts,
    setShowShortcuts,
    keyboardZoom,
    panBy,
    onResetZoom: resetPinch,
    // While pinch-zoomed in, arrows pan the photo instead of navigating, so
    // keyboard users can inspect finishes without losing their zoom.
    isArrowPanning: () => pinchZoomed,
    onNavigate: (dir) => (dir === 1 ? next() : prev()),
    onEscape: onClose,
    onOtherKey: (e) => {
      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = tabbableIn(dialogRef.current);
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
    },
  });

  useEffect(() => {
    // Focus management: move focus into the dialog on open and restore focus
    // to the opener on close. (Keyboard shortcuts + Tab trap live in
    // useLightboxShortcutKeys above.)
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      previouslyFocused?.focus();
    };
  }, []);

  // Clicking outside the open legend dismisses it — shared capture-phase
  // handler (see use-dismiss-legend-on-outside-click.ts for the rules). The
  // capture phase matters here: the dismissing click must never reach the
  // backdrop's onClick, which would close the whole gallery.
  const dismissLegendOnOutsideClick = useDismissLegendOnOutsideClick(
    'gallery-shortcuts-legend',
    showShortcuts,
    setShowShortcuts,
  );

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
      onClickCapture={dismissLegendOnOutsideClick}
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
                reducedMotion || isGesturing() || mouseDragging
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
        {/* Shared zoom / "?" cluster + shortcut legend (mirrors PlanLightbox
            and the Photo Gallery page by construction). */}
        <LightboxShortcutControls
          legendId="gallery-shortcuts-legend"
          showShortcuts={showShortcuts}
          onToggleShortcuts={() => setShowShortcuts((s) => !s)}
          onDismissShortcuts={() => setShowShortcuts(false)}
          zoomedIn={pinchZoomed}
          onZoomToggle={() => {
            if (pinchZoomed) {
              resetPinch();
            } else {
              setPinch({
                scale: DOUBLE_TAP_SCALE,
                ...clampPan(0, 0, DOUBLE_TAP_SCALE, 0),
              });
            }
          }}
        />
      </div>
    </div>
  );
}
