// Unit tests for the hydrated-head single-SEO guard's pure helpers
// (scripts/lib/hydrated-seo.mjs), covering the two regression classes the
// live check must catch:
//   1. a navigation that has NOT committed yet must never be satisfied by the
//      previous route's already-settled head (isSettled checks the href), and
//   2. malformed raw heads — duplicated preview tags, tags outside the seo
//      markers, missing markers — must fail the raw-head assertions.
import { describe, it, expect } from 'vitest';
import { analyzeRawHead, rawHeadFailures, isSettled, PREVIEW_TAGS } from './hydrated-seo.mjs';

const settledCounts = Object.fromEntries(PREVIEW_TAGS.map((t) => [t, 1]));
const settledSnap = (href) => ({ ...settledCounts, href, leftoverInBlock: 0, sawMarkers: true });

describe('isSettled', () => {
  it('accepts a clean single-set head on the expected URL', () => {
    expect(isSettled(settledSnap('https://x.test/amenities'), 'https://x.test/amenities')).toBe(true);
  });

  it('tolerates trailing-slash and hash differences on the same route', () => {
    expect(isSettled(settledSnap('https://x.test/amenities/'), 'https://x.test/amenities')).toBe(true);
    expect(isSettled(settledSnap('https://x.test/amenities#top'), 'https://x.test/amenities')).toBe(true);
  });

  it("rejects the PREVIOUS route's settled head while a navigation is pending", () => {
    // Regression: after Page.navigate to /amenities, the old document (/) is
    // still live and fully settled — its snapshot must NOT pass.
    expect(isSettled(settledSnap('https://x.test/'), 'https://x.test/amenities')).toBe(false);
  });

  it('rejects a null snapshot (head unreadable mid-navigation)', () => {
    expect(isSettled(null, 'https://x.test/')).toBe(false);
  });

  it('rejects duplicated tags and leftover elements inside the markers', () => {
    expect(isSettled({ ...settledSnap('https://x.test/'), ogImage: 2 }, 'https://x.test/')).toBe(false);
    expect(isSettled({ ...settledSnap('https://x.test/'), leftoverInBlock: 3 }, 'https://x.test/')).toBe(false);
    expect(isSettled({ ...settledSnap('https://x.test/'), twitterImage: 0 }, 'https://x.test/')).toBe(false);
  });
});

const singleSet = `
  <title>Home</title>
  <link rel="canonical" href="https://x.test/" />
  <meta property="og:title" content="Home" />
  <meta property="og:image" content="https://x.test/og.jpg" />
  <meta property="og:image:width" content="1200" />
  <meta name="twitter:image" content="https://x.test/og.jpg" />
`;
const page = (headInner) => `<!doctype html><html><head>${headInner}</head><body></body></html>`;
const cleanHead = page(`<!-- seo:start -->${singleSet}<!-- seo:end -->`);

describe('rawHeadFailures', () => {
  it('passes a clean single set inside the markers', () => {
    expect(rawHeadFailures(cleanHead, '/')).toEqual([]);
  });

  it('fails when the marker pair is missing', () => {
    expect(rawHeadFailures(page(singleSet), '/')).toEqual([
      expect.stringContaining('missing the seo:start/seo:end marker pair'),
    ]);
  });

  it('fails a duplicated set (the original two-image share-card bug)', () => {
    const dupe = page(`<!-- seo:start -->${singleSet}<!-- seo:end -->${singleSet}`);
    const failures = rawHeadFailures(dupe, '/');
    for (const tag of PREVIEW_TAGS) {
      expect(failures.join('\n')).toContain(`2 ${tag} tags`);
    }
  });

  it('fails a preview tag that sits OUTSIDE the markers (hydration would not strip it)', () => {
    const outside = page(
      `<meta property="og:image" content="https://x.test/og.jpg" /><!-- seo:start -->${singleSet.replace(
        /<meta property="og:image" content[^>]*>/,
        '',
      )}<!-- seo:end -->`,
    );
    expect(rawHeadFailures(outside, '/')).toEqual([expect.stringContaining('OUTSIDE the seo markers')]);
  });

  it('does not count og:image:width/height as og:image', () => {
    const { counts } = analyzeRawHead(cleanHead);
    expect(counts.ogImage).toBe(1);
  });

  it('ignores tags below </head>', () => {
    const bodyNoise = cleanHead.replace('<body>', `<body><meta property="og:image" content="x" />`);
    expect(rawHeadFailures(bodyNoise, '/')).toEqual([]);
  });
});
