import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { plans, unitNumbersForPlan } from './floorPlans';
import snapshot from './availabilitySnapshot.json';
import {
  FLOOR_PLAN_PAGES,
  FLOOR_PLAN_PAGE_PATHS,
  buildFloorPlanSeoModel,
  floorPlanCanonical,
  floorPlanDescription,
  floorPlanH1,
  floorPlanPage,
  floorPlanPageJsonLd,
  floorPlanTitle,
  matchingUnitsForPlan,
  planPageForUnit,
  relatedPagesFor,
  variantPagesFor,
} from './floorPlanPages';
import type { AvailableUnit } from '../lib/availabilityData';

const makeUnit = (unit: string, over: Partial<AvailableUnit> = {}): AvailableUnit => ({
  unit,
  rent: 2500,
  bedrooms: 1,
  bathrooms: 1,
  sqft: 665,
  availableOn: '2026-08-01',
  photoUrl: null,
  applyUrl: null,
  marketingTitle: null,
  description: null,
  amenities: [],
  detailSections: [],
  ...over,
} as unknown as AvailableUnit);

describe('floor-plan page list', () => {
  it('has exactly one page per distinct plan sheet', () => {
    expect(FLOOR_PLAN_PAGES.length).toBe(plans.length);
    // The consolidated 769–776 SF unit-06 sheet is ONE layout — one page.
    const u6 = FLOOR_PLAN_PAGES.filter((fp) => fp.plan.unit === 6 && fp.plan.sqftMin === 769);
    expect(u6.length).toBe(1);
    expect(u6[0].slug).toBe('two-bedroom-one-bath-769-776-sf');
  });

  it('has unique slugs, paths, titles, H1s, and canonicals', () => {
    for (const key of [
      (fp: (typeof FLOOR_PLAN_PAGES)[number]) => fp.slug,
      (fp: (typeof FLOOR_PLAN_PAGES)[number]) => floorPlanTitle(fp),
      (fp: (typeof FLOOR_PLAN_PAGES)[number]) => floorPlanH1(fp),
      (fp: (typeof FLOOR_PLAN_PAGES)[number]) => floorPlanCanonical(fp.slug),
      (fp: (typeof FLOOR_PLAN_PAGES)[number]) => floorPlanDescription(fp),
    ]) {
      const values = FLOOR_PLAN_PAGES.map(key);
      expect(new Set(values).size).toBe(values.length);
    }
    expect(new Set(FLOOR_PLAN_PAGE_PATHS).size).toBe(FLOOR_PLAN_PAGES.length);
  });

  it('uses clean slugs (lowercase, hyphenated, -sf suffix or floor suffix)', () => {
    for (const fp of FLOOR_PLAN_PAGES) {
      expect(fp.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(fp.slug).toMatch(/-sf(-floors?-[a-z0-9-]+)?$/);
    }
    expect(floorPlanPage('two-bedroom-two-bath-1003-sf')?.plan.sqft).toBe(1003);
    expect(floorPlanPage('nope')).toBeNull();
  });

  it('disambiguates colliding beds/baths/sqft twins with floor ranges', () => {
    const twins = FLOOR_PLAN_PAGES.filter((fp) => fp.disambiguated);
    expect(twins.length).toBeGreaterThan(0);
    for (const fp of twins) {
      expect(fp.slug).toMatch(/-floors?-/);
      expect(floorPlanTitle(fp)).toMatch(/Floors? /);
    }
  });

  it('keeps titles ≤65 chars and descriptions ≤160 chars', () => {
    for (const fp of FLOOR_PLAN_PAGES) {
      expect(floorPlanTitle(fp).length).toBeLessThanOrEqual(65);
      const d = floorPlanDescription(fp);
      expect(d.length).toBeLessThanOrEqual(160);
      expect(d.length).toBeGreaterThan(50);
    }
  });

  it('flags only the 02/03 stacks on floors 6–29 as balcony-free', () => {
    const noBalcony = FLOOR_PLAN_PAGES.filter((fp) => !fp.balcony);
    expect(noBalcony.map((fp) => fp.plan.id).sort()).toEqual([
      'unit-2-floors-6-29',
      'unit-3-floors-6-29',
    ]);
  });

  it('surfaces ADA designations within each plan floor range', () => {
    // 2406 (AC) sits in the consolidated unit-06 6–29 sheet.
    const u6 = FLOOR_PLAN_PAGES.find((fp) => fp.slug === 'two-bedroom-one-bath-769-776-sf')!;
    expect(u6.adaUnits.some((u) => u.unit === '2406' && u.designation === 'AC')).toBe(true);
  });

  it('offers related/variant links for every page', () => {
    for (const fp of FLOOR_PLAN_PAGES) {
      const links = [...variantPagesFor(fp), ...relatedPagesFor(fp)];
      expect(links.length).toBeGreaterThan(0);
      expect(links.every((l) => l.slug !== fp.slug)).toBe(true);
    }
  });
});

describe('availability matching', () => {
  it('matches units by residence line and floor range', () => {
    const page = floorPlanPage('one-bedroom-one-bath-665-sf')!; // unit 7, floors 6–16
    const units = [makeUnit('0907'), makeUnit('1707'), makeUnit('0906')];
    expect(matchingUnitsForPlan(page.plan, units).map((u) => u.unit)).toEqual(['0907']);
  });

  it('ignores unparseable unit numbers', () => {
    const page = floorPlanPage('one-bedroom-one-bath-665-sf')!;
    expect(matchingUnitsForPlan(page.plan, [makeUnit('PH-X')])).toEqual([]);
  });
});

describe('planPageForUnit (unit → plan page reverse link)', () => {
  it('resolves every buildable apartment number to exactly one plan page', () => {
    // The plan sheets must partition each residence line by floor band — no
    // apartment can belong to zero or two pages, or the UnitDetail reverse
    // link would be missing or ambiguous.
    for (const p of plans) {
      for (const unitNumber of unitNumbersForPlan(p)) {
        const matches = FLOOR_PLAN_PAGES.filter(
          (fp) => matchingUnitsForPlan(fp.plan, [makeUnit(unitNumber)]).length > 0,
        );
        expect(matches.length, `unit ${unitNumber} matches ${matches.length} pages`).toBe(1);
        expect(planPageForUnit(unitNumber)?.slug).toBe(matches[0].slug);
      }
    }
  });

  it('resolves every unit in the baked availability snapshot', () => {
    const units = (snapshot as { units: { unit: string }[] }).units;
    expect(units.length).toBeGreaterThan(0);
    for (const u of units) {
      expect(planPageForUnit(u.unit), `no plan page for unit ${u.unit}`).not.toBeNull();
    }
  });

  it('returns null for unparseable unit numbers', () => {
    expect(planPageForUnit('PH-X')).toBeNull();
  });
});

describe('floor-plan JSON-LD', () => {
  const page = floorPlanPage('one-bedroom-one-bath-665-sf')!;

  it('stays valid and non-empty with zero availability', () => {
    const jsonLd = floorPlanPageJsonLd(page, [], null);
    const graph = jsonLd['@graph'] as Record<string, unknown>[];
    const types = graph.map((n) => n['@type']);
    expect(types).toContain('FloorPlan');
    expect(types).toContain('WebPage');
    expect(types).toContain('BreadcrumbList');
    expect(types).toContain('ApartmentComplex');
    expect(types).not.toContain('Apartment');
    expect(types).not.toContain('Offer');
    const fp = graph.find((n) => n['@type'] === 'FloorPlan')!;
    // validate-jsonld recommended props for FloorPlan.
    for (const prop of ['name', 'numberOfBedrooms', 'numberOfBathroomsTotal', 'floorSize', 'image'])
      expect(fp[prop]).toBeDefined();
  });

  it('links matching units as Apartment + standalone Offer nodes keyed to unit-page canonicals', () => {
    const jsonLd = floorPlanPageJsonLd(page, [makeUnit('0907')], '2026-07-22T00:00:00Z');
    const graph = jsonLd['@graph'] as Record<string, unknown>[];
    const apt = graph.find((n) => n['@type'] === 'Apartment')!;
    expect(apt['@id']).toContain('/available-units/0907#apartment');
    const offer = graph.find((n) => n['@type'] === 'Offer')!;
    expect((offer.itemOffered as Record<string, unknown>)['@id']).toBe(apt['@id']);
    // No `offers` property directly on the Apartment (schema.org core rule).
    expect(apt.offers).toBeUndefined();
    // ApartmentComplex links this page's FloorPlan node.
    const complex = graph.find((n) => n['@type'] === 'ApartmentComplex')!;
    expect((complex.accommodationFloorPlan as Record<string, unknown>)['@id']).toBe(
      `${floorPlanCanonical(page.slug)}#floorplan`,
    );
  });

  it('builds a complete head model with self-canonical', () => {
    const model = buildFloorPlanSeoModel(page, [], null);
    expect(model.canonical).toBe(floorPlanCanonical(page.slug));
    expect(model.metas.find((m) => m.name === 'robots')?.content).toContain('index');
    expect(model.metas.find((m) => m.property === 'og:url')?.content).toBe(model.canonical);
  });
});

describe('artifact.toml rewrite parity', () => {
  it('has a bare + trailing-slash rewrite pair for the hub and every plan page', () => {
    const toml = fs.readFileSync(
      path.resolve(__dirname, '../../.replit-artifact/artifact.toml'),
      'utf8',
    );
    for (const p of ['/floor-plans', ...FLOOR_PLAN_PAGE_PATHS]) {
      expect(toml, `missing rewrite for ${p}`).toContain(`from = "${p}"\nto = "${p}/index.html"`);
      expect(toml, `missing rewrite for ${p}/`).toContain(
        `from = "${p}/"\nto = "${p}/index.html"`,
      );
    }
    // Unknown-slug fallback must exist ahead of the /* catch-all.
    expect(toml).toContain('from = "/floor-plans/*"');
    expect(toml.indexOf('from = "/floor-plans/*"')).toBeLessThan(toml.indexOf('from = "/*"'));
  });
});
