import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./email", () => ({ sendFeeCopyAlert: vi.fn(async () => {}) }));
vi.mock("./mailer", () => ({ mailerConfigured: vi.fn(() => true) }));
vi.mock("./logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

// Simulate the shared `email_throttle_counters` table: an INSERT … ON CONFLICT
// DO NOTHING RETURNING returns a row only when the key was newly inserted.
const sharedKeys = new Set<string>();
let dbDown = false;
vi.mock("@workspace/db", () => ({
  db: {
    execute: vi.fn(async (query: { queryChunks?: unknown[] }) => {
      if (dbDown) throw new Error("db unreachable");
      const text = JSON.stringify(query);
      if (text.includes("DELETE")) return { rows: [] };
      // Extract the bound key param (the string starting with feecopy:)
      const key = text.match(/feecopy:[^"\\]+/)?.[0];
      if (typeof key !== "string") return { rows: [] };
      if (sharedKeys.has(key)) return { rows: [] };
      sharedKeys.add(key);
      return { rows: [{ count: 1 }] };
    }),
  },
}));

import {
  recordFeeCopyCheck,
  reportStrippedFeeCopy,
  __resetFeeCopyAlertForTests,
} from "./feeCopyAlert";
import { sendFeeCopyAlert } from "./email";
import { mailerConfigured } from "./mailer";
import { logger } from "./logger";

const sendFeeCopyAlertMock = vi.mocked(sendFeeCopyAlert);
const mailerConfiguredMock = vi.mocked(mailerConfigured);
const warn = vi.mocked(logger.warn);
const error = vi.mocked(logger.error);

const DAY1 = Date.parse("2026-07-25T10:00:00Z");

describe("reportStrippedFeeCopy", () => {
  beforeEach(() => {
    __resetFeeCopyAlertForTests();
    sharedKeys.clear();
    dbDown = false;
    vi.clearAllMocks();
    mailerConfiguredMock.mockReturnValue(true);
  });

  it("logs and emails on first detection", async () => {
    await reportStrippedFeeCopy("0606", ["There is a $300 pet deposit."], DAY1);
    expect(warn).toHaveBeenCalledOnce();
    expect(sendFeeCopyAlertMock).toHaveBeenCalledExactlyOnceWith({
      unit: "0606",
      removed: ["There is a $300 pet deposit."],
    });
  });

  it("does not re-notify for the same unchanged text on the same day", async () => {
    await reportStrippedFeeCopy("0606", ["Pet rent is $30/month."], DAY1);
    await reportStrippedFeeCopy("0606", ["Pet rent is $30/month."], DAY1 + 5 * 60 * 1000);
    expect(sendFeeCopyAlertMock).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("re-notifies the next UTC day", async () => {
    await reportStrippedFeeCopy("0606", ["Pet rent is $30/month."], DAY1);
    await reportStrippedFeeCopy("0606", ["Pet rent is $30/month."], DAY1 + 24 * 60 * 60 * 1000);
    expect(sendFeeCopyAlertMock).toHaveBeenCalledTimes(2);
  });

  it("notifies separately per unit and only for new text", async () => {
    await reportStrippedFeeCopy("0606", ["Pet rent is $30/month."], DAY1);
    await reportStrippedFeeCopy("0710", ["Pet rent is $30/month."], DAY1);
    await reportStrippedFeeCopy(
      "0606",
      ["Pet rent is $30/month.", "A $500 admin fee per person applies."],
      DAY1,
    );
    expect(sendFeeCopyAlertMock).toHaveBeenCalledTimes(3);
    expect(sendFeeCopyAlertMock).toHaveBeenLastCalledWith({
      unit: "0606",
      removed: ["A $500 admin fee per person applies."],
    });
  });

  it("dedupes repeated items within one call", async () => {
    await reportStrippedFeeCopy("0606", ["Pet rent is $30.", "Pet rent is $30."], DAY1);
    expect(sendFeeCopyAlertMock).toHaveBeenCalledExactlyOnceWith({
      unit: "0606",
      removed: ["Pet rent is $30."],
    });
  });

  it("dedupes across replicas/restarts via the shared database claim", async () => {
    await reportStrippedFeeCopy("0606", ["Pet rent is $30/month."], DAY1);
    // Simulate another replica (or a cold start): fresh in-memory state,
    // same shared database.
    __resetFeeCopyAlertForTests();
    await reportStrippedFeeCopy("0606", ["Pet rent is $30/month."], DAY1 + 1000);
    expect(sendFeeCopyAlertMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to in-memory dedupe when the database is unreachable", async () => {
    dbDown = true;
    await reportStrippedFeeCopy("0606", ["Pet rent is $30/month."], DAY1);
    await reportStrippedFeeCopy("0606", ["Pet rent is $30/month."], DAY1 + 1000);
    expect(sendFeeCopyAlertMock).toHaveBeenCalledTimes(1);
    // The fallback path logs the DB failure but the alert still goes out.
    expect(error).toHaveBeenCalled();
  });

  it("does not re-send during a DB outage after a successful shared claim", async () => {
    await reportStrippedFeeCopy("0606", ["Pet rent is $30/month."], DAY1);
    dbDown = true;
    await reportStrippedFeeCopy("0606", ["Pet rent is $30/month."], DAY1 + 1000);
    expect(sendFeeCopyAlertMock).toHaveBeenCalledTimes(1);
  });

  it("still logs but skips the email when the mailer is unconfigured", async () => {
    mailerConfiguredMock.mockReturnValue(false);
    await reportStrippedFeeCopy("0606", ["Pet rent is $30/month."], DAY1);
    expect(warn).toHaveBeenCalledOnce();
    expect(sendFeeCopyAlertMock).not.toHaveBeenCalled();
  });

  it("swallows send failures (never throws into the availability refresh)", async () => {
    sendFeeCopyAlertMock.mockRejectedValueOnce(new Error("smtp down"));
    await expect(
      reportStrippedFeeCopy("0606", ["Pet rent is $30/month."], DAY1),
    ).resolves.toBeUndefined();
    expect(error).toHaveBeenCalledOnce();
  });
});

describe("recordFeeCopyCheck heartbeat", () => {
  const info = vi.mocked(logger.info);
  const heartbeats = () =>
    info.mock.calls.filter(
      ([, msg]) => typeof msg === "string" && msg.includes("heartbeat"),
    );

  beforeEach(() => {
    __resetFeeCopyAlertForTests();
    vi.clearAllMocks();
  });

  it("emits an info heartbeat on the first check, then at most once per UTC day", () => {
    recordFeeCopyCheck("clean", DAY1);
    expect(heartbeats()).toHaveLength(1);
    recordFeeCopyCheck("clean", DAY1 + 5 * 60 * 1000);
    recordFeeCopyCheck("clean", DAY1 + 60 * 60 * 1000);
    expect(heartbeats()).toHaveLength(1);
    recordFeeCopyCheck("clean", DAY1 + 24 * 60 * 60 * 1000);
    const beats = heartbeats();
    expect(beats).toHaveLength(2);
    // The second heartbeat summarizes the 3 checks since the first one.
    expect(beats[1]?.[0]).toMatchObject({ checks: 3, clean: 3, stripped: 0, failed: 0 });
  });

  it("counts stripped and failed checks in the heartbeat", () => {
    recordFeeCopyCheck("clean", DAY1); // first check -> immediate heartbeat
    recordFeeCopyCheck("stripped", DAY1 + 1000);
    recordFeeCopyCheck("failed", DAY1 + 2000);
    recordFeeCopyCheck("clean", DAY1 + 24 * 60 * 60 * 1000);
    const beats = heartbeats();
    expect(beats).toHaveLength(2);
    expect(beats[1]?.[0]).toMatchObject({ checks: 3, clean: 1, stripped: 1, failed: 1 });
  });
});
