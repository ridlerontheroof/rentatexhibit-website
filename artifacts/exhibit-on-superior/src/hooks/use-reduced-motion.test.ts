// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useReducedMotion } from './use-reduced-motion';

/**
 * Guards the JS-side companion of the CSS reduced-motion block (see
 * src/reduced-motion-guard.test.ts). JS-driven motion (rAF animations,
 * gesture-driven transforms, etc.) can't be stopped by CSS alone, so
 * components consult this hook. These tests fail if the hook stops
 * tracking `prefers-reduced-motion: reduce`.
 */

type ChangeListener = (e: MediaQueryListEvent) => void;

/** Install a controllable matchMedia mock; returns a setter that fires 'change'. */
function mockMatchMedia(initialMatches: boolean) {
  let matches = initialMatches;
  const listeners = new Set<ChangeListener>();
  const mql = {
    get matches() {
      return matches;
    },
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: (type: string, cb: ChangeListener) => {
      if (type === 'change') listeners.add(cb);
    },
    removeEventListener: (type: string, cb: ChangeListener) => {
      if (type === 'change') listeners.delete(cb);
    },
  };
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => {
      expect(query).toBe('(prefers-reduced-motion: reduce)');
      return mql as unknown as MediaQueryList;
    }),
  );
  return {
    setMatches(next: boolean) {
      matches = next;
      for (const cb of [...listeners]) {
        cb({ matches: next } as MediaQueryListEvent);
      }
    },
    listenerCount: () => listeners.size,
  };
}

let active: ReturnType<typeof renderHook<boolean, void>> | null = null;

function renderReducedMotion() {
  active = renderHook(() => useReducedMotion());
  return active;
}

afterEach(() => {
  active?.unmount();
  active = null;
  vi.unstubAllGlobals();
});

describe('useReducedMotion', () => {
  it('returns true when prefers-reduced-motion: reduce matches', () => {
    mockMatchMedia(true);
    const { result } = renderReducedMotion();
    expect(result.current).toBe(true);
  });

  it('returns false when the visitor has no reduce-motion preference', () => {
    mockMatchMedia(false);
    const { result } = renderReducedMotion();
    expect(result.current).toBe(false);
  });

  it('updates reactively when the OS preference changes mid-session', () => {
    const media = mockMatchMedia(false);
    const { result } = renderReducedMotion();
    expect(result.current).toBe(false);

    act(() => media.setMatches(true));
    expect(result.current).toBe(true);

    act(() => media.setMatches(false));
    expect(result.current).toBe(false);
  });

  it('detaches its media-query listener on unmount', () => {
    const media = mockMatchMedia(false);
    renderReducedMotion();
    expect(media.listenerCount()).toBe(1);
    active!.unmount();
    active = null;
    expect(media.listenerCount()).toBe(0);
  });
});
