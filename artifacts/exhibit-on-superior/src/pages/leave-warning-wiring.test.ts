// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement, type ComponentType, type ReactNode } from 'react';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { ContactUs } from './ContactUs';
import { ScheduleTour } from './ScheduleTour';

// These tests guard the *wiring* between the two lead forms and
// `useUnsavedChangesWarning`. The hook itself is unit-tested separately; here we
// prove each form passes the right flag: OFF on a pristine form, ON once the
// user edits it, and OFF again after a successful submit/reset. A refactor that
// left the warning on after submit (or never turned it on) would break real
// leads while the hook's own tests still passed — that's what this catches.
//
// jsdom + manual cleanup follow the pattern in
// `.agents/memory/vitest-dom-hook-tests.md` (vitest globals aren't enabled, so
// testing-library's auto-cleanup does not run on its own).

// A fresh QueryClient per render, mirroring the providers wired up in main.tsx.
// `retry: false` keeps a failed mutation from lingering and skewing the flag.
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

/**
 * The unsaved-changes guard registers a `beforeunload` handler that calls
 * `preventDefault()` only while it is enabled. So dispatching the event and
 * reading `defaultPrevented` is a precise probe for "is the guard currently on".
 */
function guardIsOn(): boolean {
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}

function setField(id: string, value: string) {
  const el = document.getElementById(id) as
    | HTMLInputElement
    | HTMLSelectElement
    | HTMLTextAreaElement
    | null;
  if (!el) throw new Error(`Field #${id} not found`);
  fireEvent.change(el, { target: { value } });
}

function submitForm() {
  const form = document.querySelector('form');
  if (!form) throw new Error('Form not found');
  fireEvent.submit(form);
}

// A resolved lead POST, so onSuccess flips `submitted` and resets the form.
function mockLeadSubmitOk() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, json: async () => ({ id: 1 }) }))
  );
}

// A failed lead POST (non-ok response), so the mutation errors out: the error
// banner shows, the form keeps its values, and the guard must stay ON.
function mockLeadSubmitFail() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal Server Error' }),
      text: async () => 'Internal Server Error',
    }))
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('leave-warning wiring', () => {
  it('ContactUs: guard is OFF pristine, ON when dirty, OFF after a successful submit', async () => {
    mockLeadSubmitOk();
    renderPage(ContactUs);

    // Pristine form: nothing to lose yet.
    expect(guardIsOn()).toBe(false);

    // Editing a single field makes the form dirty and arms the guard.
    setField('firstName', 'Ada');
    expect(guardIsOn()).toBe(true);

    // Fill the rest with values that pass the schema and submit.
    setField('lastName', 'Lovelace');
    setField('email', 'ada@example.com');
    setField('phone', '3124500635');
    setField('message', 'I would like more information about availability.');
    submitForm();

    // Success banner confirms onSuccess ran (setSubmitted + reset).
    await waitFor(() =>
      expect(document.body.textContent).toContain("We've received your message")
    );

    // Guard must be back OFF so the confirmation/leasing flow isn't blocked.
    expect(guardIsOn()).toBe(false);
  });

  it('ScheduleTour: guard is OFF pristine, ON when dirty, OFF after a successful submit', async () => {
    mockLeadSubmitOk();
    renderPage(ScheduleTour);

    expect(guardIsOn()).toBe(false);

    setField('firstName', 'Grace');
    expect(guardIsOn()).toBe(true);

    setField('lastName', 'Hopper');
    setField('email', 'grace@example.com');
    setField('phone', '3124500635');
    setField('moveInDate', '2026-09-01');
    setField('bedrooms', '1 Bedroom');
    submitForm();

    // Success screen replaces the form once onSuccess runs.
    await waitFor(() =>
      expect(document.body.textContent).toContain('Tour Request Received')
    );

    expect(guardIsOn()).toBe(false);
  });

  it('ContactUs: guard stays ON when the submit fails, so the visitor cannot silently lose their message', async () => {
    mockLeadSubmitFail();
    renderPage(ContactUs);

    setField('firstName', 'Ada');
    setField('lastName', 'Lovelace');
    setField('email', 'ada@example.com');
    setField('phone', '3124500635');
    setField('message', 'I would like more information about availability.');
    expect(guardIsOn()).toBe(true);

    submitForm();

    // The error banner confirms the mutation settled in the error state
    // (isPending is false again), which is exactly when a regression could
    // wrongly disarm the guard.
    await waitFor(() =>
      expect(document.body.textContent).toContain(
        "your message couldn't be sent"
      )
    );

    // Form still holds the visitor's info…
    expect(
      (document.getElementById('email') as HTMLInputElement).value
    ).toBe('ada@example.com');
    // …so the leave warning must still be armed.
    expect(guardIsOn()).toBe(true);
  });

  it('ScheduleTour: guard stays ON when the submit fails, so the visitor cannot silently lose their request', async () => {
    mockLeadSubmitFail();
    renderPage(ScheduleTour);

    setField('firstName', 'Grace');
    setField('lastName', 'Hopper');
    setField('email', 'grace@example.com');
    setField('phone', '3124500635');
    setField('moveInDate', '2026-09-01');
    setField('bedrooms', '1 Bedroom');
    expect(guardIsOn()).toBe(true);

    submitForm();

    await waitFor(() =>
      expect(document.body.textContent).toContain(
        "your tour request couldn't be sent"
      )
    );

    expect(
      (document.getElementById('email') as HTMLInputElement).value
    ).toBe('grace@example.com');
    expect(guardIsOn()).toBe(true);
  });
});
