// End-to-end pipeline coverage for a simulated "4M" mezzanine unit.
//
// AppFolio (and the floor-plan sheets) name the mezzanine level "4M" — the
// building has NO floor 5. AppFolio writes mezzanine apartments as "04M" +
// two-digit unit line (e.g. "04M02", 5 characters). These tests walk a
// simulated mezzanine listing through the whole pipeline: unit-number
// parsing, plan matching, page address, head model, floor-band filtering,
// and floor-band sorting — so a future live 4M listing can never fall back
// to the old "floor 5 / 05XX" renumbering.
import { describe, expect, it } from 'vitest';
import {
  FLOOR_BANDS,
  MEZZANINE_FLOOR,
  floorDisplayLabel,
  floorToken,
  groupMatchesFilters,
  parseUnitNumber,
  planGroups,
  unitNumbersForGroup,
  variantIndexForUnit,
} from './floorPlans';
import { planGroupForUnitNumber } from './unitJsonLd';
import {
  buildUnitSeoModel,
  unitCanonical,
  unitFactSummary,
  unitFloor,
  unitPagePath,
} from './unitPageSeo';
import { SITE_URL } from './seo';
import type { AvailableUnit } from '../hooks/use-availability';

const MEZZ_UNIT = '04M02'; // unit line 2 on the 4M mezzanine (AppFolio format)

function mezzListing(): AvailableUnit {
  return {
    unit: MEZZ_UNIT,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 628,
    rent: 2650,
    availableOn: null,
    photoUrl: null,
    listingUrl: null,
    photos: [],
    videoUrl: null,
  } as unknown as AvailableUnit;
}

describe('4M mezzanine unit-number format', () => {
  it('parses AppFolio\'s "04M" + line form and never floor 5', () => {
    expect(parseUnitNumber(MEZZ_UNIT)).toEqual({ floor: MEZZANINE_FLOOR, line: 2 });
    expect(parseUnitNumber('04m02')).toEqual({ floor: MEZZANINE_FLOOR, line: 2 });
    // "0502" is a floor-5 number — floor 5 does not exist, but the parser is
    // format-driven; what matters is it maps to NO plan group (next test).
    expect(parseUnitNumber('0502')).toEqual({ floor: 5, line: 2 });
    expect(parseUnitNumber('4M02')).toBeNull();
    expect(parseUnitNumber('abc')).toBeNull();
  });

  it('formats the mezzanine floor as "4M"/"04M" everywhere', () => {
    expect(floorDisplayLabel(MEZZANINE_FLOOR)).toBe('4M');
    expect(floorToken(MEZZANINE_FLOOR)).toBe('04M');
  });
});

describe('4M plan matching', () => {
  it('matches a mezzanine listing to its floor-plan group', () => {
    const group = planGroupForUnitNumber(MEZZ_UNIT);
    expect(group).not.toBeNull();
    expect(group!.unit).toBe(2);
    expect(group!.floors).toContain(MEZZANINE_FLOOR);
    // The variant resolved is the one whose floor range covers the mezzanine.
    const idx = variantIndexForUnit(group!, MEZZ_UNIT);
    expect(group!.variants[idx].floors).toContain(MEZZANINE_FLOOR);
  });

  it('no group carries an old-style floor-5 unit number', () => {
    for (const g of planGroups) {
      for (const n of unitNumbersForGroup(g)) {
        expect(n.startsWith('05')).toBe(false);
      }
    }
    expect(planGroupForUnitNumber('0502')).toBeNull();
  });

  it('every mezzanine plan group publishes 04M-form unit numbers', () => {
    const mezzGroups = planGroups.filter((g) => g.floors.includes(MEZZANINE_FLOOR));
    expect(mezzGroups.length).toBeGreaterThan(0);
    for (const g of mezzGroups) {
      const line = String(g.unit).padStart(2, '0');
      expect(unitNumbersForGroup(g)).toContain(`04M${line}`);
    }
  });
});

describe('4M page address, head model, and structured data', () => {
  it('builds the page path and canonical from the real unit number', () => {
    expect(unitPagePath(MEZZ_UNIT)).toBe('/available-units/04M02');
    expect(unitCanonical(MEZZ_UNIT)).toBe(`${SITE_URL}/available-units/04M02`);
  });

  it('describes the unit as on floor 4M (never floor 5)', () => {
    expect(unitFloor(MEZZ_UNIT)).toBe('4M');
    const summary = unitFactSummary(mezzListing());
    expect(summary).toContain('Apartment 04M02');
    expect(summary).toContain('on floor 4M');
    expect(summary).not.toContain('floor 5');
  });

  it('emits a self-canonical head model with an Apartment node keyed to 04M02', () => {
    const model = buildUnitSeoModel(mezzListing(), '2026-07-26T12:00:00Z');
    expect(model.canonical).toBe(`${SITE_URL}/available-units/04M02`);
    expect(model.title).toContain('04M02');
    const graph = (model.jsonLd[0] as { '@graph': Record<string, unknown>[] })['@graph'];
    const apt = graph.find((n) => n['@type'] === 'Apartment');
    expect(apt).toBeDefined();
    expect(String(apt!.name)).toContain('04M02');
    expect(String(apt!['@id'])).toContain('/available-units/04M02');
    // The sitemap is generated from unit page paths, so the canonical above
    // is exactly what a sitemap <loc> entry would carry.
  });
});

describe('4M floor bands and sorting', () => {
  it('the mezzanine belongs to the Podium band and the band label reads 2–4M', () => {
    const podium = FLOOR_BANDS.find((b) => b.id === 'podium')!;
    expect(MEZZANINE_FLOOR).toBeGreaterThanOrEqual(podium.min);
    expect(MEZZANINE_FLOOR).toBeLessThanOrEqual(podium.max);
    expect(podium.label).toBe('2\u20134M');
    const group = planGroupForUnitNumber(MEZZ_UNIT)!;
    expect(group.bands.some((b) => b.id === 'podium')).toBe(true);
    // A Podium-band filter must surface the mezzanine group.
    expect(
      groupMatchesFilters(group, {
        categories: new Set(),
        bands: new Set(['podium']),
        sqft: [group.sqftMin, group.sqftMax],
        ada: false,
      }),
    ).toBe(true);
  });

  it('sorts between floor 4 and floor 6', () => {
    expect(MEZZANINE_FLOOR).toBeGreaterThan(4);
    expect(MEZZANINE_FLOOR).toBeLessThan(6);
    // The availability feed sorts by localeCompare on the unit string —
    // "04M02" must land after floor-4 units and before floor-6 units.
    const sorted = ['0602', '04M02', '0402'].sort((a, b) => a.localeCompare(b));
    expect(sorted).toEqual(['0402', '04M02', '0602']);
  });
});
