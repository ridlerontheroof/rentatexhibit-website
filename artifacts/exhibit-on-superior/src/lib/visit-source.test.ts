// @vitest-environment jsdom
/**
 * Visit-scoped source attribution: capture UTM tags on landing, remember the
 * label across in-site navigation (sessionStorage), enforce the leasing
 * team's `Website (UTM-HERE)` label convention (no spaces or special
 * characters inside the parentheses), and keep the default behavior
 * (null → "Website (Exhibit)" downstream) for visits without campaign tags.
 */
import { afterEach, describe, expect, it } from 'vitest';
import {
  captureVisitSource,
  clearVisitSourceForTests,
  getVisitSource,
  sanitizeVisitSource,
  visitSourceFromUrl,
  VISIT_SOURCE_MAX_LENGTH,
} from './visitSource';

afterEach(() => clearVisitSourceForTests());

describe('visitSourceFromUrl', () => {
  it('maps Google Ads UTM tags to "Website (GoogleAds-{Campaign})"', () => {
    expect(
      visitSourceFromUrl(
        'https://www.exhibitonsuperior.com/?utm_source=google&utm_medium=cpc&utm_campaign=spring_promo',
      ),
    ).toBe('Website (GoogleAds-SpringPromo)');
  });

  it('recognizes the common Google Ads utm_source spellings', () => {
    for (const s of ['google', 'googleads', 'google_ads', 'google-ads', 'adwords']) {
      expect(visitSourceFromUrl(`https://x.com/?utm_source=${s}`)).toBe('Website (GoogleAds)');
    }
  });

  it('labels non-Google sources with a tokenized channel name', () => {
    expect(visitSourceFromUrl('https://x.com/?utm_source=facebook&utm_campaign=open_house')).toBe(
      'Website (Facebook-OpenHouse)',
    );
  });

  it('returns null without utm_source (default behavior unchanged)', () => {
    expect(visitSourceFromUrl('https://x.com/floor-plans')).toBeNull();
    expect(visitSourceFromUrl('https://x.com/?utm_campaign=orphan')).toBeNull();
  });

  it('strips junk from campaigns down to safe tokens', () => {
    expect(
      visitSourceFromUrl(
        'https://x.com/?utm_source=google&utm_campaign=%3Cscript%3Ealert(1)%3C/script%3E',
      ),
    ).toBe('Website (GoogleAds-ScriptAlert1Script)');
    // A campaign with no salvageable characters keeps just the channel.
    expect(visitSourceFromUrl('https://x.com/?utm_source=google&utm_campaign=%22%27%3C%3E')).toBe(
      'Website (GoogleAds)',
    );
  });

  it('caps overlong labels at the max length without a dangling hyphen', () => {
    const long = 'a'.repeat(300);
    const label = visitSourceFromUrl(`https://x.com/?utm_source=google&utm_campaign=${long}`);
    expect(label).not.toBeNull();
    expect(label!.length).toBeLessThanOrEqual(VISIT_SOURCE_MAX_LENGTH);
    expect(label!.startsWith('Website (GoogleAds-')).toBe(true);
    expect(label!.endsWith(')')).toBe(true);
  });
});

describe('sanitizeVisitSource', () => {
  it('accepts only the Website (Token) convention', () => {
    expect(sanitizeVisitSource('Website (GoogleAds-SpringPromo)')).toBe(
      'Website (GoogleAds-SpringPromo)',
    );
    expect(sanitizeVisitSource('Website (Exhibit)')).toBe('Website (Exhibit)');
  });

  it('rejects spaces or special characters inside the parentheses', () => {
    expect(sanitizeVisitSource('Website (Google Ads)')).toBeNull();
    // Underscore is allowed — the contact-link label uses it.
    expect(sanitizeVisitSource('Website (Google_Ads)')).toBe('Website (Google_Ads)');
    expect(sanitizeVisitSource('Website (Exhibit_ContactUs)')).toBe('Website (Exhibit_ContactUs)');
    expect(sanitizeVisitSource('Website (<script>)')).toBeNull();
    expect(sanitizeVisitSource('Website ()')).toBeNull();
  });

  it('rejects anything not shaped like the convention', () => {
    expect(sanitizeVisitSource('Google Ads — Spring Promo')).toBeNull();
    expect(sanitizeVisitSource('<img onerror=x>')).toBeNull();
    expect(sanitizeVisitSource('   ')).toBeNull();
    expect(sanitizeVisitSource(42)).toBeNull();
    expect(sanitizeVisitSource(`Website (${'x'.repeat(VISIT_SOURCE_MAX_LENGTH)})`)).toBeNull();
  });
});

describe('capture + persistence across in-site navigation', () => {
  it('remembers the source for the visit and survives later tagless reads', () => {
    captureVisitSource('https://x.com/?utm_source=google&utm_campaign=tour_blitz');
    expect(getVisitSource()).toBe('Website (GoogleAds-TourBlitz)');
    // SPA navigation doesn't re-capture; a later boot-style capture on a
    // tagless URL must not clear the remembered attribution.
    captureVisitSource('https://x.com/floor-plans');
    expect(getVisitSource()).toBe('Website (GoogleAds-TourBlitz)');
  });

  it('a new campaign landing overwrites the previous one', () => {
    captureVisitSource('https://x.com/?utm_source=google&utm_campaign=one');
    captureVisitSource('https://x.com/?utm_source=google&utm_campaign=two');
    expect(getVisitSource()).toBe('Website (GoogleAds-Two)');
  });

  it('returns null when nothing was captured', () => {
    expect(getVisitSource()).toBeNull();
  });

  it('re-validates on read so tampered storage never leaks junk', () => {
    window.sessionStorage.setItem('exhibit-visit-source', '<script>bad</script>');
    expect(getVisitSource()).toBeNull();
    window.sessionStorage.setItem('exhibit-visit-source', 'Website (has space)');
    expect(getVisitSource()).toBeNull();
  });
});
