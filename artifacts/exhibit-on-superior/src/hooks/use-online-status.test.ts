// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useOnlineStatus } from './use-online-status';

// Track the active render so we can always unmount it and detach the hook's
// window listeners between tests (vitest globals aren't enabled here, so
// testing-library's auto-cleanup does not run on its own).
let active: ReturnType<typeof renderHook<boolean, void>> | null = null;

function renderStatus() {
  active = renderHook(() => useOnlineStatus());
  return active;
}

/** Force jsdom's navigator.onLine to a value, then fire the matching event. */
function goOffline() {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    get: () => false,
  });
  act(() => {
    window.dispatchEvent(new Event('offline'));
  });
}

function goOnline() {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    get: () => true,
  });
  act(() => {
    window.dispatchEvent(new Event('online'));
  });
}

afterEach(() => {
  active?.unmount();
  active = null;
  // Restore the default (online) so state doesn't leak across tests.
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    get: () => true,
  });
});

describe('useOnlineStatus', () => {
  it('reports online initially (jsdom default)', () => {
    const view = renderStatus();
    expect(view.result.current).toBe(true);
  });

  it('flips to false when the browser goes offline', () => {
    const view = renderStatus();
    goOffline();
    expect(view.result.current).toBe(false);
  });

  it('flips back to true when the connection is restored', () => {
    const view = renderStatus();
    goOffline();
    expect(view.result.current).toBe(false);
    goOnline();
    expect(view.result.current).toBe(true);
  });

  it('reflects an already-offline browser at mount time', () => {
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      get: () => false,
    });
    const view = renderStatus();
    expect(view.result.current).toBe(false);
  });

  it('stops updating after unmount (listeners removed)', () => {
    const view = renderStatus();
    goOffline();
    expect(view.result.current).toBe(false);
    view.unmount();
    active = null;
    // Dispatching further events must not throw or resurrect updates.
    goOnline();
    expect(view.result.current).toBe(false);
  });
});
