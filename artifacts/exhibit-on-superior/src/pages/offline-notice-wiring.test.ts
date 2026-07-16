// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { createElement, type ComponentType, type ReactNode } from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { ContactUs } from './ContactUs';
import { ScheduleTour } from './ScheduleTour';

// These tests guard the *wiring* between the two lead forms and
// `useOnlineStatus`. The hook itself is unit-tested separately
// (src/hooks/use-online-status.test.ts); here we prove each page actually
// shows the offline warning banner and disables its submit button while
// offline, and clears both once the connection returns. A refactor that
// dropped the hook or the `disabled` prop would pass the hook tests but
// silently lose this user-facing safeguard — that's what this catches.
//
// jsdom + manual cleanup follow the pattern in
// `.agents/memory/vitest-dom-hook-tests.md` (vitest globals aren't enabled, so
// testing-library's auto-cleanup does not run on its own).

function Providers({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return createElement(
    HelmetProvider,
    null,
    createElement(QueryClientProvider, { client: queryClient }, children)
  );
}

function renderPage(component: ComponentType) {
  return render(createElement(component), { wrapper: Providers });
}

/** Force jsdom's navigator.onLine to a value, then fire the matching event. */
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

function submitButton(): HTMLButtonElement {
  const btn = document.querySelector('button[type="submit"]');
  if (!btn) throw new Error('Submit button not found');
  return btn as HTMLButtonElement;
}

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
  // Restore the default (online) so state doesn't leak across tests.
  setOnLine(true);
});

describe('offline notice wiring', () => {
  it('ContactUs: mounted while offline, shows the notice and disables Send', () => {
    setOnLine(false);
    renderPage(ContactUs);

    expect(document.body.textContent).toContain(
      'You appear to be offline. Please check your internet connection before sending your message.'
    );
    expect(submitButton().disabled).toBe(true);
  });

  it('ScheduleTour: mounted while offline, shows the notice and disables Request Tour', () => {
    setOnLine(false);
    renderPage(ScheduleTour);

    expect(document.body.textContent).toContain(
      'You appear to be offline. Please check your internet connection before requesting a tour.'
    );
    expect(submitButton().disabled).toBe(true);
  });

  it('ContactUs: going offline after mount shows the notice and disables Send; reconnecting clears both', () => {
    renderPage(ContactUs);

    // Online at mount: no warning, button enabled.
    expect(document.body.textContent).not.toContain('You appear to be offline');
    expect(submitButton().disabled).toBe(false);

    goOffline();
    expect(document.body.textContent).toContain(
      'You appear to be offline. Please check your internet connection before sending your message.'
    );
    expect(submitButton().disabled).toBe(true);

    goOnline();
    expect(document.body.textContent).not.toContain('You appear to be offline');
    expect(submitButton().disabled).toBe(false);
  });

  it('ScheduleTour: going offline after mount shows the notice and disables Request Tour; reconnecting clears both', () => {
    renderPage(ScheduleTour);

    expect(document.body.textContent).not.toContain('You appear to be offline');
    expect(submitButton().disabled).toBe(false);

    goOffline();
    expect(document.body.textContent).toContain(
      'You appear to be offline. Please check your internet connection before requesting a tour.'
    );
    expect(submitButton().disabled).toBe(true);

    goOnline();
    expect(document.body.textContent).not.toContain('You appear to be offline');
    expect(submitButton().disabled).toBe(false);
  });
});
