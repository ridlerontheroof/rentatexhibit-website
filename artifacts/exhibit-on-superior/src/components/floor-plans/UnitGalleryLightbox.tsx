import { useCallback, useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { AvailableUnit } from '../../hooks/use-availability';
import { trackOutboundClick } from '../../lib/analytics';

interface UnitGalleryLightboxProps {
  unit: AvailableUnit;
  onClose: () => void;
}

/**
 * Derive the AppFolio online rental application URL for a posted listing —
 * the same target as the "Apply Now" button on AppFolio's own listing page.
 */
export function applyUrlForListing(listingUrl: string): string | null {
  const parsed = parseListingUrl(listingUrl);
  if (!parsed) return null;
  return `${parsed.origin}/listings/rental_applications/new?listable_uid=${parsed.uid}&source=Website`;
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
  return `${parsed.origin}/listings/showings/new?listable_uid=${parsed.uid}&source=Website`;
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
  const count = unit.photos.length;

  const prev = useCallback(() => setIndex((i) => (i - 1 + count) % count), [count]);
  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count]);

  useEffect(() => {
    // Focus management: move focus into the dialog on open, trap Tab within
    // it, and restore focus to the opener on close.
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
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
  }, [onClose, prev, next]);

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
        <img
          src={unit.photos[index]}
          alt={`Apartment ${unit.unit}, photo ${index + 1} of ${count}`}
          className="max-h-full max-w-full object-contain"
          onClick={(e) => e.stopPropagation()}
        />
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
      </div>
    </div>
  );
}
