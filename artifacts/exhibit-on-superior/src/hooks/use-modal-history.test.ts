// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { useModalHistory } from './use-modal-history';

// Guards the Back-button contract of useModalHistory, especially the
// navigate-away case: a wouter link tapped while a lightbox/modal is open
// unmounts the pop-up without a close, stranding the pushed history entry
// mid-stack. The hook must (a) NOT call history.back() at unmount — that
// would yank the visitor off the page they just navigated to — and (b) make
// a later Back press that lands on the stranded entry transparently skip it,
// so the visitor never needs an extra press.
//
// jsdom + createElement (no JSX in .test.ts) + manual cleanup follow
// `.agents/memory/vitest-dom-hook-tests.md`.

/** Minimal consumer: exposes the hook's close() and the open flag. */
let lastClose: (() => void) | null = null;
function Harness({ open, onClose }: { open: boolean; onClose: () => void }) {
  lastClose = useModalHistory(open, onClose);
  return null;
}

function mount(open: boolean, onClose: () => void) {
  return render(createElement(Harness, { open, onClose }));
}

/** Fire popstate as the browser would when landing on an entry with `state`. */
function firePopstate(state: unknown) {
  act(() => {
    window.dispatchEvent(new PopStateEvent('popstate', { state }));
  });
}

/** The state object the hook pushed for its most recent open. */
function pushedMarker(): unknown {
  return pushSpy.mock.calls[pushSpy.mock.calls.length - 1][0];
}

let backSpy: ReturnType<typeof vi.spyOn>;
let forwardSpy: ReturnType<typeof vi.spyOn>;
let pushSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  backSpy = vi.spyOn(window.history, 'back').mockImplementation(() => {});
  forwardSpy = vi.spyOn(window.history, 'forward').mockImplementation(() => {});
  pushSpy = vi.spyOn(window.history, 'pushState').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  backSpy.mockRestore();
  forwardSpy.mockRestore();
  pushSpy.mockRestore();
  lastClose = null;
});

describe('useModalHistory — existing contract', () => {
  it('opening pushes one marker-tagged entry', () => {
    mount(true, () => {});
    expect(pushSpy).toHaveBeenCalledTimes(1);
    expect(pushSpy.mock.calls[0][0]).toMatchObject({ __modalHistory: true });
    expect(typeof (pushSpy.mock.calls[0][0] as { __modalSeq?: unknown }).__modalSeq).toBe('number');
  });

  it('a manual close consumes the pushed entry with history.back()', () => {
    const onClose = vi.fn();
    mount(true, onClose);

    act(() => lastClose!());
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(backSpy).toHaveBeenCalledTimes(1);
  });

  it('a Back-button (popstate) close does not call history.back() again', () => {
    const onClose = vi.fn();
    mount(true, onClose);

    // Back from the pushed entry lands on the original page entry (no marker).
    firePopstate(null);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(backSpy).not.toHaveBeenCalled();
  });
});

describe('useModalHistory — navigating away with the pop-up open', () => {
  it('unmounting while open does not call history.back()', () => {
    const view = mount(true, () => {});

    // wouter navigation: new entry pushed, page (and pop-up) unmounts.
    view.unmount();
    expect(backSpy).not.toHaveBeenCalled();
  });

  it('a later Back press landing on the stranded entry skips it with one more back()', () => {
    const view = mount(true, () => {});
    const marker = pushedMarker();
    view.unmount();
    expect(backSpy).not.toHaveBeenCalled();

    // The visitor presses Back on the page they navigated to; the browser
    // lands on the stranded marker entry and fires popstate with its state.
    firePopstate(marker);
    expect(backSpy).toHaveBeenCalledTimes(1);
    expect(forwardSpy).not.toHaveBeenCalled();

    // The follow-up back() lands on the real previous entry (no marker) —
    // no further skipping, no loop.
    firePopstate(null);
    expect(backSpy).toHaveBeenCalledTimes(1);
  });

  it('the skipper stays inert while a pop-up is open (its own handler owns Back)', () => {
    const onClose = vi.fn();
    mount(true, onClose);
    const marker = pushedMarker();

    // Hypothetical marker-state landing while a pop-up is open must not
    // trigger a second back() on top of the hook's own close handling.
    firePopstate(marker);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(backSpy).not.toHaveBeenCalled();
  });

  it('ordinary entries are never skipped', () => {
    const view = mount(true, () => {});
    view.unmount();

    firePopstate(null);
    firePopstate({ some: 'state' });
    expect(backSpy).not.toHaveBeenCalled();
  });
});

