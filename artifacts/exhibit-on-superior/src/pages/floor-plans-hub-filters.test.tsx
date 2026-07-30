// @vitest-environment jsdom
// /floor-plans hub filter panel: the layout grid narrows live, filter state
// round-trips to ?q/beds/floors/sqft/ada, every control has an accessible
// name, and a polite live region announces the shown-layout count.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import {
  FLOOR_PLAN_PAGES,
  filterFloorPlanPages,
} from '../data/floorPlanPages';
import { SQFT_MIN, SQFT_MAX, type Category } from '../data/floorPlans';

// Radix's slider (used by the floor-plan filters) needs ResizeObserver,
// which jsdom does not provide.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as { ResizeObserver?: unknown }).ResizeObserver ??= ResizeObserverStub;

vi.mock('../components/Seo', () => ({ Seo: () => null }));

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
});

const defaultFilters = () => ({
  categories: new Set<Category>(),
  bands: new Set<string>(),
  sqft: [SQFT_MIN, SQFT_MAX] as [number, number],
  ada: false,
});

describe('filterFloorPlanPages (pure)', () => {
  it('default state passes every layout', () => {
    expect(filterFloorPlanPages(FLOOR_PLAN_PAGES, '', defaultFilters())).toHaveLength(
      FLOOR_PLAN_PAGES.length,
    );
  });

  it('narrows by category, floor band, sqft, and ADA', () => {
    const studios = filterFloorPlanPages(FLOOR_PLAN_PAGES, '', {
      ...defaultFilters(),
      categories: new Set<Category>(['studio']),
    });
    expect(studios.length).toBeGreaterThan(0);
    expect(studios.every((fp) => fp.plan.category === 'studio')).toBe(true);

    const penthouse = filterFloorPlanPages(FLOOR_PLAN_PAGES, '', {
      ...defaultFilters(),
      bands: new Set(['penthouse']),
    });
    expect(penthouse.length).toBeGreaterThan(0);
    // Only sheets whose own floor range reaches the 30-34 band qualify —
    // not lower-floor sheets of the same residence line.
    expect(penthouse.every((fp) => fp.plan.floorMax >= 30)).toBe(true);

    const big = filterFloorPlanPages(FLOOR_PLAN_PAGES, '', {
      ...defaultFilters(),
      sqft: [1200, SQFT_MAX],
    });
    expect(big.length).toBeGreaterThan(0);
    expect(big.every((fp) => fp.plan.sqft >= 1200)).toBe(true);

    const ada = filterFloorPlanPages(FLOOR_PLAN_PAGES, '', {
      ...defaultFilters(),
      ada: true,
    });
    expect(ada.length).toBeGreaterThan(0);
    expect(ada.every((fp) => fp.adaUnits.length > 0)).toBe(true);
  });

  it('search matches the specific sheet floor range, not the whole line', () => {
    // "22" must match sheets containing floor 22, not floor-17-21 siblings.
    const hits = filterFloorPlanPages(FLOOR_PLAN_PAGES, '22', defaultFilters());
    expect(hits.length).toBeGreaterThan(0);
    expect(
      hits.every((fp) => fp.plan.floors.includes(22) || fp.plan.unit === 22),
    ).toBe(true);
  });
});

describe('floor-plans hub filter panel', () => {
  it('narrows the grid live and announces the count in a polite live region', async () => {
    window.history.replaceState(null, '', '/floor-plans');
    const { FloorPlansHub } = await import('./FloorPlansHub');
    render(<FloorPlansHub />);

    const status = screen.getByRole('status');
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.textContent).toBe(`${FLOOR_PLAN_PAGES.length} layouts shown`);

    const studio = screen.getAllByRole('button', { name: /^Studio$/i })[0];
    fireEvent.click(studio);
    expect(studio.getAttribute('aria-pressed')).toBe('true');
    expect(status.textContent).toMatch(/^\d+ layouts? shown$/);
    expect(status.textContent).not.toBe(`${FLOOR_PLAN_PAGES.length} layouts shown`);

    // Grid narrowed: only the Studio section remains.
    expect(screen.queryByRole('heading', { level: 2, name: /two bedroom/i })).toBeNull();
  });

  it('syncs filter state to ?beds/floors/ada/q and clears back to the bare URL', async () => {
    window.history.replaceState(null, '', '/floor-plans');
    const { FloorPlansHub } = await import('./FloorPlansHub');
    render(<FloorPlansHub />);

    fireEvent.click(screen.getAllByRole('button', { name: /^Studio$/i })[0]);
    expect(window.location.search).toContain('beds=studio');

    const ada = screen.getAllByRole('button', { name: /show only ADA-accessible floor plans/i })[0];
    fireEvent.click(ada);
    expect(window.location.search).toContain('ada=1');

    const search = screen.getAllByLabelText('Search layouts by residence line or floor')[0];
    fireEvent.change(search, { target: { value: 'unit 06' } });
    expect(window.location.search).toContain('q=unit+06');

    // Clear all -> bare /floor-plans, no params.
    fireEvent.click(screen.getAllByRole('button', { name: /clear all filters/i })[0]);
    expect(window.location.search).toBe('');
    expect(window.location.pathname).toBe('/floor-plans');
  });

  it('reads filters from the URL on load (shareable links)', async () => {
    window.history.replaceState(null, '', '/floor-plans?beds=3br');
    const { FloorPlansHub } = await import('./FloorPlansHub');
    render(<FloorPlansHub />);
    const status = screen.getByRole('status');
    const threeBr = FLOOR_PLAN_PAGES.filter((fp) => fp.plan.category === '3br').length;
    expect(status.textContent).toBe(`${threeBr} layouts shown`);
  });

  it('gives every filter control an accessible name and pressed state', async () => {
    window.history.replaceState(null, '', '/floor-plans');
    const { FloorPlansHub } = await import('./FloorPlansHub');
    const { container } = render(<FloorPlansHub />);

    // Search inputs (desktop sidebar + mobile top bar).
    expect(
      screen.getAllByLabelText('Search layouts by residence line or floor').length,
    ).toBeGreaterThanOrEqual(2);

    // Slider thumbs carry explicit labels.
    expect(screen.getAllByLabelText('Minimum square footage').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByLabelText('Maximum square footage').length).toBeGreaterThanOrEqual(1);

    // ADA toggle is self-explanatory without visual context.
    const ada = screen.getAllByRole('button', { name: /show only ADA-accessible floor plans/i });
    expect(ada.length).toBeGreaterThanOrEqual(1);
    expect(ada[0].getAttribute('aria-pressed')).toBe('false');

    // Every button has a non-empty accessible name.
    for (const btn of Array.from(container.querySelectorAll('button'))) {
      const name = btn.getAttribute('aria-label') ?? btn.textContent?.trim() ?? '';
      expect(name.length, `button missing accessible name: ${btn.outerHTML.slice(0, 120)}`).toBeGreaterThan(0);
    }

    // Bedroom/floor toggles expose pressed state.
    const bedroomGroup = screen.getAllByRole('group', { name: /bedrooms/i })[0];
    for (const btn of within(bedroomGroup).getAllByRole('button')) {
      expect(btn.getAttribute('aria-pressed')).toMatch(/^(true|false)$/);
    }

    // Focus stays on the control that changed.
    const studio = screen.getAllByRole('button', { name: /^Studio$/i })[0];
    studio.focus();
    fireEvent.click(studio);
    expect(document.activeElement).toBe(studio);
  });
});
