// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement, type ReactNode } from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Route, Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import { UnitDetail } from './UnitDetail';
import type { AvailableUnit } from '../hooks/use-availability';

// Neutralize the build-time availability snapshot: it contains the real
// units (possibly including 0807 with its own videoUrl), which would paint
// as placeholder data ahead of the mocked fetch and race these assertions.
vi.mock('../data/availabilitySnapshot', () => ({
  getBakedAvailability: () => null,
}));

// Pins the unit-detail video tour wiring: the embedded player renders only
// when the unit's videoUrl is a valid YouTube link (privacy-enhanced embed
// URL), and never for missing or non-YouTube links. jsdom + manual cleanup
// per `.agents/memory/vitest-dom-hook-tests.md`.

const baseUnit: AvailableUnit = {
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

function mockAvailability(unit: AvailableUnit) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      json: async () => ({ units: [unit], updatedAt: '2026-07-22T00:00:00Z' }),
    })),
  );
}

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

function renderUnitDetail() {
  const { hook } = memoryLocation({ path: '/available-units/0807' });
  return render(
    createElement(
      Router,
      { hook },
      createElement(Route, { path: '/available-units/:unit', component: UnitDetail }),
    ),
    { wrapper: Providers },
  );
}

async function waitForPage() {
  await waitFor(() => {
    if (!document.querySelector('h1')) throw new Error('page not loaded');
  });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('UnitDetail video tour', () => {
  it('embeds a privacy-enhanced player when the unit has a YouTube link', async () => {
    mockAvailability({ ...baseUnit, videoUrl: 'https://youtu.be/dQw4w9WgXcQ' });
    renderUnitDetail();
    await waitForPage();
    const iframe = document.querySelector('iframe');
    expect(iframe).not.toBeNull();
    expect(iframe!.src).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0');
    expect(iframe!.title).toContain('0807');
  });

  it('renders no video section when videoUrl is missing', async () => {
    mockAvailability(baseUnit);
    renderUnitDetail();
    await waitForPage();
    expect(document.querySelector('iframe')).toBeNull();
  });

  it('renders no video section for a non-YouTube link', async () => {
    mockAvailability({ ...baseUnit, videoUrl: 'https://vimeo.com/12345' });
    renderUnitDetail();
    await waitForPage();
    expect(document.querySelector('iframe')).toBeNull();
  });
});