describe('useModalHistory — direction-aware skipping (Forward past a stranded entry)', () => {
  it('a Forward landing after a back-skip is skipped with history.forward(), not back()', () => {
    // Strand the entry: open, navigate away, unmount.
    const view = mount(true, () => {});
    const marker = pushedMarker();
    view.unmount();

    // Back lands on the stranded entry → skipped backwards (1st back()).
    firePopstate(marker);
    expect(backSpy).toHaveBeenCalledTimes(1);
    // back() resolves: visitor is now behind the marker.
    firePopstate(null);

    // Forward lands on the stranded entry again → must skip FORWARD.
    firePopstate(marker);
    expect(forwardSpy).toHaveBeenCalledTimes(1);
    expect(backSpy).toHaveBeenCalledTimes(1); // no extra back()

    // And alternating again: Back from ahead → back-skip once more.
    firePopstate({ some: 'page' });
    firePopstate(marker);
    expect(backSpy).toHaveBeenCalledTimes(2);
    expect(forwardSpy).toHaveBeenCalledTimes(1);
  });

  it('after a manual close, a Forward landing on the leftover entry skips forward', () => {
    const onClose = vi.fn();
    const view = mount(true, onClose);
    const marker = pushedMarker();

    // Manual close consumes the entry with back(); the marker entry stays
    // AHEAD of the visitor in the stack.
    act(() => lastClose!());
    expect(backSpy).toHaveBeenCalledTimes(1);
    view.rerender(createElement(Harness, { open: false, onClose }));

    // Forward press lands on the leftover marker entry → skip forward.
    firePopstate(marker);
    expect(forwardSpy).toHaveBeenCalledTimes(1);
    expect(backSpy).toHaveBeenCalledTimes(1);
  });

  it('after a Back-button close, a Forward landing on the leftover entry skips forward', () => {
    const onClose = vi.fn();
    const view = mount(true, onClose);
    const marker = pushedMarker();

    // Back press closes the pop-up (popstate on the previous, unmarked
    // entry); the marker entry stays ahead of the visitor.
    firePopstate(null);
    expect(onClose).toHaveBeenCalledTimes(1);
    view.rerender(createElement(Harness, { open: false, onClose }));

    // Forward press lands on the leftover marker entry → skip forward.
    firePopstate(marker);
    expect(forwardSpy).toHaveBeenCalledTimes(1);
    expect(backSpy).not.toHaveBeenCalled();
  });

  it('legacy marker entries without a sequence still skip backwards', () => {
    const view = mount(true, () => {});
    view.unmount();

    firePopstate({ __modalHistory: true });
    expect(backSpy).toHaveBeenCalledTimes(1);
    expect(forwardSpy).not.toHaveBeenCalled();
  });

  it('two stranded entries track their sides independently', () => {
    const first = mount(true, () => {});
    const markerA = pushedMarker();
    first.unmount();
    const second = mount(true, () => {});
    const markerB = pushedMarker();
    second.unmount();

    // Back onto B → back-skip; B is now 'behind'.
    firePopstate(markerB);
    expect(backSpy).toHaveBeenCalledTimes(1);

    // Back onto A (still 'ahead') → back-skip too.
    firePopstate(markerA);
    expect(backSpy).toHaveBeenCalledTimes(2);

    // Forward onto A → forward-skip; then Forward onto B → forward-skip.
    firePopstate(markerA);
    expect(forwardSpy).toHaveBeenCalledTimes(1);
    firePopstate(markerB);
    expect(forwardSpy).toHaveBeenCalledTimes(2);
    expect(backSpy).toHaveBeenCalledTimes(2);
  });
});
