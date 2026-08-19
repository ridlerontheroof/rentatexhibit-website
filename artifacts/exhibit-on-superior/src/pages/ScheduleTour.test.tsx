// @vitest-environment jsdom
// Step-flow tests for /schedule-a-tour, now routed into the day/time
// scheduler: form (with optional apartment choice) → contact step → live
// slots → booked. The general "No specific apartment" path books against the
// reserved "TOUR" token and must NEVER surface the internal tour unit to the
// visitor; its fallback is today's plain lead submission (no hosted link).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScheduleTour } from './ScheduleTour';

const HOSTED =
  'https://highlandrealestatepartners.appfolio.com/listings/showings/new?listable_uid=uid-1';

let searchString = '';
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
  unit: 'TOUR',
  hostedUrl: HOSTED,
  durationMinutes: 15,
  days: [{ date: '2026/08/03', slots: [{ time: '2026/08/03 10:00', agentId: 444 }] }],
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
          startAt: '2026-08-03T15:00:00.000Z',
          endAt: '2026-08-03T15:15:00.000Z',
          fullAddress: '165 W Superior St, Apt. Tour',
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
      <ScheduleTour />
    </QueryClientProvider>,
  );
}

async function fillForm(user: ReturnType<typeof userEvent.setup>, unit?: string) {
  await user.type(screen.getByLabelText(/first name/i), 'Jane');
  await user.type(screen.getByLabelText(/last name/i), 'Doe');
  await user.type(screen.getByLabelText(/email/i), 'jane@example.com');
  await user.type(screen.getByLabelText(/phone/i), '3125550100');
  await user.type(screen.getByLabelText(/desired move-in date/i), '2026-09-01');
  await user.selectOptions(screen.getByLabelText(/floor plan preference/i), '1 Bedroom');
  if (unit) {
    await user.selectOptions(screen.getByLabelText(/interested in a specific apartment/i), unit);
  }
  await user.click(screen.getByRole('button', { name: /request tour/i }));
}

function callsTo(needle: string) {
  return fetchMock.mock.calls.filter(([input]) => String(input).includes(needle));
}

beforeEach(() => {
  searchString = '';
  vi.stubGlobal('fetch', fetchMock);
  routeFetch();
});

