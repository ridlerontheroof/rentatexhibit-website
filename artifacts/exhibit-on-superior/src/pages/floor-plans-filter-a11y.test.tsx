// @vitest-environment jsdom
// Task: apartment-filter accessibility. Verifies that filtering updates a
// polite live region announcing the shown-plan count, that focus stays on the
// control that changed, and that every filter control exposes an accessible
// name (including the ADA toggle, which must be self-explanatory without
// visual context).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

// Radix's slider (used by the floor-plan filters) needs ResizeObserver,
// which jsdom does not provide.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as { ResizeObserver?: unknown }).ResizeObserver ??= ResizeObserverStub;

vi.mock('../components/Seo', () => ({ Seo: () => null }));

vi.mock('../hooks/use-availability', () => ({
  useAvailability: () => ({ data: { units: [] }, isPending: false }),
  normalizeAvailability: (d: unknown) => d,
}));

function renderPage(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
});

describe('floor-plan filter accessibility', () => {
  it('announces the shown-plan count in a polite live region that updates on filter change', async () => {
    window.history.replaceState(null, '', '/available-units');
    const { FloorPlans } = await import('./FloorPlans');
    renderPage(<FloorPlans />);

    const status = screen.getByRole('status');
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.textContent).toMatch(/^\d+ plans? shown$/);
    const before = status.textContent;

    // Toggle a bedroom filter; the live region text must change with it.
    const studio = screen.getAllByRole('button', { name: /^Studio$/i })[0];
    fireEvent.click(studio);
    expect(status.textContent).toMatch(/^\d+ plans? shown$/);
    expect(status.textContent).not.toBe(before);
    expect(studio.getAttribute('aria-pressed')).toBe('true');
  });

  it('keeps focus on the filter control that changed', async () => {
    window.history.replaceState(null, '', '/available-units');
    const { FloorPlans } = await import('./FloorPlans');
    renderPage(<FloorPlans />);

    const studio = screen.getAllByRole('button', { name: /^Studio$/i })[0];
    studio.focus();
    fireEvent.click(studio);
    expect(document.activeElement).toBe(studio);

    const ada = screen.getAllByRole('button', { name: /ADA-accessible/i })[0];
    ada.focus();
    fireEvent.click(ada);
    expect(document.activeElement).toBe(ada);
  });

  it('gives every filter control an accessible name', async () => {
    window.history.replaceState(null, '', '/available-units');
    const { FloorPlans } = await import('./FloorPlans');
    const { container } = renderPage(<FloorPlans />);

    // Search inputs (desktop sidebar + mobile top bar).
    expect(screen.getAllByLabelText('Search by unit or floor').length).toBeGreaterThanOrEqual(2);

    // Sort select is labelled via its sr-only <span> inside the label.
    expect(screen.getByRole('combobox', { name: /sort plans/i })).toBeTruthy();

    // Slider thumbs carry explicit labels.
    expect(screen.getAllByLabelText('Minimum square footage').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByLabelText('Maximum square footage').length).toBeGreaterThanOrEqual(1);

    // ADA toggle is self-explanatory without visual context.
    const ada = screen.getAllByRole('button', { name: /show only ADA-accessible floor plans/i });
    expect(ada.length).toBeGreaterThanOrEqual(1);
    expect(ada[0].getAttribute('aria-pressed')).toBe('false');

    // Every button on the page has a non-empty accessible name (text or
    // aria-label) — no icon-only mystery buttons in the filter UI.
    for (const btn of Array.from(container.querySelectorAll('button'))) {
      const name = btn.getAttribute('aria-label') ?? btn.textContent?.trim() ?? '';
      expect(name.length, `button missing accessible name: ${btn.outerHTML.slice(0, 120)}`).toBeGreaterThan(0);
    }

    // Bedroom/floor toggles expose pressed state.
    const bedroomGroup = screen.getAllByRole('group', { name: /bedrooms/i })[0];
    for (const btn of within(bedroomGroup).getAllByRole('button')) {
      expect(btn.getAttribute('aria-pressed')).toMatch(/^(true|false)$/);
    }
  });
});
