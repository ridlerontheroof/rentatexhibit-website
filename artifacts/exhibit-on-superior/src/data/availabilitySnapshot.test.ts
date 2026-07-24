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
