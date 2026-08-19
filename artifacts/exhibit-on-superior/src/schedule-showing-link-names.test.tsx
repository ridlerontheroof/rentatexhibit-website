// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import type { AvailabilityData } from './hooks/use-availability';
import type {
  ShowingBookPayload,
  ShowingContactPayload,
  ShowingContactResponse,
  ShowingSlotsResponse,
} from './hooks/use-showings';
import { domLabelOffenders, type LabelOffender } from './lib/link-name-lint';

// Companion to interactive-link-names.test.tsx (WCAG 2.5.3 label-in-name).
// The schedule-a-showing page reveals its slot picker, confirmation, fallback
// and "unit gone" surfaces only after the visitor submits the contact form,
// so neither the prerender scan nor the existing interactive test ever sees
// them. This test mocks the showing-scheduler hooks, drives the stepper past
// step 1 into every later state, and applies the same normalized "aria-label
// must begin with visible text" contract on each one.

const unit = {
  unit: '0807',
  bedrooms: 1,
  bathrooms: 1,
  sqft: 665,
  rent: 2873,
  availableOn: '2026-08-01',
  photoUrl: null,
  listingUrl: 'https://www.exhibitonsuperior.com/listings/detail/abc',
  videoUrl: null,
  photos: [],
  details: [],
  marketingTitle: 'Luxury 1-Bedroom Apartment',
  description: 'A bright one bedroom.',
};

const data: AvailabilityData = { units: [unit], updatedAt: '2026-07-22T00:00:00Z' };

vi.mock('./hooks/use-availability', () => ({
  useAvailability: () => ({ data, isLoading: false }),
}));

vi.mock('./hooks/use-create-lead', () => ({
  useCreateLead: () => ({ mutate: vi.fn(), isPending: false, isError: false }),
}));

// Mutable per-test behaviour for the showing hooks.
const contactResponse: ShowingContactResponse = {
  guestCardId: 'gc-1',
  jwt: null,
  hostedUrl: 'https://example.appfolio.com/showings/abc',
};

const slotsResponse: ShowingSlotsResponse = {
  unit: '0807',
  hostedUrl: contactResponse.hostedUrl,
  durationMinutes: 15,
  days: [
    {
      date: '2026/07/28',
      slots: [
        { time: '2026/07/28 13:15', agentId: 7 },
        { time: '2026/07/28 14:00', agentId: 7 },
      ],
    },
  ],
  futureAvailabilitiesExist: true,
  firstAvailableDate: '2026/07/28',
};

type MutateOpts<Res, Err> = { onSuccess?: (res: Res) => void; onError?: (err: Err) => void };

let contactBehaviour: (
  payload: ShowingContactPayload,
  opts: MutateOpts<ShowingContactResponse, InstanceType<typeof ShowingApiErrorActual>>,
) => void;
let bookBehaviour: (
  payload: ShowingBookPayload,
  opts: MutateOpts<{ startAt: string; endAt: string; fullAddress: string | null }, InstanceType<typeof ShowingApiErrorActual>>,
) => void;
let slotsState: () => {
  data?: ShowingSlotsResponse;
  isPending: boolean;
  isError: boolean;
  error?: unknown;
  refetch: () => void;
};

vi.mock('./hooks/use-showings', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./hooks/use-showings')>();
  return {
    ...actual,
    useShowingContact: () => ({
      isPending: false,
      mutate: (payload: ShowingContactPayload, opts: MutateOpts<ShowingContactResponse, never>) =>
        contactBehaviour(payload, opts),
    }),
    useBookShowing: () => ({
      isPending: false,
      mutate: (payload: ShowingBookPayload, opts: MutateOpts<never, never>) =>
        bookBehaviour(payload, opts),
    }),
    useShowingSlots: () => slotsState(),
  };
});

// Real error class (mock spreads the actual module, so instanceof works).
import { ShowingApiError as ShowingApiErrorActual } from './hooks/use-showings';
import { ScheduleShowing } from './pages/ScheduleShowing';

beforeEach(() => {
  contactBehaviour = (_p, opts) => opts.onSuccess?.(contactResponse);
  bookBehaviour = (_p, opts) =>
    opts.onSuccess?.({ startAt: '2026/07/28 13:15', endAt: '2026/07/28 13:30', fullAddress: null });
  slotsState = () => ({
    data: slotsResponse,
    isPending: false,
    isError: false,
    refetch: () => {},
  });
  window.scrollTo = () => {};
});

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
  vi.clearAllMocks();
});

