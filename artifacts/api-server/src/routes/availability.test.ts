import { beforeEach, describe, expect, it, vi } from "vitest";
import seed from "../data/availabilitySeed.json";

vi.mock("../lib/appfolio", () => ({
  fetchAvailability: vi.fn(),
}));

import { fetchAvailability } from "../lib/appfolio";
import {
  resetAvailabilityCacheForTests,
  seedCacheFromBakedSnapshot,
  getAvailabilitySnapshot,
} from "./availability";

const seedUpdatedAt = Date.parse((seed as { updatedAt: string }).updatedAt);

describe("seedCacheFromBakedSnapshot", () => {
  beforeEach(() => {
    resetAvailabilityCacheForTests();
    vi.mocked(fetchAvailability).mockReset();
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

  it("makes the seeded payload available without an upstream fetch", async () => {
    expect(seedCacheFromBakedSnapshot(seedUpdatedAt)).toBe(true);
    const snapshot = await getAvailabilitySnapshot();
    expect(snapshot).not.toBeNull();
    expect(snapshot!.updatedAt).toBe((seed as { updatedAt: string }).updatedAt);
    expect(fetchAvailability).not.toHaveBeenCalled();
  });
});
