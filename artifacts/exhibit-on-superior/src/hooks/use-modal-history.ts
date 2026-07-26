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
 * - Navigating AWAY while the pop-up is open (e.g. tapping a wouter link
 *   such as "Schedule a tour") unmounts the pop-up without a close, leaving
 *   the pushed entry stranded mid-stack. History APIs can't delete a middle
 *   entry, so the pushed entry carries a state marker and a global popstate
 *   listener transparently skips it: when Back later lands on a marker entry
 *   while no pop-up is open, it immediately backs up one more step — the
 *   visitor never sees the duplicate.
 *
 * Usage: call with the pop-up's open flag and its state-closing setter, and
 * route EVERY manual close path through the returned `close` function.
 */

/** history.state shape for the entry this hook pushes on open. */
const MODAL_ENTRY_STATE = { __modalHistory: true };

function isModalEntryState(state: unknown): boolean {
  return (
    typeof state === 'object' &&
    state !== null &&
    (state as { __modalHistory?: unknown }).__modalHistory === true
  );
}

// How many pop-ups managed by this hook are currently open. While one is
// open, its own popstate handler owns Back presses; the stranded-entry
// skipper below must stay out of the way.
let openModalCount = 0;

let skipListenerInstalled = false;

/**
 * One global listener for the whole app: when history navigation lands on an
 * entry that a since-unmounted pop-up pushed (marker present, no pop-up
 * open), consume it with one more back() so the visitor's Back press behaves
 * as if the duplicate never existed.
 */
function installStrandedEntrySkipper() {
  if (skipListenerInstalled || typeof window === 'undefined') return;
  skipListenerInstalled = true;
  window.addEventListener('popstate', (event: PopStateEvent) => {
    if (openModalCount === 0 && isModalEntryState(event.state)) {
      window.history.back();
    }
  });
}

export function useModalHistory(open: boolean, onClose: () => void): () => void {
  // True while the current history entry is the one this hook pushed.
  const pushedEntryRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open || typeof window === 'undefined') return;
    installStrandedEntrySkipper();
    window.history.pushState(MODAL_ENTRY_STATE, '', window.location.href);
    pushedEntryRef.current = true;
    openModalCount += 1;

    const onPopState = () => {
      // The pushed entry has been navigated away from (Back pressed); close
      // the pop-up without calling history.back() again.
      pushedEntryRef.current = false;
      onCloseRef.current();
    };
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
      openModalCount -= 1;
      // If the pop-up unmounts while its pushed entry is still pending (a
      // wouter navigation happened with the pop-up open), the entry is now
      // stranded BEHIND the new page's entry — back() here would visibly
      // yank the visitor off the page they just navigated to. Leave it; the
      // global skipper consumes it if Back ever lands there.
      pushedEntryRef.current = false;
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
