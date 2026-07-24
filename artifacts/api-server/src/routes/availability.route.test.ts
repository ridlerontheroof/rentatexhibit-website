/**
 * Route-level tests for GET /availability: prove the full cold-start
 * stale-while-revalidate sequence so a visitor is never shown units that
 * vanished while the site idled — the baked seed is served at most once,
 * then the background refresh swaps in live data.
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

const seedPayload = seed as unknown as AvailabilityPayload;
const seedUpdatedAt = Date.parse(seedPayload.updatedAt);

// Live payload with one unit fewer than the seed — simulates a unit leased
// overnight while the autoscale instance idled.
const livePayload: AvailabilityPayload = {
  ...seedPayload,
  updatedAt: new Date(seedUpdatedAt + 10 * 60 * 1000).toISOString(),
  units: seedPayload.units.slice(1),
};

function makeApp() {
  const app = express();
  // The real app attaches req.log via pino-http; stub it for the router.
  app.use((req, _res, next) => {
    (req as unknown as { log: object }).log = {
      info: () => {},
      warn: () => {},
      error: () => {},
    };
    next();
  });
  app.use(availabilityRouter);
  return app;
}

/** Let the fire-and-forget background refresh settle. */
async function flushBackgroundRefresh() {
  await vi.runOnlyPendingTimersAsync();
  // Drain microtasks (the .then chain after fetchAvailability resolves).
  for (let i = 0; i < 5; i++) await Promise.resolve();
}

describe("GET /availability (route-level)", () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    resetAvailabilityCacheForTests();
    vi.mocked(fetchAvailability).mockReset();
    process.env.APPFOLIO_CLIENT_ID = "test-client-id";
    process.env.APPFOLIO_CLIENT_SECRET = "test-client-secret";
    // Freeze time just after the seed's updatedAt so the seed is within its
    // 48h max age but reads as stale against the 5-minute cache TTL.
    vi.useFakeTimers();
    vi.setSystemTime(seedUpdatedAt + 6 * 60 * 1000);
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env.APPFOLIO_CLIENT_ID = ORIGINAL_ENV.APPFOLIO_CLIENT_ID;
    process.env.APPFOLIO_CLIENT_SECRET = ORIGINAL_ENV.APPFOLIO_CLIENT_SECRET;
  });

  it("returns 503 when credentials are missing, even with a seeded cache", async () => {
    seedCacheFromBakedSnapshot(Date.now());
    delete process.env.APPFOLIO_CLIENT_ID;
    delete process.env.APPFOLIO_CLIENT_SECRET;

    const res = await request(makeApp()).get("/availability");
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ error: "Availability feed is not configured" });
    expect(fetchAvailability).not.toHaveBeenCalled();
  });

  it("cold start: serves the baked seed instantly, then live data after the background refresh", async () => {
    expect(seedCacheFromBakedSnapshot(Date.now())).toBe(true);

    let resolveFetch!: (p: AvailabilityPayload) => void;
    vi.mocked(fetchAvailability).mockImplementation(
      () => new Promise((resolve) => (resolveFetch = resolve)),
    );

    const app = makeApp();

    // 1) First request after the cold start: seed served instantly, without
    // waiting on the (still-pending) AppFolio round-trip.
    const first = await request(app).get("/availability");
    expect(first.status).toBe(200);
    expect(first.body.updatedAt).toBe(seedPayload.updatedAt);
    expect(first.body.units).toHaveLength(seedPayload.units.length);
    expect(fetchAvailability).toHaveBeenCalledTimes(1);

    // 2) Background refresh completes and swaps the cache to live data.
    resolveFetch(livePayload);
    await flushBackgroundRefresh();

    // 3) Next request returns live data — the overnight-leased unit is gone.
    const second = await request(app).get("/availability");
    expect(second.status).toBe(200);
    expect(second.body.updatedAt).toBe(livePayload.updatedAt);
    expect(second.body.units).toHaveLength(seedPayload.units.length - 1);
    // Stale seed was served exactly once; no extra upstream fetch needed
    // while the refreshed cache is still fresh.
    expect(fetchAvailability).toHaveBeenCalledTimes(1);
  });

  it("keeps serving the seed if the background refresh fails, without crashing", async () => {
    expect(seedCacheFromBakedSnapshot(Date.now())).toBe(true);
    vi.mocked(fetchAvailability).mockRejectedValue(new Error("AppFolio down"));

    const app = makeApp();
    const first = await request(app).get("/availability");
    expect(first.status).toBe(200);
    expect(first.body.updatedAt).toBe(seedPayload.updatedAt);

    await flushBackgroundRefresh();

    const second = await request(app).get("/availability");
    expect(second.status).toBe(200);
    expect(second.body.updatedAt).toBe(seedPayload.updatedAt);
  });

  it("cold start with no usable seed: awaits the live fetch instead of serving nothing", async () => {
    // No seeding — cache is empty (e.g. seed older than 48h was rejected).
    vi.mocked(fetchAvailability).mockResolvedValue(livePayload);

    const res = await request(makeApp()).get("/availability");
    expect(res.status).toBe(200);
    expect(res.body.updatedAt).toBe(livePayload.updatedAt);
    expect(fetchAvailability).toHaveBeenCalledTimes(1);
  });

  it("cold start with no seed and a failing fetch returns 503", async () => {
    vi.mocked(fetchAvailability).mockRejectedValue(new Error("AppFolio down"));

    const res = await request(makeApp()).get("/availability");
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ error: "Availability feed is temporarily unavailable" });
  });
});
