// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Route, Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import type { AvailabilityData } from './hooks/use-availability';
import { domLabelOffenders, type LabelOffender } from './lib/link-name-lint';

// Companion to prerender-link-names.test.ts (WCAG 2.5.3 label-in-name).
// That guard scans dist/public, so it only covers what ships in the initial
// prerendered page. UI that renders after hydration or interaction — photo
// lightboxes, the mobile menu, nav dropdowns, dialogs/sheets — never appears
// in dist/public, so an aria-label there that drops its visible text would
// slip through. This test mounts those surfaces, opens them, and applies the
// same normalized "label must begin with visible text" contract to every
// <a>/<button> carrying an aria-label.

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

vi.mock('./hooks/use-availability', () => ({
  useAvailability: () => ({ data, isLoading: false }),
}));

import { Header } from './components/Header';
import { PhotoGallery } from './pages/PhotoGallery';
import { UnitDetail } from './pages/UnitDetail';
import FloorPlansDefault, * as FloorPlansModule from './pages/FloorPlans';

// FloorPlans may export default or named — resolve whichever exists.
const FloorPlans =
  (FloorPlansModule as Record<string, unknown>).FloorPlans ?? FloorPlansDefault;

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  if (!window.matchMedia) {
    vi.stubGlobal(
      'matchMedia',
      (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    );
  }
  // jsdom has no layout/scroll implementations.
  window.scrollTo = () => {};
  Element.prototype.scrollIntoView = () => {};
});

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  window.history.replaceState(null, '', '/');
});

function mountAt(path: string, node: React.ReactElement) {
  const { hook } = memoryLocation({ path });
  return render(<Router hook={hook}>{node}</Router>);
}

/** Assert the current DOM has labelled elements and none of them offend. */
function expectNoOffenders(where: string, minLabelled = 1) {
  const { offenders, labelledCount } = domLabelOffenders(document.body, where);
  // Guard against vacuous passes: the surface must actually contain
  // aria-labelled links/buttons, or this check proves nothing.
  expect(labelledCount, `${where}: expected aria-labelled elements in the DOM`).toBeGreaterThanOrEqual(minLabelled);
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

describe('interactive surfaces label-in-name (WCAG 2.5.3)', () => {
  it('Header: mobile menu open + all desktop nav dropdowns open', () => {
    mountAt('/', <Header />);

    // Open the mobile navigation panel.
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /toggle menu/i }));
    });
    expect(document.getElementById('mobile-nav')).not.toBeNull();

    // Open every desktop nav dropdown (they can all be open at once).
    const submenuButtons = screen.getAllByRole('button', { name: /submenu/i });
    expect(submenuButtons.length).toBeGreaterThan(0);
    act(() => {
      for (const btn of submenuButtons) fireEvent.click(btn);
    });
    for (const btn of submenuButtons) {
      expect(btn.getAttribute('aria-expanded')).toBe('true');
    }

    expectNoOffenders('Header (mobile menu + nav dropdowns open)');
  });

  it('PhotoGallery: lightbox open', () => {
    mountAt('/photo-gallery', <PhotoGallery />);

    // Click the first gallery photo to open the lightbox.
    const closedButtons = document.querySelectorAll('button').length;
    const grid = Array.from(document.querySelectorAll('button')).find((b) =>
      b.querySelector('img, picture'),
    );
    if (!grid) throw new Error('No gallery photo button found');
    act(() => {
      fireEvent.click(grid);
    });
    // The lightbox adds Close / Previous / Next buttons.
    expect(document.querySelectorAll('button').length).toBeGreaterThan(closedButtons);
    expect(screen.getAllByRole('button', { name: /close/i }).length).toBeGreaterThan(0);

    expectNoOffenders('PhotoGallery (lightbox open)');
  });

  it('UnitDetail: photo gallery lightbox open', () => {
    mountAt(
      '/available-units/0807',
      <Route path="/available-units/:unit" component={UnitDetail} />,
    );

    act(() => {
      fireEvent.click(
        screen.getByRole('button', { name: /photos of apartment .* view all/i }),
      );
    });
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();

    expectNoOffenders('UnitDetail (unit photo lightbox open)');
  });

  it('UnitDetail: floor-plan modal open', () => {
    mountAt(
      '/available-units/0807',
      <Route path="/available-units/:unit" component={UnitDetail} />,
    );

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /floor plan/i }));
    });
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();

    expectNoOffenders('UnitDetail (floor-plan modal open)');
  });

  it('FloorPlans: mobile filter sheet open', () => {
    mountAt('/floor-plans', <FloorPlans />);

    const filtersBtn = screen
      .getAllByRole('button')
      .find((b) => /filters/i.test(b.textContent ?? ''));
    if (!filtersBtn) throw new Error('Filters sheet trigger not found');
    act(() => {
      fireEvent.click(filtersBtn);
    });
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();

    expectNoOffenders('FloorPlans (filter sheet open)');
  });
});
