// @vitest-environment jsdom
// Step-flow tests for the Exhibit showing scheduler: contact → live slots →
// booked, plus the two mandatory no-dead-end paths (contact failure and
// booking failure fall back to a standard lead + hosted AppFolio link).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
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
});
