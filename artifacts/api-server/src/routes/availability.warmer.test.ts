/**
 * Background cache-warmer resilience: prove startAvailabilityCacheWarmer
 * survives repeated AppFolio outages — several consecutive failed interval
 * ticks must not wedge the shared inflight promise or stop future refreshes,
 * and the first successful tick must swap the cache to the new payload.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import seed from "../data/availabilitySeed.json";

vi.mock("../lib/appfolio", () => ({
  fetchAvailability: vi.fn(),
}));
vi.mock("../lib/email", () => ({
  sendSeedStaleAlert: vi.fn().mockResolvedValue(undefined),
}));

import { fetchAvailability } from "../lib/appfolio";
import type { AvailabilityPayload } from "../lib/appfolio";
import {
  getAvailabilitySnapshot,
  resetAvailabilityCacheForTests,
  startAvailabilityCacheWarmer,
} from "./availability";

const seedPayload = seed as unknown as AvailabilityPayload;
const seedUpdatedAt = Date.parse(seedPayload.updatedAt);

// Must match WARM_INTERVAL_MS in availability.ts (5min TTL - 30s).
const WARM_INTERVAL_MS = 5 * 60 * 1000 - 30 * 1000;

const recoveredPayload: AvailabilityPayload = {
  ...seedPayload,
  updatedAt: new Date(seedUpdatedAt + 60 * 60 * 1000).toISOString(),
  units: seedPayload.units.slice(1),
};

const silentLog = { info: () => {}, warn: () => {} };

describe("startAvailabilityCacheWarmer outage recovery", () => {
  const ORIGINAL_ENV = { ...process.env };
  let timer: NodeJS.Timeout | null = null;

  beforeEach(() => {
    resetAvailabilityCacheForTests();
    vi.mocked(fetchAvailability).mockReset();
    process.env.APPFOLIO_CLIENT_ID = "test-client-id";
    process.env.APPFOLIO_CLIENT_SECRET = "test-client-secret";
    vi.useFakeTimers();
    // Just after the seed's updatedAt: seed is usable (within 48h), so the
    // warmer starts from a realistic last-good snapshot.
    vi.setSystemTime(seedUpdatedAt + 6 * 60 * 1000);
  });

  afterEach(() => {
    if (timer) clearInterval(timer);
    timer = null;
    vi.useRealTimers();
    process.env.APPFOLIO_CLIENT_ID = ORIGINAL_ENV.APPFOLIO_CLIENT_ID;
    process.env.APPFOLIO_CLIENT_SECRET = ORIGINAL_ENV.APPFOLIO_CLIENT_SECRET;
  });

  it("recovers after several consecutive failed ticks, one upstream call per tick", async () => {
    // Startup warm + first three interval ticks fail; the fourth succeeds.
    vi.mocked(fetchAvailability)
      .mockRejectedValueOnce(new Error("AppFolio down (startup)"))
      .mockRejectedValueOnce(new Error("AppFolio down (tick 1)"))
      .mockRejectedValueOnce(new Error("AppFolio down (tick 2)"))
      .mockRejectedValueOnce(new Error("AppFolio down (tick 3)"))
      .mockResolvedValue(recoveredPayload);

    timer = startAvailabilityCacheWarmer(silentLog);
    expect(timer).not.toBeNull();

    // Startup warm fires immediately and fails.
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchAvailability).toHaveBeenCalledTimes(1);
    // Last good snapshot (the baked seed) keeps serving through the failure.
    expect((await getAvailabilitySnapshot())?.updatedAt).toBe(seedPayload.updatedAt);

    // Three failing interval ticks in a row: each issues exactly one upstream
    // call — the inflight coalescing promise must clear after each failure.
    for (let tick = 1; tick <= 3; tick++) {
      await vi.advanceTimersByTimeAsync(WARM_INTERVAL_MS);
      expect(fetchAvailability).toHaveBeenCalledTimes(1 + tick);
      expect((await getAvailabilitySnapshot())?.updatedAt).toBe(seedPayload.updatedAt);
    }

    // Next tick succeeds: the cache swaps to the recovered payload.
    await vi.advanceTimersByTimeAsync(WARM_INTERVAL_MS);
    expect(fetchAvailability).toHaveBeenCalledTimes(5);
    const snapshot = await getAvailabilitySnapshot();
    expect(snapshot?.updatedAt).toBe(recoveredPayload.updatedAt);
    expect(snapshot?.units).toHaveLength(seedPayload.units.length - 1);

    // getAvailabilitySnapshot served from cache — no extra upstream calls.
    expect(fetchAvailability).toHaveBeenCalledTimes(5);

    // And the warmer keeps ticking after recovery (no dead interval).
    await vi.advanceTimersByTimeAsync(WARM_INTERVAL_MS);
    expect(fetchAvailability).toHaveBeenCalledTimes(6);
  });

  it("keeps exactly one-call-per-tick when every tick fails (no stuck inflight, no duplicates)", async () => {
    vi.mocked(fetchAvailability).mockRejectedValue(new Error("AppFolio down"));

    timer = startAvailabilityCacheWarmer(silentLog);
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchAvailability).toHaveBeenCalledTimes(1);

    for (let tick = 1; tick <= 5; tick++) {
      await vi.advanceTimersByTimeAsync(WARM_INTERVAL_MS);
      expect(fetchAvailability).toHaveBeenCalledTimes(1 + tick);
    }
  });
});
