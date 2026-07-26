// Square-footage authority + consistency guard.
//
// Rule (see unitSqft.ts): the approved floor-plan database wins over the
// AppFolio feed when the two disagree. This suite pins the rule's behavior
// AND acts as a publish gate: every unit in the baked availability snapshot
// must either match its floor plan's square footage or be explicitly
// whitelisted in KNOWN_BAD_APPFOLIO_SQFT — so a future bad AppFolio record
// fails the build instead of shipping two contradictory numbers on one page.
import { describe, expect, it } from 'vitest';
import { KNOWN_BAD_APPFOLIO_SQFT, planForUnitNumber, resolveUnitSqft } from './unitSqft';
import raw from './availabilitySnapshot.json';

interface SnapshotUnit {
  unit: string;
  sqft: number | null;
}

const units = (raw as { units: SnapshotUnit[] }).units;

describe('resolveUnitSqft authority rule', () => {
  it('prefers the floor-plan value when AppFolio disagrees (Apartment 2705: 478 → 450)', () => {
    // Line 05, floors 6–29 = 450 SF per the approved unit map.
    expect(resolveUnitSqft({ unit: '2705', sqft: 478 })).toBe(450);
  });

  it('keeps a matching AppFolio value', () => {
    expect(resolveUnitSqft({ unit: '2705', sqft: 450 })).toBe(450);
  });

  it('falls back to the plan when the feed has no value', () => {
    expect(resolveUnitSqft({ unit: '2705', sqft: null })).toBe(450);
  });

  it('trusts a feed value inside a plan-printed range (line 06, 769–776 SF)', () => {
    expect(resolveUnitSqft({ unit: '2406', sqft: 772 })).toBe(772);
  });

  it('rejects a feed value outside a plan-printed range', () => {
    expect(resolveUnitSqft({ unit: '2406', sqft: 900 })).toBe(769);
  });

  it('passes the feed value through for unmapped units', () => {
    expect(resolveUnitSqft({ unit: '9999', sqft: 512 })).toBe(512);
  });
});

describe('baked snapshot sqft consistency (publish gate)', () => {
  it('has at least one unit to check', () => {
    expect(units.length).toBeGreaterThan(0);
  });

  it.each(units.map((u) => [u.unit, u] as const))(
    'apartment %s: AppFolio sqft matches its floor plan or is whitelisted',
    (_name, u) => {
      const plan = planForUnitNumber(u.unit);
      // Unmapped units (no plan) have nothing to contradict.
      if (!plan || u.sqft === null) return;
      const matchesPlan =
        plan.sqftMin !== plan.sqft
          ? u.sqft >= plan.sqftMin && u.sqft <= plan.sqft
          : u.sqft === plan.sqft;
      if (matchesPlan) return;
      expect(
        KNOWN_BAD_APPFOLIO_SQFT[u.unit],
        `Apartment ${u.unit}: AppFolio says ${u.sqft} sq ft but the floor-plan database says ` +
          `${plan.sqftMin === plan.sqft ? plan.sqft : `${plan.sqftMin}–${plan.sqft}`} sq ft. ` +
          `The site will display the floor-plan value. If this is a known-bad AppFolio record, ` +
          `add it to KNOWN_BAD_APPFOLIO_SQFT in unitSqft.ts and ask the leasing team to fix AppFolio.`,
      ).toBe(u.sqft);
    },
  );

  it('whitelist entries match either the recorded bad value or the corrected plan value', () => {
    for (const [unit, badSqft] of Object.entries(KNOWN_BAD_APPFOLIO_SQFT)) {
      const inSnapshot = units.find((u) => u.unit === unit);
      // Unit may have been rented and left the snapshot — that's fine.
      if (!inSnapshot || inSnapshot.sqft === null) continue;
      const plan = planForUnitNumber(unit);
      // Once AppFolio is corrected the feed matches the plan again; the entry
      // is then merely removable, never a build failure.
      const matchesPlan =
        plan !== null &&
        (plan.sqftMin !== plan.sqft
          ? inSnapshot.sqft >= plan.sqftMin && inSnapshot.sqft <= plan.sqft
          : inSnapshot.sqft === plan.sqft);
      expect(
        inSnapshot.sqft === badSqft || matchesPlan,
        `Whitelist for apartment ${unit} records feed value ${badSqft} but the snapshot now says ` +
          `${inSnapshot.sqft}, which matches neither the recorded bad value nor the floor plan. ` +
          `Update or remove the entry in KNOWN_BAD_APPFOLIO_SQFT.`,
      ).toBe(true);
    }
  });
});
