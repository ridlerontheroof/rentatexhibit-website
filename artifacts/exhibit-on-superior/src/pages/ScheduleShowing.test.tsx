// @vitest-environment jsdom
// Step-flow tests for the Exhibit showing scheduler: contact → live slots →
// booked, plus the two mandatory no-dead-end paths (contact failure and
// booking failure fall back to a standard lead + hosted AppFolio link).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScheduleShowing } from './ScheduleShowing';

const HOSTED =
  'https://highlandrealestatepartners.appfolio.com/listings/showings/new?listable_uid=uid-1';

vi.mock('wouter', async (importOriginal) => ({
  ...(await importOriginal<typeof import('wouter')>()),
  useSearch: () => 'unit=2801',
}));

vi.mock('../hooks/use-availability', () => ({
  useAvailability: () => ({
    data: {
      units: [
        {
          unit: '2801',
          listingUrl:
            'https://highlandrealestatepartners.appfolio.com/listings/detail/uid-1',
        },
      ],
    },
  }),
}));

const fetchMock = vi.fn();

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

const SLOTS = {
  unit: '2801',
  hostedUrl: HOSTED,
  durationMinutes: 15,
  days: [{ date: '2026/07/28', slots: [{ time: '2026/07/28 13:15', agentId: 443 }] }],
  futureAvailabilitiesExist: true,
  firstAvailableDate: null,
};

function routeFetch(overrides: Record<string, () => Promise<Response>> = {}) {
  fetchMock.mockImplementation((input: RequestInfo | URL) => {
    const url = String(input);
    for (const [needle, handler] of Object.entries(overrides)) {
      if (url.includes(needle)) return handler();
    }
    if (url.includes('api/showings/contact')) {
      return jsonResponse({ guestCardId: '77', jwt: 'tok', hostedUrl: HOSTED }, 201);
    }
    if (url.includes('api/showings/slots')) return jsonResponse(SLOTS);
    if (url.includes('api/showings/book')) {
      return jsonResponse(
        {
          startAt: '2026-07-28T18:15:00.000Z',
          endAt: '2026-07-28T18:30:00.000Z',
          fullAddress: '165 W Superior St, Apt. 2801',
        },
        201,
      );
    }
    if (url.includes('api/leads')) return jsonResponse({ ok: true }, 201);
    throw new Error(`Unexpected fetch in test: ${url}`);
  });
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ScheduleShowing />
    </QueryClientProvider>,
  );
}

