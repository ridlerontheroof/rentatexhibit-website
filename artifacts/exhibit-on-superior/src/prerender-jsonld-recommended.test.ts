import { describe, expect, it } from 'vitest';
import { render, SITE_URL, PAGE_SEO } from './entry-server';
// Shared with scripts/prerender.mjs so the test and build-time reporter can
// never drift apart.
// @ts-expect-error plain-JS module shared with the build script (no d.ts)
import {
  extractJsonLdPayloads,
  checkRecommendedProperties,
  RECOMMENDED_PROPERTIES,
  SITE_RECOMMENDED_ALLOWLIST,
} from '../scripts/validate-jsonld.mjs';

// Task: beyond structural validity, schema.org types have *recommended*
// properties that drive rich-result eligibility (FAQ Questions need
// acceptedAnswer text, ApartmentComplex is stronger with address/telephone/
// image, VideoObject needs uploadDate/thumbnailUrl, ...). The prerenderer
// prints these as warnings; this suite pins them down: every route must
// produce ZERO warnings beyond the explicit allowlist of intentional
// omissions, so a regression (or a new page shipping thin structured data)
// fails `pnpm test` with a readable list of what to strengthen.

describe('recommended-property checklist', () => {
  it('covers every @type the site emits', () => {
    for (const type of [
      'WebSite',
      'Organization',
      'ApartmentComplex',
      'WebPage',
      'BreadcrumbList',
      'FAQPage',
      'ItemList',
      'ImageGallery',
      'VideoObject',
    ]) {
      expect(RECOMMENDED_PROPERTIES[type], `no checklist for ${type}`).toBeDefined();
    }
  });

  it('flags a missing recommended property', () => {
    const warnings = checkRecommendedProperties([
      JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [{ '@type': 'Question', name: 'Q?' }], // no acceptedAnswer
      }),
    ]) as string[];
    expect(warnings.some((w) => w.includes('Question') && w.includes('acceptedAnswer'))).toBe(
      true,
    );
  });

  it('treats empty strings and empty arrays as missing', () => {
    const warnings = checkRecommendedProperties([
      JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [],
      }),
    ]) as string[];
    expect(warnings.some((w) => w.includes('itemListElement'))).toBe(true);
  });

  it('accepts either alternative of an any-of group', () => {
    const video = {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: 'V',
      description: 'D',
      thumbnailUrl: 'https://x/t.jpg',
      uploadDate: '2024-01-01',
      duration: 'PT1M',
      embedUrl: 'https://x/e', // no contentUrl — embedUrl satisfies the group
    };
    expect(checkRecommendedProperties([JSON.stringify(video)])).toEqual([]);
  });

  it('silences allowlisted omissions only', () => {
    const payload = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: [{ '@type': 'ListItem', position: 1, name: 'x', item: 'https://x' }],
    }); // ItemList missing "name"
    expect((checkRecommendedProperties([payload]) as string[]).length).toBe(1);
    expect(
      checkRecommendedProperties([payload], { allowlist: ['ItemList.name'] }),
    ).toEqual([]);
  });

  it('ignores pure @id reference nodes', () => {
    const warnings = checkRecommendedProperties([
      JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'S',
        url: 'https://x',
        publisher: { '@id': 'https://x#org' }, // reference, not a thin Organization
      }),
    ]) as string[];
    expect(warnings).toEqual([]);
  });
});

describe('every prerendered route ships the properties Google rewards', () => {
  const routePaths = Object.keys(PAGE_SEO);

  it.each(routePaths)('%s: no missing recommended properties', async (routePath) => {
    const { head } = await render(routePath);
    const payloads = extractJsonLdPayloads(head) as string[];
    const warnings = checkRecommendedProperties(payloads, {
      allowlist: SITE_RECOMMENDED_ALLOWLIST,
    }) as string[];
    expect(warnings, warnings.join('\n')).toEqual([]);
  });

  it('the allowlist itself carries no stale entries', async () => {
    // Every allowlisted omission must still be a REAL omission somewhere —
    // otherwise the entry is stale and would mask a future regression.
    const still = new Set<string>();
    for (const routePath of routePaths) {
      const { head } = await render(routePath);
      const payloads = extractJsonLdPayloads(head) as string[];
      for (const w of checkRecommendedProperties(payloads) as string[]) {
        const m = w.match(/^(\S+).*missing recommended property "([^"]+)"/);
        if (m) still.add(`${m[1]}.${m[2]}`);
      }
    }
    for (const entry of SITE_RECOMMENDED_ALLOWLIST as string[]) {
      expect(still.has(entry), `stale allowlist entry: ${entry}`).toBe(true);
    }
  });
});
