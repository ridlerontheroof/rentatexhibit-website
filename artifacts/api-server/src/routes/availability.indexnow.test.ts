/**
 * Integration test: an availability refresh whose inventory differs from the
 * previous snapshot must ping IndexNow with the exact per-unit page URLs that
 * changed (added, removed, re-priced) — proving the wiring from the route's
 * refresh path through changedUnitUrls/notifyAvailabilityChanged, not just
 * the unit-tested URL diffing.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import seed from "../data/availabilitySeed.json";

vi.mock("../lib/appfolio", () => ({
  fetchAvailability: vi.fn(),
}));

import { fetchAvailability } from "../lib/appfolio";
import type { AvailabilityPayload } from "../lib/appfolio";
import availabilityRouter, {
  resetAvailabilityCacheForTests,
  seedCacheFromBakedSnapshot,
} from "./availability";
import { SITE_URL } from "../lib/indexnow";

const seedPayload = seed as unknown as AvailabilityPayload;
const seedUpdatedAt = Date.parse(seedPayload.updatedAt);

function makeApp() {
  const app = express();
  app.use((req, _res, next) => {
    (req as unknown as { log: object }).log = { info: () => {}, warn: () => {}, error: () => {} };
    next();
  });
  app.use(availabilityRouter);
  return app;
}

async function flushBackgroundRefresh() {
  await vi.runOnlyPendingTimersAsync();
  for (let i = 0; i < 5; i++) await Promise.resolve();
}

describe("availability refresh -> IndexNow per-unit pings", () => {
  const ORIGINAL_ENV = { ...process.env };
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    resetAvailabilityCacheForTests();
    vi.mocked(fetchAvailability).mockReset();
    process.env.APPFOLIO_CLIENT_ID = "test-client-id";
    process.env.APPFOLIO_CLIENT_SECRET = "test-client-secret";
    // notifyAvailabilityChanged only fires in production.
    vi.stubEnv("NODE_ENV", "production");
    fetchSpy = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchSpy);
    vi.useFakeTimers();
    vi.setSystemTime(seedUpdatedAt + 6 * 60 * 1000);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    process.env.APPFOLIO_CLIENT_ID = ORIGINAL_ENV.APPFOLIO_CLIENT_ID;
    process.env.APPFOLIO_CLIENT_SECRET = ORIGINAL_ENV.APPFOLIO_CLIENT_SECRET;
  });

  it("pings IndexNow with the removed and re-priced unit URLs after a changed refresh", async () => {
    expect(seedPayload.units.length).toBeGreaterThan(1);
    const removed = seedPayload.units[0];
    const repriced = seedPayload.units[1];
    const live: AvailabilityPayload = {
      ...seedPayload,
      updatedAt: new Date(seedUpdatedAt + 10 * 60 * 1000).toISOString(),
      units: [
        { ...repriced, rent: (repriced.rent ?? 2000) + 100 },
        ...seedPayload.units.slice(2),
      ],
    };
    vi.mocked(fetchAvailability).mockResolvedValue(live);

    // Cold start: cache seeded from the baked snapshot (= previous inventory).
    seedCacheFromBakedSnapshot(Date.now());
    const app = makeApp();

    // Stale-while-revalidate: serves the seed, refreshes in the background.
    await request(app).get("/availability").expect(200);
    await flushBackgroundRefresh();

    const indexNowCalls = fetchSpy.mock.calls.filter(([url]) =>
      String(url).includes("api.indexnow.org"),
    );
    expect(indexNowCalls.length).toBe(1);
    const body = JSON.parse(indexNowCalls[0][1].body as string);
    expect(body.urlList).toContain(`${SITE_URL}/available-units/${removed.unit}`);
    expect(body.urlList).toContain(`${SITE_URL}/available-units/${repriced.unit}`);
    // Hub pages always ride along with an inventory change.
    expect(body.urlList).toContain(`${SITE_URL}/`);
    expect(body.urlList).toContain(`${SITE_URL}/available-units`);
    // Unchanged units are NOT resubmitted.
    for (const u of seedPayload.units.slice(2)) {
      expect(body.urlList).not.toContain(`${SITE_URL}/available-units/${u.unit}`);
    }
  });

  it("does not ping IndexNow when the refreshed inventory is identical", async () => {
    vi.mocked(fetchAvailability).mockResolvedValue({
      ...seedPayload,
      updatedAt: new Date(seedUpdatedAt + 10 * 60 * 1000).toISOString(),
    });
    seedCacheFromBakedSnapshot(Date.now());
    const app = makeApp();
    await request(app).get("/availability").expect(200);
    await flushBackgroundRefresh();
    const indexNowCalls = fetchSpy.mock.calls.filter(([url]) =>
      String(url).includes("api.indexnow.org"),
    );
    expect(indexNowCalls.length).toBe(0);
  });
});
