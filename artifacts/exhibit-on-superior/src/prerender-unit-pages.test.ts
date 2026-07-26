import { describe, expect, it } from 'vitest';
import { render, SITE_URL, UNIT_PATHS } from './entry-server';
// Same shared validator the build-time guard uses (scripts/prerender.mjs).
// @ts-expect-error plain-JS module shared with the build script (no d.ts)
import {
  extractJsonLdPayloads,
  validateJsonLdPayloads,
  checkRecommendedProperties,
  SITE_RECOMMENDED_ALLOWLIST,
} from '../scripts/validate-jsonld.mjs';

// Task: every available apartment gets its own prerendered, indexable page
// with fact-first HTML and Apartment/OfferForLease JSON-LD. These tests run
// each baked unit route through the same entry-server pipeline the
// prerenderer uses and assert the crawler-visible contract holds.

describe('per-unit prerendered pages', () => {
  it('the baked snapshot yields unit paths to prerender', () => {
    expect(UNIT_PATHS.length).toBeGreaterThan(0);
    // Regular units are "FFUU"; mezzanine units use AppFolio's "04M" + line
    // form (e.g. /available-units/04M02).
    for (const p of UNIT_PATHS) expect(p).toMatch(/^\/available-units\/(\d{4}|04M\d{2})$/);
  });

  it.each(UNIT_PATHS)('%s: head carries unit title, canonical, and index robots', async (p) => {
    const unit = p.split('/').pop() as string;
    const { head } = await render(p);
    expect(head).toContain(`Apartment ${unit}`);
    expect(head).toContain(`rel="canonical" href="${SITE_URL}${p}"`);
    expect(head).toContain('content="index, follow"');
  });

  it.each(UNIT_PATHS)('%s: body opens with the fact-first summary', async (p) => {
    const unit = p.split('/').pop() as string;
    const { html } = await render(p);
    // renderToString splits dynamic text with <!-- --> comments.
    const text = html.replaceAll('<!-- -->', '');
    expect(text).toContain(`Apartment ${unit} at Exhibit On Superior is a`);
    // Internal links crawlers should find on every unit page.
    for (const href of ['/amenities', '/fees', '/parking-transportation', '/available-units']) {
      expect(text).toContain(`href="${href}"`);
    }
  });

  it.each(UNIT_PATHS)('%s: JSON-LD is valid with Apartment + lease Offer', async (p) => {
    const { head } = await render(p);
    const payloads = extractJsonLdPayloads(head) as string[];
    expect(payloads.length).toBeGreaterThan(0);
    const problems = validateJsonLdPayloads(payloads, SITE_URL) as string[];
    expect(problems, problems.join('\n')).toEqual([]);
    const warnings = checkRecommendedProperties(payloads, {
      allowlist: SITE_RECOMMENDED_ALLOWLIST,
    }) as string[];
    expect(warnings, warnings.join('\n')).toEqual([]);

    const nodes = payloads.flatMap((raw) => {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed['@graph']) ? parsed['@graph'] : [parsed];
    });
    const apt = nodes.find((n) => n['@type'] === 'Apartment');
    expect(apt).toBeDefined();
    expect(apt['@id']).toBe(`${SITE_URL}${p}#apartment`);
    expect(apt.offers?.['@type']).toBe('Offer');
    expect(apt.offers?.businessFunction).toContain('LeaseOut');
    expect(nodes.some((n) => n['@type'] === 'FloorPlan')).toBe(true);
    expect(nodes.some((n) => n['@type'] === 'BreadcrumbList')).toBe(true);
  });
});
