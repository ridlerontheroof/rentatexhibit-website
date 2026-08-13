// Unit tests for the post-publish IndexNow submitter's pure helpers
// (scripts/lib/indexnow-sitemap.mjs): sitemap parsing and new/changed-URL
// diffing. The submitter itself (scripts/submit-indexnow.mjs) is exercised
// manually / by the postpublish watcher — these tests pin the diff semantics
// it relies on.
import { describe, it, expect } from 'vitest';
// @ts-expect-error — plain .mjs helper shared with the scripts pipeline
import { parseSitemap, changedUrls } from '../scripts/lib/indexnow-sitemap.mjs';

const xml = (entries: Array<[string, string | null]>) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries
    .map(
      ([loc, lastmod]) =>
        `<url><loc>${loc}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`,
    )
    .join('\n')}\n</urlset>`;

describe('parseSitemap', () => {
  it('maps each <loc> to its <lastmod>', () => {
    const parsed = parseSitemap(
      xml([
        ['https://www.rentatexhibit.com/', '2026-08-11'],
        ['https://www.rentatexhibit.com/blog/river-north-guide', '2026-08-13'],
      ]),
    );
    expect(parsed).toEqual({
      'https://www.rentatexhibit.com/': '2026-08-11',
      'https://www.rentatexhibit.com/blog/river-north-guide': '2026-08-13',
    });
  });

  it('records URLs without a lastmod as empty string (so adding one later counts as a change)', () => {
    const parsed = parseSitemap(xml([['https://www.rentatexhibit.com/faq', null]]));
    expect(parsed).toEqual({ 'https://www.rentatexhibit.com/faq': '' });
  });

  it('returns an empty record for non-sitemap content', () => {
    expect(parseSitemap('<!doctype html><html><body>SPA fallback</body></html>')).toEqual({});
  });
});

describe('changedUrls', () => {
  const prev = {
    'https://x.com/': '2026-08-01',
    'https://x.com/blog/old-guide': '2026-08-01',
    'https://x.com/gone': '2026-08-01',
  };

  it('flags brand-new URLs (a freshly published blog guide)', () => {
    const next = { ...prev, 'https://x.com/blog/new-guide': '2026-08-13' };
    expect(changedUrls(prev, next)).toEqual(['https://x.com/blog/new-guide']);
  });

  it('flags URLs whose lastmod changed (content-changed page)', () => {
    const next = { ...prev, 'https://x.com/blog/old-guide': '2026-08-13' };
    expect(changedUrls(prev, next)).toEqual(['https://x.com/blog/old-guide']);
  });

  it('ignores URLs that disappeared (rented units are pinged by api-server, not here)', () => {
    const next = { 'https://x.com/': '2026-08-01', 'https://x.com/blog/old-guide': '2026-08-01' };
    expect(changedUrls(prev, next)).toEqual([]);
  });

  it('returns empty when nothing changed', () => {
    expect(changedUrls(prev, { ...prev })).toEqual([]);
  });
});
