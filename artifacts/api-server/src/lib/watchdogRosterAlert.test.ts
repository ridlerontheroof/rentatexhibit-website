import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./email", () => ({
  sendWatchdogRosterAlert: vi.fn(async () => {}),
}));
vi.mock("./mailer", () => ({ mailerConfigured: vi.fn(() => true) }));
vi.mock("./logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

// Simulate the shared `email_throttle_counters` table for daily claims.
const sharedClaims = new Set<string>();
let dbDown = false;
vi.mock("@workspace/db", () => ({
  db: {
    execute: vi.fn(async (query: { queryChunks?: unknown[] }) => {
      if (dbDown) throw new Error("db unreachable");
      const text = JSON.stringify(query);
      // DELETE: remove the claim key so the next claim attempt can succeed.
      if (text.includes("DELETE")) {
        const delKey = text.match(/watchdog-roster-missing:[^"\\]+/)?.[0];
        if (delKey) sharedClaims.delete(delKey);
        return { rows: [] };
      }
      const claimKey = text.match(/watchdog-roster-missing:[^"\\]+/)?.[0];
      if (typeof claimKey !== "string") return { rows: [] };
      if (sharedClaims.has(claimKey)) return { rows: [] };
      sharedClaims.add(claimKey);
      return { rows: [{ count: 1 }] };
    }),
  },
}));

import {
  alertMissingWatchdogs,
  __resetWatchdogRosterAlertForTests,
} from "./watchdogRosterAlert";
import { sendWatchdogRosterAlert } from "./email";
import { mailerConfigured } from "./mailer";
import { logger } from "./logger";

const sendAlert = vi.mocked(sendWatchdogRosterAlert);
const mailerConfiguredMock = vi.mocked(mailerConfigured);

const DAY1 = Date.parse("2026-07-26T10:00:00Z");
const DAY1_LATER = Date.parse("2026-07-26T22:00:00Z");
const DAY2 = Date.parse("2026-07-27T08:00:00Z");

const MISSING = ["apex-redirect", "ga4-tracking"];

beforeEach(() => {
  sendAlert.mockClear();
  vi.mocked(logger.warn).mockClear();
  vi.mocked(logger.error).mockClear();
  vi.mocked(logger.info).mockClear();
  mailerConfiguredMock.mockReturnValue(true);
  sharedClaims.clear();
  dbDown = false;
  __resetWatchdogRosterAlertForTests();
});

describe("alertMissingWatchdogs", () => {
  it("sends an email when there are missing watchdogs", async () => {
    await alertMissingWatchdogs(MISSING, logger, DAY1);
    expect(sendAlert).toHaveBeenCalledOnce();
    const call = sendAlert.mock.calls[0][0];
    expect(call.missing).toEqual(MISSING);
    expect(typeof call.deploymentLogsUrl).toBe("string");
    expect(call.deploymentLogsUrl.length).toBeGreaterThan(0);
  });

  it("does nothing when missing list is empty", async () => {
    await alertMissingWatchdogs([], logger, DAY1);
    expect(sendAlert).not.toHaveBeenCalled();
  });

  it("sends only once per UTC day (shared claim dedupes)", async () => {
    await alertMissingWatchdogs(MISSING, logger, DAY1);
    await alertMissingWatchdogs(MISSING, logger, DAY1_LATER);
    expect(sendAlert).toHaveBeenCalledOnce();
  });

  it("sends again on the next UTC day", async () => {
    await alertMissingWatchdogs(MISSING, logger, DAY1);
    await alertMissingWatchdogs(MISSING, logger, DAY2);
    expect(sendAlert).toHaveBeenCalledTimes(2);
  });

  it("does not send when the mailer is unconfigured", async () => {
    mailerConfiguredMock.mockReturnValue(false);
    await alertMissingWatchdogs(MISSING, logger, DAY1);
    expect(sendAlert).not.toHaveBeenCalled();
    expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(
      expect.objectContaining({ missing: MISSING }),
      expect.stringContaining("mailer not configured"),
    );
  });

  it("logs and does not throw when the email send fails", async () => {
    sendAlert.mockRejectedValueOnce(new Error("SMTP timeout"));
    await expect(alertMissingWatchdogs(MISSING, logger, DAY1)).resolves.toBeUndefined();
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      expect.objectContaining({ missing: MISSING }),
      expect.stringContaining("Failed to send watchdog-roster alert"),
    );
  });

  it("releases the daily claim after a send failure so the next run can retry", async () => {
    // First call: send fails → claim should be released.
    sendAlert.mockRejectedValueOnce(new Error("SMTP timeout"));
    await alertMissingWatchdogs(MISSING, logger, DAY1);
    expect(sendAlert).toHaveBeenCalledTimes(1);

    // Second call same day: claim was released, so this should attempt to send again.
    sendAlert.mockResolvedValueOnce(undefined);
    __resetWatchdogRosterAlertForTests(); // reset in-memory dedupe
    await alertMissingWatchdogs(MISSING, logger, DAY1);
    expect(sendAlert).toHaveBeenCalledTimes(2);
  });

  describe("database unavailable fallback", () => {
    beforeEach(() => { dbDown = true; });

    it("falls back to in-memory dedupe and sends the email", async () => {
      await alertMissingWatchdogs(MISSING, logger, DAY1);
      expect(sendAlert).toHaveBeenCalledOnce();
    });

    it("dedupes within the same process-day without the DB", async () => {
      await alertMissingWatchdogs(MISSING, logger, DAY1);
      await alertMissingWatchdogs(MISSING, logger, DAY1_LATER);
      expect(sendAlert).toHaveBeenCalledOnce();
    });

    it("resets the in-memory dedupe on a new UTC day", async () => {
      await alertMissingWatchdogs(MISSING, logger, DAY1);
      await alertMissingWatchdogs(MISSING, logger, DAY2);
      expect(sendAlert).toHaveBeenCalledTimes(2);
    });
  });
});
