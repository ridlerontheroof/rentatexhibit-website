import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./email", () => ({ sendShowingSchedulerAlert: vi.fn(async () => {}) }));
vi.mock("./mailer", () => ({ mailerConfigured: vi.fn(() => true) }));
vi.mock("./logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));
// The default probe deps are always overridden in these tests, but the module
// imports the real availability route + showings client at load time; stub
// them so importing this module never touches the network or the snapshot.
vi.mock("../routes/availability", () => ({
  getAvailabilitySnapshot: vi.fn(async () => null),
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
      if (text.includes("showingscheduler:failed-runs")) {
        if (text.includes("DELETE")) {
          sharedFailureCount = 0;
          return { rows: [] };
        }
        sharedFailureCount += 1;
        return { rows: [{ count: sharedFailureCount }] };
      }
      const key = text.match(/showingscheduler:[^"\\]+/)?.[0];
      if (typeof key !== "string") return { rows: [] };
      if (sharedKeys.has(key)) return { rows: [] };
      sharedKeys.add(key);
      return { rows: [{ count: 1 }] };
    }),
  },
}));

import {
  checkShowingSchedulerOnce,
  ESCALATION_RUNS,
  __resetShowingSchedulerCheckForTests,
  type ShowingProbeDeps,
} from "./showingSchedulerCheck";
import { sendShowingSchedulerAlert } from "./email";
import { mailerConfigured } from "./mailer";
import { logger } from "./logger";

const sendAlert = vi.mocked(sendShowingSchedulerAlert);
const mailerConfiguredMock = vi.mocked(mailerConfigured);

const DAY1 = Date.parse("2026-07-26T10:00:00Z");
const DAY1_LATER = Date.parse("2026-07-26T22:00:00Z");
const DAY2 = Date.parse("2026-07-27T10:00:00Z");

function deps(overrides: Partial<ShowingProbeDeps> = {}): ShowingProbeDeps {
  return {
    resolveProbeUid: async () => "uid-123",
    probeSlots: async () => {},
    probeIdv: async () => false,
    ...overrides,
  };
}

const failingSlots = async () => {
  throw new Error("AppFolio availabilities failed: status 404");
};

