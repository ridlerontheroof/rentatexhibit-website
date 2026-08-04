import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./email", () => ({ sendShowingSchedulerAlert: vi.fn(async () => {}) }));
vi.mock("./mailer", () => ({ mailerConfigured: vi.fn(() => true) }));
vi.mock("./logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

// Simulate the shared `email_throttle_counters` table: daily-claim keys use
// INSERT … ON CONFLICT DO NOTHING RETURNING; the slots-failure counter
// stores one event row per failure (key carries the event's ms timestamp,
// expires_at = event + window) and the check is DELETE-expired / INSERT /
// COUNT rows with expires_at >= now.
const sharedKeys = new Set<string>();
// Shared event-row store: the failure timestamps (ms) currently in the table.
let sharedEvents: number[] = [];
const WINDOW = 10 * 60 * 1000;
let dbDown = false;
vi.mock("@workspace/db", () => ({
  db: {
    execute: vi.fn(async (query: { queryChunks?: unknown[] }) => {
      if (dbDown) throw new Error("db unreachable");
      const text = JSON.stringify(query);
      if (text.includes("showingscheduler:slots-failed")) {
        // The bound Date param serializes to an ISO string in the JSON.
        const iso = text.match(/\d{4}-\d{2}-\d{2}T[\d:.]+Z/)?.[0];
        const at = iso ? Date.parse(iso) : NaN;
        if (text.includes("DELETE")) {
          sharedEvents = sharedEvents.filter((ms) => ms + WINDOW >= at);
          return { rows: [] };
        }
        if (text.includes("COUNT")) {
          const total = sharedEvents.filter((ms) => ms + WINDOW >= at).length;
          return { rows: [{ total }] };
        }
        const eventMs = Number(text.match(/slots-failed:(\d+):/)?.[1]);
        sharedEvents.push(eventMs);
        return { rows: [] };
      }
      const key = text.match(/showingscheduler-slots:[^"\\]+/)?.[0];
      if (typeof key !== "string") return { rows: [] };
      if (sharedKeys.has(key)) return { rows: [] };
      sharedKeys.add(key);
      return { rows: [{ count: 1 }] };
    }),
  },
}));

import {
  SLOTS_FAILURE_THRESHOLD,
  SLOTS_FAILURE_WINDOW_MS,
  recordSlotsFetchFailure,
  __resetShowingSlotsFailureAlertForTests,
} from "./showingSlotsFailureAlert";
import { sendShowingSchedulerAlert } from "./email";
import { mailerConfigured } from "./mailer";
import { logger } from "./logger";

const sendAlert = vi.mocked(sendShowingSchedulerAlert);
const mailerConfiguredMock = vi.mocked(mailerConfigured);

// The 2026-08-04 incident window: four 502s between 17:46 and 17:50 UTC.
const T0 = Date.parse("2026-08-04T17:46:00Z");
const MIN = 60_000;

const failure = (n: number) => ({ unit: "2801", message: `status 50${n}` });

describe("showing slots-failure windowed escalation", () => {
  beforeEach(() => {
    __resetShowingSlotsFailureAlertForTests();
    sharedKeys.clear();
    sharedEvents = [];
    dbDown = false;
    vi.clearAllMocks();
    mailerConfiguredMock.mockReturnValue(true);
  });

  it("does not alert on a single transient failure", async () => {
    await recordSlotsFetchFailure(logger, T0, failure(2));
    expect(sendAlert).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled(); // every failure is logged loudly
  });

  it("does not alert below the window threshold", async () => {
    for (let i = 1; i < SLOTS_FAILURE_THRESHOLD; i++) {
      await recordSlotsFetchFailure(logger, T0 + i * MIN, failure(2));
    }
    expect(sendAlert).not.toHaveBeenCalled();
  });

  it("alerts once the threshold is reached within the window, naming window and count", async () => {
    await recordSlotsFetchFailure(logger, T0, failure(2));
    await recordSlotsFetchFailure(logger, T0 + 2 * MIN, failure(2));
    await recordSlotsFetchFailure(logger, T0 + 4 * MIN, failure(4));
    expect(sendAlert).toHaveBeenCalledTimes(1);
    const call = sendAlert.mock.calls[0]?.[0];
    expect(call?.reason).toBe("slots_endpoint_failure");
    expect(call?.failedRuns).toBe(SLOTS_FAILURE_THRESHOLD);
    expect(call?.detail).toContain("17:46 UTC");
    expect(call?.detail).toContain("17:50 UTC");
    expect(call?.detail).toContain(`${SLOTS_FAILURE_THRESHOLD} slot-loading failures`);
    expect(call?.detail).toContain("status 504");
  });

  it("failures spread wider than the window do not alert", async () => {
    // One failure every 11 minutes — each has fallen out of the trailing
    // window (in-memory and shared) by the time the next lands.
    await recordSlotsFetchFailure(logger, T0, failure(2));
    await recordSlotsFetchFailure(logger, T0 + SLOTS_FAILURE_WINDOW_MS + MIN, failure(2));
    await recordSlotsFetchFailure(logger, T0 + 3 * (SLOTS_FAILURE_WINDOW_MS + MIN), failure(2));
    await recordSlotsFetchFailure(logger, T0 + 5 * (SLOTS_FAILURE_WINDOW_MS + MIN), failure(2));
    expect(sendAlert).not.toHaveBeenCalled();
  });

  it("failures older than the window can never contribute to the shared count", async () => {
    // Two failures early, then quiet, then two more just over the window
    // edge later: at the fourth failure only two lie inside the trailing
    // window, so no alert — even though four hit the shared table within
    // ~11 minutes overall (the old two-bucket approximation false positive).
    await recordSlotsFetchFailure(logger, T0, failure(2));
    await recordSlotsFetchFailure(logger, T0 + MIN, failure(2));
    await recordSlotsFetchFailure(logger, T0 + SLOTS_FAILURE_WINDOW_MS + 2 * MIN, failure(2));
    await recordSlotsFetchFailure(logger, T0 + SLOTS_FAILURE_WINDOW_MS + 3 * MIN, failure(2));
    expect(sendAlert).not.toHaveBeenCalled();
  });

  it("stale failures cannot contribute cross-replica either", async () => {
    // Replica A logs two failures, then a fresh replica sees one failure
    // just after those fell out of the window: the shared SUM only covers
    // in-window sub-buckets, so no alert.
    await recordSlotsFetchFailure(logger, T0, failure(2));
    await recordSlotsFetchFailure(logger, T0 + MIN, failure(2));
    __resetShowingSlotsFailureAlertForTests();
    sharedKeys.clear();
    await recordSlotsFetchFailure(logger, T0 + SLOTS_FAILURE_WINDOW_MS + 2 * MIN, failure(2));
    expect(sendAlert).not.toHaveBeenCalled();
  });

  it("throttles to one alert per UTC day, cluster-wide", async () => {
    for (let i = 0; i < SLOTS_FAILURE_THRESHOLD; i++) {
      await recordSlotsFetchFailure(logger, T0 + i * MIN, failure(2));
    }
    expect(sendAlert).toHaveBeenCalledTimes(1);
    // A later burst the same day does not re-send.
    const later = T0 + 3 * 60 * MIN;
    for (let i = 0; i < SLOTS_FAILURE_THRESHOLD; i++) {
      await recordSlotsFetchFailure(logger, later + i * MIN, failure(2));
    }
    expect(sendAlert).toHaveBeenCalledTimes(1);
    // A "different replica" (fresh in-memory state, same shared table) also
    // cannot re-send on the same day.
    __resetShowingSlotsFailureAlertForTests();
    for (let i = 0; i < SLOTS_FAILURE_THRESHOLD; i++) {
      await recordSlotsFetchFailure(logger, later + 30 * MIN + i * MIN, failure(2));
    }
    expect(sendAlert).toHaveBeenCalledTimes(1);
    // Next day it fires again.
    const nextDay = Date.parse("2026-08-05T09:00:00Z");
    for (let i = 0; i < SLOTS_FAILURE_THRESHOLD; i++) {
      await recordSlotsFetchFailure(logger, nextDay + i * MIN, failure(2));
    }
    expect(sendAlert).toHaveBeenCalledTimes(2);
  });

  it("replicas splitting the traffic still reach the threshold via the shared bucket", async () => {
    // Replica A sees two failures…
    await recordSlotsFetchFailure(logger, T0, failure(2));
    await recordSlotsFetchFailure(logger, T0 + MIN, failure(2));
    // …then "replica B" (fresh in-memory state) sees the third.
    __resetShowingSlotsFailureAlertForTests();
    sharedKeys.clear(); // keep the day claim winnable for replica B
    await recordSlotsFetchFailure(logger, T0 + 2 * MIN, failure(2));
    expect(sendAlert).toHaveBeenCalledTimes(1);
  });

  it("failures milliseconds older than the cutoff do not count; exactly at the cutoff still do", async () => {
    // Two failures early in a minute, then a third arriving so that the
    // early ones are 1ms past the window edge: no alert (the old
    // minute-bucket rounding would have counted them).
    await recordSlotsFetchFailure(logger, T0 + 1_000, failure(2));
    await recordSlotsFetchFailure(logger, T0 + 29_000, failure(2));
    await recordSlotsFetchFailure(logger, T0 + 1_000 + SLOTS_FAILURE_WINDOW_MS + 1, failure(2));
    expect(sendAlert).not.toHaveBeenCalled();
    // But a failure exactly at the window edge still counts: two fresh
    // failures inside the window of the T0+29s event → threshold reached.
    await recordSlotsFetchFailure(logger, T0 + 29_000 + SLOTS_FAILURE_WINDOW_MS, failure(2));
    expect(sendAlert).toHaveBeenCalledTimes(1);
  });

  it("sub-minute stale failures do not count cross-replica either", async () => {
    // Replica A: two failures at :01 and :29 seconds. Replica B (fresh
    // in-memory state) sees one failure 10min-and-30s after the first — only
    // the :29s event is still inside its trailing window, so no alert.
    await recordSlotsFetchFailure(logger, T0 + 1_000, failure(2));
    await recordSlotsFetchFailure(logger, T0 + 29_000, failure(2));
    __resetShowingSlotsFailureAlertForTests();
    sharedKeys.clear();
    await recordSlotsFetchFailure(logger, T0 + 30_000 + SLOTS_FAILURE_WINDOW_MS, failure(2));
    expect(sendAlert).not.toHaveBeenCalled();
  });

  it("a burst straddling a window-multiple boundary still alerts", async () => {
    // Two failures just before a 10-minute-multiple boundary and one just
    // after: all three lie within one trailing window, so it alerts.
    const boundary = (Math.floor(T0 / SLOTS_FAILURE_WINDOW_MS) + 1) * SLOTS_FAILURE_WINDOW_MS;
    await recordSlotsFetchFailure(logger, boundary - 2 * MIN, failure(2));
    await recordSlotsFetchFailure(logger, boundary - MIN, failure(2));
    await recordSlotsFetchFailure(logger, boundary + MIN, failure(2));
    expect(sendAlert).toHaveBeenCalledTimes(1);
  });

  it("falls back to in-memory counting and dedupe when the database is down", async () => {
    dbDown = true;
    for (let i = 0; i < SLOTS_FAILURE_THRESHOLD + 1; i++) {
      await recordSlotsFetchFailure(logger, T0 + i * MIN, failure(2));
    }
    expect(sendAlert).toHaveBeenCalledTimes(1);
  });

  it("does not send when the mailer is unconfigured, but still counts and logs", async () => {
    mailerConfiguredMock.mockReturnValue(false);
    for (let i = 0; i < SLOTS_FAILURE_THRESHOLD; i++) {
      await recordSlotsFetchFailure(logger, T0 + i * MIN, failure(2));
    }
    expect(sendAlert).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });

  it("never throws when the alert send fails", async () => {
    sendAlert.mockRejectedValueOnce(new Error("smtp down"));
    for (let i = 0; i < SLOTS_FAILURE_THRESHOLD - 1; i++) {
      await recordSlotsFetchFailure(logger, T0 + i * MIN, failure(2));
    }
    await expect(
      recordSlotsFetchFailure(logger, T0 + SLOTS_FAILURE_THRESHOLD * MIN, failure(2)),
    ).resolves.toBeUndefined();
  });

  it("keeps only the most recent failures in the alert detail", async () => {
    // Extra failures land before the alert can fire (mailer off), proving
    // the detail buffer stays capped at the threshold's most recent entries.
    mailerConfiguredMock.mockReturnValue(false);
    for (let i = 0; i < SLOTS_FAILURE_THRESHOLD + 1; i++) {
      await recordSlotsFetchFailure(logger, T0 + i * MIN, {
        unit: "2801",
        message: `err-${i}`,
      });
    }
    mailerConfiguredMock.mockReturnValue(true);
    __resetShowingSlotsFailureAlertForTests(); // release the in-process day claim
    sharedKeys.clear(); // the mailer-off pass consumed the shared day claim too
    // Re-run the burst so the claim is winnable; buffer refills the same way.
    for (let i = 0; i < SLOTS_FAILURE_THRESHOLD + 2; i++) {
      await recordSlotsFetchFailure(logger, T0 + 60 * MIN + i * MIN, {
        unit: "2801",
        message: `late-${i}`,
      });
    }
    const detail = sendAlert.mock.calls[0]?.[0]?.detail ?? "";
    // Alert fired the moment the threshold was reached; the buffer held
    // exactly the threshold's most recent entries and nothing older.
    const entries = detail.split("Latest: ")[1]?.split("; ") ?? [];
    expect(entries.length).toBeLessThanOrEqual(SLOTS_FAILURE_THRESHOLD);
    expect(detail).toContain(`late-${SLOTS_FAILURE_THRESHOLD - 1}`);
    expect(detail).not.toContain("err-");
  });
});
