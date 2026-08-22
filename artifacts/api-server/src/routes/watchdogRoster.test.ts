/**
 * Route tests for POST /watchdog-roster/alert: verifies that unauthorized
 * requests are rejected before any claim or email side-effect, that malformed
 * bodies are rejected with 400, and that a correctly authenticated request
 * with valid watchdog names returns 204 and fires alertMissingWatchdogs.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";

vi.mock("../lib/watchdogRosterAlert", () => ({
  alertMissingWatchdogs: vi.fn(async () => {}),
}));
vi.mock("../lib/startupSummary", () => ({
  EXPECTED_WATCHDOGS: ["apex-redirect", "ga4-tracking"] as const,
  getStartedWatchdogs: vi.fn(() => ["apex-redirect"]),
}));
vi.mock("../lib/logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import watchdogRosterRouter from "./watchdogRoster";
import { alertMissingWatchdogs } from "../lib/watchdogRosterAlert";

const alertFn = vi.mocked(alertMissingWatchdogs);
const TOKEN = "test-secret-token-abc123";

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use(watchdogRosterRouter);
  return app;
}

describe("GET /watchdog-roster", () => {
  it("returns the roster without authentication", async () => {
    const app = makeApp();
    const res = await request(app).get("/watchdog-roster");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      expected: expect.arrayContaining(["apex-redirect", "ga4-tracking"]),
      started: expect.any(Array),
      missing: expect.any(Array),
    });
  });
});

describe("POST /watchdog-roster/alert auth", () => {
  const savedToken = process.env.WATCHDOG_ALERT_TOKEN;

  beforeEach(() => {
    alertFn.mockClear();
    process.env.WATCHDOG_ALERT_TOKEN = TOKEN;
  });

  afterEach(() => {
    if (savedToken === undefined) {
      delete process.env.WATCHDOG_ALERT_TOKEN;
    } else {
      process.env.WATCHDOG_ALERT_TOKEN = savedToken;
    }
  });

  it("returns 401 with no Authorization header", async () => {
    const res = await request(makeApp())
      .post("/watchdog-roster/alert")
      .send({ missing: ["ga4-tracking"] });
    expect(res.status).toBe(401);
    expect(alertFn).not.toHaveBeenCalled();
  });

  it("returns 401 with a wrong token", async () => {
    const res = await request(makeApp())
      .post("/watchdog-roster/alert")
      .set("Authorization", "Bearer completely-wrong-token")
      .send({ missing: ["ga4-tracking"] });
    expect(res.status).toBe(401);
    expect(alertFn).not.toHaveBeenCalled();
  });

  it("returns 401 with a token of correct value but wrong length", async () => {
    const res = await request(makeApp())
      .post("/watchdog-roster/alert")
      .set("Authorization", `Bearer ${TOKEN}X`)
      .send({ missing: ["ga4-tracking"] });
    expect(res.status).toBe(401);
    expect(alertFn).not.toHaveBeenCalled();
  });

  it("returns 401 when WATCHDOG_ALERT_TOKEN env var is absent", async () => {
    delete process.env.WATCHDOG_ALERT_TOKEN;
    const res = await request(makeApp())
      .post("/watchdog-roster/alert")
      .set("Authorization", `Bearer ${TOKEN}`)
      .send({ missing: ["ga4-tracking"] });
    expect(res.status).toBe(401);
    expect(alertFn).not.toHaveBeenCalled();
  });

  it("does not send alert on 401 — claim is not consumed", async () => {
    // Two unauthenticated requests must not affect the daily claim state.
    const app = makeApp();
    await request(app).post("/watchdog-roster/alert").send({ missing: ["ga4-tracking"] });
    await request(app).post("/watchdog-roster/alert").send({ missing: ["ga4-tracking"] });
    expect(alertFn).not.toHaveBeenCalled();
  });
});

describe("POST /watchdog-roster/alert validation", () => {
  const savedToken = process.env.WATCHDOG_ALERT_TOKEN;

  beforeEach(() => {
    alertFn.mockClear();
    process.env.WATCHDOG_ALERT_TOKEN = TOKEN;
  });

  afterEach(() => {
    if (savedToken === undefined) {
      delete process.env.WATCHDOG_ALERT_TOKEN;
    } else {
      process.env.WATCHDOG_ALERT_TOKEN = savedToken;
    }
  });

  it("returns 400 for an empty missing array", async () => {
    const res = await request(makeApp())
      .post("/watchdog-roster/alert")
      .set("Authorization", `Bearer ${TOKEN}`)
      .send({ missing: [] });
    expect(res.status).toBe(400);
    expect(alertFn).not.toHaveBeenCalled();
  });

  it("returns 400 when missing is not an array", async () => {
    const res = await request(makeApp())
      .post("/watchdog-roster/alert")
      .set("Authorization", `Bearer ${TOKEN}`)
      .send({ missing: "apex-redirect" });
    expect(res.status).toBe(400);
    expect(alertFn).not.toHaveBeenCalled();
  });

  it("returns 400 for unknown watchdog names", async () => {
    const res = await request(makeApp())
      .post("/watchdog-roster/alert")
      .set("Authorization", `Bearer ${TOKEN}`)
      .send({ missing: ["not-a-real-watchdog"] });
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: "unknown watchdog names", unknown: ["not-a-real-watchdog"] });
    expect(alertFn).not.toHaveBeenCalled();
  });

  it("returns 204 and calls alertMissingWatchdogs for valid authenticated request", async () => {
    const res = await request(makeApp())
      .post("/watchdog-roster/alert")
      .set("Authorization", `Bearer ${TOKEN}`)
      .send({ missing: ["ga4-tracking"] });
    expect(res.status).toBe(204);
    // alertMissingWatchdogs is fire-and-forget; flush microtasks
    await new Promise((r) => setTimeout(r, 20));
    expect(alertFn).toHaveBeenCalledWith(["ga4-tracking"], expect.anything());
  });

  it("returns 204 for multiple valid watchdog names", async () => {
    const res = await request(makeApp())
      .post("/watchdog-roster/alert")
      .set("Authorization", `Bearer ${TOKEN}`)
      .send({ missing: ["apex-redirect", "ga4-tracking"] });
    expect(res.status).toBe(204);
  });
});
