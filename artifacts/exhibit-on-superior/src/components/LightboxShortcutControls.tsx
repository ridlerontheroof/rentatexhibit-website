import { ZoomIn, ZoomOut } from 'lucide-react';

/**
 * Shared zoom / "?" button cluster and keyboard-shortcut legend used by all
 * three photo viewers: the floor-plan lightbox (PlanLightbox), the unit photo
 * gallery (UnitGalleryLightbox), and the Photo Gallery page's lightbox.
 *
 * Keeping the markup in one place means a shortcut change (or a styling
 * tweak) can't drift between the three panels — they are consistent by
 * construction. The legend rows are identical everywhere except the two
 * viewer-specific descriptions (what ←/→ navigate, what Esc does), which are
 * passed in as props.
 *
 * The host component still owns the state and behavior:
 *  - `showShortcuts` state and its key handler ("?", Escape-dismiss),
 *  - the click-capture outside-click dismiss (which relies on the legend's
 *    `id` / the toggle's `aria-controls` rendered here),
 *  - the actual zoom implementation behind `onZoomToggle`.
 *
 * All three controls are absolutely positioned; the host must render this
 * inside a `position: relative` (or fixed) viewer container. Button clicks
 * stop propagation so they never reach a backdrop close handler.
 */
export interface LightboxShortcutControlsProps {
  /** DOM id of the legend panel; the "?" toggle's aria-controls points at it. */
  legendId: string;
  /** Whether the legend panel is open. */
  showShortcuts: boolean;
  /** Toggle the legend (the "?" button). */
  onToggleShortcuts: () => void;
  /** Close the legend (its × button). */
  onDismissShortcuts: () => void;
  /** Whether the viewer is currently zoomed in (drives the Zoom/Fit button). */
  zoomedIn: boolean;
  /** Zoom in when zoomed out, reset to fit when zoomed in. */
  onZoomToggle: () => void;
  /** Legend description for the ← → row. */
  navDescription?: string;
  /** Legend description for the Esc row. */
  escDescription?: string;
}

export function LightboxShortcutControls({
  legendId,
  showShortcuts,
  onToggleShortcuts,
  onDismissShortcuts,
  zoomedIn,
  onZoomToggle,
  navDescription = 'Next / previous photo',
  escDescription = 'Close',
}: LightboxShortcutControlsProps) {
  const rows: Array<[string, string]> = [
    ['+ / −', 'Zoom in / out'],
    ['0', 'Reset zoom'],
    ['← →', navDescription],
    ['Arrows', 'Pan while zoomed'],
    ['Esc', escDescription],
    ['?', 'Toggle this panel'],
  ];

  return (
    <>
      {/* Zoom toggle — visible control for visitors who don't know the
          pinch/double-tap gestures (and assistive tech). */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onZoomToggle();
        }}
        className="absolute bottom-4 left-4 z-10 flex min-h-11 items-center gap-2 bg-black/60! px-3 py-2 text-xs uppercase tracking-wider text-white transition-colors hover:bg-black/80!"
        aria-label={zoomedIn ? 'Zoom out' : 'Zoom in'}
      >
        {zoomedIn ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
        {zoomedIn ? 'Fit' : 'Zoom'}
      </button>

      {/* Keyboard shortcuts hint (desktop / fine-pointer only) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleShortcuts();
        }}
        aria-expanded={showShortcuts}
        aria-controls={legendId}
        aria-label={showShortcuts ? 'Hide keyboard shortcuts' : 'Show keyboard shortcuts'}
        className="absolute bottom-4 left-[7.5rem] z-10 hidden min-h-11 min-w-11 items-center justify-center bg-black/60! px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-black/80! pointer-fine:lg:flex"
      >
        ?
      </button>
      {showShortcuts && (
        <div
          id={legendId}
          role="region"
          aria-label="Keyboard shortcuts"
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-16 left-4 z-10 hidden w-60 bg-black/80! p-4 text-white backdrop-blur-sm pointer-fine:lg:block"
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[2px] text-white/70">
              Keyboard shortcuts
            </p>
            <button
              type="button"
              onClick={onDismissShortcuts}
              aria-label="Dismiss keyboard shortcuts"
              className="-mr-1 -mt-1 px-1 text-white/60 transition-colors hover:text-white"
            >
              ×
            </button>
          </div>
          <dl className="space-y-1.5 text-xs">
            {rows.map(([key, desc]) => (
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
    </>
  );
}
