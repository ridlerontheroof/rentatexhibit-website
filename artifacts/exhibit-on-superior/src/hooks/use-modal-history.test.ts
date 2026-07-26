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

const MARKER = { __modalHistory: true };

let backSpy: ReturnType<typeof vi.spyOn>;
let pushSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  backSpy = vi.spyOn(window.history, 'back').mockImplementation(() => {});
  pushSpy = vi.spyOn(window.history, 'pushState').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  backSpy.mockRestore();
  pushSpy.mockRestore();
  lastClose = null;
});

describe('useModalHistory — existing contract', () => {
  it('opening pushes one marker-tagged entry', () => {
    mount(true, () => {});
    expect(pushSpy).toHaveBeenCalledTimes(1);
    expect(pushSpy.mock.calls[0][0]).toEqual(MARKER);
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
    view.unmount();
    expect(backSpy).not.toHaveBeenCalled();

    // The visitor presses Back on the page they navigated to; the browser
    // lands on the stranded marker entry and fires popstate with its state.
    firePopstate(MARKER);
    expect(backSpy).toHaveBeenCalledTimes(1);

    // The follow-up back() lands on the real previous entry (no marker) —
    // no further skipping, no loop.
    firePopstate(null);
    expect(backSpy).toHaveBeenCalledTimes(1);
  });

  it('the skipper stays inert while a pop-up is open (its own handler owns Back)', () => {
    const onClose = vi.fn();
    mount(true, onClose);

    // Hypothetical marker-state landing while a pop-up is open must not
    // trigger a second back() on top of the hook's own close handling.
    firePopstate(MARKER);
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
