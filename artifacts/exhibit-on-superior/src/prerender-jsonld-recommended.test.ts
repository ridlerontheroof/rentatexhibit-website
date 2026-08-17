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
  NO_CHECKLIST_TYPES,
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
      uploadDate: '2024-01-01T10:00:00-05:00',
      duration: 'PT1M',
      embedUrl: 'https://x/e', // no contentUrl — embedUrl satisfies the group
    };
    expect(checkRecommendedProperties([JSON.stringify(video)])).toEqual([]);
  });

  it('flags a date-only VideoObject uploadDate (Search Console requires a timezone)', () => {
    const video = {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: 'V',
      description: 'D',
      thumbnailUrl: 'https://x/t.jpg',
      uploadDate: '2024-06-25', // date-only — missing timezone
      duration: 'PT1M',
      embedUrl: 'https://x/e',
    };
    const warnings = checkRecommendedProperties([JSON.stringify(video)]) as string[];
    expect(warnings.some((w) => w.includes('uploadDate') && w.includes('timezone'))).toBe(true);
  });

  it('flags a Review missing datePublished, accepts one that carries it', () => {
    const review = (extra: Record<string, unknown>) =>
      JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Review',
        reviewBody: 'Great place',
        author: { '@type': 'Person', name: 'Resident' },
        reviewRating: { '@type': 'Rating', ratingValue: 5, bestRating: 5, worstRating: 1 },
        ...extra,
      });
    const warnings = checkRecommendedProperties([review({})]) as string[];
    expect(warnings.some((w) => w.includes('Review') && w.includes('datePublished'))).toBe(true);
    expect(checkRecommendedProperties([review({ datePublished: '2024-11-03' })])).toEqual([]);
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

describe('no emitted @type escapes the checklist decision', () => {
  // The soft check silently skips any @type without a RECOMMENDED_PROPERTIES
  // entry. This guard keeps that honest: every distinct @type emitted by any
  // route must either have a checklist or be explicitly declared "no
  // checklist needed". A brand-new type (Event, Offer, Review, ...) fails
  // here until someone decides which bucket it belongs in.
  const collectTypes = (value: unknown, into: Set<string>): void => {
    if (Array.isArray(value)) {
      value.forEach((v) => collectTypes(v, into));
      return;
    }
    if (value === null || typeof value !== 'object') return;
    const node = value as Record<string, unknown>;
    const type = node['@type'];
    if (typeof type === 'string' && type.length > 0) into.add(type);
    if (Array.isArray(type)) type.forEach((t) => typeof t === 'string' && into.add(t));
    for (const [k, v] of Object.entries(node)) {
      if (!k.startsWith('@') || k === '@graph') collectTypes(v, into);
    }
  };

  // Renders every PAGE_SEO route in one test body; under concurrent
  // validation-suite load this can blow the default 5s timeout.
  it('every emitted @type has a checklist or is explicitly checklist-free', { timeout: 60_000 }, async () => {
    const emitted = new Set<string>();
    for (const routePath of Object.keys(PAGE_SEO)) {
      const { head } = await render(routePath);
      for (const raw of extractJsonLdPayloads(head) as string[]) {
        collectTypes(JSON.parse(raw), emitted);
      }
    }
    expect(emitted.size).toBeGreaterThan(0);

    const noChecklist = new Set(NO_CHECKLIST_TYPES as string[]);
    const undecided = [...emitted].filter(
      (t) => !(t in RECOMMENDED_PROPERTIES) && !noChecklist.has(t),
    );
    expect(
      undecided,
      `New structured-data type(s) emitted without a quality decision: ${undecided.join(', ')}. ` +
        'Add a RECOMMENDED_PROPERTIES checklist in scripts/validate-jsonld.mjs, or — if schema.org ' +
        'recommends nothing extra for it — add it to NO_CHECKLIST_TYPES.',
    ).toEqual([]);

    // Keep the "no checklist needed" list honest too: entries must still be
    // emitted somewhere and must not ALSO have a checklist.
    for (const t of noChecklist) {
      expect(emitted.has(t), `stale NO_CHECKLIST_TYPES entry: ${t} is no longer emitted`).toBe(true);
      expect(t in RECOMMENDED_PROPERTIES, `${t} is in both lists; remove it from one`).toBe(false);
    }
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
