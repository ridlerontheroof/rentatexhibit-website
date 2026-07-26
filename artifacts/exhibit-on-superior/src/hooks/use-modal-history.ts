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
type ModalEntryState = { __modalHistory: true; __modalSeq: number };

function isModalEntryState(state: unknown): state is { __modalHistory: true; __modalSeq?: number } {
  return (
    typeof state === 'object' &&
    state !== null &&
    (state as { __modalHistory?: unknown }).__modalHistory === true
  );
}

// Monotonic id per pushed entry, so the skipper can track each stranded
// entry individually across repeated landings.
let nextModalSeq = 1;

/**
 * Which side of each marker entry the visitor is currently on. Landing on a
 * marker entry via popstate can only happen from an adjacent entry, so the
 * side tells us the travel direction:
 * - 'ahead'  → the visitor was ahead of the marker, so this landing came via
 *   Back — skip with history.back(), visitor ends up 'behind'.
 * - 'behind' → the visitor was behind it, so this landing came via Forward —
 *   skip with history.forward(), visitor ends up 'ahead'.
 * Entries start 'ahead': a strand happens by navigating forward past the
 * marker, and a manual/Back close is recorded explicitly below.
 */
const markerSide = new Map<number, 'ahead' | 'behind'>();

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
      const seq = event.state.__modalSeq;
      if (typeof seq !== 'number') {
        // Legacy marker without a sequence — can't infer direction; the
        // overwhelmingly common landing is via Back.
        window.history.back();
        return;
      }
      const side = markerSide.get(seq) ?? 'ahead';
      if (side === 'ahead') {
        // Visitor was ahead of the marker → this landing came via Back.
        markerSide.set(seq, 'behind');
        window.history.back();
      } else {
        // Visitor was behind it → this landing came via Forward; a back()
        // here would bounce them backwards. Keep them moving forward.
        markerSide.set(seq, 'ahead');
        window.history.forward();
      }
    }
  });
}

export function useModalHistory(open: boolean, onClose: () => void): () => void {
  // True while the current history entry is the one this hook pushed.
  const pushedEntryRef = useRef(false);
  // Sequence id of the entry this hook pushed (while open).
  const seqRef = useRef<number | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open || typeof window === 'undefined') return;
    installStrandedEntrySkipper();
    const seq = nextModalSeq++;
    seqRef.current = seq;
    const state: ModalEntryState = { __modalHistory: true, __modalSeq: seq };
    window.history.pushState(state, '', window.location.href);
    pushedEntryRef.current = true;
    openModalCount += 1;

    const onPopState = () => {
      // The pushed entry has been navigated away from (Back pressed); close
      // the pop-up without calling history.back() again. The visitor is now
      // behind the marker entry.
      pushedEntryRef.current = false;
      markerSide.set(seq, 'behind');
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
      // global skipper consumes it if Back ever lands there. The wouter
      // navigation replaced the forward stack, so the visitor is ahead of
      // the marker — which is the default the skipper assumes.
      if (pushedEntryRef.current) {
        markerSide.set(seq, 'ahead');
      }
      pushedEntryRef.current = false;
    };
  }, [open]);

  return useCallback(() => {
    onCloseRef.current();
    if (pushedEntryRef.current) {
      // Consume the entry the open pushed so one Back press leaves the page.
      // back() leaves the marker entry ahead of the visitor, so a Forward
      // press could still land on it — record the side for the skipper.
      pushedEntryRef.current = false;
      if (seqRef.current !== null) {
        markerSide.set(seqRef.current, 'behind');
      }
      window.history.back();
    }
  }, []);
}