function mountScheduler() {
  const { hook, searchHook } = memoryLocation({ path: '/schedule-showing?unit=0807' });
  return render(
    <Router hook={hook} searchHook={searchHook}>
      <ScheduleShowing />
    </Router>,
  );
}

/**
 * Assert no aria-label on the current DOM violates label-in-name. Unlike the
 * lightbox/menu surfaces, these booking steps may legitimately carry zero
 * aria-labelled elements today — the guard exists to catch labels added
 * later — so the non-vacuous minimum is configurable per step.
 */
function expectNoOffenders(where: string, minLabelled = 0) {
  const { offenders, labelledCount } = domLabelOffenders(document.body, where);
  expect(labelledCount, `${where}: labelled-element count`).toBeGreaterThanOrEqual(minLabelled);
  const report = offenders
    .map(
      (o: LabelOffender) =>
        `${o.where}: aria-label "${o.label}" does not begin with visible text "${o.visible}"\n  ${o.tag}`,
    )
    .join('\n');
  expect(
    offenders,
    `aria-labels that break WCAG 2.5.3 label-in-name (make the label start with the visible text, or drop it):\n${report}`,
  ).toEqual([]);
}

async function fillAndSubmitContactForm() {
  fireEvent.input(screen.getByLabelText(/first name/i), { target: { value: 'Ada' } });
  fireEvent.input(screen.getByLabelText(/last name/i), { target: { value: 'Lovelace' } });
  fireEvent.input(screen.getByLabelText(/email/i), { target: { value: 'ada@example.com' } });
  fireEvent.input(screen.getByLabelText(/phone/i), { target: { value: '3125550123' } });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /view available times/i }));
  });
}

describe('ScheduleShowing later booking steps label-in-name (WCAG 2.5.3)', () => {
  it('step 2 — slot picker (with a slot selected)', async () => {
    mountScheduler();
    expectNoOffenders('ScheduleShowing (step 1 contact form)');

    await fillAndSubmitContactForm();
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /select a time to view apartment 0807/i })).toBeTruthy(),
    );
    expectNoOffenders('ScheduleShowing (step 2 slot picker)');

    // Select a slot so the confirm block (summary + Confirm Appointment) renders.
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /1:15 pm/i }));
    });
    expect(screen.getByRole('button', { name: /confirm appointment/i })).toBeTruthy();
    expectNoOffenders('ScheduleShowing (step 2 slot selected)');
  });

  it('step 3 — booking confirmation', async () => {
    mountScheduler();
    await fillAndSubmitContactForm();
    await waitFor(() => screen.getByRole('button', { name: /1:15 pm/i }));

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /1:15 pm/i }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /confirm appointment/i }));
    });
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /you're all set/i })).toBeTruthy(),
    );
    expectNoOffenders('ScheduleShowing (step 3 booked confirmation)');
  });

  it('step 2 — no slots open (leasing-team handoff prompt)', async () => {
    slotsState = () => ({
      data: { ...slotsResponse, days: [] },
      isPending: false,
      isError: false,
      refetch: () => {},
    });
    mountScheduler();
    await fillAndSubmitContactForm();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /have the leasing team contact me/i })).toBeTruthy(),
    );
    expectNoOffenders('ScheduleShowing (step 2 no slots open)');
  });

  it('fallback — lead captured + hosted scheduling link', async () => {
    contactBehaviour = (_p, opts) =>
      opts.onError?.(new ShowingApiErrorActual('appfolio_down', contactResponse.hostedUrl));
    mountScheduler();
    await fillAndSubmitContactForm();
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /we've got your request/i })).toBeTruthy(),
    );
    expect(screen.getByRole('link', { name: /open the scheduling page/i })).toBeTruthy();
    expectNoOffenders('ScheduleShowing (fallback with hosted link)');
  });

  it('unit gone — no-longer-available notice', async () => {
    contactBehaviour = (_p, opts) => opts.onError?.(new ShowingApiErrorActual('unit_not_listed'));
    mountScheduler();
    await fillAndSubmitContactForm();
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /no longer available/i }),
      ).toBeTruthy(),
    );
    expectNoOffenders('ScheduleShowing (unit no longer available)');
  });
});
