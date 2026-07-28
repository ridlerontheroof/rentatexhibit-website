// @vitest-environment jsdom
// Tests for the Exhibit-branded application-start step: the lead is captured
// (bot-guard fields included), the visitor is handed off to the correct
// AppFolio hosted application (right unit + source), and the hand-off is
// NEVER blocked by a lead-capture failure or hang.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StartApplication } from './StartApplication';
import { APPLY_URL } from '../data/seo';

const APPLY_HOSTED =
  'https://highlandrealestatepartners.appfolio.com/listings/rental_applications/new?listable_uid=0a1b2c-3d4e&source=Website%20(Exhibit)';

let searchString = 'unit=2801';

vi.mock('wouter', async (importOriginal) => ({
  ...(await importOriginal<typeof import('wouter')>()),
  useSearch: () => searchString,
}));

vi.mock('../hooks/use-availability', () => ({
  useAvailability: () => ({
    data: {
      units: [
        {
          unit: '2801',
          rent: 3200,
          bedrooms: 1,
          bathrooms: 1,
          photos: [],
          listingUrl:
            'https://highlandrealestatepartners.appfolio.com/listings/detail/0a1b2c-3d4e',
        },
      ],
    },
  }),
}));

const fetchMock = vi.fn();
const assignMock = vi.fn();

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <StartApplication />
    </QueryClientProvider>,
  );
}

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/first name/i), 'Jane');
  await user.type(screen.getByLabelText(/last name/i), 'Doe');
  await user.type(screen.getByLabelText(/email/i), 'jane@example.com');
  await user.type(screen.getByLabelText(/phone/i), '3125550100');
  await user.click(
    screen.getByRole('button', { name: /continue to the secure application/i }),
  );
}

beforeEach(() => {
  searchString = 'unit=2801';
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockImplementation((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('api/leads')) return jsonResponse({ ok: true }, 201);
    throw new Error(`Unexpected fetch in test: ${url}`);
  });
  // jsdom's location.assign throws "not implemented" — stub it out.
  Object.defineProperty(window, 'location', {
    value: { ...window.location, assign: assignMock },
    writable: true,
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
  assignMock.mockReset();
});

describe('StartApplication', () => {
  it('shows the unit context and the fee/fact checklist', () => {
    renderPage();
    expect(screen.getAllByText(/apartment 2801/i)[0]).toBeTruthy();
    // Sourced from the shared fee/fact modules, not hand-typed.
    expect(screen.getByText(/\$60 per applicant/)).toBeTruthy();
    expect(screen.getByText(/\$500 administration fee/)).toBeTruthy();
    expect(screen.getByText(/\$300,000/)).toBeTruthy();
    expect(screen.getByText(/1–3 business days/)).toBeTruthy();
    expect(screen.getByText(/replying STOP/i)).toBeTruthy();
  });

  it('creates an apply lead (with bot-guard fields) and hands off to the unit application', async () => {
    const user = userEvent.setup();
    renderPage();
    await fillAndSubmit(user);

    await waitFor(() => expect(assignMock).toHaveBeenCalledWith(APPLY_HOSTED));

    const leadCall = fetchMock.mock.calls.find((c) => String(c[0]).includes('api/leads'));
    expect(leadCall).toBeTruthy();
    const body = JSON.parse(String((leadCall![1] as RequestInit).body));
    expect(body.type).toBe('apply');
    expect(body.unit).toBe('2801');
    expect(body.firstName).toBe('Jane');
    expect(body.email).toBe('jane@example.com');
    // Bot-guard fields ride along for the server-side check.
    expect(body).toHaveProperty('xh_note');
    expect(typeof body.elapsedMs).toBe('number');
    // Forwarded exactly once.
    expect(assignMock).toHaveBeenCalledTimes(1);
  });

  it('NEVER blocks the hand-off when the lead capture fails', async () => {
    fetchMock.mockImplementation(() => Promise.reject(new Error('api down')));
    const user = userEvent.setup();
    renderPage();
    await fillAndSubmit(user);

    await waitFor(() => expect(assignMock).toHaveBeenCalledWith(APPLY_HOSTED));
    expect(assignMock).toHaveBeenCalledTimes(1);
    // The interstitial still offers a manual link to the same URL.
    expect(
      (screen.getByRole('link', { name: /continue to the application/i }) as HTMLAnchorElement)
        .href,
    ).toBe(APPLY_HOSTED);
  });

  it('forwards after the timeout when the lead request hangs', async () => {
    vi.useFakeTimers();
    try {
      fetchMock.mockImplementation(() => new Promise<Response>(() => {}));
      renderPage();
      fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Jane' } });
      fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'jane@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '3125550100' } });
      fireEvent.submit(
        screen.getByRole('button', { name: /continue to the secure application/i }),
      );
      // Let react-hook-form's async validation resolve, then hit the timeout.
      await vi.advanceTimersByTimeAsync(10_000);
      expect(assignMock).toHaveBeenCalledWith(APPLY_HOSTED);
      expect(assignMock).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('falls back to the general application URL when the unit is not listed', async () => {
    searchString = 'unit=0999';
    const user = userEvent.setup();
    renderPage();
    expect(screen.getByText(/no longer listed/i)).toBeTruthy();
    await fillAndSubmit(user);

    await waitFor(() => expect(assignMock).toHaveBeenCalledWith(APPLY_URL));
    // No unit is attached to the lead (nothing to pin a guest card to).
    const leadCall = fetchMock.mock.calls.find((c) => String(c[0]).includes('api/leads'));
    const body = JSON.parse(String((leadCall![1] as RequestInit).body));
    expect(body.type).toBe('apply');
    expect(body.unit).toBeUndefined();
  });
});
