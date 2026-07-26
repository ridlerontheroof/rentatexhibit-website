// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement, type ReactNode } from 'react';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { FloorPlans } from './FloorPlans';

// Guards the plan-lightbox history contract on /available-units:
//
//  * Opening a plan PUSHES a history entry (`?plan=…`), so the phone's Back
//    button closes the pop-up instead of leaving the page.
//  * Plan-to-plan arrow navigation REPLACES the entry, so paging through ten
//    plans doesn't require ten Back presses.
//  * Closing via the X cleans `?plan` out of the URL.
//  * Browser Back to a URL without `?plan` (a popstate) closes the pop-up.
//
// A regression — e.g. reverting the open path to replaceState — would silently
// bring back the "Back leaves the page" bug on phones. That's what this locks.
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
    createElement(QueryClientProvider, { client: queryClient }, children),
  );
}

function setUrl(search: string) {
  window.history.replaceState(null, '', `/available-units${search}`);
}

function planParam(): string | null {
  return new URLSearchParams(window.location.search).get('plan');
}

/** The lightbox dialog, or null when closed. */
function dialog(): HTMLElement | null {
  return document.querySelector('[role="dialog"]');
}

function clickButton(el: Element) {
  act(() => {
    fireEvent.click(el);
  });
}

/** First plan card in the results grid (a <button> ending in "View floor plan"). */
function firstPlanCard(): HTMLButtonElement {
  const card = Array.from(document.querySelectorAll('button')).find((b) =>
    b.textContent?.includes('View floor plan'),
  );
  if (!card) throw new Error('Plan card not found');
  return card;
}

function lightboxButton(label: string): HTMLElement {
  const btn = document.querySelector(`button[aria-label="${label}"]`);
  if (!btn) throw new Error(`Lightbox button "${label}" not found`);
  return btn as HTMLElement;
}

function closeButton(): HTMLElement {
  // Radix's dialog close button carries an sr-only "Close" label.
  const box = dialog();
  const btn = box
    ? Array.from(box.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Close')
    : null;
  if (!btn) throw new Error('Dialog close button not found');
  return btn;
}

beforeEach(() => {
  // Keep the availability fetch off the network; the page falls back to the
  // baked snapshot via placeholderData.
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({}), { status: 503 })),
  );
  // jsdom lacks ResizeObserver, which Radix components need at mount time.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  setUrl('');
});

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
  setUrl('');
  vi.unstubAllGlobals();
});

describe('FloorPlans plan-lightbox history behaviour', () => {
  it('opening a plan pushes a history entry with ?plan in the URL', () => {
    render(createElement(FloorPlans), { wrapper: Providers });
    const before = window.history.length;

    clickButton(firstPlanCard());

    expect(dialog()).not.toBeNull();
    expect(planParam()).not.toBeNull();
    // pushState (not replaceState) — this is what makes Back close the pop-up
    // instead of leaving the page on phones.
    expect(window.history.length).toBe(before + 1);
  });

  it('arrow-navigating between plans replaces the entry instead of pushing', () => {
    render(createElement(FloorPlans), { wrapper: Providers });
    clickButton(firstPlanCard());
    const afterOpen = window.history.length;
    const firstPlan = planParam();
    expect(firstPlan).not.toBeNull();

    clickButton(lightboxButton('Next floor plan'));

    // URL follows the new plan, but history does NOT grow — ten arrow presses
    // must not require ten Back presses.
    expect(planParam()).not.toBeNull();
    expect(planParam()).not.toBe(firstPlan);
    expect(window.history.length).toBe(afterOpen);

    clickButton(lightboxButton('Previous floor plan'));
    expect(planParam()).toBe(firstPlan);
    expect(window.history.length).toBe(afterOpen);
  });

  it('closing via the X removes ?plan from the URL', async () => {
    render(createElement(FloorPlans), { wrapper: Providers });
    clickButton(firstPlanCard());
    expect(planParam()).not.toBeNull();

    clickButton(closeButton());
    expect(dialog()).toBeNull();
    // The X consumes the pushed entry via history.back(); jsdom performs
    // history traversal (and the resulting URL change + popstate)
    // asynchronously, so wait for the URL to settle.
    await waitFor(() => expect(planParam()).toBeNull());
  });

  it('a popstate to a URL without ?plan closes the pop-up (the Back press)', () => {
    render(createElement(FloorPlans), { wrapper: Providers });
    clickButton(firstPlanCard());
    expect(dialog()).not.toBeNull();

    // Simulate the browser's Back: URL loses ?plan, popstate fires.
    setUrl('');
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(dialog()).toBeNull();
    expect(planParam()).toBeNull();
  });

  it('a popstate to a URL with ?plan reopens that plan (the Forward press)', () => {
    render(createElement(FloorPlans), { wrapper: Providers });
    // Open once to learn a real plan id, then Back-close.
    clickButton(firstPlanCard());
    const planId = planParam();
    expect(planId).not.toBeNull();
    setUrl('');
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(dialog()).toBeNull();

    setUrl(`?plan=${planId}`);
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(dialog()).not.toBeNull();
  });
});
