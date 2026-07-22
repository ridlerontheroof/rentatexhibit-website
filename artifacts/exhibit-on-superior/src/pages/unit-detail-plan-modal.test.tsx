// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Route, Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import type { AvailabilityData } from '../hooks/use-availability';

/**
 * The "View the … floor plan" button on the unit detail page must open the
 * floor-plan lightbox in place (modal) rather than navigating away to
 * /available-units — leaving the page loses the visitor's spot on a listing.
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
  marketingTitle: 'Luxury 1-Bedroom Apartment',
  description: 'A bright one bedroom.',
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

describe('UnitDetail floor-plan modal', () => {
  it('opens the floor plan in a dialog without leaving the page', () => {
    const { hook } = memoryLocation({ path: '/available-units/0807' });
    render(
      <Router hook={hook}>
        <Route path="/available-units/:unit" component={UnitDetail} />
      </Router>,
    );
    const btn = screen.getByRole('button', { name: /floor plan/i });
    expect(document.querySelector('[role="dialog"]')).toBeNull();

    fireEvent.click(btn);
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  });
});
