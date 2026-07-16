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

  // Mobile bottom-sheet drag state. Snap points are expressed in dvh.
  const SHEET_COLLAPSED = 40;
  const SHEET_EXPANDED = 85;
  const [sheetSnap, setSheetSnap] = useState<number>(SHEET_COLLAPSED);
  const [dragHeightPx, setDragHeightPx] = useState<number | null>(null);
  const dragRef = useRef<{ startY: number; startHeightPx: number } | null>(null);

  // Reset zoom whenever the shown plan changes.
  useEffect(() => {
    setZoomed(false);
  }, [group?.id, variantIndex]);

  // Collapse the sheet when a different plan group is opened.
  useEffect(() => {
    setSheetSnap(SHEET_COLLAPSED);
    setDragHeightPx(null);
    dragRef.current = null;
  }, [group?.id]);

  const viewportH = () =>
    typeof window !== 'undefined' ? window.innerHeight : 800;

  const onSheetDragStart = (e: React.TouchEvent) => {
    const startHeightPx =
      dragHeightPx ?? (sheetSnap / 100) * viewportH();
    dragRef.current = { startY: e.touches[0].clientY, startHeightPx };
  };
  const onSheetDragMove = (e: React.TouchEvent) => {
    if (!dragRef.current) return;
    const dy = dragRef.current.startY - e.touches[0].clientY;
    const vh = viewportH();
    const next = Math.min(
      (SHEET_EXPANDED / 100) * vh,
      Math.max((SHEET_COLLAPSED / 100) * vh * 0.6, dragRef.current.startHeightPx + dy),
    );
    setDragHeightPx(next);
  };
  const onSheetDragEnd = () => {
    if (!dragRef.current) return;
    const vh = viewportH();
    const currentPx = dragHeightPx ?? (sheetSnap / 100) * vh;
    const midpointPx = ((SHEET_COLLAPSED + SHEET_EXPANDED) / 2 / 100) * vh;
    setSheetSnap(currentPx >= midpointPx ? SHEET_EXPANDED : SHEET_COLLAPSED);
    setDragHeightPx(null);
    dragRef.current = null;
  };

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
        className="max-w-none w-screen h-screen max-h-screen supports-[height:100svh]:h-[100svh] supports-[height:100svh]:max-h-[100svh] supports-[height:100dvh]:h-[100dvh] supports-[height:100dvh]:max-h-[100dvh] translate-x-[-50%] translate-y-[-50%] gap-0 border-0 bg-[#111] p-0 sm:rounded-none"
      >
        <DialogTitle className="sr-only">
          {variant.typeLabel}, Unit {variant.unit}, floors {variant.floorLabel}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {sqftLabel}. Use the left and right arrow keys or swipe to move between floor plans. Press
          Escape to close.
        </DialogDescription>

        <div className="flex h-screen supports-[height:100svh]:h-[100svh] supports-[height:100dvh]:h-[100dvh] flex-col lg:grid lg:h-screen lg:grid-cols-[1fr_360px] lg:grid-rows-1">
          {/* Image viewer */}
          <div className="relative flex min-h-0 flex-1 items-center justify-center bg-[#111] lg:flex-none">
            <div
              className={`h-full w-full ${zoomed ? 'overflow-auto' : 'overflow-hidden flex items-center justify-center p-4 sm:p-8'}`}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <img
                key={variant.id}
                src={zoomed ? variant.images.zoom : variant.images.detail}
                alt={`${variant.typeLabel} floor plan, Unit ${variant.unit}, floors ${variant.floorLabel}, ${sqftLabel}`}
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
              className="absolute bottom-4 left-4 flex min-h-11 items-center gap-2 bg-black/60 px-3 py-2 text-xs uppercase tracking-wider text-white transition-colors hover:bg-black/80"
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
          <aside
            className={`flex min-h-0 shrink-0 flex-col overflow-y-auto bg-white h-[var(--sheet-h)] max-h-[var(--sheet-h)] lg:h-auto lg:max-h-none lg:shrink ${
              dragHeightPx === null ? 'transition-[height,max-height] duration-300 ease-out' : ''
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
              onTouchStart={onSheetDragStart}
              onTouchMove={onSheetDragMove}
              onTouchEnd={onSheetDragEnd}
              onTouchCancel={onSheetDragEnd}
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
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}
