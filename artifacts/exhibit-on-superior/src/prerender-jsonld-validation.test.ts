import { describe, expect, it } from 'vitest';
import { render, SITE_URL, PAGE_SEO } from './entry-server';
// The validator is shared with scripts/prerender.mjs so the test and the
// build-time guard can never drift apart.
// @ts-expect-error plain-JS module shared with the build script (no d.ts)
import { extractJsonLdPayloads, validateJsonLdPayloads } from '../scripts/validate-jsonld.mjs';

// Task: catch structured-data breakage before Google does, on EVERY page —
// not just the pages with bespoke JSON-LD tests. Renders every route through
// the same entry-server pipeline the prerenderer uses and validates the full
// set of JSON-LD blocks each would ship: parseable JSON, schema.org @context,
// @type on every node, and no dangling internal @id references. The identical
// validator also runs post-build in scripts/prerender.mjs against the written
// HTML, so a malformed node fails both `pnpm test` and the build itself.

describe('every prerendered route ships valid JSON-LD', () => {
  const routePaths = Object.keys(PAGE_SEO);

  it('covers all prerendered routes', () => {
    expect(routePaths.length).toBeGreaterThanOrEqual(14);
  });

  it.each(routePaths)('%s: JSON-LD is well-formed with no dangling @id refs', async (routePath) => {
    const { head } = await render(routePath);
    const payloads = extractJsonLdPayloads(head) as string[];
    // Every indexable page must ship structured data; noindex pages skip it.
    if (!PAGE_SEO[routePath].noindex) {
      expect(payloads.length, 'indexable page has no JSON-LD blocks').toBeGreaterThan(0);
    }
    const problems = validateJsonLdPayloads(payloads, SITE_URL) as string[];
    expect(problems, problems.join('\n')).toEqual([]);
  });

  it('the validator itself rejects malformed structured data', () => {
    // Unparseable JSON
    expect(validateJsonLdPayloads(['{not json'], SITE_URL)).not.toEqual([]);
    // Missing @context
    expect(
      validateJsonLdPayloads([JSON.stringify({ '@type': 'WebSite' })], SITE_URL),
    ).not.toEqual([]);
    // Node missing @type inside an @graph
    expect(
      validateJsonLdPayloads(
        [JSON.stringify({ '@context': 'https://schema.org', '@graph': [{ name: 'x' }] })],
        SITE_URL,
      ),
    ).not.toEqual([]);
    // Nested property-value node missing @type (only pure @id refs may be untyped)
    expect(
      validateJsonLdPayloads(
        [
          JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            publisher: { '@id': `${SITE_URL}#org`, name: 'Org' },
          }),
        ],
        SITE_URL,
      ),
    ).not.toEqual([]);
    // Same nested node WITH @type passes
    expect(
      validateJsonLdPayloads(
        [
          JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            publisher: { '@type': 'Organization', '@id': `${SITE_URL}#org`, name: 'Org' },
          }),
        ],
        SITE_URL,
      ),
    ).toEqual([]);
    // Dangling internal @id reference
    expect(
      validateJsonLdPayloads(
        [
          JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            isPartOf: { '@id': `${SITE_URL}#nonexistent` },
          }),
        ],
        SITE_URL,
      ),
    ).not.toEqual([]);
    // External references are allowed to dangle
    expect(
      validateJsonLdPayloads(
        [
          JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            '@id': `${SITE_URL}#webpage`,
            about: { '@id': 'https://www.wikidata.org/wiki/Q1297' },
          }),
        ],
        SITE_URL,
      ),
    ).toEqual([]);
    // A clean page passes
    expect(
      validateJsonLdPayloads(
        [
          JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              { '@type': 'WebSite', '@id': `${SITE_URL}#website` },
              { '@type': 'WebPage', isPartOf: { '@id': `${SITE_URL}#website` } },
            ],
          }),
        ],
        SITE_URL,
      ),
    ).toEqual([]);
  });
});
