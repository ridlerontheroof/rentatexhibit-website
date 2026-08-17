// Unit tests for the blog prose linkifier (blogLinkifier.ts).
//
// Covers: matching, case-insensitivity, once-per-destination across calls,
// self-link exclusion, multiple destinations in one string, text
// reconstruction, and no-match passthrough.
import { describe, expect, it } from 'vitest';
import { linkifyText, BLOG_LINK_PHRASES } from './blogLinkifier';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function joined(text: string, usedDests = new Set<string>(), selfPath = '/blog/test-article') {
  return linkifyText(text, usedDests, selfPath).map((s) => s.text).join('');
}
function linkedSegments(
  text: string,
  usedDests = new Set<string>(),
  selfPath = '/blog/test-article',
) {
  return linkifyText(text, usedDests, selfPath).filter((s) => s.href);
}

// ---------------------------------------------------------------------------
// Basic passthrough
// ---------------------------------------------------------------------------
describe('linkifyText — no match', () => {
  it('returns a single plain segment when no phrase matches', () => {
    const result = linkifyText('Nothing to link here.', new Set(), '/blog/test');
    expect(result).toEqual([{ text: 'Nothing to link here.' }]);
  });

  it('preserves the exact original string (no trimming/normalization)', () => {
    const text = '  Leading and trailing spaces.  ';
    expect(joined(text)).toBe(text);
  });

  it('handles an empty string', () => {
    const result = linkifyText('', new Set(), '/blog/test');
    expect(result).toEqual([{ text: '' }]);
  });
});

// ---------------------------------------------------------------------------
// Single-phrase matching
// ---------------------------------------------------------------------------
describe('linkifyText — single phrase', () => {
  it('links "schedule a tour"', () => {
    const segs = linkedSegments('You can schedule a tour this week.');
    expect(segs.length).toBe(1);
    expect(segs[0].href).toBe('/schedule-a-tour');
    expect(segs[0].text).toBe('schedule a tour');
  });

  it('links "book a tour"', () => {
    const segs = linkedSegments('Feel free to book a tour online.');
    expect(segs.length).toBe(1);
    expect(segs[0].href).toBe('/schedule-a-tour');
  });

  it('links "available units"', () => {
    const segs = linkedSegments('Browse our available units now.');
    expect(segs.length).toBe(1);
    expect(segs[0].href).toBe('/available-units');
  });

  it('links "available apartments"', () => {
    const segs = linkedSegments('See all available apartments on this page.');
    expect(segs[0].href).toBe('/available-units');
  });

  it('links "current availability"', () => {
    const segs = linkedSegments('Check current availability before applying.');
    expect(segs[0].href).toBe('/available-units');
  });

  it('links "floor plans"', () => {
    const segs = linkedSegments('Compare our floor plans side by side.');
    expect(segs[0].href).toBe('/floor-plans');
  });

  it('links "floor plan" (singular)', () => {
    const segs = linkedSegments('Every floor plan includes in-home laundry.');
    expect(segs[0].href).toBe('/floor-plans');
  });

  it('links "building amenities"', () => {
    const segs = linkedSegments('Building amenities include a pool and gym.');
    expect(segs[0].href).toBe('/amenities');
  });

  it('links "community amenities"', () => {
    const segs = linkedSegments('Our community amenities span a full floor.');
    expect(segs[0].href).toBe('/amenities');
  });

  it('links "amenity deck"', () => {
    const segs = linkedSegments('The amenity deck sits above the street.');
    expect(segs[0].href).toBe('/amenities');
  });

  it('links "pet-friendly"', () => {
    const segs = linkedSegments('Exhibit is a pet-friendly building.');
    expect(segs[0].href).toBe('/pet-friendly');
  });

  it('links "pet policy"', () => {
    const segs = linkedSegments('Ask about the pet policy before applying.');
    expect(segs[0].href).toBe('/pet-friendly');
  });

  it('links "leasing team"', () => {
    const segs = linkedSegments('Contact our leasing team for details.');
    expect(segs[0].href).toBe('/contact-us');
  });

  it('links "leasing office"', () => {
    const segs = linkedSegments('Reach the leasing office by email.');
    expect(segs[0].href).toBe('/contact-us');
  });

  it('links "fee schedule"', () => {
    const segs = linkedSegments('Request the full fee schedule before signing.');
    expect(segs[0].href).toBe('/fees');
  });

  it('links "full fee list"', () => {
    const segs = linkedSegments('Ask for the full fee list when touring.');
    expect(segs[0].href).toBe('/fees');
  });

  it('links "neighborhood guide"', () => {
    const segs = linkedSegments('See our neighborhood guide for details.');
    expect(segs[0].href).toBe('/neighborhood');
  });

  it('links "resident reviews"', () => {
    const segs = linkedSegments('Read our resident reviews on the site.');
    expect(segs[0].href).toBe('/reviews');
  });
});

