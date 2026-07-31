// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement, type ComponentType, type ReactNode } from 'react';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { ContactUs } from './ContactUs';
import { ScheduleTour } from './ScheduleTour';

// These tests pin the double-submit safeguard on both lead forms: while the
// lead POST is in flight (`createLead.isPending`), the submit button must be
// disabled and show its pending label, so a fast double-click on Send cannot
// create duplicate leads in the leasing inbox. A refactor that dropped
// `createLead.isPending` from the `disabled` prop would pass every other test
// while silently reintroducing duplicate submissions — that's what this
// catches. The fetch mock returns a promise we control, so we can assert the
// mid-flight state precisely, then resolve it and confirm the form settles.
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

function submitButton(): HTMLButtonElement {
  const btn = document.querySelector('button[type="submit"]');
  if (!btn) throw new Error('Submit button not found');
  return btn as HTMLButtonElement;
}

/**
 * Stub fetch with a promise that stays pending until we call the returned
 * `resolve()`. This freezes the mutation in its in-flight state so we can
 * assert what the visitor sees between click and server response.
 */
function mockLeadSubmitPending() {
  let resolveFetch!: () => void;
  const gate = new Promise<void>((res) => {
    resolveFetch = res;
  });
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    // ScheduleTour also fetches live availability for its apartment select;
    // answer it immediately so only the lead POST rides the gate.
    if (String(input).includes('api/availability')) {
      return { ok: true, json: async () => ({ units: [] }) };
    }
    await gate;
    return { ok: true, json: async () => ({ id: 1 }) };
  });
  vi.stubGlobal('fetch', fetchMock);
  const leadCalls = () =>
    fetchMock.mock.calls.filter(([input]) => String(input).includes('api/leads')).length;
  return { resolveFetch, fetchMock, leadCalls };
}

/**
 * Same gated-promise pattern for ScheduleTour's scheduler contact step
 * (POST /api/showings/contact): availability answers immediately, the
 * contact POST rides the gate, and the follow-up slots fetch answers with
 * one open day so the picker renders.
 */
function mockContactSubmitPending() {
  let resolveFetch!: () => void;
  const gate = new Promise<void>((res) => {
    resolveFetch = res;
  });
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('api/availability')) {
      return { ok: true, json: async () => ({ units: [] }) };
    }
    if (url.includes('api/showings/slots')) {
      return {
        ok: true,
        json: async () => ({
          unit: 'TOUR',
          durationMinutes: 15,
          days: [{ date: '2026/08/03', slots: [{ time: '2026/08/03 10:00', agentId: 1 }] }],
          hostedUrl: null,
        }),
      };
    }
    await gate;
    return { ok: true, json: async () => ({ guestCardId: '1', jwt: 'tok', hostedUrl: null }) };
  });
  vi.stubGlobal('fetch', fetchMock);
  const contactCalls = () =>
    fetchMock.mock.calls.filter(([input]) => String(input).includes('api/showings/contact'))
      .length;
  return { resolveFetch, fetchMock, contactCalls };
}

function fillContactForm() {
  setField('firstName', 'Ada');
  setField('lastName', 'Lovelace');
  setField('email', 'ada@example.com');
  setField('phone', '3124500635');
  setField('message', 'I would like more information about availability.');
}

function fillTourForm() {
  setField('firstName', 'Grace');
  setField('lastName', 'Hopper');
  setField('email', 'grace@example.com');
  setField('phone', '3124500635');
  setField('moveInDate', '2026-09-01');
  setField('bedrooms', '1 Bedroom');
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('pending submit lock (double-click duplicate-lead guard)', () => {
  it('ContactUs: Send is disabled and reads "Sending..." while the request is in flight, then re-enables', async () => {
    const { resolveFetch, leadCalls } = mockLeadSubmitPending();
    renderPage(ContactUs);

    // Before submit: enabled with the idle label.
    expect(submitButton().disabled).toBe(false);
    expect(submitButton().textContent).toBe('Send Message');

    fillContactForm();
    submitForm();

    // In flight: button locked and labelled, so a second click can't fire.
    await waitFor(() => expect(submitButton().disabled).toBe(true));
    expect(submitButton().textContent).toBe('Sending...');
    expect(leadCalls()).toBe(1);

    // A frantic double-click while pending must not trigger a second POST —
    // the disabled attribute is the guard (clicks on a disabled button are
    // inert, and Enter-in-field routes through this same disabled button).
    fireEvent.click(submitButton());
    expect(leadCalls()).toBe(1);

    // A programmatic submit (form.requestSubmit() from an extension or
    // autofill tool) bypasses the disabled button entirely — the onSubmit
    // handler's own isPending early-return must block the second POST.
    submitForm();
    await waitFor(() => expect(submitButton().disabled).toBe(true));
    expect(leadCalls()).toBe(1);

    // Let the request settle: success banner shows, button re-enables.
    resolveFetch();
    await waitFor(() =>
      expect(document.body.textContent).toContain("We've received your message")
    );
    expect(submitButton().disabled).toBe(false);
    expect(submitButton().textContent).toBe('Send Message');
    expect(leadCalls()).toBe(1);
  });

  it('ScheduleTour: Request Tour is disabled and reads "Submitting..." while in flight, then the scheduler replaces the form', async () => {
    // ScheduleTour now posts the scheduler's contact step (guest card) on
    // submit — the double-submit guard must hold on THAT request, or a fast
    // double-click creates duplicate guest cards in AppFolio.
    const { resolveFetch, contactCalls } = mockContactSubmitPending();
    renderPage(ScheduleTour);

    expect(submitButton().disabled).toBe(false);
    expect(submitButton().textContent).toBe('Request Tour');

    fillTourForm();
    submitForm();

    await waitFor(() => expect(submitButton().disabled).toBe(true));
    expect(submitButton().textContent).toBe('Submitting...');
    expect(contactCalls()).toBe(1);

    fireEvent.click(submitButton());
    expect(contactCalls()).toBe(1);

    // Programmatic submit bypasses the disabled button; the handler's
    // isPending early-return must still block a second POST.
    submitForm();
    await waitFor(() => expect(submitButton().disabled).toBe(true));
    expect(contactCalls()).toBe(1);

    resolveFetch();
    await waitFor(() =>
      expect(document.body.textContent).toContain('Select a Time for Your Tour')
    );
    expect(contactCalls()).toBe(1);
  });

  it('ContactUs: button re-enables after a failed request so the visitor can retry', async () => {
    let rejectFetch!: () => void;
    const gate = new Promise<never>((_res, rej) => {
      rejectFetch = () => rej(new TypeError('Failed to fetch'));
    });
    const fetchMock = vi.fn(async () => gate);
    vi.stubGlobal('fetch', fetchMock);
    renderPage(ContactUs);

    fillContactForm();
    submitForm();

    await waitFor(() => expect(submitButton().disabled).toBe(true));
    expect(submitButton().textContent).toBe('Sending...');

    rejectFetch();
    await waitFor(() =>
      expect(document.body.textContent).toContain("your message couldn't be sent")
    );
    // After the error settles, the visitor must be able to try again.
    expect(submitButton().disabled).toBe(false);
    expect(submitButton().textContent).toBe('Send Message');
  });
});
