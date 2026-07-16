import { useCallback, useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../ui/dialog';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Link } from 'wouter';
import { unitNumbersForPlan, type PlanGroup } from '../../data/floorPlans';

const AVAILABILITY_URL = 'https://www.highlandptrs.com/chicago-availability?search=exhibit';

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
  const [zoomed, setZoomed] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Reset zoom whenever the shown plan changes.
  useEffect(() => {
    setZoomed(false);
  }, [group?.id, variantIndex]);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (!group) return;
      if (e.key === 'ArrowLeft') onNavigate(-1);
      else if (e.key === 'ArrowRight') onNavigate(1);
    },
    [group, onNavigate],
  );

  useEffect(() => {
    if (!group) return;
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [group, handleKey]);

  if (!group) return null;

  const variant = group.variants[variantIndex] ?? group.variants[0];
  const sqftLabel = `${variant.sqft.toLocaleString()} sq ft`;

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || zoomed) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) onNavigate(dx < 0 ? 1 : -1);
    touchStartX.current = null;
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-none w-screen h-screen max-h-screen translate-x-[-50%] translate-y-[-50%] gap-0 border-0 bg-[#111] p-0 sm:rounded-none"
      >
        <DialogTitle className="sr-only">
          {variant.typeLabel}, Residence {variant.unit}, floors {variant.floorLabel}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {sqftLabel}. Use the left and right arrow keys or swipe to move between floor plans. Press
          Escape to close.
        </DialogDescription>

        <div className="grid h-screen grid-rows-[1fr_auto] lg:grid-cols-[1fr_360px] lg:grid-rows-1">
          {/* Image viewer */}
          <div className="relative flex min-h-0 items-center justify-center bg-[#111]">
            <div
              className={`h-full w-full ${zoomed ? 'overflow-auto' : 'overflow-hidden flex items-center justify-center p-4 sm:p-8'}`}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <img
                key={variant.id}
                src={zoomed ? variant.images.zoom : variant.images.detail}
                alt={`${variant.typeLabel} floor plan, Residence ${variant.unit}, floors ${variant.floorLabel}, ${sqftLabel}`}
                onClick={() => setZoomed((z) => !z)}
                className={
                  zoomed
                    ? 'max-w-none cursor-zoom-out'
                    : 'mx-auto max-h-full max-w-full cursor-zoom-in object-contain'
                }
                style={zoomed ? { width: '160%' } : undefined}
              />
            </div>

            {/* Zoom toggle */}
            <button
              type="button"
              onClick={() => setZoomed((z) => !z)}
              className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/60 px-3 py-2 text-xs uppercase tracking-wider text-white transition-colors hover:bg-black/80"
              aria-label={zoomed ? 'Zoom out' : 'Zoom in'}
            >
              {zoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
              {zoomed ? 'Fit' : 'Zoom'}
            </button>

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
          <aside className="flex flex-col gap-5 overflow-y-auto bg-white p-6 lg:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[2px] text-primary">
                Residence {String(variant.unit).padStart(2, '0')}
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
              Each plan sheet includes the building stacking diagram with this residence highlighted
              and a north orientation arrow. Zoom in to explore dimensions and layout in detail.
            </p>

            <div className="mt-auto flex flex-col gap-3 pt-2">
              <a
                href={AVAILABILITY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold-outline bg-primary text-center text-white hover:bg-primary/90"
              >
                Check Availability
              </a>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/schedule-a-tour"
                  onClick={onClose}
                  className="btn-gold-outline flex-1 text-center"
                >
                  Schedule a Tour
                </Link>
                <Link href="/contact-us" onClick={onClose} className="btn-gold-outline flex-1 text-center">
                  Contact Us
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}
