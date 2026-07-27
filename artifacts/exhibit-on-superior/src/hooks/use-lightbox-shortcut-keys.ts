import { useCallback, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';

/** Arrow-key pan step while zoomed (px) — identical in all three viewers. */
export const KEY_PAN_STEP = 60;

/**
 * The visible, keyboard-focusable controls inside a lightbox dialog, in DOM
 * order — used by the Tab focus traps in UnitGalleryLightbox and the Photo
 * Gallery page. Filtering out `display: none` elements matters: the shared
 * "?" shortcuts button is hidden on coarse-pointer / small viewports
 * (`hidden pointer-fine:lg:flex`), and counting it as the trap's "last"
 * focusable lets a real browser Tab straight past the visually-last control
 * into the page behind the dialog.
 */
export function tabbableIn(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'),
  ).filter((el) => {
    // jsdom computes no layout; getComputedStyle().display is still reliable
    // for inline `display: none`, and defaults keep everything "visible".
    return getComputedStyle(el).display !== 'none';
  });
}

/**
 * Shared keyboard handling for the three photo viewers: the floor-plan
 * lightbox (PlanLightbox), the unit photo gallery (UnitGalleryLightbox), and
 * the Photo Gallery page's lightbox.
 *
 * The visible legend and zoom/"?" buttons are already shared via
 * LightboxShortcutControls; this hook makes the *behavior* behind those
 * shortcuts consistent by construction too:
 *
 *  - `?`      toggles the shortcut legend
 *  - `+` / `=` and `-` / `_` step the keyboard zoom
 *  - `0`      resets the zoom (viewer-specific work goes in `onResetZoom`)
 *  - Arrows   pan while zoomed (per `isArrowPanning`), otherwise ←/→ navigate
 *  - `Escape` dismisses the legend first, then calls `onEscape` (if provided)
 *
 * Viewer-specific behavior is passed in as options:
 *  - PlanLightbox guards input fields (`guardInputFields`), suppresses arrow
 *    navigation while in scroll-zoom mode (`canArrowNavigate`), and handles
 *    Escape itself via Radix's onEscapeKeyDown (so it omits `onEscape`).
 *  - UnitGalleryLightbox keeps its Tab focus trap in `onOtherKey`.
 */
export interface LightboxShortcutKeyOptions {
  /** Attach the window keydown listener only while true (viewer open). */
  active: boolean;
  /** Whether the shortcut legend is currently open (Escape-dismiss-first). */
  showShortcuts: boolean;
  /** Legend state setter ("?" toggles, Escape dismisses). */
  setShowShortcuts: Dispatch<SetStateAction<boolean>>;
  /** Step the zoom in (+1) or out (−1) — usePinchZoom's keyboardZoom. */
  keyboardZoom: (dir: 1 | -1) => void;
  /** Pan the zoomed image by (dx, dy) px — usePinchZoom's panBy. */
  panBy: (dx: number, dy: number) => void;
  /** Reset zoom on `0` (include any viewer-specific zoom-mode cleanup). */
  onResetZoom: () => void;
  /** When true, arrow keys pan instead of navigating. */
  isArrowPanning: () => boolean;
  /** Navigate to the previous (−1) / next (1) item on ←/→. */
  onNavigate: (dir: -1 | 1) => void;
  /**
   * Extra gate on arrow navigation (after the pan check). Return false to
   * leave the arrows to the browser (PlanLightbox's scroll-zoom mode).
   * Defaults to always navigable.
   */
  canArrowNavigate?: () => boolean;
  /**
   * Called on Escape after the legend-dismiss check (typically closes the
   * viewer). Omit when Escape is handled elsewhere (PlanLightbox's Radix
   * onEscapeKeyDown owns its fit-then-close behavior).
   */
  onEscape?: () => void;
  /** Ignore keystrokes originating in inputs/textareas/contentEditable. */
  guardInputFields?: boolean;
  /** Fallback for keys the hook doesn't handle (e.g. a Tab focus trap). */
  onOtherKey?: (e: KeyboardEvent) => void;
}

export function useLightboxShortcutKeys({
  active,
  showShortcuts,
  setShowShortcuts,
  keyboardZoom,
  panBy,
  onResetZoom,
  isArrowPanning,
  onNavigate,
  canArrowNavigate,
  onEscape,
  guardInputFields,
  onOtherKey,
}: LightboxShortcutKeyOptions) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (guardInputFields) {
        const target = e.target as HTMLElement | null;
        if (
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable)
        ) {
          return;
        }
      }
      if (e.key === 'Escape' && onEscape) {
        // First Escape dismisses the shortcut legend if it is open.
        if (showShortcuts) {
          e.preventDefault();
          setShowShortcuts(false);
          return;
        }
        onEscape();
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
        onResetZoom();
        return;
      }
      if (e.key.startsWith('Arrow')) {
        // While zoomed in, arrows pan the image instead of navigating, so
        // keyboard users can inspect details without losing their zoom.
        if (isArrowPanning()) {
          e.preventDefault();
          const dx =
            e.key === 'ArrowLeft' ? KEY_PAN_STEP : e.key === 'ArrowRight' ? -KEY_PAN_STEP : 0;
          const dy =
            e.key === 'ArrowUp' ? KEY_PAN_STEP : e.key === 'ArrowDown' ? -KEY_PAN_STEP : 0;
          panBy(dx, dy);
          return;
        }
        if (canArrowNavigate && !canArrowNavigate()) return;
        if (e.key === 'ArrowLeft') onNavigate(-1);
        else if (e.key === 'ArrowRight') onNavigate(1);
        return;
      }
      onOtherKey?.(e);
    },
    [
      guardInputFields,
      onEscape,
      showShortcuts,
      setShowShortcuts,
      keyboardZoom,
      panBy,
      onResetZoom,
      isArrowPanning,
      canArrowNavigate,
      onNavigate,
      onOtherKey,
    ],
  );

  useEffect(() => {
    if (!active) return;
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [active, handleKey]);
}
