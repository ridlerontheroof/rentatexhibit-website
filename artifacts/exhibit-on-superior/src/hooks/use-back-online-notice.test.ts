// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useBackOnlineNotice } from './use-back-online-notice';

// Track the active render so we can always unmount it and detach the hook's
// window listeners between tests (vitest globals aren't enabled here, so
// testing-library's auto-cleanup does not run on its own).
let active: ReturnType<typeof renderHook<ReturnType<typeof useBackOnlineNotice>, void>> | null =
  null;

function renderNotice() {
  active = renderHook(() => useBackOnlineNotice());
  return active;
}

function setOnLine(value: boolean) {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    get: () => value,
  });
}

function goOffline() {
  setOnLine(false);
  act(() => {
    window.dispatchEvent(new Event('offline'));
  });
}

function goOnline() {
  setOnLine(true);
  act(() => {
    window.dispatchEvent(new Event('online'));
  });
}

afterEach(() => {
  active?.unmount();
  active = null;
  setOnLine(true);
});

describe('useBackOnlineNotice', () => {
  it('does NOT show the notice on initial load while online', () => {
    const view = renderNotice();
    expect(view.result.current[0]).toBe(false);
  });

  it('does not show the notice while offline', () => {
    const view = renderNotice();
    goOffline();
    expect(view.result.current[0]).toBe(false);
  });

  it('shows the notice after an offline → online transition', () => {
    const view = renderNotice();
    goOffline();
    goOnline();
    expect(view.result.current[0]).toBe(true);
  });

  it('persists until dismissed — no auto-dismiss timer (WCAG 2.2.1)', async () => {
    const view = renderNotice();
    goOffline();
    goOnline();
    expect(view.result.current[0]).toBe(true);
    // Give any stray timer a chance to fire; the notice must stay put.
    await act(() => new Promise((r) => setTimeout(r, 50)));
    expect(view.result.current[0]).toBe(true);
  });

  it('hides when dismissed', () => {
    const view = renderNotice();
    goOffline();
    goOnline();
    expect(view.result.current[0]).toBe(true);
    act(() => {
      view.result.current[1]();
    });
    expect(view.result.current[0]).toBe(false);
  });

  it('hides immediately if the browser drops offline again mid-notice', () => {
    const view = renderNotice();
    goOffline();
    goOnline();
    expect(view.result.current[0]).toBe(true);
    goOffline();
    expect(view.result.current[0]).toBe(false);
  });

  it('shows again on each subsequent offline → online round trip', () => {
    const view = renderNotice();
    goOffline();
    goOnline();
    act(() => {
      view.result.current[1]();
    });
    expect(view.result.current[0]).toBe(false);
    goOffline();
    goOnline();
    expect(view.result.current[0]).toBe(true);
  });
});
