import type { UsePinchZoomOptions } from './use-pinch-zoom';

/**
 * Companion rule to useDismissLegendOnOutsideClick, expressed once for all
 * three photo viewers (PlanLightbox, UnitGalleryLightbox, PhotoGallery):
 *
 * Touch gestures never end in a click, so the click-capture dismiss
 * (useDismissLegendOnOutsideClick) can never run for them. Without this,
 * a pinch/pan would zoom — or a swipe would change the photo — underneath
 * a still-open shortcut legend, leaving it stranded on top.
 *
 * Wrap the options passed to usePinchZoom:
 *
 *   usePinchZoom(clearLegendOnTouchGestures(setShowShortcuts, { ...options }))
 *
 * The wrapper clears the legend at gesture start (pinch/pan) and on swipe,
 * then delegates to the viewer's own onGestureStart / onSwipe handlers.
 * (Arrow-key navigation deliberately keeps the legend open for keyboard
 * users; a swipe is a touch gesture, so no keyboard user is served by
 * leaving it up.)
 *
 * The lightbox-shortcut-guard test enforces that every viewer routes its
 * usePinchZoom options through this wrapper instead of hand-writing the
 * clearing calls.
 */
export function clearLegendOnTouchGestures(
  setShowShortcuts: (show: boolean) => void,
  options: UsePinchZoomOptions = {},
): UsePinchZoomOptions {
  return {
    ...options,
    onGestureStart: () => {
      setShowShortcuts(false);
      options.onGestureStart?.();
    },
    onSwipe: (dir) => {
      setShowShortcuts(false);
      options.onSwipe?.(dir);
    },
  };
}
