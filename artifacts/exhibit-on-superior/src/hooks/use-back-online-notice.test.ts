// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useBackOnlineNotice } from './use-back-online-notice';

// Track the active render so we can always unmount it and detach the hook's
// window listeners between tests (vitest globals aren't enabled here, so
// testing-library's auto-cleanup does not run on its own).
let active: ReturnType<typeof renderHook<boolean, number | undefined>> | null = null;

function renderNotice(durationMs?: number) {
  active = renderHook(() => useBackOnlineNotice(durationMs));
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

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  active?.unmount();
  active = null;
  setOnLine(true);
  vi.useRealTimers();
});

describe('useBackOnlineNotice', () => {
  it('does NOT show the notice on initial load while online', () => {
    const view = renderNotice();
    expect(view.result.current).toBe(false);
  });

  it('does not show the notice while offline', () => {
    const view = renderNotice();
    goOffline();
    expect(view.result.current).toBe(false);
  });

  it('shows the notice after an offline → online transition', () => {
    const view = renderNotice();
    goOffline();
    goOnline();
    expect(view.result.current).toBe(true);
  });

  it('auto-dismisses the notice after the default 5s timeout', () => {
    const view = renderNotice();
    goOffline();
    goOnline();
    expect(view.result.current).toBe(true);
    act(() => {
      vi.advanceTimersByTime(4999);
    });
    expect(view.result.current).toBe(true);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(view.result.current).toBe(false);
  });

  it('respects a custom duration', () => {
    const view = renderNotice(1000);
    goOffline();
    goOnline();
    expect(view.result.current).toBe(true);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(view.result.current).toBe(false);
  });

  it('hides immediately if the browser drops offline again mid-notice', () => {
    const view = renderNotice();
    goOffline();
    goOnline();
    expect(view.result.current).toBe(true);
    goOffline();
    expect(view.result.current).toBe(false);
    // Advancing past the (cleared) timer must not resurrect the notice.
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(view.result.current).toBe(false);
  });

  it('shows again on each subsequent offline → online round trip', () => {
    const view = renderNotice();
    goOffline();
    goOnline();
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(view.result.current).toBe(false);
    goOffline();
    goOnline();
    expect(view.result.current).toBe(true);
  });
});
