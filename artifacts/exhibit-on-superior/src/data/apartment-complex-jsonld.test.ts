import { describe, expect, it } from 'vitest';
import {
  APARTMENT_COMPLEX_NODE,
  FLOOR_SIZE_RANGE_NODE,
  availabilityComplexProps,
} from './seo';
import { plans } from './floorPlans';
import { getBakedAvailability, SNAPSHOT_MAX_AGE_MS } from './availabilitySnapshot';
import raw from './availabilitySnapshot.json';

// Task: the ApartmentComplex node carries floorSize (sq-ft range),
// numberOfAvailableAccommodationUnits, and priceRange — all DERIVED from
// source data (floor-plan DB + baked availability snapshot), never hardcoded,
// and omitted gracefully when the snapshot is unusable.

describe('ApartmentComplex floorSize', () => {
  it('is a QuantitativeValue range equal to the true floor-plan DB extremes', () => {
    const trueMin = Math.min(...plans.map((p) => p.sqftMin));
    const trueMax = Math.max(...plans.map((p) => p.sqft));
    expect(FLOOR_SIZE_RANGE_NODE).toEqual({
      '@type': 'QuantitativeValue',
      minValue: trueMin,
      maxValue: trueMax,
      unitCode: 'FTK',
      unitText: 'sq ft',
    });
    expect(FLOOR_SIZE_RANGE_NODE.minValue).toBeLessThan(FLOOR_SIZE_RANGE_NODE.maxValue);
    expect((APARTMENT_COMPLEX_NODE as Record<string, unknown>).floorSize).toBe(
      FLOOR_SIZE_RANGE_NODE,
    );
  });
});

describe('availability-derived ApartmentComplex properties', () => {
  const snapshotTime = Date.parse((raw as { updatedAt: string }).updatedAt);

  it('carries the live availability count and a real From-$/month price range when the snapshot is fresh', () => {
    const now = snapshotTime + 60 * 1000; // snapshot definitely fresh
    const data = getBakedAvailability(now);
    expect(data).not.toBeNull();
    const props = availabilityComplexProps(now);
    expect(props.numberOfAvailableAccommodationUnits).toBe(data!.units.length);
    expect(props.numberOfAvailableAccommodationUnits).toBeGreaterThan(0);
    const lowestRent = Math.min(
      ...data!.units
        .map((u) => u.rent)
        .filter((r): r is number => typeof r === 'number' && r > 0),
    );
    expect(props.priceRange).toBe(`From $${lowestRent.toLocaleString('en-US')}/month`);
    expect(props.priceRange).toMatch(/^From \$[\d,]+\/month$/);
  });

  it('omits both properties entirely (no 0/null) when the snapshot is unusable', () => {
    const now = snapshotTime + SNAPSHOT_MAX_AGE_MS + 60 * 1000; // snapshot too old
    const props = availabilityComplexProps(now);
    expect('numberOfAvailableAccommodationUnits' in props).toBe(false);
    expect('priceRange' in props).toBe(false);
  });

  it('the baked APARTMENT_COMPLEX_NODE never emits 0/null for availability-derived properties', () => {
    const node = APARTMENT_COMPLEX_NODE as Record<string, unknown>;
    if ('numberOfAvailableAccommodationUnits' in node) {
      expect(node.numberOfAvailableAccommodationUnits).toBeGreaterThan(0);
    }
    if ('priceRange' in node) {
      expect(node.priceRange).toMatch(/^From \$[\d,]+\/month$/);
    }
  });
});
