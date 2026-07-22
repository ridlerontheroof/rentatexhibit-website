// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';

/**
 * Outbound-redirect attribution tests.
 *
 * The Redirect component in App.tsx handles the routes that leave the SPA for
 * RentCafe (/apply, /available-units, and the legacy Wix apply URL). Because
 * `window.location.replace` tears the page down immediately, the
 * `outbound_click` event must be fired BEFORE the navigation call — and
 * analytics sends it with beacon transport so the browser flushes it even
 * after unload. These tests lock down both halves:
 *  1. Redirect fires trackOutboundClick with the right type before replace().
 *  2. trackOutboundClick tags the gtag event with transport_type: 'beacon'.
 */

// Mock the analytics module so we can observe call order without gtag.js.
vi.mock('./lib/analytics', () => ({
  initAnalytics: vi.fn(),
  trackPageView: vi.fn(),
  trackOutboundClick: vi.fn(),
}));

import { Redirect } from './App';
import { trackOutboundClick } from './lib/analytics';
import { APPLY_URL, AVAILABILITY_URL } from './data/seo';

const trackSpy = vi.mocked(trackOutboundClick);

// jsdom's location.replace throws "not implemented"; swap in a recording stub.
const replaceSpy = vi.fn();
const originalLocation = window.location;

beforeEach(() => {
  // Record the relative order of tracking vs. navigation.
  callOrder.length = 0;
  trackSpy.mockImplementation(() => {
    callOrder.push('track');
  });
  replaceSpy.mockImplementation(() => {
    callOrder.push('replace');
  });
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...originalLocation, replace: replaceSpy },
  });
});

const callOrder: string[] = [];

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: originalLocation,
  });
});

describe('Redirect outbound tracking (/apply, /available-units, legacy apply)', () => {
  it('fires an apply outbound_click before navigating for /apply and the legacy apply URL', async () => {
    // /apply and the legacy Wix apply route both render <Redirect to={APPLY_URL} cta="apply"/>.
    render(<Redirect to={APPLY_URL} cta="apply" />);

    await waitFor(() => expect(replaceSpy).toHaveBeenCalledWith(APPLY_URL));
    expect(trackSpy).toHaveBeenCalledTimes(1);
    expect(trackSpy).toHaveBeenCalledWith('apply', APPLY_URL, 'redirect');
    // The event must be queued before the page starts tearing down.
    expect(callOrder).toEqual(['track', 'replace']);
  });

  it('fires an availability outbound_click before navigating for /available-units', async () => {
    // cta is passed explicitly because APPLY_URL and AVAILABILITY_URL point at
    // the same destination, so the URL alone can't attribute the click.
    render(<Redirect to={AVAILABILITY_URL} cta="availability" />);

    await waitFor(() => expect(replaceSpy).toHaveBeenCalledWith(AVAILABILITY_URL));
    expect(trackSpy).toHaveBeenCalledWith('availability', AVAILABILITY_URL, 'redirect');
    expect(callOrder).toEqual(['track', 'replace']);
  });

  it('disables URL-based fallback attribution while APPLY and AVAILABILITY URLs are identical', async () => {
    // Both CTAs currently point at the same destination, so a Redirect
    // without an explicit `cta` must not guess — no tracking, still navigates.
    expect(APPLY_URL).toBe(AVAILABILITY_URL); // precondition for this guard
    render(<Redirect to={APPLY_URL} />);

    await waitFor(() => expect(replaceSpy).toHaveBeenCalledWith(APPLY_URL));
    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('keeps query and hash on internal redirects (legacy /floor-plans?plan= deep links)', async () => {
    // /floor-plans forwards its search + hash to /available-units so plan
    // lightbox deep links keep auto-opening after the rename.
    const historySpy = vi.spyOn(window.history, 'replaceState');
    render(<Redirect to="/available-units?plan=studio-06#available-units" />);

    await waitFor(() => expect(historySpy).toHaveBeenCalled());
    const target = String(historySpy.mock.calls.at(-1)![2]);
    expect(target).toContain('/available-units?plan=studio-06#available-units');
    expect(replaceSpy).not.toHaveBeenCalled(); // internal — no page teardown
    historySpy.mockRestore();
  });

  it('does not track other external redirects, but still navigates', async () => {
    render(<Redirect to="https://example.com/elsewhere" />);

    await waitFor(() => expect(replaceSpy).toHaveBeenCalledWith('https://example.com/elsewhere'));
    expect(trackSpy).not.toHaveBeenCalled();
  });
});

describe('trackOutboundClick beacon transport', () => {
  it('sends outbound_click with transport_type: beacon so the hit survives unload', async () => {
    // Use the real analytics module for this one (fresh copy, GA enabled).
    vi.resetModules();
    vi.doUnmock('./lib/analytics');
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST123');
    const analytics = await import('./lib/analytics');
    analytics.initAnalytics();
    const gtagSpy = vi.fn();
    window.gtag = gtagSpy as unknown as typeof window.gtag;

    analytics.trackOutboundClick('apply', APPLY_URL, 'redirect');

    const call = gtagSpy.mock.calls.find(
      (args) => args[0] === 'event' && args[1] === 'outbound_click'
    );
    expect(call, 'expected an outbound_click event').toBeDefined();
    expect((call![2] as Record<string, unknown>).transport_type).toBe('beacon');

    vi.unstubAllEnvs();
    delete window.gtag;
    delete window.dataLayer;
    document.head.querySelectorAll('script').forEach((s) => s.remove());
  });
});
