import { describe, expect, it } from 'vitest';
import raw from './availabilitySnapshot.json';
import { getBakedAvailability, SNAPSHOT_MAX_AGE_MS } from './availabilitySnapshot';

// The committed snapshot file must always be a structurally valid availability
// payload — the build's fetch step refuses malformed payloads, and this test
// catches hand edits that would break the baked-cards path silently.
describe('availabilitySnapshot.json', () => {
  it('has the availability payload shape', () => {
    expect(Array.isArray((raw as { units: unknown }).units)).toBe(true);
    expect(typeof (raw as { updatedAt: unknown }).updatedAt).toBe('string');
    expect(Number.isFinite(Date.parse((raw as { updatedAt: string }).updatedAt))).toBe(true);
    for (const unit of (raw as { units: Array<Record<string, unknown>> }).units) {
      expect(typeof unit.unit).toBe('string');
      expect(Array.isArray(unit.photos)).toBe(true);
      expect(Array.isArray(unit.details)).toBe(true);
    }
  });
});

// Staleness signal: warns loudly in test output when the committed snapshot
// has aged past the 48h guard in getBakedAvailability, but never fails —
// staleness only degrades to today's skeleton behavior, and every real build
// refreshes the file via scripts/fetch-availability-snapshot.mjs.
describe('availabilitySnapshot freshness (warning only)', () => {
  it('reports the committed snapshot age against the 48h max age', () => {
    const updated = Date.parse((raw as { updatedAt: string }).updatedAt);
    const ageMs = Date.now() - updated;
    const ageHours = (ageMs / 3_600_000).toFixed(1);
    if (ageMs > SNAPSHOT_MAX_AGE_MS) {
      console.warn(
        `WARN baked availability snapshot is STALE: ${ageHours}h old (max 48h). ` +
          'getBakedAvailability will ignore it and visitors will see skeleton cards ' +
          'until the live fetch lands — rebuild the site to refresh the snapshot.',
      );
      expect(getBakedAvailability()).toBeNull();
    } else {
      console.log(
        `Baked availability snapshot is ${ageHours}h old (fresh; 48h max age).`,
      );
      expect(getBakedAvailability()).not.toBeNull();
    }
  });
});

describe('getBakedAvailability', () => {
  const updated = Date.parse((raw as { updatedAt: string }).updatedAt);

  it('returns the snapshot while it is fresh enough', () => {
    const snapshot = getBakedAvailability(updated + 60_000);
    expect(snapshot).not.toBeNull();
    expect(snapshot?.updatedAt).toBe((raw as { updatedAt: string }).updatedAt);
  });

  it('ignores snapshots older than the max age (stale pricing guard)', () => {
    expect(getBakedAvailability(updated + SNAPSHOT_MAX_AGE_MS + 1)).toBeNull();
  });
});
