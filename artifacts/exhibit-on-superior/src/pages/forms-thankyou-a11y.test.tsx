// @vitest-environment jsdom
// Screen-reader wiring for the tour-request and contact forms' POST-SUBMIT
// screens (Task: "make sure the thank-you screens are read aloud too").
//
// Both pages swap the form for a thank-you banner on success, or show an
// error banner on API failure. These tests submit each form to success and
// to failure and assert the resulting screen (a) lives in a live region
// (role="status"/alert) so it is announced, and (b) receives focus so a
// keyboard or screen-reader user isn't stranded on the submit button —
// the same pattern as the ScheduleShowing failure banners.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScheduleTour } from './ScheduleTour';
import { ContactUs } from './ContactUs';

vi.mock('wouter', async (importOriginal) => ({
  ...(await importOriginal<typeof import('wouter')>()),
  useSearch: () => '',
}));

vi.mock('../hooks/use-availability', () => ({
  useAvailability: () => ({ data: { units: [] } }),
}));

const fetchMock = vi.fn();

function leadResponse(status: number) {
  return Promise.resolve(
    new Response(JSON.stringify(status < 400 ? { ok: true } : { error: 'lead_failed' }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

function routeLeads(status: number) {
  fetchMock.mockImplementation((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('api/leads')) return leadResponse(status);
    throw new Error(`Unexpected fetch in test: ${url}`);
  });
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

async function fillTourForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/first name/i), 'Jane');
  await user.type(screen.getByLabelText(/last name/i), 'Doe');
  await user.type(screen.getByLabelText(/^email/i), 'jane@example.com');
  await user.type(screen.getByLabelText(/^phone/i), '3125550100');
  await user.type(screen.getByLabelText(/move-in date/i), '2026-09-01');
  await user.selectOptions(screen.getByLabelText(/floor plan preference/i), '1 Bedroom');
  await user.click(screen.getByRole('button', { name: /request tour/i }));
}

async function fillContactForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/first name/i), 'Jane');
  await user.type(screen.getByLabelText(/last name/i), 'Doe');
  await user.type(screen.getByLabelText(/^email/i), 'jane@example.com');
  await user.type(screen.getByLabelText(/^phone/i), '3125550100');
  await user.type(screen.getByLabelText(/message/i), 'I would like more information please.');
  await user.click(screen.getByRole('button', { name: /send message/i }));
}

describe('ScheduleTour — thank-you and error screens are announced and focused', () => {
  it('announces and focuses the thank-you screen on success', async () => {
    routeLeads(201);
    const user = userEvent.setup();
    renderWithClient(<ScheduleTour />);
    await fillTourForm(user);

    const text = await screen.findByText(/tour request received/i);
    const banner = text.closest('[role="status"]') as HTMLElement;
    expect(banner).toBeTruthy();
    expect(banner.getAttribute('aria-live')).toBe('polite');
    await waitFor(() => expect(document.activeElement).toBe(banner));
  });

  it('announces and focuses the error banner when the API fails', async () => {
    routeLeads(502);
    const user = userEvent.setup();
    renderWithClient(<ScheduleTour />);
    await fillTourForm(user);

    const banner = await screen.findByText(/couldn't be sent/i);
    expect(banner.getAttribute('role')).toBe('alert');
    await waitFor(() => expect(document.activeElement).toBe(banner));
  });
});

describe('ContactUs — thank-you and error screens are announced and focused', () => {
  it('announces and focuses the thank-you banner on success', async () => {
    routeLeads(201);
    const user = userEvent.setup();
    renderWithClient(<ContactUs />);
    await fillContactForm(user);

    const text = await screen.findByText(/we've received your message/i);
    const banner = text.closest('[role="status"]') as HTMLElement;
    expect(banner).toBeTruthy();
    expect(banner.getAttribute('aria-live')).toBe('polite');
    await waitFor(() => expect(document.activeElement).toBe(banner));
  });

  it('announces and focuses the error banner when the API fails', async () => {
    routeLeads(502);
    const user = userEvent.setup();
    renderWithClient(<ContactUs />);
    await fillContactForm(user);

    const banner = await screen.findByText(/couldn't be sent/i);
    expect(banner.getAttribute('role')).toBe('alert');
    await waitFor(() => expect(document.activeElement).toBe(banner));
  });

  // WCAG 2.2.1 (Timing Adjustable): the banner must not vanish on a timer.
  it('keeps the thank-you banner up past the old 5s auto-dismiss window', async () => {
    // shouldAdvanceTime keeps real time ticking so testing-library's waitFor
    // (used by findByText) doesn't deadlock on the faked clock.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      routeLeads(201);
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderWithClient(<ContactUs />);
      await fillContactForm(user);

      await screen.findByText(/we've received your message/i);
      await vi.advanceTimersByTimeAsync(10000);
      expect(screen.getByText(/we've received your message/i)).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it('dismisses the thank-you banner via its Dismiss button', async () => {
    routeLeads(201);
    const user = userEvent.setup();
    renderWithClient(<ContactUs />);
    await fillContactForm(user);

    await screen.findByText(/we've received your message/i);
    await user.click(screen.getByRole('button', { name: /dismiss message/i }));
    expect(screen.queryByText(/we've received your message/i)).toBeNull();
  });

  it('clears the thank-you banner when the visitor starts a new message', async () => {
    routeLeads(201);
    const user = userEvent.setup();
    renderWithClient(<ContactUs />);
    await fillContactForm(user);

    await screen.findByText(/we've received your message/i);
    await user.type(screen.getByLabelText(/first name/i), 'J');
    await waitFor(() =>
      expect(screen.queryByText(/we've received your message/i)).toBeNull(),
    );
  });
});