afterEach(() => {
  cleanup();
  fetchMock.mockReset();
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('ScheduleTour — general path ("No specific apartment")', () => {
  it('books a slot against the reserved TOUR token without ever showing the tour unit', async () => {
    const user = userEvent.setup();
    renderPage();

    // The dropdown offers real units + the explicit no-apartment choice.
    const dropdown = screen.getByLabelText(/interested in a specific apartment/i);
    const options = Array.from((dropdown as HTMLSelectElement).options).map((o) => o.text);
    expect(options).toEqual(['No specific apartment', 'Apt 2801']);

    await fillForm(user);

    // Contact step posted with the reserved token — never a lead POST.
    await waitFor(() => expect(callsTo('api/showings/contact')).toHaveLength(1));
    const contactBody = JSON.parse(callsTo('api/showings/contact')[0][1]!.body as string);
    expect(contactBody.unit).toBe('TOUR');
    expect(callsTo('api/leads')).toHaveLength(0);

    // Slot picker speaks about the building, not any unit.
    await screen.findByRole('heading', { name: /select a time for your tour/i });
    expect(String(callsTo('api/showings/slots')[0][0])).toContain('unit=TOUR');

    await user.click(screen.getByRole('button', { name: '10:00 AM' }));
    expect(screen.getByText(/your tour of exhibit on superior/i)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /confirm appointment/i }));

    await screen.findByRole('heading', { name: /you're all set/i });
    expect(document.body.textContent).toContain('Your tour of Exhibit On Superior is booked');
    // The internal tour unit's "address" must not leak into the confirmation.
    expect(document.body.textContent).not.toContain('Apt. Tour');
    expect(document.body.textContent).not.toMatch(/Apartment TOUR/i);
    expect(screen.getByRole('link', { name: /browse available apartments/i })).toBeTruthy();
    // The SMS consent audit record is written server-side by the booking route;
    // no client-side leads call is made.
    await waitFor(() => expect(callsTo('api/leads')).toHaveLength(0));
  });

  it('sends smsConsent: true through contact and booking when the consent box is checked', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('checkbox', { name: /consent to receive SMS/i }));
    await fillForm(user);
    await waitFor(() => {
      const contactCall = callsTo('api/showings/contact')[0];
      expect(contactCall).toBeTruthy();
      expect(JSON.parse(contactCall[1]!.body as string).smsConsent).toBe(true);
    });
    await user.click(await screen.findByRole('button', { name: '10:00 AM' }));
    await user.click(screen.getByRole('button', { name: /confirm appointment/i }));

    await screen.findByRole('heading', { name: /you're all set/i });
    // smsConsent travels in the book payload so the server writes the audit
    // record server-side — no separate client-side leads call is needed.
    await waitFor(() => {
      const bookCall = callsTo('api/showings/book')[0];
      expect(bookCall).toBeTruthy();
      const body = JSON.parse(bookCall[1]!.body as string);
      expect(body.smsConsent).toBe(true);
    });
    expect(callsTo('api/leads')).toHaveLength(0);
  });

  it('sends smsConsent: false through contact and booking when the consent box is unchecked', async () => {
    const user = userEvent.setup();
    renderPage();
    // Leave the consent box unchecked (default)
    await fillForm(user);
    await waitFor(() => {
      const contactCall = callsTo('api/showings/contact')[0];
      expect(contactCall).toBeTruthy();
      expect(JSON.parse(contactCall[1]!.body as string).smsConsent).toBe(false);
    });
    await user.click(await screen.findByRole('button', { name: '10:00 AM' }));
    await user.click(screen.getByRole('button', { name: /confirm appointment/i }));

    await screen.findByRole('heading', { name: /you're all set/i });
    await waitFor(() => {
      const bookCall = callsTo('api/showings/book')[0];
      expect(bookCall).toBeTruthy();
      const body = JSON.parse(bookCall[1]!.body as string);
      expect(body.smsConsent).toBe(false);
    });
    expect(callsTo('api/leads')).toHaveLength(0);
  });

  it('creates exactly one AppFolio guest card on booking success with no client-side leads call', async () => {
    const user = userEvent.setup();
    renderPage();
    await fillForm(user);
    await user.click(await screen.findByRole('button', { name: '10:00 AM' }));
    await user.click(screen.getByRole('button', { name: /confirm appointment/i }));

    await screen.findByRole('heading', { name: /you're all set/i });
    await waitFor(() => {
      // One contact call (= one guest card). The SMS consent audit record is
      // written server-side by the book route — no client-side leads call.
      expect(callsTo('api/showings/contact')).toHaveLength(1);
      expect(callsTo('api/leads')).toHaveLength(0);
    });
  });

  it('falls back to today\u2019s plain lead (with preferences, WITHOUT hosted link) when the contact step fails', async () => {
    routeFetch({
      'api/showings/contact': () => jsonResponse({ error: 'appfolio_down', hostedUrl: HOSTED }, 502),
    });
    const user = userEvent.setup();
    renderPage();
    await fillForm(user);

    await screen.findByRole('heading', { name: /tour request received/i });
    const leadBody = JSON.parse(callsTo('api/leads')[0][1]!.body as string);
    expect(leadBody).toMatchObject({
      type: 'tour',
      firstName: 'Jane',
      preferredDate: '2026-09-01',
    });
    expect(leadBody.unit).toBeUndefined();
    expect(leadBody.message).toContain('Floor plan preference: 1 Bedroom');
    // The hosted AppFolio page would present the internal tour unit as an
    // apartment — the general path must never link out to it.
    expect(screen.queryByRole('link', { name: /open the scheduling page/i })).toBeNull();
  });

  it('falls back to a plain lead when no slots are open (single lead, no duplicates)', async () => {
    routeFetch({
      'api/showings/slots': () => jsonResponse({ ...SLOTS, days: [{ date: '2026/08/03', slots: [] }] }),
    });
    const user = userEvent.setup();
    renderPage();
    await fillForm(user);

    await screen.findByText(/no online tour times are open right now/i);
    await user.click(screen.getByRole('button', { name: /have the leasing team contact me/i }));

    await screen.findByRole('heading', { name: /tour request received/i });
    expect(callsTo('api/leads')).toHaveLength(1);
  });

  it('treats a contact-step 400 as terminal — no fallback lead for a rejected submission', async () => {
    routeFetch({
      'api/showings/contact': () => jsonResponse({ error: 'invalid_submission' }, 400),
    });
    const user = userEvent.setup();
    renderPage();
    await fillForm(user);

    await screen.findByText(/your submission couldn't be verified/i);
    expect(callsTo('api/leads')).toHaveLength(0);
    // The form is still there for the visitor to correct.
    expect(screen.getByRole('button', { name: /request tour/i })).toBeTruthy();
  });
});

describe('ScheduleTour — specific-apartment path', () => {
  it('routes the chosen unit into the scheduler and books it', async () => {
    const user = userEvent.setup();
    renderPage();
    await fillForm(user, '2801');

    await waitFor(() => expect(callsTo('api/showings/contact')).toHaveLength(1));
    const contactBody = JSON.parse(callsTo('api/showings/contact')[0][1]!.body as string);
    expect(contactBody.unit).toBe('2801');

    await screen.findByRole('heading', { name: /select a time to view apartment 2801/i });
    await user.click(screen.getByRole('button', { name: '10:00 AM' }));
    await user.click(screen.getByRole('button', { name: /confirm appointment/i }));

    await screen.findByRole('heading', { name: /you're all set/i });
    expect(document.body.textContent).toContain(
      'Your in-person showing of Apartment 2801 is booked',
    );
    expect(screen.getByRole('link', { name: /back to apartment 2801/i })).toBeTruthy();
    // The SMS consent audit record is written server-side by the booking route;
    // no client-side leads call is made.
    await waitFor(() => expect(callsTo('api/leads')).toHaveLength(0));
  });

  it('booking failure falls back to a lead WITH the hosted AppFolio link', async () => {
    routeFetch({
      'api/showings/book': () => jsonResponse({ error: 'booking_failed', hostedUrl: HOSTED }, 502),
    });
    const user = userEvent.setup();
    renderPage();
    await fillForm(user, '2801');

    await screen.findByRole('heading', { name: /select a time to view apartment 2801/i });
    await user.click(screen.getByRole('button', { name: '10:00 AM' }));
    await user.click(screen.getByRole('button', { name: /confirm appointment/i }));

    await screen.findByRole('heading', { name: /tour request received/i });
    const leadBody = JSON.parse(callsTo('api/leads')[0][1]!.body as string);
    expect(leadBody.unit).toBe('2801');
    const hostedLink = screen.getByRole('link', { name: /open the scheduling page/i });
    expect(hostedLink.getAttribute('href')).toBe(HOSTED);
  });

  it('honors the ?unit= prefill for an available unit', async () => {
    searchString = 'unit=2801';
    renderPage();
    await waitFor(() => {
      const dropdown = screen.getByLabelText(
        /interested in a specific apartment/i,
      ) as HTMLSelectElement;
      expect(dropdown.value).toBe('2801');
    });
  });
});
