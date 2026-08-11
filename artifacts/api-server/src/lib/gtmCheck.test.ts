import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./email", () => ({ sendGtmCheckAlert: vi.fn(async () => {}) }));
vi.mock("./mailer", () => ({ mailerConfigured: vi.fn(() => true) }));
vi.mock("./logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

// Simulate the shared `email_throttle_counters` table (same contract as the
// redirectCheck tests): daily-claim inserts return a row only when new;
// DO UPDATE counters increment; DELETE clears. Stores survive
// __resetGtmCheckForTests(), mimicking a restart (memory lost, DB kept).
const sharedKeys = new Set<string>();
const sharedCounters = new Map<string, number>();
let dbDown = false;
vi.mock("@workspace/db", () => ({
  db: {
    execute: vi.fn(async (query: { queryChunks?: unknown[] }) => {
      if (dbDown) throw new Error("db unreachable");
      const text = JSON.stringify(query);
      const key = text.match(/gtmcheck:[^"\\]+/)?.[0];
      if (typeof key !== "string") return { rows: [] };
      if (text.includes("DELETE")) {
        sharedCounters.delete(key);
        return { rows: [] };
      }
      if (text.includes("DO UPDATE")) {
        const next = (sharedCounters.get(key) ?? 0) + 1;
        sharedCounters.set(key, next);
        return { rows: [{ count: next }] };
      }
      if (sharedKeys.has(key)) return { rows: [] };
      sharedKeys.add(key);
      return { rows: [{ count: 1 }] };
    }),
  },
}));

import {
  checkGtmTrackingOnce,
  resolveGtmCheckScript,
  __resetGtmCheckForTests,
  type GtmCheckRun,
} from "./gtmCheck";
import { sendGtmCheckAlert } from "./email";
import { mailerConfigured } from "./mailer";
import { logger } from "./logger";

const sendAlert = vi.mocked(sendGtmCheckAlert);
const mailerConfiguredMock = vi.mocked(mailerConfigured);
const log = logger as never;

const DAY1 = Date.parse("2026-08-11T10:00:00Z");
const DAY1_LATER = Date.parse("2026-08-11T22:00:00Z");
const DAY2 = Date.parse("2026-08-12T10:00:00Z");

const pass = (): Promise<GtmCheckRun> =>
  Promise.resolve({
    exitCode: 0,
    outputTail:
      "PASS  Container GTM-MDPWH532 is live and carries G-1S66YHBN91 — visitor tracking is wired up.",
  });
const fail = (): Promise<GtmCheckRun> =>
  Promise.resolve({
    exitCode: 1,
    outputTail:
      "FAIL  Published container GTM-MDPWH532 contains NO GA4 measurement ID (G-…).",
  });
const spawnError = (): Promise<GtmCheckRun> =>
  Promise.resolve({ exitCode: null, outputTail: "", error: "killed after timeout" });

beforeEach(() => {
  vi.clearAllMocks();
  sharedKeys.clear();
  sharedCounters.clear();
  dbDown = false;
  mailerConfiguredMock.mockReturnValue(true);
  __resetGtmCheckForTests();
});

describe("resolveGtmCheckScript", () => {
  it("finds the check script from the repo root and from the package dir", () => {
    // Test runs with cwd = artifacts/api-server; the script lives two levels up.
    expect(resolveGtmCheckScript()).toMatch(
      /artifacts\/exhibit-on-superior\/scripts\/check-gtm-tracking\.mjs$/,
    );
    expect(resolveGtmCheckScript("/nonexistent/place")).toBeNull();
  });
});

describe("checkGtmTrackingOnce", () => {
  it("does not alert when the check passes and logs an info line", async () => {
    await checkGtmTrackingOnce(log, DAY1, pass);
    expect(sendAlert).not.toHaveBeenCalled();
    expect(vi.mocked(logger.info)).toHaveBeenCalledWith(
      {},
      "GTM tracking check passed",
    );
  });

  it("alerts once per UTC day on a definitive failure, again the next day", async () => {
    await checkGtmTrackingOnce(log, DAY1, fail);
    expect(sendAlert).toHaveBeenCalledTimes(1);
    expect(sendAlert.mock.calls[0]![0].summary).toContain("exited 1");
    expect(sendAlert.mock.calls[0]![0].outputTail).toContain("FAIL");

    await checkGtmTrackingOnce(log, DAY1_LATER, fail);
    expect(sendAlert).toHaveBeenCalledTimes(1); // same day → deduped

    await checkGtmTrackingOnce(log, DAY2, fail);
    expect(sendAlert).toHaveBeenCalledTimes(2);
  });

  it("dedupes across a restart via the shared claim", async () => {
    await checkGtmTrackingOnce(log, DAY1, fail);
    expect(sendAlert).toHaveBeenCalledTimes(1);
    __resetGtmCheckForTests(); // restart: memory gone, DB rows kept
    await checkGtmTrackingOnce(log, DAY1_LATER, fail);
    expect(sendAlert).toHaveBeenCalledTimes(1);
  });

  it("does not alert when the mailer is unconfigured", async () => {
    mailerConfiguredMock.mockReturnValue(false);
    await checkGtmTrackingOnce(log, DAY1, fail);
    expect(sendAlert).not.toHaveBeenCalled();
  });

  it("treats a missing script as unsupported: errors once, never alerts", async () => {
    const resolver = () => null;
    await checkGtmTrackingOnce(log, DAY1, undefined, resolver);
    await checkGtmTrackingOnce(log, DAY1_LATER, undefined, resolver);
    expect(sendAlert).not.toHaveBeenCalled();
    expect(vi.mocked(logger.error)).toHaveBeenCalledTimes(1);
  });

  it("does not alert on a single errored run, but escalates after 4 in a row", async () => {
    for (let i = 0; i < 3; i++) {
      await checkGtmTrackingOnce(log, DAY1, spawnError);
    }
    expect(sendAlert).not.toHaveBeenCalled();
    await checkGtmTrackingOnce(log, DAY1, spawnError);
    expect(sendAlert).toHaveBeenCalledTimes(1);
    expect(sendAlert.mock.calls[0]![0].summary).toContain("4 consecutive runs");
  });

  it("persists the errored-run streak across restarts", async () => {
    await checkGtmTrackingOnce(log, DAY1, spawnError);
    await checkGtmTrackingOnce(log, DAY1, spawnError);
    __resetGtmCheckForTests(); // restart mid-outage
    await checkGtmTrackingOnce(log, DAY1, spawnError);
    expect(sendAlert).not.toHaveBeenCalled();
    await checkGtmTrackingOnce(log, DAY1, spawnError);
    expect(sendAlert).toHaveBeenCalledTimes(1);
  });

  it("a successful run resets the errored-run streak", async () => {
    for (let i = 0; i < 3; i++) {
      await checkGtmTrackingOnce(log, DAY1, spawnError);
    }
    await checkGtmTrackingOnce(log, DAY1, pass);
    for (let i = 0; i < 3; i++) {
      await checkGtmTrackingOnce(log, DAY1, spawnError);
    }
    expect(sendAlert).not.toHaveBeenCalled();
  });

  it("a same-day FAIL alert does not swallow the watchdog-blind escalation", async () => {
    await checkGtmTrackingOnce(log, DAY1, fail);
    expect(sendAlert).toHaveBeenCalledTimes(1);
    for (let i = 0; i < 4; i++) {
      await checkGtmTrackingOnce(log, DAY1_LATER, spawnError);
    }
    expect(sendAlert).toHaveBeenCalledTimes(2);
    expect(sendAlert.mock.calls[1]![0].summary).toContain("consecutive runs");
  });

  it("the escalation itself is still deduped once per day", async () => {
    for (let i = 0; i < 4; i++) {
      await checkGtmTrackingOnce(log, DAY1, spawnError);
    }
    expect(sendAlert).toHaveBeenCalledTimes(1);
    await checkGtmTrackingOnce(log, DAY1_LATER, spawnError);
    expect(sendAlert).toHaveBeenCalledTimes(1); // still blind, same day → deduped
  });

  it("falls back to in-memory counting when the database is down", async () => {
    dbDown = true;
    for (let i = 0; i < 4; i++) {
      await checkGtmTrackingOnce(log, DAY1, spawnError);
    }
    expect(sendAlert).toHaveBeenCalledTimes(1);
  });

  it("never throws when the alert send fails", async () => {
    sendAlert.mockRejectedValueOnce(new Error("smtp down"));
    await expect(
      checkGtmTrackingOnce(log, DAY1, fail),
    ).resolves.toBeUndefined();
    expect(vi.mocked(logger.error)).toHaveBeenCalled();
  });
});