async function fillContactForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/first name/i), 'Jane');
  await user.type(screen.getByLabelText(/last name/i), 'Doe');
  await user.type(screen.getByLabelText(/email/i), 'jane@example.com');
  await user.type(screen.getByLabelText(/phone/i), '3125550100');
  await user.click(screen.getByRole('button', { name: /view available times/i }));
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  routeFetch();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe('ScheduleShowing', () => {
  it('shows the contact step with the texting-consent language', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /tell us about you/i })).toBeTruthy();
    expect(screen.getByText(/replying STOP/i)).toBeTruthy();
    expect(screen.getAllByRole('link', { name: /privacy policy/i }).length).toBeGreaterThan(0);
  });

  it('books a showing end-to-end: contact → slot → confirmation', async () => {
    const user = userEvent.setup();
    renderPage();
    await fillContactForm(user);

    // Step 2 — live slots
    const slotButton = await screen.findByRole('button', { name: '1:15 PM' });
    await user.click(slotButton);
    await user.click(screen.getByRole('button', { name: /confirm appointment/i }));

    await screen.findByText(/you're all set/i);
    expect(screen.getByText(/tuesday, july 28/i)).toBeTruthy();
    // Booking hit our server proxy, never AppFolio directly.
    const urls = fetchMock.mock.calls.map((c) => String(c[0]));
    expect(urls.some((u) => u.includes('api/showings/book'))).toBe(true);
    expect(urls.every((u) => !u.includes('appfolio.com'))).toBe(true);
  });

  it('a browser-autofilled submission passes: empty honeypot, no elapsedMs', async () => {
    // Regression guard for the 2026-07-27 incident: Safari filled the old
    // "Company"-named honeypot from the visitor's contact card and the visitor
    // never typed a keystroke. Simulate pure autofill by setting every visible
    // input programmatically (input events, no keydowns), then submitting.
    renderPage();
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Jane' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'jane@example.com' } });
    fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '3125550100' } });
    fireEvent.click(screen.getByRole('button', { name: /view available times/i }));

    // The submission goes through to step 2 — no bot rejection.
    await screen.findByRole('button', { name: '1:15 PM' });
    const contactCall = fetchMock.mock.calls.find((c) =>
      String(c[0]).includes('api/showings/contact'),
    );
    expect(contactCall).toBeTruthy();
    const body = JSON.parse(String((contactCall![1] as RequestInit).body));
    // Honeypot empty (autofill has nothing to map onto the nonsense name),
    // no legacy company field, and elapsedMs omitted (the visitor never typed).
    expect(body.xh_note).toBe('');
    expect(body).not.toHaveProperty('company');
    expect(body).not.toHaveProperty('elapsedMs');
  });

  it('a typed submission reports elapsedMs measured from first interaction', async () => {
    const user = userEvent.setup();
    renderPage();
    await fillContactForm(user);
    await screen.findByRole('button', { name: '1:15 PM' });
    const contactCall = fetchMock.mock.calls.find((c) =>
      String(c[0]).includes('api/showings/contact'),
    );
    const body = JSON.parse(String((contactCall![1] as RequestInit).body));
    expect(typeof body.elapsedMs).toBe('number');
    expect(body.elapsedMs).toBeGreaterThanOrEqual(0);
    expect(body.xh_note).toBe('');
  });

  it('books when the contact step returns no booking token (jwt null)', async () => {
    // Since 2026-07 AppFolio no longer issues X-JWT; bookings authorize via
    // guest card alone. The page must pass jwt: null through untouched.
    routeFetch({
      'api/showings/contact': () => jsonResponse({ guestCardId: '77', jwt: null, hostedUrl: HOSTED }, 201),
    });
    const user = userEvent.setup();
    renderPage();
    await fillContactForm(user);
    await user.click(await screen.findByRole('button', { name: '1:15 PM' }));
    await user.click(screen.getByRole('button', { name: /confirm appointment/i }));

    await screen.findByText(/you're all set/i);
    const bookCall = fetchMock.mock.calls.find((c) => String(c[0]).includes('api/showings/book'));
    expect(bookCall).toBeTruthy();
    const body = JSON.parse(String((bookCall![1] as RequestInit).body));
    expect(body).toMatchObject({ guestCardId: '77', jwt: null });
  });

  it('falls back to a standard lead + hosted link when contact fails', async () => {
    routeFetch({
      'api/showings/contact': () => jsonResponse({ error: 'contact_failed', hostedUrl: HOSTED }, 502),
    });
    const user = userEvent.setup();
    renderPage();
    await fillContactForm(user);

    await screen.findByText(/we've got your request/i);
    const hostedLink = screen.getByRole('link', { name: /open the scheduling page/i });
    expect(hostedLink.getAttribute('href')).toBe(HOSTED);
    await waitFor(() => {
      const leadCall = fetchMock.mock.calls.find((c) => String(c[0]).includes('api/leads'));
      expect(leadCall).toBeTruthy();
      const body = JSON.parse(String((leadCall![1] as RequestInit).body));
      expect(body).toMatchObject({ type: 'tour', email: 'jane@example.com', unit: '2801' });
    });
  });

  it('a bot/validation rejection is terminal — no lead fallback is submitted', async () => {
    routeFetch({
      'api/showings/contact': () => jsonResponse({ error: 'invalid_submission' }, 400),
    });
    const user = userEvent.setup();
    renderPage();
    await fillContactForm(user);

    // Terminal rejection message, not the lead-capture fallback screen.
    await screen.findByText(/couldn't be verified/i);
    expect(screen.queryByText(/we've got your request/i)).toBeNull();
    // Crucially: the server just rejected this submission as a bot — it must
    // NOT re-enter the pipeline through POST /leads.
    const leadCall = fetchMock.mock.calls.find((c) => String(c[0]).includes('api/leads'));
    expect(leadCall).toBeUndefined();
  });

  it('falls back when booking fails for a non-slot reason', async () => {
    routeFetch({
      'api/showings/book': () => jsonResponse({ error: 'booking_failed', hostedUrl: HOSTED }, 502),
    });
    const user = userEvent.setup();
    renderPage();
    await fillContactForm(user);
    await user.click(await screen.findByRole('button', { name: '1:15 PM' }));
    await user.click(screen.getByRole('button', { name: /confirm appointment/i }));

    await screen.findByText(/we've got your request/i);
    await waitFor(() =>
      expect(fetchMock.mock.calls.some((c) => String(c[0]).includes('api/leads'))).toBe(true),
    );
  });

  it('shows "no longer available" when the contact step reports unit_not_listed', async () => {
    routeFetch({
      'api/showings/contact': () => jsonResponse({ error: 'unit_not_listed' }, 404),
    });
    const user = userEvent.setup();
    renderPage();
    await fillContactForm(user);

    await screen.findByText(/no longer available to tour/i);
    const link = screen.getByRole('link', { name: /view other open apartments/i });
    expect(link.getAttribute('href')).toBe('/available-units');
    // No lead-capture fallback and no dead-end generic message.
    expect(fetchMock.mock.calls.some((c) => String(c[0]).includes('api/leads'))).toBe(false);
    expect(screen.queryByText(/we've got your request/i)).toBeNull();
  });

  it('shows "no longer available" when the slots fetch reports unit_not_listed', async () => {
    routeFetch({
      'api/showings/slots': () => jsonResponse({ error: 'unit_not_listed' }, 404),
    });
    const user = userEvent.setup();
    renderPage();
    await fillContactForm(user);

    // The slots query retries once before surfacing the error.
    await screen.findByText(/no longer available to tour/i, undefined, { timeout: 4000 });
    expect(
      screen.getByRole('link', { name: /view other open apartments/i }).getAttribute('href'),
    ).toBe('/available-units');
    expect(fetchMock.mock.calls.some((c) => String(c[0]).includes('api/leads'))).toBe(false);
  });

  it('lets the visitor re-pick when the slot was just taken', async () => {
    routeFetch({
      'api/showings/book': () => jsonResponse({ error: 'slot_taken', hostedUrl: HOSTED }, 409),
    });
    const user = userEvent.setup();
    renderPage();
    await fillContactForm(user);
    await user.click(await screen.findByRole('button', { name: '1:15 PM' }));
    await user.click(screen.getByRole('button', { name: /confirm appointment/i }));

    await screen.findByText(/just booked by someone else/i);
    // No lead fallback — the visitor stays in the flow.
    expect(fetchMock.mock.calls.some((c) => String(c[0]).includes('api/leads'))).toBe(false);
  });

  // Screen-reader announcements for booking-step failures: each user-visible
  // failure banner must live in an alert/live region so it is announced
  // without a refresh, and focus must land on the banner so a keyboard or
  // screen-reader user isn't stranded on the control that just failed.
  describe('booking-step failure announcements', () => {
    it('announces and focuses the "slot taken" banner', async () => {
      routeFetch({
        'api/showings/book': () => jsonResponse({ error: 'slot_taken', hostedUrl: HOSTED }, 409),
      });
      const user = userEvent.setup();
      renderPage();
      await fillContactForm(user);
      await user.click(await screen.findByRole('button', { name: '1:15 PM' }));
      await user.click(screen.getByRole('button', { name: /confirm appointment/i }));

      const banner = await screen.findByRole('alert');
      expect(banner.textContent).toMatch(/just booked by someone else/i);
      await waitFor(() => expect(document.activeElement).toBe(banner));
    });

    it('announces and focuses the fallback banner when the slots fetch fails', async () => {
      routeFetch({
        'api/showings/slots': () => jsonResponse({ error: 'slots_failed', hostedUrl: HOSTED }, 502),
      });
      const user = userEvent.setup();
      renderPage();
      await fillContactForm(user);

      // (the transient "Loading available times…" status appears first)
      const text = await screen.findByText(/we've got your request/i, undefined, {
        timeout: 4000,
      });
      const banner = text.closest('[role="status"]') as HTMLElement;
      expect(banner).toBeTruthy();
      expect(banner.getAttribute('aria-live')).toBe('polite');
      await waitFor(() => expect(document.activeElement).toBe(banner));
      // The retry action (hosted scheduling link) lives inside the focused banner.
      expect(
        screen.getByRole('link', { name: /open the scheduling page/i }).closest('[role="status"]'),
      ).toBe(banner);
    });

    it('announces and focuses the fallback banner when booking fails outright', async () => {
      routeFetch({
        'api/showings/book': () => jsonResponse({ error: 'booking_failed', hostedUrl: HOSTED }, 502),
      });
      const user = userEvent.setup();
      renderPage();
      await fillContactForm(user);
      await user.click(await screen.findByRole('button', { name: '1:15 PM' }));
      await user.click(screen.getByRole('button', { name: /confirm appointment/i }));

      const banner = await screen.findByRole('status');
      expect(banner.textContent).toMatch(/we've got your request/i);
      expect(banner.getAttribute('aria-live')).toBe('polite');
      await waitFor(() => expect(document.activeElement).toBe(banner));
    });

    it('announces and focuses the "no longer available" banner when booking hits unit_not_listed', async () => {
      routeFetch({
        'api/showings/book': () => jsonResponse({ error: 'unit_not_listed' }, 404),
      });
      const user = userEvent.setup();
      renderPage();
      await fillContactForm(user);
      await user.click(await screen.findByRole('button', { name: '1:15 PM' }));
      await user.click(screen.getByRole('button', { name: /confirm appointment/i }));

      const banner = await screen.findByRole('status');
      expect(banner.textContent).toMatch(/no longer available to tour/i);
      expect(banner.getAttribute('aria-live')).toBe('polite');
      await waitFor(() => expect(document.activeElement).toBe(banner));
    });
  });
});
