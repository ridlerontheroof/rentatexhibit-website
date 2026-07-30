// Guards for og:image:alt and twitter:image:alt on unit detail pages.
// Both branches must emit alt tags: units with their own listing photo (the
// primary case) AND units that fall back to the floor-plan share card.
import { describe, expect, it } from 'vitest';
import { buildUnitSeoModel } from './unitPageSeo';
import type { AvailableUnit } from '../hooks/use-availability';

const baseUnit: AvailableUnit = {
  unit: '2705',
  rent: 3200,
  bedrooms: 2,
  bathrooms: 2,
  sqft: 1003,
  availableOn: '2026-08-01',
  photoUrl: null,
  applyUrl: null,
  marketingTitle: null,
  description: null,
  amenities: [],
  detailSections: [],
  videoUrl: null,
} as unknown as AvailableUnit;

describe('buildUnitSeoModel — image alt tags', () => {
  it('emits og:image:alt when unit has NO listing photo (floor-plan card fallback)', () => {
    const model = buildUnitSeoModel({ ...baseUnit, photoUrl: null });
    const ogAlt = model.metas.find((m) => m.property === 'og:image:alt');
    const twAlt = model.metas.find((m) => m.name === 'twitter:image:alt');
    expect(ogAlt?.content, 'og:image:alt missing on photo-less unit').toBeTruthy();
    expect(twAlt?.content, 'twitter:image:alt missing on photo-less unit').toBeTruthy();
    expect(ogAlt?.content).toBe(twAlt?.content);
  });

  it('emits og:image:alt when unit HAS its own listing photo', () => {
    const model = buildUnitSeoModel({
      ...baseUnit,
      photoUrl: 'https://cdn.example.com/units/2705.jpg',
    });
    const ogAlt = model.metas.find((m) => m.property === 'og:image:alt');
    const twAlt = model.metas.find((m) => m.name === 'twitter:image:alt');
    expect(ogAlt?.content, 'og:image:alt missing on unit with listing photo').toBeTruthy();
    expect(twAlt?.content, 'twitter:image:alt missing on unit with listing photo').toBeTruthy();
    expect(ogAlt?.content).toBe(twAlt?.content);
  });

  it('alt tag content matches the page title in both branches', () => {
    for (const photoUrl of [null, 'https://cdn.example.com/units/2705.jpg']) {
      const model = buildUnitSeoModel({ ...baseUnit, photoUrl } as unknown as AvailableUnit);
      const title = model.title;
      expect(model.metas.find((m) => m.property === 'og:image:alt')?.content).toBe(title);
      expect(model.metas.find((m) => m.name === 'twitter:image:alt')?.content).toBe(title);
    }
  });
});
