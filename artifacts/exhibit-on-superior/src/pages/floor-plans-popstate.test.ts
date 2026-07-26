// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement, type ReactNode } from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { FloorPlans } from './FloorPlans';

// Guards the Back/Forward wiring on /available-units: the page keeps its
// filter state in the URL, and a `popstate` listener re-reads it when the
// browser navigates through history without remounting the page. The URL
// round-trip itself is unit-tested in floor-plans-url-filters.test.ts; this
// test proves the *mounted page* actually reacts to popstate. A refactor of
// FloorPlans.tsx that drops the listener would silently reintroduce the
// "Back changes the URL but not the view" bug — that's what this catches.
//
// jsdom + createElement (no JSX in .test.ts) + manual cleanup follow
// `.agents/memory/vitest-dom-hook-tests.md`.

function Providers({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return createElement(
    HelmetProvider,
    null,
    createElement(QueryClientProvider, { client: queryClient }, children)
  );
}

function setUrl(search: string) {
  window.history.replaceState(null, '', `/available-units${search}`);
}

/** Simulate the browser's Back/Forward: change the URL, then fire popstate. */
function navigateHistory(search: string) {
  setUrl(search);
  act(() => {
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
}

function searchInput(): HTMLInputElement {
  const input = document.querySelector('input[type="search"]');
  if (!input) throw new Error('Search input not found');
  return input as HTMLInputElement;
}

function planCount(): number {
  const match = /(\d+) plans?/.exec(document.body.textContent ?? '');
  if (!match) throw new Error('Plan count not found');
  return Number(match[1]);
}

beforeEach(() => {
  // Keep the availability fetch off the network; the page falls back to the
  // baked snapshot via placeholderData.
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({}), { status: 503 })),
  );
  // jsdom lacks ResizeObserver, which Radix components (the range slider and
  // sort Select) need at mount time.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
  setUrl('');
  vi.unstubAllGlobals();
});

describe('FloorPlans Back/Forward filter restoration', () => {
  it('re-reads filters from the URL when popstate fires', () => {
    setUrl('');
    render(createElement(FloorPlans), { wrapper: Providers });

    const allPlans = planCount();
    expect(allPlans).toBeGreaterThan(0);
    expect(searchInput().value).toBe('');
    expect(document.body.textContent).not.toContain('ADA designation key');

    // Browser Back to a filtered view: the visible state must follow.
    navigateHistory('?beds=2br&ada=1&q=unit+06');

    expect(searchInput().value).toBe('unit 06');
    expect(document.body.textContent).toContain('ADA designation key');
    expect(planCount()).toBeLessThan(allPlans);
  });

  it('restores the unfiltered view when navigating back to a bare URL', () => {
    setUrl('?beds=3br&sqft=1200-1600');
    render(createElement(FloorPlans), { wrapper: Providers });

    const filteredPlans = planCount();

    // Browser Back to the bare URL: every plan returns and filters clear.
    navigateHistory('');

    expect(searchInput().value).toBe('');
    expect(planCount()).toBeGreaterThan(filteredPlans);
  });

  it('URL changes without popstate do not change the view (listener is the only bridge)', () => {
    setUrl('');
    render(createElement(FloorPlans), { wrapper: Providers });
    const allPlans = planCount();

    // replaceState alone (no popstate) must not re-filter — proving the
    // popstate listener is what does the work, not some polling fallback.
    setUrl('?q=unit+06');
    expect(searchInput().value).toBe('');
    expect(planCount()).toBe(allPlans);
  });
});
