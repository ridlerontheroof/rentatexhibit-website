// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Lead-attribution privacy tests.
 *
 * `trackLead` must never forward form-field values (name, email, phone,
 * message, …) to Google Analytics. These tests lock down the exact set of
 * gtag parameter keys allowed on a `generate_lead` event and verify UTM
 * capture/persistence via sessionStorage across simulated SPA navigation.
 */

type Analytics = typeof import('./analytics');

/** Every key trackLead is allowed to send. Adding a key here needs review. */
const ALLOWED_LEAD_KEYS = new Set([
  'form_type',
  'page_path',
  'referring_page',
  'floor_plan_preference',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
]);

const PII_KEY_PATTERN = /name|email|phone|message|first|last|contact/i;

let gtagSpy: ReturnType<typeof vi.fn>;

/**
 * Import a fresh copy of the analytics module (its module-level state —
 * initialized flag, SPA path history — must not leak between tests) with the
 * GA measurement ID stubbed so analytics is enabled.
 */
async function loadAnalytics(landingUrl = '/'): Promise<Analytics> {
  window.history.replaceState(null, '', landingUrl);
  vi.resetModules();
  vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST123');
  const analytics = await import('./analytics');
  // initAnalytics defines window.gtag; replace it with a spy so we can
  // inspect event payloads without gtag.js.
  analytics.initAnalytics();
  gtagSpy = vi.fn();
  window.gtag = gtagSpy as unknown as typeof window.gtag;
  return analytics;
}

/** The params object of the last `generate_lead` event sent to gtag. */
function lastLeadParams(): Record<string, unknown> {
  const call = [...gtagSpy.mock.calls]
    .reverse()
    .find((args) => args[0] === 'event' && args[1] === 'generate_lead');
  expect(call, 'expected a generate_lead event').toBeDefined();
  return call![2] as Record<string, unknown>;
}

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  delete window.gtag;
  delete window.dataLayer;
  document.head.querySelectorAll('script').forEach((s) => s.remove());
});

describe('trackLead payload whitelist (no PII)', () => {
  it('sends only whitelisted attribution keys for a contact lead', async () => {
    const analytics = await loadAnalytics();
    analytics.trackPageView('/contact');
    analytics.trackLead('contact');

    const params = lastLeadParams();
    for (const key of Object.keys(params)) {
      expect(ALLOWED_LEAD_KEYS.has(key), `unexpected gtag param "${key}"`).toBe(true);
      expect(key).not.toMatch(PII_KEY_PATTERN);
    }
    expect(params.form_type).toBe('contact');
    expect(params.page_path).toBe('/contact');
  });

  it('sends only whitelisted keys for a tour lead with a floor-plan preference', async () => {
    const analytics = await loadAnalytics();
    analytics.trackPageView('/floor-plans');
    analytics.trackPageView('/tour');
    analytics.trackLead('tour', { floorPlanPreference: 'Residence 06' });

    const params = lastLeadParams();
    for (const key of Object.keys(params)) {
      expect(ALLOWED_LEAD_KEYS.has(key), `unexpected gtag param "${key}"`).toBe(true);
    }
    expect(params.form_type).toBe('tour');
    expect(params.floor_plan_preference).toBe('Residence 06');
    expect(params.referring_page).toBe('/floor-plans');
  });

  it('every payload value is a string (no objects that could smuggle form data)', async () => {
    const analytics = await loadAnalytics();
    analytics.trackPageView('/contact');
    analytics.trackLead('tour', { floorPlanPreference: 'A1' });

    for (const value of Object.values(lastLeadParams())) {
      expect(typeof value).toBe('string');
    }
  });

  it('ignores extra properties on the attribution argument', async () => {
    const analytics = await loadAnalytics();
    analytics.trackPageView('/contact');
    // Simulate a regression where a caller passes the whole form payload.
    analytics.trackLead('contact', {
      floorPlanPreference: 'B2',
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '312-555-0100',
    } as never);

    const params = lastLeadParams();
    expect(params).not.toHaveProperty('name');
    expect(params).not.toHaveProperty('email');
    expect(params).not.toHaveProperty('phone');
    for (const value of Object.values(params)) {
      expect(String(value)).not.toContain('jane@example.com');
      expect(String(value)).not.toContain('312-555-0100');
    }
  });
});

