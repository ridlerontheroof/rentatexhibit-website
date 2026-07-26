// Tests for the ADA designation registry (data/ada.ts) and its wiring into
// the floor-plan filter/search and the Apartment JSON-LD builders.
import { describe, expect, it } from 'vitest';
import {
  ADA_UNITS,
  ADA_COUNTS,
  ADA_KEY,
  ADA_DISCLAIMER,
  adaDesignation,
  isAdaUnit,
  adaDesignationLabel,
  adaUnitsAmong,
  isAdaQuery,
} from './ada';
import {
  planGroups,
  filterGroups,
  groupHasAdaUnits,
  adaUnitsForGroup,
  groupMatchesQuery,
  unitNumbersForGroup,
  SQFT_MIN,
  SQFT_MAX,
  type GroupFilterState,
  type Category,
} from './floorPlans';
import { apartmentNode, adaAmenityFeatures, unitAvailabilityJsonLd } from './unitJsonLd';
import { unitPageJsonLd } from './unitPageSeo';
import type { AvailableUnit } from '../hooks/use-availability';
import { PAGE_SEO } from './seo';
import { KNOWLEDGE_ARTICLES } from './knowledgeArticles';

function makeFilters(over: Partial<GroupFilterState> = {}): GroupFilterState {
  return {
    categories: new Set<Category>(),
    bands: new Set<string>(),
    sqft: [SQFT_MIN, SQFT_MAX],
    ada: false,
    ...over,
  };
}

function makeUnit(unit: string): AvailableUnit {
  return {
    unit,
    rent: 2500,
    sqft: 700,
    bedrooms: 1,
    bathrooms: 1,
    availableOn: null,
    listingUrl: null,
    photoUrl: null,
    photos: [],
    videoUrl: null,
    marketingTitle: null,
    description: null,
    details: [],
  } as unknown as AvailableUnit;
}

// --- registry ---------------------------------------------------------------

describe('ADA registry', () => {
  it('matches the as-built matrix totals: 62 units, 34 (A) + 28 (AC)', () => {
    expect(ADA_COUNTS).toEqual({ a: 34, ac: 28, total: 62 });
    expect(Object.keys(ADA_UNITS)).toHaveLength(62);
  });

  it('has only valid 4-digit unit numbers on existing floors (no 5, 13, 16)', () => {
    for (const n of Object.keys(ADA_UNITS)) {
      expect(n).toMatch(/^\d{4}$/);
      const floor = Number(n.slice(0, 2));
      expect(floor).toBeGreaterThanOrEqual(2);
      expect(floor).toBeLessThanOrEqual(34);
      expect([5, 13, 16]).not.toContain(floor);
    }
  });

  it('every registry unit belongs to a real plan group', () => {
    // Since the v0.7 plan book, unit line 6's sheet covers floors 6-29, so
    // 2406 (AC) — formerly the lone uncovered designation — has a plan card.
    const all = new Set(planGroups.flatMap((g) => unitNumbersForGroup(g)));
    const uncovered = Object.keys(ADA_UNITS).filter((n) => !all.has(n));
    expect(uncovered).toEqual([]);
  });

  it('spot-checks designations from the matrix', () => {
    expect(adaDesignation('3406')).toBe('AC');
    expect(adaDesignation('0606')).toBeNull();
    expect(adaDesignation('2901')).toBe('A');
    expect(adaDesignation('0210')).toBe('A');
    expect(isAdaUnit('0603')).toBe(true);
    expect(isAdaUnit('0605')).toBe(false);
  });

  it('labels and key/disclaimer copy carry the designation language', () => {
    expect(adaDesignationLabel('A')).toContain('Type A accessible/adaptable');
    expect(adaDesignationLabel('AC')).toContain('conduit line');
    expect(ADA_KEY.map((k) => k.label)).toEqual(['(A)', '(AC)']);
    expect(ADA_KEY[0].description).toContain('may vary');
    expect(ADA_KEY[1].description).toContain('as-built accessibility matrix');
    expect(ADA_DISCLAIMER).toContain('Contact leasing');
  });

  it('adaUnitsAmong filters and sorts', () => {
    expect(adaUnitsAmong(['0606', '3406', '0206'])).toEqual([
      { unit: '0206', designation: 'AC' },
      { unit: '3406', designation: 'AC' },
    ]);
  });
});

// --- published copy stays in sync with the registry ---------------------------

