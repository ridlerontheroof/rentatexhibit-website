// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { Route, Router, Switch } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import type { AvailabilityData } from '../hooks/use-availability';

/**
 * Runtime edge cases for the per-unit route:
 *  - an unknown unit (rented, typo, stale AI citation) must land on the
 *    graceful sold-out page and be marked noindex — never a hard 404 and
 *    never an indexable page with wrong facts;
 *  - a trailing-slash URL (/available-units/0807/) must still resolve to the
 *    unit page, because prerendered pages are served as directory indexes and
 *    crawlers/browsers may request the slash form.
 */

const unit = {
  unit: '0807',
  bedrooms: 1,
  bathrooms: 1,
  sqft: 665,
  rent: 2873,
  availableOn: '2026-08-01',
  photoUrl: null,
  listingUrl: null,
  videoUrl: null,
  photos: [],
  details: [],
  marketingTitle: null,
  description: null,
};

const data: AvailabilityData = { units: [unit], updatedAt: '2026-07-22T00:00:00Z' };

vi.mock('../hooks/use-availability', () => ({
  useAvailability: () => ({ data, isLoading: false }),
}));

import { UnitDetail } from './UnitDetail';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

/** Mirror of App.tsx's routing for the unit route + catch-all. */
function TestRoutes({ path }: { path: string }) {
  const { hook } = memoryLocation({ path, static: true });
  return (
    <Router hook={hook}>
      <Switch>
        <Route path="/available-units/:unit" component={UnitDetail} />
        <Route>{() => <div data-testid="not-found">not found</div>}</Route>
      </Switch>
    </Router>
  );
}

describe('unit route edge cases', () => {
  it('unknown unit renders the sold-out page, not a 404', () => {
    render(<TestRoutes path="/available-units/9999" />);
    expect(screen.getByText(/Apartment 9999 has been rented/i)).toBeDefined();
    expect(screen.getByText(/See current availability/i)).toBeDefined();
    expect(screen.queryByTestId('not-found')).toBeNull();
  });

  it('unknown unit page is marked noindex', async () => {
    render(<TestRoutes path="/available-units/9999" />);
    await waitFor(() => {
      const robots = document.head.querySelector('meta[name="robots"]');
      expect(robots?.getAttribute('content')).toContain('noindex');
    });
  });

  it('trailing-slash unit URL still resolves to the unit page', () => {
    render(<TestRoutes path="/available-units/0807/" />);
    expect(screen.getByRole('heading', { level: 1, name: /Apartment 0807/i })).toBeDefined();
    expect(screen.queryByTestId('not-found')).toBeNull();
  });
});
