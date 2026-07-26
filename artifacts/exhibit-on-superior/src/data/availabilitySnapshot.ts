import { normalizeAvailability, type AvailabilityData } from '../hooks/use-availability';
import raw from './availabilitySnapshot.json';

/**
 * Snapshots older than this are ignored entirely: better to show skeleton
 * cards for a moment than pricing from a build that predates several
 * AppFolio updates. Live data replaces the snapshot within seconds either
 * way (the fetch is kicked off from the HTML head — see index.html).
 */
export const SNAPSHOT_MAX_AGE_MS = 48 * 60 * 60 * 1000;

/**
 * Build-time availability snapshot (refreshed by
 * scripts/fetch-availability-snapshot.mjs during `pnpm build`). Returns null
 * when the baked file is malformed or too old, in which case callers fall
 * back to today's behavior: skeleton placeholders until the live fetch lands.
 */
export function getBakedAvailability(now: number = Date.now()): AvailabilityData | null {
  const data = raw as unknown;
  if (
    !data ||
    typeof data !== 'object' ||
    !Array.isArray((data as AvailabilityData).units) ||
    typeof (data as AvailabilityData).updatedAt !== 'string'
  ) {
    return null;
  }
  const snapshot = data as AvailabilityData;
  const updated = Date.parse(snapshot.updatedAt);
  if (!Number.isFinite(updated) || now - updated > SNAPSHOT_MAX_AGE_MS) return null;
  // Correct known feed typos even when the baked snapshot predates the
  // api-server-side normalization.
  return normalizeAvailability(snapshot);
}

export type BakedSnapshotStatus = 'fresh' | 'stale' | 'invalid';

/**
 * Why the baked snapshot is (or is not) usable. The prerenderer FAILS THE
 * BUILD on anything but 'fresh': a stale or malformed snapshot would silently
 * drop every per-unit page (and its sitemap entries) from the publish —
 * far worse than a loud build error telling you to re-fetch the snapshot.
 */
export function getBakedSnapshotStatus(now: number = Date.now()): BakedSnapshotStatus {
  const data = raw as unknown;
  if (
    !data ||
    typeof data !== 'object' ||
    !Array.isArray((data as AvailabilityData).units) ||
    typeof (data as AvailabilityData).updatedAt !== 'string'
  ) {
    return 'invalid';
  }
  const updated = Date.parse((data as AvailabilityData).updatedAt);
  if (!Number.isFinite(updated)) return 'invalid';
  return now - updated > SNAPSHOT_MAX_AGE_MS ? 'stale' : 'fresh';
}
