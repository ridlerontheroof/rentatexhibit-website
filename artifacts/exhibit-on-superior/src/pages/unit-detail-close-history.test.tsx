// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Route, Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import type { AvailabilityData } from '../hooks/use-availability';

// Guards the Back-button contract on the unit detail page's two pop-ups —
// the photo gallery lightbox and the floor-plan modal — mirroring
// floor-plans-close-history.test.ts:
//
// - Opening either pop-up pushes a history entry so Back closes it.
// - Closing with the X consumes that entry via history.back(), so one
//   further Back press leaves the page.
// - A popstate-driven close (the Back button itself) must NOT call
//   history.back() again.

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
  photos: ['https://example.com/a.jpg', 'https://example.com/b.jpg'],
  details: [],
  marketingTitle: 'Luxury 1-Bedroom Apartment',
  description: 'A bright one bedroom.',
};

const data: AvailabilityData = { units: [unit], updatedAt: '2026-07-22T00:00:00Z' };

vi.mock('../hooks/use-availability', () => ({
  useAvailability: () => ({ data, isLoading: false }),
}));

import { UnitDetail } from './UnitDetail';

let backSpy: ReturnType<typeof vi.spyOn>;
let pushSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  backSpy = vi.spyOn(window.history, 'back').mockImplementation(() => {
    // Simulate the browser: back() pops the pushed entry and fires popstate.
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  pushSpy = vi.spyOn(window.history, 'pushState');
});

afterEach(() => {
  backSpy.mockRestore();
  pushSpy.mockRestore();
  cleanup();
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function renderPage() {
  const { hook } = memoryLocation({ path: '/available-units/0807' });
  return render(
    <Router hook={hook}>
      <Route path="/available-units/:unit" component={UnitDetail} />
    </Router>,
  );
}

function dialogOpen(): boolean {
  return document.querySelector('[role="dialog"]') !== null;
}

describe('UnitDetail photo gallery lightbox vs. history', () => {
  function openGallery() {
    const btn = screen.getByRole('button', { name: /view all .* photos/i });
    act(() => {
      fireEvent.click(btn);
    });
  }

  it('opening pushes an entry; closing with the X consumes it via history.back()', () => {
    renderPage();
    openGallery();
    expect(dialogOpen()).toBe(true);
    expect(pushSpy).toHaveBeenCalledTimes(1);

    const closeBtn = screen.getByRole('button', { name: /close photo gallery/i });
    act(() => {
      fireEvent.click(closeBtn);
    });
    expect(dialogOpen()).toBe(false);
    expect(backSpy).toHaveBeenCalledTimes(1);
  });

  it('a Back-button (popstate) close does not call history.back() again', () => {
    renderPage();
    openGallery();
    expect(dialogOpen()).toBe(true);

    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(dialogOpen()).toBe(false);
    expect(backSpy).not.toHaveBeenCalled();
  });

  it('navigating between photos inside the lightbox never touches history', () => {
    renderPage();
    openGallery();
    expect(pushSpy).toHaveBeenCalledTimes(1);

    const next = screen.getByRole('button', { name: /next photo/i });
    act(() => {
      fireEvent.click(next);
      fireEvent.click(next);
    });
    expect(pushSpy).toHaveBeenCalledTimes(1);
    expect(backSpy).not.toHaveBeenCalled();
    expect(dialogOpen()).toBe(true);
  });
});

describe('UnitDetail floor-plan modal vs. history', () => {
  function openPlan() {
    const btn = screen.getByRole('button', { name: /floor plan/i });
    act(() => {
      fireEvent.click(btn);
    });
  }

  it('opening pushes an entry; closing with the X consumes it via history.back()', () => {
    renderPage();
    openPlan();
    expect(dialogOpen()).toBe(true);
    expect(pushSpy).toHaveBeenCalledTimes(1);

    const buttons = Array.from(document.querySelectorAll('button'));
    const closeBtn = buttons.find(
      (b) => /close/i.test(b.textContent ?? '') || /close/i.test(b.getAttribute('aria-label') ?? ''),
    );
    if (!closeBtn) throw new Error('Plan modal close button not found');
    act(() => {
      fireEvent.click(closeBtn);
    });
    expect(dialogOpen()).toBe(false);
    expect(backSpy).toHaveBeenCalledTimes(1);
  });

  it('a Back-button (popstate) close does not call history.back() again', () => {
    renderPage();
    openPlan();
    expect(dialogOpen()).toBe(true);

    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(dialogOpen()).toBe(false);
    expect(backSpy).not.toHaveBeenCalled();
  });
});
