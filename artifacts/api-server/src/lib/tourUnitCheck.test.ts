import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./email", () => ({ sendShowingSchedulerAlert: vi.fn(async () => {}) }));
vi.mock("./mailer", () => ({ mailerConfigured: vi.fn(() => true) }));
vi.mock("./logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));
// The default dependency is always overridden in these tests, but the module
// imports the real AppFolio client at load time; stub it so importing this
// module never touches the network.
vi.mock("./appfolio", () => ({
  resolveTourUnitListableUid: vi.fn(async () => null),
}));

// Simulate the shared `email_throttle_counters` table: daily-claim keys use
// INSERT … ON CONFLICT DO NOTHING RETURNING; the failure counter uses
// INSERT … ON CONFLICT DO UPDATE … RETURNING count and DELETE.
const sharedKeys = new Set<string>();
let sharedFailureCount = 0;
let dbDown = false;
vi.mock("@workspace/db", () => ({
  db: {
    execute: vi.fn(async (query: { queryChunks?: unknown[] }) => {
      if (dbDown) throw new Error("db unreachable");
      const text = JSON.stringify(query);
      if (text.includes("tourunit:failed-runs")) {
        if (text.includes("DELETE")) {
          sharedFailureCount = 0;
          return { rows: [] };
        }
        sharedFailureCount += 1;
        return { rows: [{ count: sharedFailureCount }] };
      }
      const key = text.match(/tourunit:[^"\\]+/)?.[0];
      if (typeof key !== "string") return { rows: [] };
      if (sharedKeys.has(key)) return { rows: [] };
      sharedKeys.add(key);
      return { rows: [{ count: 1 }] };
    }),
  },
}));

import {
  checkTourUnitOnce,
  ESCALATION_RUNS,
  __resetTourUnitCheckForTests,
  type TourUnitCheckDeps,
} from "./tourUnitCheck";
import { sendShowingSchedulerAlert } from "./email";
import { mailerConfigured } from "./mailer";
import { logger } from "./logger";

const sendAlert = vi.mocked(sendShowingSchedulerAlert);
const mailerConfiguredMock = vi.mocked(mailerConfigured);

const DAY1 = Date.parse("2026-07-30T10:00:00Z");
const DAY1_LATER = Date.parse("2026-07-30T22:00:00Z");
const DAY2 = Date.parse("2026-07-31T10:00:00Z");

const healthy: TourUnitCheckDeps = {
  resolveTourUid: async () => "96a20390-f2a3-4806-b877-a758094c2a2b",
};
const unresolved: TourUnitCheckDeps = { resolveTourUid: async () => null };
const throwing: TourUnitCheckDeps = {
  resolveTourUid: async () => {
    throw new Error("unit directory fetch exploded");
  },
};

describe("checkTourUnitOnce", () => {
  beforeEach(() => {
    __resetTourUnitCheckForTests();
    sharedKeys.clear();
    sharedFailureCount = 0;
    dbDown = false;
    vi.clearAllMocks();
    mailerConfiguredMock.mockReturnValue(true);
  });

  it("does not alert or log errors when the TOUR token resolves", async () => {
    await checkTourUnitOnce(logger, DAY1, healthy);
    expect(sendAlert).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("does not alert on the first failed runs, then alerts once sustained", async () => {
    for (let i = 1; i < ESCALATION_RUNS; i++) {
      await checkTourUnitOnce(logger, DAY1, unresolved);
    }
    expect(sendAlert).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled(); // every failure is logged loudly

    await checkTourUnitOnce(logger, DAY1, unresolved);
    expect(sendAlert).toHaveBeenCalledExactlyOnceWith({
      reason: "tour_unit_unresolved",
      detail: expect.stringContaining("unit directory"),
      failedRuns: ESCALATION_RUNS,
    });
  });

  it("treats a throwing resolver as a failed run and includes the message", async () => {
    for (let i = 0; i < ESCALATION_RUNS; i++) {
      await checkTourUnitOnce(logger, DAY1, throwing);
    }
    expect(sendAlert).toHaveBeenCalledExactlyOnceWith({
      reason: "tour_unit_unresolved",
      detail: expect.stringContaining("unit directory fetch exploded"),
      failedRuns: ESCALATION_RUNS,
    });
  });

  it("a healthy run resets the failure streak (shared + in-memory)", async () => {
    await checkTourUnitOnce(logger, DAY1, unresolved);
    await checkTourUnitOnce(logger, DAY1, unresolved);
    await checkTourUnitOnce(logger, DAY1, healthy); // recovery
    await checkTourUnitOnce(logger, DAY1, unresolved);
    expect(sendAlert).not.toHaveBeenCalled();
  });

  it("the persisted failure count survives a process restart", async () => {
    for (let i = 1; i < ESCALATION_RUNS; i++) {
      await checkTourUnitOnce(logger, DAY1, unresolved);
    }
    // "Restart": in-memory streak resets, shared table keeps counting.
    __resetTourUnitCheckForTests();
    await checkTourUnitOnce(logger, DAY1, unresolved);
    expect(sendAlert).toHaveBeenCalledTimes(1);
  });

  it("throttles to one alert per UTC day, cluster-wide", async () => {
    for (let i = 0; i < ESCALATION_RUNS; i++) {
      await checkTourUnitOnce(logger, DAY1, unresolved);
    }
    await checkTourUnitOnce(logger, DAY1_LATER, unresolved);
    expect(sendAlert).toHaveBeenCalledTimes(1);
    // A "different replica" (fresh in-memory state, same shared table) also
    // cannot re-send on the same day.
    __resetTourUnitCheckForTests();
    await checkTourUnitOnce(logger, DAY1_LATER, unresolved);
    expect(sendAlert).toHaveBeenCalledTimes(1);
    // Next day (outage still ongoing) it fires again.
    await checkTourUnitOnce(logger, DAY2, unresolved);
    expect(sendAlert).toHaveBeenCalledTimes(2);
  });

  it("falls back to in-memory dedupe and counting when the database is down", async () => {
    dbDown = true;
    for (let i = 0; i < ESCALATION_RUNS; i++) {
      await checkTourUnitOnce(logger, DAY1, unresolved);
    }
    await checkTourUnitOnce(logger, DAY1_LATER, unresolved);
    expect(sendAlert).toHaveBeenCalledTimes(1);
  });

  it("still logs the error when the mailer is unconfigured", async () => {
    mailerConfiguredMock.mockReturnValue(false);
    for (let i = 0; i < ESCALATION_RUNS; i++) {
      await checkTourUnitOnce(logger, DAY1, unresolved);
    }
    expect(sendAlert).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });

  it("never throws when the alert send fails", async () => {
    sendAlert.mockRejectedValue(new Error("smtp down"));
    for (let i = 0; i < ESCALATION_RUNS; i++) {
      await expect(
        checkTourUnitOnce(logger, DAY1, unresolved),
      ).resolves.toBeUndefined();
    }
  });

  it("logs the first pass of a UTC day at info, later same-day passes at debug", async () => {
    const passLines = (fn: typeof logger.info) =>
      vi
        .mocked(fn)
        .mock.calls.filter(
          ([, msg]) => msg === "Tour-unit check passed — TOUR token resolves",
        );

    await checkTourUnitOnce(logger, DAY1, healthy);
    expect(passLines(logger.info)).toHaveLength(1);
    expect(passLines(logger.debug)).toHaveLength(0);

    // A second same-day pass stays at debug.
    await checkTourUnitOnce(logger, DAY1_LATER, healthy);
    expect(passLines(logger.info)).toHaveLength(1);
    expect(passLines(logger.debug)).toHaveLength(1);

    // A new UTC day promotes the first pass to info again.
    await checkTourUnitOnce(logger, DAY2, healthy);
    expect(passLines(logger.info)).toHaveLength(2);
  });

  it("emits an info heartbeat on the first check, then a daily summary of outcomes", async () => {
    const heartbeats = () =>
      vi
        .mocked(logger.info)
        .mock.calls.filter(([, msg]) => typeof msg === "string" && msg.includes("heartbeat"));

    await checkTourUnitOnce(logger, DAY1, healthy);
    expect(heartbeats()).toHaveLength(1);
    await checkTourUnitOnce(logger, DAY1_LATER, unresolved);
    expect(heartbeats()).toHaveLength(1);
    await checkTourUnitOnce(logger, DAY2, healthy);
    const beats = heartbeats();
    expect(beats).toHaveLength(2);
    expect(beats[1]?.[0]).toMatchObject({
      checks: 2,
      healthy: 1,
      failed: 1,
    });
  });
});
