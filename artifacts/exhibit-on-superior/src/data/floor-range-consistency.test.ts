// Task: both floor-plan surfaces must read from the same normalized
// plan-variant dataset. /available-units cards render one "Flr X–Y" chip per
// group variant (exact sheet floor ranges), and the /floor-plans directory
// renders one page per plan sheet — these must agree on unit line, floors,
// square footage, and bed/bath type, so "which plans exist on 4M?" gets one
// answer everywhere.
import { describe, expect, it } from 'vitest';
import { planGroups, plans, groupKey } from './floorPlans';
import { FLOOR_PLAN_PAGES } from './floorPlanPages';
import { bedBathLabel } from '../components/floor-plans/AvailableUnits';
import type { AvailableUnit } from '../lib/availabilityData';
import { groupForUnit } from '../components/floor-plans/AvailableUnits';

describe('floor-range consistency across /available-units and /floor-plans', () => {
  it('every plan sheet appears exactly once as a directory page', () => {
    expect(FLOOR_PLAN_PAGES.length).toBe(plans.length);
    const pagePlans = new Set(FLOOR_PLAN_PAGES.map((fp) => fp.plan.id));
    for (const p of plans) expect(pagePlans.has(p.id)).toBe(true);
  });

  it('group variants (available-units card chips) match the directory pages plan-for-plan', () => {
    for (const g of planGroups) {
      const pages = FLOOR_PLAN_PAGES.filter((fp) => groupKey(fp.plan) === g.id);
      // Same set of floor-range variants on both surfaces.
      const cardChips = g.variants.map((v) => v.floorLabel).sort();
      const directoryRanges = pages.map((fp) => fp.plan.floorLabel).sort();
      expect(cardChips).toEqual(directoryRanges);
      for (const fp of pages) {
        const v = g.variants.find((x) => x.id === fp.plan.id)!;
        expect(v).toBeDefined();
        // Identical facts: unit line, floors, sqft, bed/bath type.
        expect(fp.plan.unit).toBe(g.unit);
        expect(fp.plan.floors).toEqual(v.floors);
        expect([fp.plan.sqftMin, fp.plan.sqft]).toEqual([v.sqftMin, v.sqft]);
        expect(fp.plan.beds).toBe(g.beds);
        expect(fp.plan.baths).toBe(g.baths);
        expect(fp.plan.typeLabel).toBe(v.typeLabel);
      }
    }
  });
});

describe('marketing type label wins over feed-derived bedroom label', () => {
  const feedUnit = (unit: string): AvailableUnit => ({
    unit,
    bedrooms: 0,
    bathrooms: 1,
    sqft: null,
    rent: null,
    availableOn: null,
    photoUrl: null,
    listingUrl: null,
    videoUrl: null,
    photos: [],
    details: [],
    marketingTitle: null,
    description: null,
  });

  it('convertible units (e.g. 0610, 2705) never show "Studio"', () => {
    for (const unit of ['0610', '2705']) {
      const group = groupForUnit(unit);
      expect(group?.category).toBe('convertible');
      const label = bedBathLabel(feedUnit(unit), group);
      expect(label.startsWith(group!.typeLabel)).toBe(true);
      expect(label).not.toMatch(/studio/i);
    }
  });

  it('true studios still show "Studio"', () => {
    const g = groupForUnit('0603'); // line 03 on floors 6-29 is a Studio sheet
    expect(g?.category).toBe('studio');
    expect(bedBathLabel(feedUnit('0603'), g).split(' \u00b7 ')[0]).toBe('Studio');
  });
});
