// @vitest-environment jsdom
// Screen-reader wiring for live validation errors (Task: "make sure live form
// errors are actually read aloud when someone mistypes").
//
// The prepublish check-link-names guard verifies aria-describedby references
// resolve on PRERENDERED pages, but hint/error text on the tour-scheduling and
// contact forms only exists after hydration, when a user submits bad input.
// These tests drive that runtime path: submit each form with invalid input and
// assert every visible error is announced with its field — the field carries
// aria-invalid="true" and an aria-describedby that resolves to the exact
// role="alert" element holding the message text. Without that wiring a
// screen-reader user who mistypes an email hears nothing.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScheduleShowing } from './ScheduleShowing';
import { ContactUs } from './ContactUs';

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

const fetchMock = vi.fn(() => {
  throw new Error('No network call expected: invalid input must fail client-side');
});

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
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

/**
 * Assert the field is announced as invalid and its aria-describedby resolves
 * to non-empty visible error text (a role="alert" element). Every referenced
 * id must exist and carry text — one broken id silently drops that message.
 */
function expectErrorWiring(field: HTMLElement) {
  expect(field.getAttribute('aria-invalid'), `${field.id} aria-invalid`).toBe('true');
  const describedby = field.getAttribute('aria-describedby');
  expect(describedby, `${field.id} aria-describedby`).toBeTruthy();
  const ids = (describedby as string).split(/\s+/).filter(Boolean);
  expect(ids.length).toBeGreaterThan(0);
  for (const id of ids) {
    const el = document.getElementById(id);
    expect(el, `#${id} referenced by ${field.id} must exist`).toBeTruthy();
    expect(
      (el as HTMLElement).textContent?.trim(),
      `#${id} referenced by ${field.id} must carry text`,
    ).toBeTruthy();
  }
}

describe('ScheduleShowing contact step — error announcement wiring', () => {
  it('wires every error to its field via aria-describedby + aria-invalid on a mistyped submit', async () => {
    const user = userEvent.setup();
    renderWithClient(<ScheduleShowing />);

    // Mistype the email, leave everything else blank, submit.
    await user.type(screen.getByLabelText(/email/i), 'not-an-email');
    await user.click(screen.getByRole('button', { name: /view available times/i }));

    await waitFor(() => expect(screen.getAllByRole('alert').length).toBeGreaterThan(0));

    for (const label of [/first name/i, /last name/i, /email/i, /phone/i]) {
      expectErrorWiring(screen.getByLabelText(label));
    }

    // Sanity: the email error is the mistype message, tied to the field.
    const email = screen.getByLabelText(/email/i);
    const errorEl = document.getElementById(email.getAttribute('aria-describedby')!.split(/\s+/)[0])!;
    expect(errorEl.getAttribute('role')).toBe('alert');
  });

  it('clears aria-invalid/aria-describedby once the field is corrected', async () => {
    const user = userEvent.setup();
    renderWithClient(<ScheduleShowing />);
    await user.type(screen.getByLabelText(/email/i), 'not-an-email');
    await user.click(screen.getByRole('button', { name: /view available times/i }));
    await waitFor(() =>
      expect(screen.getByLabelText(/email/i).getAttribute('aria-invalid')).toBe('true'),
    );

    const email = screen.getByLabelText(/email/i);
    await user.clear(email);
    await user.type(email, 'jane@example.com');
    await waitFor(() => expect(email.getAttribute('aria-invalid')).toBeNull());
    expect(email.getAttribute('aria-describedby')).toBeNull();
  });
});

describe('ContactUs form — error announcement wiring', () => {
  it('wires every error to its field via aria-describedby + aria-invalid on a mistyped submit', async () => {
    const user = userEvent.setup();
    renderWithClient(<ContactUs />);

    await user.type(screen.getByLabelText(/email/i), 'not-an-email');
    await user.type(screen.getByLabelText(/^message/i), 'short'); // < 10 chars
    await user.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => expect(screen.getAllByRole('alert').length).toBeGreaterThan(0));

    for (const label of [/first name/i, /last name/i, /email/i, /phone/i, /^message/i]) {
      expectErrorWiring(screen.getByLabelText(label));
    }

    const email = screen.getByLabelText(/email/i);
    const errorEl = document.getElementById(email.getAttribute('aria-describedby')!.split(/\s+/)[0])!;
    expect(errorEl.getAttribute('role')).toBe('alert');
  });
});
