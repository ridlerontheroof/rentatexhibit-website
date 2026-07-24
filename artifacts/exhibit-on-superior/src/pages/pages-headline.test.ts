// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement, type ComponentType, type ReactNode } from 'react';
import { render, type RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';

import { Amenities } from './Amenities';
import { ApartmentGuide } from './ApartmentGuide';
import { ApplicationGuide } from './ApplicationGuide';
import { FaqHub } from './FaqHub';
import { Fees } from './Fees';
import { ParkingTransportation } from './ParkingTransportation';
import { ContactUs } from './ContactUs';
import { FloorPlans } from './FloorPlans';
import { MapDirections } from './MapDirections';
import { Neighborhood } from './Neighborhood';
import { PetFriendly } from './PetFriendly';
import { PhotoGallery } from './PhotoGallery';
import { Residents } from './Residents';
import { Reviews } from './Reviews';
import { ScheduleTour } from './ScheduleTour';
import { VirtualTour } from './VirtualTour';

// Every page with a branded headline (Home is covered separately in
// components/split-headline.test.ts). Each entry lists the page component
// plus the hero script/caps copy that must survive page-level edits.
const PAGES: Array<{ name: string; Component: ComponentType }> = [
  { name: 'Amenities', Component: Amenities },
  { name: 'ApartmentGuide', Component: ApartmentGuide },
  { name: 'ApplicationGuide', Component: ApplicationGuide },
  { name: 'FaqHub', Component: FaqHub },
  { name: 'Fees', Component: Fees },
  { name: 'ParkingTransportation', Component: ParkingTransportation },
  { name: 'ContactUs', Component: ContactUs },
  { name: 'FloorPlans', Component: FloorPlans },
  { name: 'MapDirections', Component: MapDirections },
  { name: 'Neighborhood', Component: Neighborhood },
  { name: 'PetFriendly', Component: PetFriendly },
  { name: 'PhotoGallery', Component: PhotoGallery },
  { name: 'Residents', Component: Residents },
  { name: 'Reviews', Component: Reviews },
  { name: 'ScheduleTour', Component: ScheduleTour },
  { name: 'VirtualTour', Component: VirtualTour },
];

function Providers({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return createElement(
    HelmetProvider,
    null,
    createElement(QueryClientProvider, { client: queryClient }, children),
  );
}

// vitest globals are off in this project, so testing-library's auto-cleanup
// doesn't run; track renders and unmount them ourselves.
let active: RenderResult | null = null;

beforeEach(() => {
  // Reviews (and any future page) may fetch on mount; keep the network out of
  // the test and let pages fall back to curated/static content.
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({}), { status: 503 })),
  );
  // jsdom lacks ResizeObserver, which Radix components (e.g. the FloorPlans
  // range slider) need at mount time.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  active?.unmount();
  active = null;
  vi.unstubAllGlobals();
});

describe.each(PAGES)('$name page branded headline', ({ Component }) => {
  it('renders the script/caps hero headline with a gold rule somewhere on the page', () => {
    active = render(createElement(Component), { wrapper: Providers });
    const { container } = active;

    // Hero headline: an h1 carrying the branded caps line (all page heroes
    // render caps; most also render the handwritten script line).
    const h1 = container.querySelector('h1');
    expect(h1, 'page must render an h1 hero headline').not.toBeNull();
    const caps = h1!.querySelector('.headline-caps');
    expect(caps, 'hero h1 must contain a .headline-caps line').not.toBeNull();
    expect(caps!.textContent?.trim().length).toBeGreaterThan(0);

    // Branded typography present on the page overall.
    expect(
      container.querySelector('.headline-script'),
      'page must contain at least one handwritten .headline-script line',
    ).not.toBeNull();
    expect(
      container.querySelector('.headline-rule'),
      'page must contain at least one gold .headline-rule',
    ).not.toBeNull();
  });
});
