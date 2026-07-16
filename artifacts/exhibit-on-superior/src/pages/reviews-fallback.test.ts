// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement, type ReactNode } from 'react';
import { cleanup, render, waitFor, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import type { GoogleReviewsData } from '../hooks/use-google-reviews';

// These tests guard the Reviews page's curated-quote fallback: when the live
// Google feed returns no usable quotes (all recent reviews below 4 stars, API
// quota exhausted, or an outright 5xx from the proxy), the grid must still
// show the three curated quotes and the curated 4.2 / 136 aggregate instead
// of rendering blank.
//
// jsdom + manual cleanup follow the pattern in
// `.agents/memory/vitest-dom-hook-tests.md`.

// Mutable override: when set, the mocked hook returns it verbatim; when
// undefined, the real hook implementation runs (so the 503 test exercises the
// genuine fetch + react-query path).
let hookOverride: { data: GoogleReviewsData | undefined } | undefined;

vi.mock('../hooks/use-google-reviews', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../hooks/use-google-reviews')>();
  return {
    ...actual,
    useGoogleReviews: () =>
      hookOverride !== undefined ? hookOverride : actual.useGoogleReviews(),
  };
});

// Import after vi.mock so the page picks up the mocked module.
import { Reviews } from './Reviews';

const CURATED_SNIPPETS = [
  "I honestly can't say enough about Exhibit",
  'Will be resigning my lease!',
  "I've enjoyed living here for almost three years",
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

function renderReviews() {
  return render(createElement(Reviews), { wrapper: Providers });
}

function expectCuratedFallback() {
  for (const snippet of CURATED_SNIPPETS) {
    expect(
      screen.getByText((text) => text.includes(snippet), {
        selector: 'blockquote',
      }),
    ).toBeTruthy();
  }
  // Curated aggregate stays in place (live count 5 < curated 136, or no data).
  expect(screen.getByText('4.2')).toBeTruthy();
  expect(screen.getByText('136')).toBeTruthy();
}

beforeEach(() => {
  hookOverride = undefined;
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('Reviews page fallback', () => {
  it('renders the three curated quotes when the hook returns an empty reviews array', () => {
    hookOverride = {
      data: { rating: 3.8, reviewCount: 5, reviews: [] },
    };

    renderReviews();

    expectCuratedFallback();
    // Exactly the three curated cards — nothing extra, nothing blank.
    expect(document.querySelectorAll('figure blockquote')).toHaveLength(3);
  });

  it('renders the curated quotes when /api/reviews responds 503', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response('Service Unavailable', { status: 503 }),
      );
    vi.stubGlobal('fetch', fetchMock);

    renderReviews();

    // Real hook runs: wait for the query to fire (and fail) so we assert the
    // settled state, not just the initial render.
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await waitFor(() => expectCuratedFallback());
    expect(document.querySelectorAll('figure blockquote')).toHaveLength(3);
    expect(String(fetchMock.mock.calls[0][0])).toContain('api/reviews');
  });
});
