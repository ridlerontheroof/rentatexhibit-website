import { useCallback } from 'react';

/**
 * Shared click-capture dismiss for the lightbox shortcut legend, used by all
 * three photo viewers (PlanLightbox, UnitGalleryLightbox, PhotoGallery) so
 * the behavior can't drift apart between them.
 *
 * Clicking anywhere outside the open legend dismisses it, matching common
 * overlay behavior. Attach the returned handler via `onClickCapture` on the
 * viewer's root container: running in the capture phase means the dismissing
 * click never reaches inner onClick handlers (which might toggle zoom mode or
 * close the whole gallery).
 *
 * Rules:
 * - Clicks inside the legend and on the "?" toggle (matched via
 *   `aria-controls={legendId}`) are excluded so their own click handlers keep
 *   working (the toggle would otherwise close-then-reopen).
 * - Clicks on clearly interactive controls (prev/next arrows, the Zoom/Fit
 *   button, CTA links, etc.) both dismiss the legend AND perform their
 *   action.
 * - All other clicks are swallowed (preventDefault + stopPropagation) so a
 *   stray click that only meant "dismiss the legend" can't also act on
 *   whatever was underneath (e.g. the plan image's zoom toggle).
 */
export function useDismissLegendOnOutsideClick(
  legendId: string,
  showShortcuts: boolean,
  setShowShortcuts: (show: boolean) => void,
) {
  return useCallback(
    (e: React.MouseEvent) => {
      if (!showShortcuts) return;
      const target = e.target as HTMLElement | null;
      if (
        target?.closest(`#${legendId}`) ||
        target?.closest(`[aria-controls="${legendId}"]`)
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
    [legendId, showShortcuts, setShowShortcuts],
  );
}