describe('trackOutboundClick payload whitelist (no PII)', () => {
  const ALLOWED_OUTBOUND_KEYS = new Set([
    'link_type',
    'link_url',
    'cta_location',
    'floor_plan',
    'page_path',
    'referring_page',
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
  ]);

  function lastOutboundParams(): Record<string, unknown> {
    const call = [...gtagSpy.mock.calls]
      .reverse()
      .find((args) => args[0] === 'event' && args[1] === 'outbound_click');
    expect(call, 'expected an outbound_click event').toBeDefined();
    return call![2] as Record<string, unknown>;
  }

  it('sends only whitelisted keys with page path and UTM attribution', async () => {
    const analytics = await loadAnalytics('/?utm_source=google&utm_medium=cpc');
    analytics.trackPageView('/');
    analytics.trackPageView('/floor-plans');
    analytics.trackOutboundClick('apply', 'https://example.com/apply', 'nav');

    const params = lastOutboundParams();
    for (const key of Object.keys(params)) {
      expect(ALLOWED_OUTBOUND_KEYS.has(key), `unexpected gtag param "${key}"`).toBe(true);
      expect(key).not.toMatch(PII_KEY_PATTERN);
      expect(typeof params[key]).toBe('string');
    }
    expect(params.link_type).toBe('apply');
    expect(params.link_url).toBe('https://example.com/apply');
    expect(params.cta_location).toBe('nav');
    expect(params.page_path).toBe('/floor-plans');
    expect(params.referring_page).toBe('/');
    expect(params.utm_source).toBe('google');
    expect(params.utm_medium).toBe('cpc');
  });

  it('sends availability clicks with the current page path', async () => {
    const analytics = await loadAnalytics();
    analytics.trackPageView('/floor-plans');
    analytics.trackOutboundClick('availability', 'https://example.com/units', 'plan_lightbox');

    const params = lastOutboundParams();
    expect(params.link_type).toBe('availability');
    expect(params.cta_location).toBe('plan_lightbox');
    expect(params.page_path).toBe('/floor-plans');
    expect(params).not.toHaveProperty('floor_plan');
  });

  it('includes only the whitelisted floor_plan key for lightbox availability clicks', async () => {
    const analytics = await loadAnalytics();
    analytics.trackPageView('/floor-plans');
    analytics.trackOutboundClick('availability', 'https://example.com/units', 'plan_lightbox', {
      floorPlan: 'Residence · Unit 06',
    });

    const params = lastOutboundParams();
    for (const key of Object.keys(params)) {
      expect(ALLOWED_OUTBOUND_KEYS.has(key), `unexpected gtag param "${key}"`).toBe(true);
      expect(key).not.toMatch(PII_KEY_PATTERN);
      expect(typeof params[key]).toBe('string');
    }
    expect(params.floor_plan).toBe('Residence · Unit 06');
  });

  it('ignores extra properties on the outbound attribution argument', async () => {
    const analytics = await loadAnalytics();
    analytics.trackPageView('/floor-plans');
    analytics.trackOutboundClick('availability', 'https://example.com/units', 'plan_lightbox', {
      floorPlan: 'A1',
      email: 'jane@example.com',
      name: 'Jane Doe',
    } as never);

    const params = lastOutboundParams();
    expect(params).not.toHaveProperty('email');
    expect(params).not.toHaveProperty('name');
    expect(params.floor_plan).toBe('A1');
  });

  it('truncates oversized floor_plan values to 100 characters', async () => {
    const analytics = await loadAnalytics();
    analytics.trackPageView('/floor-plans');
    analytics.trackOutboundClick('availability', 'https://example.com/units', 'plan_lightbox', {
      floorPlan: 'x'.repeat(500),
    });

    expect(String(lastOutboundParams().floor_plan)).toHaveLength(100);
  });
});

describe('UTM capture and persistence across SPA navigation', () => {
  it('captures utm params from the landing URL and attaches them to leads after navigation', async () => {
    const analytics = await loadAnalytics(
      '/?utm_source=google&utm_medium=cpc&utm_campaign=spring&gclid=abc123'
    );
    // Simulate SPA navigation away from the landing URL (query string gone).
    window.history.replaceState(null, '', '/contact');
    analytics.trackPageView('/');
    analytics.trackPageView('/contact');
    analytics.trackLead('contact');

    const params = lastLeadParams();
    expect(params.utm_source).toBe('google');
    expect(params.utm_medium).toBe('cpc');
    expect(params.utm_campaign).toBe('spring');
    // Non-UTM query params are never captured.
    expect(params).not.toHaveProperty('gclid');
  });

  it('persists utm params in sessionStorage so a fresh module load (reload) still has them', async () => {
    await loadAnalytics('/?utm_source=newsletter&utm_term=luxury');
    // Second load with no query string — simulates an in-session reload.
    const analytics = await loadAnalytics('/tour');
    analytics.trackPageView('/tour');
    analytics.trackLead('tour');

    const params = lastLeadParams();
    expect(params.utm_source).toBe('newsletter');
    expect(params.utm_term).toBe('luxury');
  });

  it('ignores non-string junk stored under the utm key', async () => {
    sessionStorage.setItem('exhibit_utm_params', JSON.stringify({ utm_source: 42, evil: 'x' }));
    const analytics = await loadAnalytics();
    analytics.trackPageView('/contact');
    analytics.trackLead('contact');

    const params = lastLeadParams();
    expect(params).not.toHaveProperty('utm_source');
    expect(params).not.toHaveProperty('evil');
  });

  it('truncates oversized utm values to 100 characters', async () => {
    const long = 'x'.repeat(500);
    const analytics = await loadAnalytics(
      `/?utm_campaign=${long}`
    );
    analytics.trackPageView('/contact');
    analytics.trackLead('contact');

    expect(String(lastLeadParams().utm_campaign)).toHaveLength(100);
  });
});
