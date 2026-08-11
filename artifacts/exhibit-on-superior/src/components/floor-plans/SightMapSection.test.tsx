// @vitest-environment jsdom
/**
 * SightMapSection failure discipline + CTA bridge.
 *
 * The map is a third-party embed, so every failure mode must keep a
 * site-owned conversion path visible:
 * - SDK load failure → CTA row stays, note tells the visitor selection sync
 *   is off.
 * - iframe never fires onLoad → visible failure state with Try Again +
 *   "View available residences" (never a silent blank panel).
 * - availability feed missing → generic fallback CTA row.
 * And the happy path: an Engrain Metrics unit-click event repoints the CTA
 * row's details/tour/apply links to that unit.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, act, waitFor } from '@testing-library/react';

const mockUseAvailability = vi.fn();
vi.mock('../../hooks/use-availability', () => ({
  useAvailability: () => mockUseAvailability(),
}));

const mockLoadSdk = vi.fn<() => Promise<void>>();
vi.mock('../../lib/sightmap', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/sightmap')>();
  return { ...actual, loadSightMapSdk: () => mockLoadSdk() };
});

const trackSightMap = vi.fn();
vi.mock('../../lib/analytics', () => ({ trackSightMap: (...args: unknown[]) => trackSightMap(...args) }));

import { SightMapSection } from './SightMapSection';

type Handler = (event: { data?: unknown }) => void;

const unit = (token: string, overrides: Record<string, unknown> = {}) => ({
  unit: token,
  listingUrl: `https://example.appfolio.com/listings/detail/${token}`,
  details: [`Apartment ${token}`],
  rent: 2500,
  beds: 1,
  baths: 1,
  sqft: 700,
  ...overrides,
});

const availability = (units: unknown[]) => ({ data: { units }, isLoading: false });

function installSightMapMock() {
  const handlers = new Map<string, Handler>();
  (window as unknown as { SightMap: unknown }).SightMap = {
    Embed: class {
      on(name: string, handler: Handler) {
        handlers.set(name, handler);
      }
    },
  };
  return handlers;
}

async function activate() {
  fireEvent.click(screen.getByRole('button', { name: /explore the interactive map/i }));
}

beforeEach(() => {
  mockUseAvailability.mockReturnValue(availability([unit('0208'), unit('0610')]));
  mockLoadSdk.mockResolvedValue(undefined);
  installSightMapMock();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
  delete (window as unknown as { SightMap?: unknown }).SightMap;
});

describe('SightMapSection', () => {
  it('unit-click event from the Metrics API repoints the CTA row to that unit', async () => {
    const handlers = installSightMapMock();
    render(<SightMapSection />);
    await activate();
    await waitFor(() => expect(handlers.has('metrics.unitMap.unit.click')).toBe(true));

    // Pre-selection: CTA row is prefilled with the first posted unit.
    expect(screen.getByRole('link', { name: /apply now for apartment 0208/i })).toHaveProperty(
      'href',
      expect.stringContaining('/start-application?unit=0208'),
    );

    act(() => {
      handlers.get('metrics.unitMap.unit.click')!({ data: { unit: { unitNumber: '610' } } });
    });

    const apply = screen.getByRole('link', { name: /apply now for apartment 0610/i });
    expect((apply as HTMLAnchorElement).href).toContain('/start-application?unit=0610');
    const tour = screen.getByRole('link', { name: /schedule a tour of apartment 0610/i });
    expect((tour as HTMLAnchorElement).href).toContain('/schedule-showing?unit=0610');
    const details = screen.getByRole('link', { name: /apt 0610 details/i });
    expect((details as HTMLAnchorElement).href).toContain('/available-units/0610');
    expect(trackSightMap).toHaveBeenCalledWith(
      'sightmap_unit_selected',
      expect.objectContaining({ unit_number: '0610', matched: true }),
    );
  });

  it('SDK load failure keeps the CTA row and tells the visitor selection sync is off', async () => {
    mockLoadSdk.mockRejectedValue(new Error('blocked'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<SightMapSection />);
    await activate();

    await screen.findByText(/won.t update this bar right now/i);
    // Conversion paths remain (first-unit prefill).
    expect(screen.getByRole('link', { name: /apply now for apartment 0208/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /schedule a tour of apartment 0208/i })).toBeTruthy();
    warn.mockRestore();
  });

  it('iframe load timeout shows a visible failure state with retry + list fallback', async () => {
    vi.useFakeTimers();
    mockLoadSdk.mockReturnValue(new Promise(() => {})); // never settles
    render(<SightMapSection />);
    fireEvent.click(screen.getByRole('button', { name: /explore the interactive map/i }));

    // Before the timeout: iframe mounted, no alert.
    expect(document.getElementById('sightmap-embed')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(16_000);
    });

    const alert = screen.getByRole('alert');
    expect(alert.textContent).toMatch(/didn.t load/i);
    expect(screen.getByRole('button', { name: /try again/i })).toBeTruthy();
    expect(
      (screen.getByRole('link', { name: /view available residences/i }) as HTMLAnchorElement).href,
    ).toContain('#available-units');

    // Try Again remounts the iframe and clears the failure state.
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(screen.queryByRole('alert')).toBeNull();
    const iframe = document.getElementById('sightmap-embed') as HTMLIFrameElement;
    expect(iframe).toBeTruthy();

    // A successful load stops the watchdog for good.
    fireEvent.load(iframe);
    act(() => {
      vi.advanceTimersByTime(20_000);
    });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('missing availability feed falls back to generic site-owned CTAs', async () => {
    mockUseAvailability.mockReturnValue({ data: undefined, isLoading: true });
    render(<SightMapSection />);
    await activate();

    expect(
      (screen.getByRole('link', { name: /view available residences/i }) as HTMLAnchorElement).href,
    ).toContain('#available-units');
    expect(
      (screen.getByRole('link', { name: /^schedule a tour$/i }) as HTMLAnchorElement).href,
    ).toContain('/schedule-a-tour');
    expect(
      (screen.getByRole('link', { name: /^apply now$/i }) as HTMLAnchorElement).href,
    ).toContain('/start-application');
  });
});
