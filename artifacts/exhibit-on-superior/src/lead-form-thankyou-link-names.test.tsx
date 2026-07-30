// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import type { AvailabilityData } from './hooks/use-availability';
import type { CreateLeadPayload, LeadResponse } from './hooks/use-create-lead';
import { domLabelOffenders, type LabelOffender } from './lib/link-name-lint';

// Companion to schedule-showing-link-names.test.tsx (WCAG 2.5.3 label-in-name).
// The tour-request (ScheduleTour) and contact (ContactUs) forms swap to
// success/error states after submission that never appear in dist/public, so
// neither the prerender scan nor the interactive test sees them. This test
// mocks the lead mutation, submits each form, and applies the same normalized
// "aria-label must begin with visible text" contract on the post-submit DOM.

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

type MutateOpts = { onSuccess?: (res: LeadResponse) => void; onError?: (err: Error) => void };

const leadResponse: LeadResponse = {
  id: 1,
  type: 'tour',
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  phone: '3125550123',
  message: null,
  preferredDate: null,
  createdAt: '2026-07-26T00:00:00Z',
};

let leadBehaviour: (payload: CreateLeadPayload, opts: MutateOpts) => void;
let leadIsError: boolean;

vi.mock('./hooks/use-create-lead', () => ({
  useCreateLead: () => ({
    isPending: false,
    isError: leadIsError,
    mutate: (payload: CreateLeadPayload, opts: MutateOpts) => leadBehaviour(payload, opts),
  }),
}));

vi.mock('./lib/analytics', () => ({
  trackLead: vi.fn(),
}));

import { ScheduleTour } from './pages/ScheduleTour';
import { ContactUs } from './pages/ContactUs';

beforeEach(() => {
  leadBehaviour = (_p, opts) => opts.onSuccess?.(leadResponse);
  leadIsError = false;
  window.scrollTo = () => {};
});

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
  vi.clearAllMocks();
});

function mountAt(path: string, ui: React.ReactElement) {
  const { hook, searchHook } = memoryLocation({ path });
  return render(
    <Router hook={hook} searchHook={searchHook}>
      {ui}
    </Router>,
  );
}

/**
 * Assert no aria-label on the current DOM violates label-in-name. These
 * thank-you/error surfaces may legitimately carry zero aria-labelled elements
 * today — the guard exists to catch labels added later — so the non-vacuous
 * minimum is configurable per state.
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

async function fillCommonFields() {
  fireEvent.input(screen.getByLabelText(/first name/i), { target: { value: 'Ada' } });
  fireEvent.input(screen.getByLabelText(/last name/i), { target: { value: 'Lovelace' } });
  fireEvent.input(screen.getByLabelText(/email/i), { target: { value: 'ada@example.com' } });
  fireEvent.input(screen.getByLabelText(/phone/i), { target: { value: '3125550123' } });
}

describe('ScheduleTour post-submit states label-in-name (WCAG 2.5.3)', () => {
  async function submitTourForm() {
    await fillCommonFields();
    fireEvent.input(screen.getByLabelText(/desired move-in date/i), {
      target: { value: '2026-08-01' },
    });
    fireEvent.change(screen.getByLabelText(/floor plan preference/i), {
      target: { value: '1 Bedroom' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /request tour/i }));
    });
  }

  it('thank-you screen after a successful tour request', async () => {
    mountAt('/schedule-a-tour?unit=0807', <ScheduleTour />);
    // The per-unit listing section (with its aria-labelled links) was removed
    // from this page; the form leads now, so zero labelled elements is fine.
    expectNoOffenders('ScheduleTour (pre-submit form)');

    await submitTourForm();
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /tour request received/i })).toBeTruthy(),
    );
    expectNoOffenders('ScheduleTour (thank-you screen)');
  });

  it('error notice when the tour request fails', async () => {
    leadIsError = true;
    leadBehaviour = (_p, opts) => opts.onError?.(new Error('boom'));
    mountAt('/schedule-a-tour', <ScheduleTour />);

    await submitTourForm();
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expectNoOffenders('ScheduleTour (submit error notice)');
  });
});

describe('ContactUs post-submit states label-in-name (WCAG 2.5.3)', () => {
  async function submitContactForm() {
    await fillCommonFields();
    fireEvent.input(screen.getByLabelText(/message/i), {
      target: { value: 'I would like to know more about availability.' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /send message/i }));
    });
  }

  it('thank-you notice after a successful message', async () => {
    mountAt('/contact-us', <ContactUs />);
    expectNoOffenders('ContactUs (pre-submit form)');

    await submitContactForm();
    await waitFor(() =>
      expect(screen.getByText(/we've received your message/i)).toBeTruthy(),
    );
    expectNoOffenders('ContactUs (thank-you notice)');
  });

  it('error notice when the message fails to send', async () => {
    leadIsError = true;
    leadBehaviour = (_p, opts) => opts.onError?.(new Error('boom'));
    mountAt('/contact-us', <ContactUs />);

    await submitContactForm();
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expectNoOffenders('ContactUs (submit error notice)');
  });
});
