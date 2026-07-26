import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./email", () => ({ sendShowingSchedulerAlert: vi.fn(async () => {}) }));
vi.mock("./mailer", () => ({ mailerConfigured: vi.fn(() => true) }));
vi.mock("./logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
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
      if (text.includes("showingscheduler:live-failed")) {
        if (text.includes("DELETE")) {
          sharedFailureCount = 0;
          return { rows: [] };
        }
        sharedFailureCount += 1;
        return { rows: [{ count: sharedFailureCount }] };
      }
      const key = text.match(/showingscheduler-live:[^"\\]+/)?.[0];
      if (typeof key !== "string") return { rows: [] };
      if (sharedKeys.has(key)) return { rows: [] };
      sharedKeys.add(key);
      return { rows: [{ count: 1 }] };
    }),
  },
}));

import {
  LIVE_ESCALATION_FAILURES,
  recordLiveShowingFailure,
  recordLiveShowingSuccess,
  __resetShowingLiveFailureAlertForTests,
} from "./showingLiveFailureAlert";
import { sendShowingSchedulerAlert } from "./email";
import { mailerConfigured } from "./mailer";
import { logger } from "./logger";

const sendAlert = vi.mocked(sendShowingSchedulerAlert);
const mailerConfiguredMock = vi.mocked(mailerConfigured);

const DAY1 = Date.parse("2026-07-26T10:00:00Z");
const DAY1_LATER = Date.parse("2026-07-26T22:00:00Z");
const DAY2 = Date.parse("2026-07-27T10:00:00Z");

const guestCard = { step: "guest card" as const, message: "status 404" };
const booking = { step: "booking" as const, message: "status 500" };

describe("showing live-traffic failure escalation", () => {
  beforeEach(() => {
    __resetShowingLiveFailureAlertForTests();
    sharedKeys.clear();
    sharedFailureCount = 0;
    dbDown = false;
    vi.clearAllMocks();
    mailerConfiguredMock.mockReturnValue(true);
  });

  it("does not alert on isolated one-off failures", async () => {
    for (let i = 1; i < LIVE_ESCALATION_FAILURES; i++) {
      await recordLiveShowingFailure(logger, DAY1, guestCard);
    }
    expect(sendAlert).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled(); // every failure is logged loudly
  });

  it("alerts once the streak is sustained, mixing guest-card and booking failures", async () => {
    await recordLiveShowingFailure(logger, DAY1, guestCard);
    await recordLiveShowingFailure(logger, DAY1, booking);
    await recordLiveShowingFailure(logger, DAY1, guestCard);
    expect(sendAlert).toHaveBeenCalledExactlyOnceWith({
      reason: "live_traffic_failure",
      detail: "guest card failed: status 404; booking failed: status 500; guest card failed: status 404",
      failedRuns: LIVE_ESCALATION_FAILURES,
    });
  });

  it("a success resets the streak (shared + in-memory)", async () => {
    await recordLiveShowingFailure(logger, DAY1, guestCard);
    await recordLiveShowingFailure(logger, DAY1, guestCard);
    await recordLiveShowingSuccess(logger); // recovery
    await recordLiveShowingFailure(logger, DAY1, guestCard);
    await recordLiveShowingFailure(logger, DAY1, guestCard);
    expect(sendAlert).not.toHaveBeenCalled();
  });

  it("the persisted streak survives a process restart", async () => {
    for (let i = 1; i < LIVE_ESCALATION_FAILURES; i++) {
      await recordLiveShowingFailure(logger, DAY1, guestCard);
    }
    // "Restart": in-memory streak resets, shared table keeps counting.
    __resetShowingLiveFailureAlertForTests();
    await recordLiveShowingFailure(logger, DAY1, guestCard);
    expect(sendAlert).toHaveBeenCalledTimes(1);
  });

  it("throttles to one alert per UTC day, cluster-wide", async () => {
    for (let i = 0; i < LIVE_ESCALATION_FAILURES; i++) {
      await recordLiveShowingFailure(logger, DAY1, guestCard);
    }
    await recordLiveShowingFailure(logger, DAY1_LATER, guestCard);
    expect(sendAlert).toHaveBeenCalledTimes(1);
    // A "different replica" (fresh in-memory state, same shared table) also
    // cannot re-send on the same day.
    __resetShowingLiveFailureAlertForTests();
    for (let i = 0; i < LIVE_ESCALATION_FAILURES; i++) {
      await recordLiveShowingFailure(logger, DAY1_LATER, guestCard);
    }
    expect(sendAlert).toHaveBeenCalledTimes(1);
    // Next day it fires again.
    await recordLiveShowingFailure(logger, DAY2, guestCard);
    expect(sendAlert).toHaveBeenCalledTimes(2);
  });

  it("falls back to in-memory counting and dedupe when the database is down", async () => {
    dbDown = true;
    for (let i = 0; i < LIVE_ESCALATION_FAILURES; i++) {
      await recordLiveShowingFailure(logger, DAY1, guestCard);
    }
    await recordLiveShowingFailure(logger, DAY1_LATER, guestCard);
    expect(sendAlert).toHaveBeenCalledTimes(1);
  });

  it("does not send when the mailer is unconfigured, but still counts", async () => {
    mailerConfiguredMock.mockReturnValue(false);
    for (let i = 0; i < LIVE_ESCALATION_FAILURES; i++) {
      await recordLiveShowingFailure(logger, DAY1, guestCard);
    }
    expect(sendAlert).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });

  it("never throws when the alert send fails", async () => {
    sendAlert.mockRejectedValueOnce(new Error("smtp down"));
    for (let i = 0; i < LIVE_ESCALATION_FAILURES - 1; i++) {
      await recordLiveShowingFailure(logger, DAY1, guestCard);
    }
    await expect(
      recordLiveShowingFailure(logger, DAY1, guestCard),
    ).resolves.toBeUndefined();
  });

  it("keeps only the most recent failures in the alert detail", async () => {
    for (let i = 0; i < LIVE_ESCALATION_FAILURES; i++) {
      await recordLiveShowingFailure(logger, DAY1, {
        step: "guest card",
        message: `status 50${i}`,
      });
    }
    const detail = sendAlert.mock.calls[0]?.[0]?.detail ?? "";
    expect(detail).not.toContain("status 500;;");
    expect(detail.split("; ")).toHaveLength(LIVE_ESCALATION_FAILURES);
  });
});
