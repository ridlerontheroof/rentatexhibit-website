import { beforeEach, describe, expect, it, vi } from "vitest";
import seed from "../data/availabilitySeed.json";

vi.mock("../lib/appfolio", () => ({
  fetchAvailability: vi.fn(),
}));

vi.mock("../lib/email", () => ({
  sendSeedStaleAlert: vi.fn(),
}));

import { fetchAvailability } from "../lib/appfolio";
import { sendSeedStaleAlert } from "../lib/email";
import {
  resetAvailabilityCacheForTests,
  seedCacheFromBakedSnapshot,
  getAvailabilitySnapshot,
  getBakedSeedHealth,
  alertIfSeedStale,
} from "./availability";

const seedUpdatedAt = Date.parse((seed as { updatedAt: string }).updatedAt);

describe("seedCacheFromBakedSnapshot", () => {
  beforeEach(() => {
    resetAvailabilityCacheForTests();
    vi.mocked(fetchAvailability).mockReset();
    vi.mocked(sendSeedStaleAlert).mockReset().mockResolvedValue(undefined);
  });

  it("seeds an empty cache from the committed snapshot when it is within max age", () => {
    expect(seedCacheFromBakedSnapshot(seedUpdatedAt + 60_000)).toBe(true);
  });

  it("ignores a seed older than 48 hours", () => {
    const past48h = seedUpdatedAt + 48 * 60 * 60 * 1000 + 1;
    expect(seedCacheFromBakedSnapshot(past48h)).toBe(false);
  });

  it("does not overwrite an already-populated cache", () => {
    expect(seedCacheFromBakedSnapshot(seedUpdatedAt)).toBe(true);
    expect(seedCacheFromBakedSnapshot(seedUpdatedAt)).toBe(false);
  });

  it("reports 'used' seed health when the seed is fresh", () => {
    expect(seedCacheFromBakedSnapshot(seedUpdatedAt + 60_000)).toBe(true);
    const health = getBakedSeedHealth();
    expect(health.status).toBe("used");
    expect(health.seedUpdatedAt).toBe((seed as { updatedAt: string }).updatedAt);
    expect(health.seedAgeHours).toBe(0);
  });

  it("reports 'stale' seed health when the seed is past max age", () => {
    const past48h = seedUpdatedAt + 48 * 60 * 60 * 1000 + 1;
    expect(seedCacheFromBakedSnapshot(past48h)).toBe(false);
    const health = getBakedSeedHealth();
    expect(health.status).toBe("stale");
    expect(health.seedAgeHours).toBe(48);
    expect(health.maxAgeHours).toBe(48);
  });

  it("reports 'superseded' when the cache already holds data", () => {
    expect(seedCacheFromBakedSnapshot(seedUpdatedAt)).toBe(true);
    expect(seedCacheFromBakedSnapshot(seedUpdatedAt)).toBe(false);
    expect(getBakedSeedHealth().status).toBe("superseded");
  });

  it("makes the seeded payload available without an upstream fetch", async () => {
    expect(seedCacheFromBakedSnapshot(seedUpdatedAt)).toBe(true);
    const snapshot = await getAvailabilitySnapshot();
    expect(snapshot).not.toBeNull();
    expect(snapshot!.updatedAt).toBe((seed as { updatedAt: string }).updatedAt);
    expect(fetchAvailability).not.toHaveBeenCalled();
  });
});

describe("alertIfSeedStale", () => {
  beforeEach(() => {
    resetAvailabilityCacheForTests();
    vi.mocked(sendSeedStaleAlert).mockReset().mockResolvedValue(undefined);
  });

  it("emails the leasing team once when the seed is stale", async () => {
    const past48h = seedUpdatedAt + 48 * 60 * 60 * 1000 + 1;
    seedCacheFromBakedSnapshot(past48h);
    await alertIfSeedStale();
    await alertIfSeedStale();
    expect(sendSeedStaleAlert).toHaveBeenCalledTimes(1);
    expect(sendSeedStaleAlert).toHaveBeenCalledWith(
      expect.objectContaining({ seedAgeHours: 48, maxAgeHours: 48 }),
    );
  });

  it("stays silent when the seed is fresh", async () => {
    seedCacheFromBakedSnapshot(seedUpdatedAt + 60_000);
    await alertIfSeedStale();
    expect(sendSeedStaleAlert).not.toHaveBeenCalled();
  });

  it("stays silent when the seed was superseded by live data", async () => {
    seedCacheFromBakedSnapshot(seedUpdatedAt);
    seedCacheFromBakedSnapshot(seedUpdatedAt);
    await alertIfSeedStale();
    expect(sendSeedStaleAlert).not.toHaveBeenCalled();
  });

  it("swallows mailer failures without throwing", async () => {
    vi.mocked(sendSeedStaleAlert).mockRejectedValueOnce(new Error("smtp down"));
    const past48h = seedUpdatedAt + 48 * 60 * 60 * 1000 + 1;
    seedCacheFromBakedSnapshot(past48h);
    await expect(alertIfSeedStale()).resolves.toBeUndefined();
  });
});
