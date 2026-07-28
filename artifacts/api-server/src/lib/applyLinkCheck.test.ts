import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./email", () => ({ sendApplyLinkAlert: vi.fn(async () => {}) }));
vi.mock("./mailer", () => ({ mailerConfigured: vi.fn(() => true) }));
vi.mock("./logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));
// The default probe deps are always overridden in these tests, but the module
// imports the real availability route at load time; stub it so importing this
// module never touches the network or the snapshot.
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
      if (text.includes("applylinkcheck:failed-runs")) {
        if (text.includes("DELETE")) {
          sharedFailureCount = 0;
          return { rows: [] };
        }
        sharedFailureCount += 1;
        return { rows: [{ count: sharedFailureCount }] };
      }
      const key = text.match(/applylinkcheck:[^"\\]+/)?.[0];
      if (typeof key !== "string") return { rows: [] };
      if (sharedKeys.has(key)) return { rows: [] };
      sharedKeys.add(key);
      return { rows: [{ count: 1 }] };
    }),
  },
}));

import {
  ESCALATION_RUNS,
  checkApplyLinkOnce,
  __resetApplyLinkCheckForTests,
  type ApplyProbeDeps,
} from "./applyLinkCheck";
import { sendApplyLinkAlert } from "./email";
import { mailerConfigured } from "./mailer";
import { logger } from "./logger";

const sendAlert = vi.mocked(sendApplyLinkAlert);
const mailerConfiguredMock = vi.mocked(mailerConfigured);
const log = logger as never;

const DAY1 = Date.UTC(2026, 6, 28, 12, 0, 0);
const DAY2 = DAY1 + 24 * 60 * 60 * 1000;

const TARGET = {
  unit: "0606",
  applyUrl:
    "https://highlandrealestatepartners.appfolio.com/listings/rental_applications/new?listable_uid=abc-123&source=Website%20(Exhibit)",
};

function deps(overrides: Partial<ApplyProbeDeps> = {}): ApplyProbeDeps {
  return {
    resolveTarget: async () => TARGET,
    probeStatus: async () => 200,
    ...overrides,
  };
}

const failing404: Pick<ApplyProbeDeps, "probeStatus"> = {
  probeStatus: async () => 404,
};

describe("checkApplyLinkOnce", () => {
  beforeEach(() => {
    __resetApplyLinkCheckForTests();
    sharedKeys.clear();
    sharedFailureCount = 0;
    dbDown = false;
    vi.clearAllMocks();
    mailerConfiguredMock.mockReturnValue(true);
  });

  it("does not alert when the apply URL answers 2xx", async () => {
    await checkApplyLinkOnce(log, DAY1, deps());
    expect(sendAlert).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("treats a 3xx final status as healthy (redirect chain cut short, not a dead link)", async () => {
    await checkApplyLinkOnce(log, DAY1, deps({ probeStatus: async () => 302 }));
    expect(sendAlert).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("records a skipped run (and never alerts) when no unit is posted", async () => {
    await checkApplyLinkOnce(log, DAY1, deps({ resolveTarget: async () => null }));
    expect(sendAlert).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("treats a snapshot resolution error as a skip, not a failure", async () => {
    await checkApplyLinkOnce(
      log,
      DAY1,
      deps({
        resolveTarget: async () => {
          throw new Error("snapshot unavailable");
        },
      }),
    );
    expect(sendAlert).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledOnce();
  });

  it("does not alert on the first failed runs, then alerts once sustained", async () => {
    const bad = deps(failing404);
    for (let i = 1; i < ESCALATION_RUNS; i++) {
      await checkApplyLinkOnce(log, DAY1, bad);
    }
    expect(sendAlert).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled(); // every failure is logged loudly

    await checkApplyLinkOnce(log, DAY1, bad);
    expect(sendAlert).toHaveBeenCalledExactlyOnceWith({
      unit: TARGET.unit,
      applyUrl: TARGET.applyUrl,
      detail: expect.stringContaining("status 404"),
      failedRuns: ESCALATION_RUNS,
    });
  });

  it("counts a network fetch failure toward the streak", async () => {
    const bad = deps({
      probeStatus: async () => {
        throw new Error("fetch timed out");
      },
    });
    for (let i = 0; i < ESCALATION_RUNS; i++) {
      await checkApplyLinkOnce(log, DAY1, bad);
    }
    expect(sendAlert).toHaveBeenCalledExactlyOnceWith({
      unit: TARGET.unit,
      applyUrl: TARGET.applyUrl,
      detail: expect.stringContaining("fetch failed"),
      failedRuns: ESCALATION_RUNS,
    });
  });

  it("a healthy run resets the failure streak (shared + in-memory)", async () => {
    const bad = deps(failing404);
    await checkApplyLinkOnce(log, DAY1, bad);
    await checkApplyLinkOnce(log, DAY1, bad);
    await checkApplyLinkOnce(log, DAY1, deps()); // recovery
    await checkApplyLinkOnce(log, DAY1, bad);
    expect(sendAlert).not.toHaveBeenCalled();
  });

  it("a skipped run also resets the failure streak", async () => {
    const bad = deps(failing404);
    await checkApplyLinkOnce(log, DAY1, bad);
    await checkApplyLinkOnce(log, DAY1, bad);
    await checkApplyLinkOnce(log, DAY1, deps({ resolveTarget: async () => null }));
    await checkApplyLinkOnce(log, DAY1, bad);
    expect(sendAlert).not.toHaveBeenCalled();
  });

  it("the persisted failure count survives a process restart", async () => {
    const bad = deps(failing404);
    for (let i = 1; i < ESCALATION_RUNS; i++) {
      await checkApplyLinkOnce(log, DAY1, bad);
    }
    // "Restart": in-memory streak resets, shared table keeps counting.
    __resetApplyLinkCheckForTests();
    await checkApplyLinkOnce(log, DAY1, bad);
    expect(sendAlert).toHaveBeenCalledTimes(1);
  });

  it("throttles to one alert per UTC day, cluster-wide", async () => {
    const bad = deps(failing404);
    for (let i = 0; i < ESCALATION_RUNS + 3; i++) {
      await checkApplyLinkOnce(log, DAY1, bad);
    }
    expect(sendAlert).toHaveBeenCalledTimes(1);

    // Next UTC day: a still-broken link alerts again.
    await checkApplyLinkOnce(log, DAY2, bad);
    expect(sendAlert).toHaveBeenCalledTimes(2);
  });

  it("falls back to in-memory dedupe when the database is down", async () => {
    dbDown = true;
    const bad = deps(failing404);
    for (let i = 0; i < ESCALATION_RUNS + 2; i++) {
      await checkApplyLinkOnce(log, DAY1, bad);
    }
    expect(sendAlert).toHaveBeenCalledTimes(1);
  });

  it("does not attempt a send when the mailer is unconfigured", async () => {
    mailerConfiguredMock.mockReturnValue(false);
    const bad = deps(failing404);
    for (let i = 0; i < ESCALATION_RUNS; i++) {
      await checkApplyLinkOnce(log, DAY1, bad);
    }
    expect(sendAlert).not.toHaveBeenCalled();
  });

  it("a send failure is caught, never thrown", async () => {
    sendAlert.mockRejectedValueOnce(new Error("smtp down"));
    const bad = deps(failing404);
    for (let i = 0; i < ESCALATION_RUNS; i++) {
      await checkApplyLinkOnce(log, DAY1, bad);
    }
    expect(logger.error).toHaveBeenCalledWith(
      { err: expect.any(Error) },
      "Failed to send apply-link broken alert",
    );
  });
});
