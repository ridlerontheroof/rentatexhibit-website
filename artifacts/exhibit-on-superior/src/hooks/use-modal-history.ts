import { useCallback, useEffect, useRef } from 'react';

/**
 * Back-button contract for full-screen pop-ups (lightboxes/modals) that don't
 * live in the URL — the same contract the /available-units floor-plan
 * lightbox implements with its `?plan=` deep-link (see FloorPlans.tsx):
 *
 * - Opening the pop-up pushes one history entry, so on phones the Back
 *   button closes it instead of leaving the page.
 * - A manual close (X, Escape, backdrop) consumes that pushed entry with
 *   `history.back()`, so a further Back press leaves the page in ONE press.
 * - A popstate-driven close (the Back button itself) must NOT call
 *   `history.back()` again, or Back would double-navigate.
 * - Navigating between photos inside the pop-up is plain React state and
 *   never touches history, so there is no pile-up.
 *
 * Usage: call with the pop-up's open flag and its state-closing setter, and
 * route EVERY manual close path through the returned `close` function.
 */
export function useModalHistory(open: boolean, onClose: () => void): () => void {
  // True while the current history entry is the one this hook pushed.
  const pushedEntryRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open || typeof window === 'undefined') return;
    window.history.pushState(null, '', window.location.href);
    pushedEntryRef.current = true;

    const onPopState = () => {
      // The pushed entry has been navigated away from (Back pressed); close
      // the pop-up without calling history.back() again.
      pushedEntryRef.current = false;
      onCloseRef.current();
    };
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, [open]);

  return useCallback(() => {
    onCloseRef.current();
    if (pushedEntryRef.current) {
      // Consume the entry the open pushed so one Back press leaves the page.
      pushedEntryRef.current = false;
      window.history.back();
    }
  }, []);
}
