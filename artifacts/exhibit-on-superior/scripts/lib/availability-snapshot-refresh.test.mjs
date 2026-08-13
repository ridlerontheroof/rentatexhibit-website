// Guards the "stale snapshot" build-failure fix: the fetch script must
// rewrite the committed snapshot's updatedAt stamp when the live payload is
// byte-identical but the stamp is >24h old, or the prerender 48h freshness
// guard trips after two quiet days and blocks the publish. A refactor that
// drops the stamp-refresh branch fails here instead of at publish time.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  decideSnapshotWrite,
  refreshSnapshot,
  assertPayloadShape,
  STAMP_REFRESH_AGE_MS,
} from './availability-snapshot-refresh.mjs';

const HOUR = 60 * 60 * 1000;
const NOW = Date.parse('2026-08-13T12:00:00Z');
const stampAgo = (ms) => new Date(NOW - ms).toISOString();

const units = [{ unit: '0606', rent: 2400 }];
const payload = { units, updatedAt: stampAgo(0) };

describe('decideSnapshotWrite', () => {
  it('skips the write when units are unchanged and the stamp is fresh (≤24h)', () => {
    const existing = { units, updatedAt: stampAgo(2 * HOUR) };
    expect(decideSnapshotWrite({ payload, existing, nowMs: NOW })).toEqual({
      write: false,
      reason: 'unchanged',
    });
  });

  it('rewrites when units are unchanged but the stamp is >24h old (48h-guard protection)', () => {
    const existing = { units, updatedAt: stampAgo(25 * HOUR) };
    expect(decideSnapshotWrite({ payload, existing, nowMs: NOW })).toEqual({
      write: true,
      reason: 'stamp-stale',
    });
  });

  it('keeps the skip right at the 24h boundary, rewrites just past it', () => {
    const atBoundary = { units, updatedAt: stampAgo(STAMP_REFRESH_AGE_MS) };
    expect(decideSnapshotWrite({ payload, existing: atBoundary, nowMs: NOW }).write).toBe(false);
    const pastBoundary = { units, updatedAt: stampAgo(STAMP_REFRESH_AGE_MS + 1) };
    expect(decideSnapshotWrite({ payload, existing: pastBoundary, nowMs: NOW }).write).toBe(true);
  });

  it('rewrites when the units changed, even with a fresh stamp', () => {
    const existing = { units: [{ unit: '0707', rent: 2600 }], updatedAt: stampAgo(HOUR) };
    expect(decideSnapshotWrite({ payload, existing, nowMs: NOW })).toEqual({
      write: true,
      reason: 'units-changed',
    });
  });

  it('rewrites when the existing stamp is unparseable', () => {
    const existing = { units, updatedAt: 'not-a-date' };
    expect(decideSnapshotWrite({ payload, existing, nowMs: NOW })).toEqual({
      write: true,
      reason: 'stamp-stale',
    });
  });

  it('writes when there is no existing snapshot', () => {
    expect(decideSnapshotWrite({ payload, existing: null, nowMs: NOW })).toEqual({
      write: true,
      reason: 'no-existing',
    });
  });
});

describe('assertPayloadShape', () => {
  it('accepts the expected shape and rejects malformed payloads', () => {
    expect(() => assertPayloadShape(payload)).not.toThrow();
    for (const bad of [null, {}, { units: 'x', updatedAt: 'y' }, { units: [] }]) {
      expect(() => assertPayloadShape(bad)).toThrow(/unexpected payload shape/);
    }
  });
});

describe('refreshSnapshot (file behavior)', () => {
  let dir;
  let outPath;
  const noop = () => {};

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'snap-refresh-'));
    outPath = path.join(dir, 'availabilitySnapshot.json');
  });
  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  const write = (obj) => fs.writeFile(outPath, `${JSON.stringify(obj, null, 2)}\n`, 'utf8');
  const read = async () => JSON.parse(await fs.readFile(outPath, 'utf8'));

  it('leaves a fresh unchanged snapshot untouched (no tree dirtying)', async () => {
    const committed = { units, updatedAt: stampAgo(HOUR) };
    await write(committed);
    const before = await fs.readFile(outPath, 'utf8');
    const res = await refreshSnapshot({
      fetchPayload: async () => payload,
      outPath,
      nowMs: NOW,
      log: noop,
    });
    expect(res.wrote).toBe(false);
    expect(await fs.readFile(outPath, 'utf8')).toBe(before);
  });

  it('rewrites the stamp when unchanged units carry a >24h-old stamp', async () => {
    await write({ units, updatedAt: stampAgo(30 * HOUR) });
    const res = await refreshSnapshot({
      fetchPayload: async () => payload,
      outPath,
      nowMs: NOW,
      log: noop,
    });
    expect(res).toMatchObject({ wrote: true, reason: 'stamp-stale' });
    expect((await read()).updatedAt).toBe(payload.updatedAt);
  });

  it('writes a changed payload over the committed snapshot', async () => {
    await write({ units: [{ unit: '0707', rent: 2600 }], updatedAt: stampAgo(HOUR) });
    const res = await refreshSnapshot({
      fetchPayload: async () => payload,
      outPath,
      nowMs: NOW,
      log: noop,
    });
    expect(res).toMatchObject({ wrote: true, reason: 'units-changed' });
    expect(await read()).toEqual(payload);
  });

  it('leaves the committed snapshot untouched when the fetch fails', async () => {
    const committed = { units, updatedAt: stampAgo(40 * HOUR) };
    await write(committed);
    const before = await fs.readFile(outPath, 'utf8');
    await expect(
      refreshSnapshot({
        fetchPayload: async () => {
          throw new Error('HTTP 503');
        },
        outPath,
        nowMs: NOW,
        log: noop,
      }),
    ).rejects.toThrow('HTTP 503');
    expect(await fs.readFile(outPath, 'utf8')).toBe(before);
  });

  it('leaves the committed snapshot untouched when the payload is malformed', async () => {
    const committed = { units, updatedAt: stampAgo(HOUR) };
    await write(committed);
    const before = await fs.readFile(outPath, 'utf8');
    await expect(
      refreshSnapshot({ fetchPayload: async () => ({ nope: true }), outPath, nowMs: NOW, log: noop }),
    ).rejects.toThrow(/unexpected payload shape/);
    expect(await fs.readFile(outPath, 'utf8')).toBe(before);
  });
});