describe('ADA counts in published copy', () => {
  const counts = new RegExp(
    `${ADA_COUNTS.total} apartments.*${ADA_COUNTS.a} Type A accessible/adaptable residences \\(A\\).*${ADA_COUNTS.ac} Type A units with conduit line \\(AC\\)`,
  );

  it('/amenities FAQ answer carries the registry counts', () => {
    const faq = PAGE_SEO['/amenities'].faqs.find((f) => f.q.includes('ADA-accessible'))!;
    expect(faq).toBeDefined();
    expect(faq.a).toMatch(counts);
  });

  it('knowledge articles carry the registry counts', () => {
    const article = KNOWLEDGE_ARTICLES.find((a) => a.slug === 'ada-accessible-apartments')!;
    expect(article).toBeDefined();
    expect(article.answer).toMatch(counts);

    const contact = KNOWLEDGE_ARTICLES.find((a) => a.slug === 'accessibility-contact')!;
    expect(contact).toBeDefined();
    expect(contact.answer).toContain(`${ADA_COUNTS.total} apartments carry an ADA designation`);
    expect(contact.answer).toContain(`${ADA_COUNTS.a} Type A “(A)”`);
    expect(contact.answer).toContain(`${ADA_COUNTS.ac} Type A with conduit line “(AC)”`);
  });
});

// --- filter + search wiring --------------------------------------------------

describe('ADA plan filtering', () => {
  it('the ada filter narrows groups to those with designated units', () => {
    const adaGroups = filterGroups(planGroups, '', makeFilters({ ada: true }));
    expect(adaGroups.length).toBeGreaterThan(0);
    expect(adaGroups.length).toBeLessThan(planGroups.length);
    for (const g of adaGroups) expect(groupHasAdaUnits(g)).toBe(true);
    // Every registry unit is represented across the filtered groups —
    // including 2406, covered by the v0.7 unit-6 floors 6-29 sheet.
    const covered = new Set(adaGroups.flatMap((g) => adaUnitsForGroup(g).map((u) => u.unit)));
    expect(covered.size).toBe(62);
    expect(covered.has('2406')).toBe(true);
  });

  it('ada:false leaves the group list unchanged', () => {
    expect(filterGroups(planGroups, '', makeFilters())).toHaveLength(planGroups.length);
  });

  it('free-text ADA terms match only groups with designated units', () => {
    for (const q of ['ada', 'ADA accessible', 'accessible', 'Type A', 'wheelchair']) {
      for (const g of planGroups) {
        expect(groupMatchesQuery(g, q)).toBe(groupHasAdaUnits(g));
      }
    }
    expect(isAdaQuery('2 bed')).toBe(false);
    expect(isAdaQuery('')).toBe(false);
  });
});

// --- structured data ----------------------------------------------------------

describe('ADA structured data', () => {
  it('adaAmenityFeatures emits LocationFeatureSpecification nodes', () => {
    const a = adaAmenityFeatures('A');
    expect(a).toHaveLength(1);
    expect(a[0]['@type']).toBe('LocationFeatureSpecification');
    expect(a[0].name).toBe('ADA Type A accessible/adaptable');
    expect(String(a[0].description)).toContain(ADA_DISCLAIMER);

    const ac = adaAmenityFeatures('AC');
    expect(ac).toHaveLength(2);
    expect(ac[1].name).toBe('Conduit line (AC)');
  });

  it('apartmentNode carries amenityFeature only for designated units', () => {
    const designated = apartmentNode(makeUnit('3406'));
    const features = designated.amenityFeature as Record<string, unknown>[];
    expect(features).toHaveLength(2);
    expect(features[0].name).toBe('ADA Type A accessible/adaptable');

    const plain = apartmentNode(makeUnit('0606'));
    expect(plain.amenityFeature).toBeUndefined();
  });

  it('per-unit page JSON-LD graph includes the accessibility signals', () => {
    const graph = (unitPageJsonLd(makeUnit('2901')) as { '@graph': Record<string, unknown>[] })['@graph'];
    const apt = graph.find((n) => n['@type'] === 'Apartment')!;
    const features = apt.amenityFeature as Record<string, unknown>[];
    expect(features).toHaveLength(1);
    expect(String(features[0].description)).toContain('(A)');
  });

  it('/available-units aggregate graph carries signals for designated units', () => {
    const graph = (
      unitAvailabilityJsonLd([makeUnit('0805'), makeUnit('0807')], '2026-07-01T00:00:00Z') as {
        '@graph': Record<string, unknown>[];
      }
    )['@graph'];
    const apartments = graph.filter((n) => n['@type'] === 'Apartment');
    expect(apartments).toHaveLength(2);
    const designated = apartments.find((n) => String(n['@id']).includes('0805'))!;
    expect(designated.amenityFeature).toBeDefined();
    const other = apartments.find((n) => String(n['@id']).includes('0807'))!;
    expect(other.amenityFeature).toBeUndefined();
  });
});