// ---------------------------------------------------------------------------
// Case-insensitivity
// ---------------------------------------------------------------------------
describe('linkifyText — case insensitivity', () => {
  it('matches mixed case', () => {
    const segs = linkedSegments('Schedule A Tour at your convenience.');
    expect(segs[0].href).toBe('/schedule-a-tour');
  });

  it('preserves the original case of the matched text', () => {
    const segs = linkedSegments('See our Floor Plans for details.');
    expect(segs[0].text).toBe('Floor Plans');
  });
});

// ---------------------------------------------------------------------------
// Text reconstruction invariant
// ---------------------------------------------------------------------------
describe('linkifyText — text reconstruction', () => {
  it('reconstructs the original string from segments', () => {
    const texts = [
      'The building amenities include a pool. You can schedule a tour today.',
      'Review the floor plans and check current availability before applying.',
      'Our leasing team can help with pet policy questions.',
      'No links in this sentence at all.',
      '',
    ];
    for (const text of texts) {
      expect(joined(text), `reconstruction failed for: "${text}"`).toBe(text);
    }
  });
});

// ---------------------------------------------------------------------------
// Once-per-destination rule
// ---------------------------------------------------------------------------
describe('linkifyText — once-per-destination', () => {
  it('does not link the same destination twice across separate calls', () => {
    const used = new Set<string>();
    const r1 = linkifyText('You can schedule a tour today.', used, '/blog/test');
    expect(r1.some((s) => s.href === '/schedule-a-tour')).toBe(true);
    expect(used.has('/schedule-a-tour')).toBe(true);

    const r2 = linkifyText('Also feel free to book a tour next week.', used, '/blog/test');
    expect(r2.some((s) => s.href === '/schedule-a-tour')).toBe(false);
  });

  it('does not link the same destination twice within a single string via synonym patterns', () => {
    // "schedule a tour" and "book a tour" both map to /schedule-a-tour.
    // Only the first match in the string should be linked.
    const used = new Set<string>();
    const segs = linkifyText(
      'You can schedule a tour or book a tour online.',
      used,
      '/blog/test',
    );
    const linked = segs.filter((s) => s.href === '/schedule-a-tour');
    expect(linked.length).toBe(1);
  });

  it('adds the matched destination to usedDests so future calls skip it', () => {
    const used = new Set<string>();
    linkifyText('Browse our floor plans here.', used, '/blog/test');
    expect(used.has('/floor-plans')).toBe(true);
  });

  it('does not mutate usedDests when no phrase matches', () => {
    const used = new Set<string>();
    linkifyText('Nothing to match here.', used, '/blog/test');
    expect(used.size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Self-link exclusion
// ---------------------------------------------------------------------------
describe('linkifyText — self-link exclusion', () => {
  it('skips a phrase whose href matches the selfPath', () => {
    // An article living at /floor-plans should not link to /floor-plans.
    const segs = linkifyText('Review the floor plans carefully.', new Set(), '/floor-plans');
    expect(segs.every((s) => !s.href)).toBe(true);
  });

  it('links the phrase normally when selfPath differs', () => {
    const segs = linkifyText('Review the floor plans carefully.', new Set(), '/blog/some-article');
    expect(segs.some((s) => s.href === '/floor-plans')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Multiple destinations in one string
// ---------------------------------------------------------------------------
describe('linkifyText — multiple destinations', () => {
  it('links two different destinations in one string', () => {
    const segs = linkifyText(
      'Compare the floor plans and schedule a tour.',
      new Set(),
      '/blog/test',
    );
    const linked = segs.filter((s) => s.href);
    const hrefs = linked.map((s) => s.href);
    expect(hrefs).toContain('/floor-plans');
    expect(hrefs).toContain('/schedule-a-tour');
  });

  it('maintains segment order matching the source string', () => {
    const segs = linkifyText(
      'See available units and review the fee schedule.',
      new Set(),
      '/blog/test',
    );
    const linked = segs.filter((s) => s.href);
    expect(linked[0].href).toBe('/available-units');
    expect(linked[1].href).toBe('/fees');
  });
});

// ---------------------------------------------------------------------------
// Phrase map integrity
// ---------------------------------------------------------------------------
describe('BLOG_LINK_PHRASES map integrity', () => {
  it('every pattern has a non-empty href starting with /', () => {
    for (const { href } of BLOG_LINK_PHRASES) {
      expect(href).toMatch(/^\//);
      expect(href.length).toBeGreaterThan(1);
    }
  });

  it('every pattern is a global case-insensitive RegExp', () => {
    for (const { pattern } of BLOG_LINK_PHRASES) {
      expect(pattern.flags).toContain('g');
      expect(pattern.flags).toContain('i');
    }
  });
});