describe("checkShowingSchedulerOnce", () => {
  beforeEach(() => {
    __resetShowingSchedulerCheckForTests();
    sharedKeys.clear();
    sharedFailureCount = 0;
    dbDown = false;
    vi.clearAllMocks();
    mailerConfiguredMock.mockReturnValue(true);
  });

  it("does not alert when both probes pass", async () => {
    await checkShowingSchedulerOnce(logger, DAY1, deps());
    expect(sendAlert).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("records a skipped run (and never alerts) when no unit is posted", async () => {
    await checkShowingSchedulerOnce(
      logger,
      DAY1,
      deps({ resolveProbeUid: async () => null }),
    );
    expect(sendAlert).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("treats a snapshot resolution error as a skip, not a failure", async () => {
    await checkShowingSchedulerOnce(
      logger,
      DAY1,
      deps({
        resolveProbeUid: async () => {
          throw new Error("snapshot unavailable");
        },
      }),
    );
    expect(sendAlert).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledOnce();
  });

  it("does not alert on the first failed runs, then alerts once sustained", async () => {
    const bad = deps({ probeSlots: failingSlots });
    for (let i = 1; i < ESCALATION_RUNS; i++) {
      await checkShowingSchedulerOnce(logger, DAY1, bad);
    }
    expect(sendAlert).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled(); // every failure is logged loudly

    await checkShowingSchedulerOnce(logger, DAY1, bad);
    expect(sendAlert).toHaveBeenCalledExactlyOnceWith({
      reason: "sustained_failure",
      detail: expect.stringContaining("slot fetch failed"),
      failedRuns: ESCALATION_RUNS,
    });
  });

  it("includes the IDV probe failure in the alert detail", async () => {
    const bad = deps({
      probeSlots: failingSlots,
      probeIdv: async () => {
        throw new Error("IDV status failed: status 500");
      },
    });
    for (let i = 0; i < ESCALATION_RUNS; i++) {
      await checkShowingSchedulerOnce(logger, DAY1, bad);
    }
    expect(sendAlert).toHaveBeenCalledExactlyOnceWith({
      reason: "sustained_failure",
      detail: expect.stringContaining("IDV status check failed"),
      failedRuns: ESCALATION_RUNS,
    });
  });

  it("a healthy run resets the failure streak (shared + in-memory)", async () => {
    const bad = deps({ probeSlots: failingSlots });
    await checkShowingSchedulerOnce(logger, DAY1, bad);
    await checkShowingSchedulerOnce(logger, DAY1, bad);
    await checkShowingSchedulerOnce(logger, DAY1, deps()); // recovery
    await checkShowingSchedulerOnce(logger, DAY1, bad);
    expect(sendAlert).not.toHaveBeenCalled();
  });

  it("the persisted failure count survives a process restart", async () => {
    const bad = deps({ probeSlots: failingSlots });
    for (let i = 1; i < ESCALATION_RUNS; i++) {
      await checkShowingSchedulerOnce(logger, DAY1, bad);
    }
    // "Restart": in-memory streak resets, shared table keeps counting.
    __resetShowingSchedulerCheckForTests();
    await checkShowingSchedulerOnce(logger, DAY1, bad);
    expect(sendAlert).toHaveBeenCalledTimes(1);
  });

  it("alerts immediately (no streak needed) when IDV is enabled", async () => {
    await checkShowingSchedulerOnce(
      logger,
      DAY1,
      deps({ probeIdv: async () => true }),
    );
    expect(sendAlert).toHaveBeenCalledExactlyOnceWith({
      reason: "idv_enabled",
      detail: expect.stringContaining("enabled: true"),
      failedRuns: 0,
    });
  });

  it("throttles to one alert per UTC day, cluster-wide", async () => {
    const idvOn = deps({ probeIdv: async () => true });
    await checkShowingSchedulerOnce(logger, DAY1, idvOn);
    await checkShowingSchedulerOnce(logger, DAY1_LATER, idvOn);
    expect(sendAlert).toHaveBeenCalledTimes(1);
    // A "different replica" (fresh in-memory state, same shared table) also
    // cannot re-send on the same day.
    __resetShowingSchedulerCheckForTests();
    await checkShowingSchedulerOnce(logger, DAY1_LATER, idvOn);
    expect(sendAlert).toHaveBeenCalledTimes(1);
    // Next day it fires again.
    await checkShowingSchedulerOnce(logger, DAY2, idvOn);
    expect(sendAlert).toHaveBeenCalledTimes(2);
  });

  it("falls back to in-memory dedupe and counting when the database is down", async () => {
    dbDown = true;
    const bad = deps({ probeSlots: failingSlots });
    for (let i = 0; i < ESCALATION_RUNS; i++) {
      await checkShowingSchedulerOnce(logger, DAY1, bad);
    }
    await checkShowingSchedulerOnce(logger, DAY1_LATER, bad);
    expect(sendAlert).toHaveBeenCalledTimes(1);
  });

  it("still logs the error when the mailer is unconfigured", async () => {
    mailerConfiguredMock.mockReturnValue(false);
    await checkShowingSchedulerOnce(logger, DAY1, deps({ probeIdv: async () => true }));
    expect(sendAlert).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });

  it("never throws when the alert send fails", async () => {
    sendAlert.mockRejectedValueOnce(new Error("smtp down"));
    await expect(
      checkShowingSchedulerOnce(logger, DAY1, deps({ probeIdv: async () => true })),
    ).resolves.toBeUndefined();
  });

  it("emits an info heartbeat on the first probe, then a daily summary of outcomes", async () => {
    const heartbeats = () =>
      vi
        .mocked(logger.info)
        .mock.calls.filter(([, msg]) => typeof msg === "string" && msg.includes("heartbeat"));

    await checkShowingSchedulerOnce(logger, DAY1, deps());
    expect(heartbeats()).toHaveLength(1);
    await checkShowingSchedulerOnce(logger, DAY1_LATER, deps({ probeSlots: failingSlots }));
    await checkShowingSchedulerOnce(logger, DAY1_LATER, deps({ resolveProbeUid: async () => null }));
    expect(heartbeats()).toHaveLength(1);
    await checkShowingSchedulerOnce(logger, DAY2, deps());
    const beats = heartbeats();
    expect(beats).toHaveLength(2);
    expect(beats[1]?.[0]).toMatchObject({
      checks: 3,
      healthy: 1,
      failed: 1,
      skipped: 1,
      idv_enabled: 0,
    });
  });
});
