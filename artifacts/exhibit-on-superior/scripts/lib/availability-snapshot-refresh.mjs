// Pure(ish) core of the build-time availability snapshot refresh, extracted
// from scripts/fetch-availability-snapshot.mjs so the unchanged-payload
// decision logic is unit-testable without hitting the live API.
//
// Decision rules (see the fetch script header for the full rationale):
// - fetch failure / malformed payload  → throw; caller leaves the committed
//   snapshot untouched (failure is non-fatal by design).
// - payload changed                    → write the fresh snapshot.
// - payload unchanged + stamp ≤ 24h    → skip the write (keep the tree clean).
// - payload unchanged + stamp > 24h    → REWRITE anyway, so the prerender 48h
//   freshness guard can never trip after a long quiet stretch.
import { promises as fs } from 'node:fs';

// Rewrite the stamp once the committed updatedAt is older than half the 48h
// prerender max age — rare enough to stay merge-friendly, early enough that a
// publish never hits the 48h wall.
export const STAMP_REFRESH_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Decide whether a freshly fetched payload needs to be written over the
 * committed snapshot. Pure: no I/O, no clock access.
 *
 * @param {{ payload: any, existing: any, nowMs: number }} args
 *   payload  — the freshly fetched snapshot payload (already shape-validated)
 *   existing — the parsed committed snapshot, or null/undefined if missing or
 *              malformed
 *   nowMs    — current time in epoch ms
 * @returns {{ write: boolean, reason: 'no-existing' | 'units-changed' | 'stamp-stale' | 'unchanged' }}
 */
export function decideSnapshotWrite({ payload, existing, nowMs }) {
  if (!existing || typeof existing !== 'object') {
    return { write: true, reason: 'no-existing' };
  }
  const sameUnits =
    JSON.stringify({ ...existing, updatedAt: null }) ===
    JSON.stringify({ ...payload, updatedAt: null });
  if (!sameUnits) return { write: true, reason: 'units-changed' };
  const existingUpdated = Date.parse(existing?.updatedAt);
  const stampFresh =
    Number.isFinite(existingUpdated) && nowMs - existingUpdated <= STAMP_REFRESH_AGE_MS;
  if (!stampFresh) return { write: true, reason: 'stamp-stale' };
  return { write: false, reason: 'unchanged' };
}

/** Throws unless the payload has the expected { units: [], updatedAt } shape. */
export function assertPayloadShape(payload) {
  if (!payload || !Array.isArray(payload.units) || typeof payload.updatedAt !== 'string') {
    throw new Error('unexpected payload shape (expected { units: [], updatedAt })');
  }
}

/**
 * Fetch (via the injected fetcher), decide, and write the snapshot file.
 * Throws on fetch failure or malformed payload WITHOUT touching outPath —
 * the caller treats that as non-fatal and keeps the committed snapshot.
 *
 * @param {{ fetchPayload: () => Promise<any>, outPath: string, nowMs?: number, log?: (msg: string) => void }} args
 * @returns {Promise<{ wrote: boolean, reason: string, payload: any }>}
 */
export async function refreshSnapshot({ fetchPayload, outPath, nowMs = Date.now(), log = console.log }) {
  const payload = await fetchPayload();
  assertPayloadShape(payload);
  let existing = null;
  try {
    existing = JSON.parse(await fs.readFile(outPath, 'utf8'));
  } catch {
    /* missing/malformed existing snapshot — write the fresh one */
  }
  const decision = decideSnapshotWrite({ payload, existing, nowMs });
  if (decision.write) {
    if (decision.reason === 'stamp-stale') {
      log(
        'Availability snapshot units unchanged but committed updatedAt is >24h old; ' +
          'rewriting the stamp so the prerender freshness guard (48h) cannot trip.',
      );
    }
    await fs.writeFile(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    log(
      `Availability snapshot refreshed: ${payload.units.length} unit(s), updatedAt ${payload.updatedAt}.`,
    );
  } else {
    log(
      `Availability snapshot unchanged (${payload.units.length} unit(s)); keeping committed updatedAt to avoid dirtying the tree.`,
    );
  }
  return { wrote: decision.write, reason: decision.reason, payload };
}
