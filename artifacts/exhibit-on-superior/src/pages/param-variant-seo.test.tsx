// @vitest-environment jsdom
// Parameterized page variants (?ada=1, ?unit=) must emit their own title and
// description so crawlers don't flag them as duplicates of the base pages
// (canonicals still point at the base paths). Regression for SEO Phase 5.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render } from '@testing-library/react';

// Radix's slider (used by the floor-plan filters) needs ResizeObserver,
// which jsdom does not provide.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as { ResizeObserver?: unknown }).ResizeObserver ??= ResizeObserverStub;

// Capture the head model the pages hand to <Seo> instead of rendering Helmet.
const seoCalls: Record<string, unknown>[] = [];
vi.mock('../components/Seo', () => ({
  Seo: (props: Record<string, unknown>) => {
    seoCalls.push(props);
    return null;
  },
}));

let search = '';
vi.mock('wouter', async (importOriginal) => ({
  ...(await importOriginal<typeof import('wouter')>()),
  useSearch: () => search,
}));

vi.mock('../hooks/use-availability', () => ({
  useAvailability: () => ({ data: { units: [] }, isPending: false }),
  normalizeAvailability: (d: unknown) => d,
}));

function renderPage(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

function lastSeo() {
  expect(seoCalls.length).toBeGreaterThan(0);
  return seoCalls[seoCalls.length - 1];
}

afterEach(() => {
  cleanup();
  seoCalls.length = 0;
  search = '';
  window.history.replaceState(null, '', '/');
});

describe('parameterized page variants emit distinct head metadata', () => {
  it('/available-units?ada=1 overrides title and description', async () => {
    window.history.replaceState(null, '', '/available-units?ada=1');
    const { FloorPlans } = await import('./FloorPlans');
    renderPage(<FloorPlans />);
    const seo = lastSeo();
    expect(seo.title).toContain('ADA-Accessible');
    expect(seo.description).toContain('ADA-accessible');
  });

  it('/floor-plans?ada=1 overrides title and description', async () => {
    window.history.replaceState(null, '', '/floor-plans?ada=1');
    const { FloorPlansHub } = await import('./FloorPlansHub');
    renderPage(<FloorPlansHub />);
    const seo = lastSeo();
    expect(seo.path).toBe('/floor-plans');
    expect(seo.title).toContain('ADA-Accessible');
    expect(seo.description).toContain('ADA-accessible');
  });

  it('/floor-plans without params keeps the base metadata', async () => {
    window.history.replaceState(null, '', '/floor-plans');
    const { FloorPlansHub } = await import('./FloorPlansHub');
    renderPage(<FloorPlansHub />);
    const seo = lastSeo();
    expect(seo.path).toBe('/floor-plans');
    expect(seo.title).toBeUndefined();
    expect(seo.description).toBeUndefined();
  });

  it('/available-units without params keeps the base metadata', async () => {
    window.history.replaceState(null, '', '/available-units');
    const { FloorPlans } = await import('./FloorPlans');
    renderPage(<FloorPlans />);
    const seo = lastSeo();
    expect(seo.title).toBeUndefined();
    expect(seo.description).toBeUndefined();
  });

  it('/schedule-a-tour?unit= overrides title and description with the unit', async () => {
    search = 'unit=0208';
    const { ScheduleTour } = await import('./ScheduleTour');
    renderPage(<ScheduleTour />);
    const seo = lastSeo();
    expect(seo.title).toContain('Apt 0208');
    expect(seo.description).toContain('0208');
  });

  it('/schedule-showing?unit= overrides title and description with the unit', async () => {
    search = 'unit=0208';
    const { ScheduleShowing } = await import('./ScheduleShowing');
    renderPage(<ScheduleShowing />);
    const seo = lastSeo();
    expect(seo.title).toContain('Apt 0208');
    expect(seo.description).toContain('0208');
  });

  it('base tour/showing pages keep their base metadata', async () => {
    const { ScheduleTour } = await import('./ScheduleTour');
    renderPage(<ScheduleTour />);
    expect(lastSeo().title).toBeUndefined();
    seoCalls.length = 0;
    const { ScheduleShowing } = await import('./ScheduleShowing');
    renderPage(<ScheduleShowing />);
    const seo = lastSeo();
    expect(seo.title).toBeUndefined();
    expect(seo.description).toBeUndefined();
  });
});
