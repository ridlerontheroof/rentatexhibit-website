// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement, type ReactNode } from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { FloorPlans } from './FloorPlans';
import { planGroups } from '../data/floorPlans';

// Guards the Back-button contract on /available-units' floor-plan lightbox:
//
// - Opening a plan pushes a history entry so Back closes the pop-up.
// - Closing with the X must CONSUME that pushed entry (history.back()), so a
//   visitor who opens a plan, closes it with X, and presses Back leaves the
//   page in ONE press — not two.
// - A popstate-driven close (the Back button itself) must NOT call
//   history.back() again, or Back would double-navigate.
// - Deep-link opens (?plan= on load, nothing pushed) must clean the URL in
//   place with replaceState, never history.back() out of the page.
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

function openFirstPlan() {
  // Plan-card buttons carry a "Unit NN" badge in their visible text; other
  // buttons on the page (filters, sort, sheet triggers) don't.
  const buttons = Array.from(document.querySelectorAll('button'));
  const target = buttons.find((b) => /Unit \d{2}/.test(b.textContent ?? ''));
  if (!target) throw new Error('No plan card button found');
  act(() => {
    fireEvent.click(target);
  });
}

function closeWithX() {
  // The lightbox is a Radix Dialog; its close control carries sr-only "Close".
  const buttons = Array.from(document.querySelectorAll('button'));
  const closeBtn = buttons.find((b) => /close/i.test(b.textContent ?? ''));
  if (!closeBtn) throw new Error('Dialog close button not found');
  act(() => {
    fireEvent.click(closeBtn);
  });
}

function dialogOpen(): boolean {
  return document.querySelector('[role="dialog"]') !== null;
}

let backSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({}), { status: 503 })),
  );
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  backSpy = vi.spyOn(window.history, 'back').mockImplementation(() => {
    // Simulate the browser: back() pops the pushed entry and fires popstate.
    window.history.replaceState(null, '', '/available-units');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
});

afterEach(() => {
  backSpy.mockRestore();
  cleanup();
  document.body.innerHTML = '';
  setUrl('');
  vi.unstubAllGlobals();
});

describe('FloorPlans lightbox close vs. history', () => {
  it('closing with the X consumes the pushed history entry via history.back()', () => {
    setUrl('');
    render(createElement(FloorPlans), { wrapper: Providers });

    openFirstPlan();
    expect(dialogOpen()).toBe(true);
    expect(window.location.search).toContain('plan=');

    closeWithX();
    expect(dialogOpen()).toBe(false);
    expect(backSpy).toHaveBeenCalledTimes(1);
    expect(window.location.search).not.toContain('plan=');
  });

  it('a Back-button (popstate) close does not call history.back() again', () => {
    setUrl('');
    render(createElement(FloorPlans), { wrapper: Providers });

    openFirstPlan();
    expect(dialogOpen()).toBe(true);

    // Simulate the visitor pressing Back while the pop-up is open.
    setUrl('');
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(dialogOpen()).toBe(false);
    expect(backSpy).not.toHaveBeenCalled();
  });

  it('deep-link opens (nothing pushed) close with replaceState, not history.back()', () => {
    setUrl('?plan=' + encodeURIComponent(firstPlanId()));
    render(createElement(FloorPlans), { wrapper: Providers });

    expect(dialogOpen()).toBe(true);

    closeWithX();
    expect(dialogOpen()).toBe(false);
    expect(backSpy).not.toHaveBeenCalled();
    expect(window.location.search).not.toContain('plan=');
  });
});

function firstPlanId(): string {
  return planGroups[0].id;
}
