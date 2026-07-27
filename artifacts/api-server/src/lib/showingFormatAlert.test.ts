/**
 * Tests for the slot-format drift alarm: the "AppFolio sent slots but the
 * parser dropped every one" condition must log loudly and email the leasing
 * inbox at most once per UTC day — never silently show an empty calendar.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./email", () => ({ sendShowingSchedulerAlert: vi.fn(async () => {}) }));
vi.mock("./mailer", () => ({ mailerConfigured: vi.fn(() => true) }));

// Simulate the shared `email_throttle_counters` daily-claim table.
const sharedKeys = new Set<string>();
vi.mock("@workspace/db", () => ({
  db: {
    execute: vi.fn(async (query: { queryChunks?: unknown[] }) => {
      const text = JSON.stringify(query);
      const key = text.match(/slotformat:[^"\\]+/)?.[0];
      if (typeof key !== "string") return { rows: [] };
      if (sharedKeys.has(key)) return { rows: [] };
      sharedKeys.add(key);
      return { rows: [{ count: 1 }] };
    }),
  },
}));

import {
  detectSlotFormatDrift,
  __resetSlotFormatAlertForTests,
} from "./showingFormatAlert";
import { sendShowingSchedulerAlert } from "./email";
import { mailerConfigured } from "./mailer";
import type { Logger } from "pino";

const sendMock = vi.mocked(sendShowingSchedulerAlert);
const mailerMock = vi.mocked(mailerConfigured);

function makeLog() {
  return { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() } as unknown as Logger;
}

const DAY1 = Date.parse("2026-07-27T10:00:00Z");
const DAY2 = Date.parse("2026-07-28T10:00:00Z");

async function flush() {
  await new Promise((r) => setTimeout(r, 0));
}

describe("detectSlotFormatDrift", () => {
  beforeEach(() => {
    __resetSlotFormatAlertForTests();
    sharedKeys.clear();
    vi.clearAllMocks();
    mailerMock.mockReturnValue(true);
  });

  it("does nothing when slots were accepted", async () => {
    const log = makeLog();
    const fired = detectSlotFormatDrift(log, DAY1, {
      rawTimeslotCount: 5,
      acceptedSlotCount: 5,
    });
    await flush();
    expect(fired).toBe(false);
    expect(log.error).not.toHaveBeenCalled();
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("does nothing when AppFolio genuinely sent zero timeslots", async () => {
    const log = makeLog();
    const fired = detectSlotFormatDrift(log, DAY1, {
      rawTimeslotCount: 0,
      acceptedSlotCount: 0,
    });
    await flush();
    expect(fired).toBe(false);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("logs an error and emails the leasing alert when every slot dropped", async () => {
    const log = makeLog();
    const fired = detectSlotFormatDrift(
      log,
      DAY1,
      { rawTimeslotCount: 42, acceptedSlotCount: 0 },
      { unit: "2407" },
    );
    await flush();
    expect(fired).toBe(true);
    expect(log.error).toHaveBeenCalledWith(
      expect.objectContaining({ unit: "2407", rawTimeslotCount: 42 }),
      expect.stringContaining("every slot dropped"),
    );
    expect(sendMock).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ reason: "slot_format_drift" }),
    );
  });

  it("emails at most once per UTC day, but keeps logging", async () => {
    const log = makeLog();
    detectSlotFormatDrift(log, DAY1, { rawTimeslotCount: 10, acceptedSlotCount: 0 });
    await flush();
    detectSlotFormatDrift(log, DAY1 + 60_000, { rawTimeslotCount: 10, acceptedSlotCount: 0 });
    await flush();
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(log.error).toHaveBeenCalledTimes(2);

    detectSlotFormatDrift(log, DAY2, { rawTimeslotCount: 10, acceptedSlotCount: 0 });
    await flush();
    expect(sendMock).toHaveBeenCalledTimes(2);
  });

  it("skips the email (but still returns true) when the mailer is unconfigured", async () => {
    mailerMock.mockReturnValue(false);
    const log = makeLog();
    const fired = detectSlotFormatDrift(log, DAY1, {
      rawTimeslotCount: 3,
      acceptedSlotCount: 0,
    });
    await flush();
    expect(fired).toBe(true);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("never throws when the email send fails", async () => {
    sendMock.mockRejectedValueOnce(new Error("smtp down"));
    const log = makeLog();
    expect(() =>
      detectSlotFormatDrift(log, DAY1, { rawTimeslotCount: 3, acceptedSlotCount: 0 }),
    ).not.toThrow();
    await flush();
    expect(log.error).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      "Failed to send slot-format drift alert",
    );
  });
});
