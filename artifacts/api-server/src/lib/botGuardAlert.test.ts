import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./email", () => ({ sendBotGuardAlert: vi.fn(async () => {}) }));
vi.mock("./mailer", () => ({ mailerConfigured: vi.fn(() => true) }));
vi.mock("./logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

// Simulate the shared `email_throttle_counters` table: daily-claim keys use
// INSERT … ON CONFLICT DO NOTHING RETURNING; the per-day rejection counter
// uses INSERT … ON CONFLICT DO UPDATE … RETURNING count.
const sharedClaims = new Set<string>();
const sharedCounts = new Map<string, number>();
let dbDown = false;
vi.mock("@workspace/db", () => ({
  db: {
    execute: vi.fn(async (query: { queryChunks?: unknown[] }) => {
      if (dbDown) throw new Error("db unreachable");
      const text = JSON.stringify(query);
      const counterKey = text.match(/botguard:rejected:[0-9-]+/)?.[0];
      if (typeof counterKey === "string") {
        const next = (sharedCounts.get(counterKey) ?? 0) + 1;
        sharedCounts.set(counterKey, next);
        return { rows: [{ count: next }] };
      }
      const claimKey = text.match(/botguard-spike:[^"\\]+/)?.[0];
      if (typeof claimKey !== "string") return { rows: [] };
      if (sharedClaims.has(claimKey)) return { rows: [] };
      sharedClaims.add(claimKey);
      return { rows: [{ count: 1 }] };
    }),
  },
}));

import {
  BOT_REJECTION_ALERT_THRESHOLD,
  recordAcceptedSubmission,
  recordBotRejection,
  __resetBotGuardAlertForTests,
} from "./botGuardAlert";
import { sendBotGuardAlert } from "./email";
import { mailerConfigured } from "./mailer";
import { logger } from "./logger";

const sendAlert = vi.mocked(sendBotGuardAlert);
const mailerConfiguredMock = vi.mocked(mailerConfigured);

const DAY1 = Date.parse("2026-07-26T10:00:00Z");
const DAY1_LATER = Date.parse("2026-07-26T22:00:00Z");
const DAY2 = Date.parse("2026-07-27T10:00:00Z");

describe("bot-guard rejection spike alert", () => {
  beforeEach(() => {
    __resetBotGuardAlertForTests();
    sharedClaims.clear();
    sharedCounts.clear();
    dbDown = false;
    vi.clearAllMocks();
    mailerConfiguredMock.mockReturnValue(true);
  });

  it("does not alert below the daily threshold", async () => {
    for (let i = 1; i < BOT_REJECTION_ALERT_THRESHOLD; i++) {
      await recordBotRejection(logger, DAY1, "leads", "honeypot");
    }
    expect(sendAlert).not.toHaveBeenCalled();
  });

  it("alerts once the day's rejections cross the threshold, with a breakdown", async () => {
    for (let i = 1; i < BOT_REJECTION_ALERT_THRESHOLD; i++) {
      await recordBotRejection(logger, DAY1, "leads", "honeypot");
    }
    await recordBotRejection(logger, DAY1, "showing_contact", "too_fast");
    expect(sendAlert).toHaveBeenCalledExactlyOnceWith({
      rejectedToday: BOT_REJECTION_ALERT_THRESHOLD,
      threshold: BOT_REJECTION_ALERT_THRESHOLD,
      breakdown: [
        `leads/honeypot: ${BOT_REJECTION_ALERT_THRESHOLD - 1}`,
        "showing_contact/too_fast: 1",
      ],
    });
  });

  it("accepted submissions never count toward the threshold", async () => {
    for (let i = 0; i < BOT_REJECTION_ALERT_THRESHOLD * 2; i++) {
      recordAcceptedSubmission(logger, DAY1, "leads");
    }
    await recordBotRejection(logger, DAY1, "leads", "honeypot");
    expect(sendAlert).not.toHaveBeenCalled();
  });

  it("the persisted daily count survives a process restart", async () => {
    for (let i = 1; i < BOT_REJECTION_ALERT_THRESHOLD; i++) {
      await recordBotRejection(logger, DAY1, "leads", "honeypot");
    }
    // "Restart": in-memory count resets, shared table keeps counting.
    __resetBotGuardAlertForTests();
    await recordBotRejection(logger, DAY1, "leads", "honeypot");
    expect(sendAlert).toHaveBeenCalledTimes(1);
  });

  it("throttles to one alert per UTC day, and resets the count next day", async () => {
    for (let i = 0; i < BOT_REJECTION_ALERT_THRESHOLD + 3; i++) {
      await recordBotRejection(logger, DAY1, "leads", "honeypot");
    }
    await recordBotRejection(logger, DAY1_LATER, "leads", "honeypot");
    expect(sendAlert).toHaveBeenCalledTimes(1);
    // Next day the count starts over: a single rejection is below threshold.
    await recordBotRejection(logger, DAY2, "leads", "honeypot");
    expect(sendAlert).toHaveBeenCalledTimes(1);
    // ...but a fresh spike on day 2 alerts again.
    for (let i = 1; i < BOT_REJECTION_ALERT_THRESHOLD; i++) {
      await recordBotRejection(logger, DAY2, "leads", "honeypot");
    }
    expect(sendAlert).toHaveBeenCalledTimes(2);
  });

  it("falls back to in-memory counting and dedupe when the database is down", async () => {
    dbDown = true;
    for (let i = 0; i < BOT_REJECTION_ALERT_THRESHOLD + 2; i++) {
      await recordBotRejection(logger, DAY1, "leads", "honeypot");
    }
    expect(sendAlert).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalled();
  });

  it("does not send when the mailer is unconfigured", async () => {
    mailerConfiguredMock.mockReturnValue(false);
    for (let i = 0; i < BOT_REJECTION_ALERT_THRESHOLD; i++) {
      await recordBotRejection(logger, DAY1, "leads", "honeypot");
    }
    expect(sendAlert).not.toHaveBeenCalled();
  });

  it("never throws when the alert send fails", async () => {
    sendAlert.mockRejectedValueOnce(new Error("smtp down"));
    for (let i = 1; i < BOT_REJECTION_ALERT_THRESHOLD; i++) {
      await recordBotRejection(logger, DAY1, "leads", "honeypot");
    }
    await expect(
      recordBotRejection(logger, DAY1, "leads", "honeypot"),
    ).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalled();
  });

  it("emits a daily heartbeat line counting accepted vs bot per route", async () => {
    // First record of the process emits an immediate heartbeat.
    recordAcceptedSubmission(logger, DAY1, "leads");
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        checks: 1,
        leads_accepted: 1,
        leads_bot: 0,
        showing_contact_accepted: 0,
        showing_contact_bot: 0,
      }),
      "Lead-form bot-guard heartbeat",
    );
    vi.mocked(logger.info).mockClear();
    // Same-day records accumulate silently…
    recordAcceptedSubmission(logger, DAY1, "showing_contact");
    await recordBotRejection(logger, DAY1_LATER, "leads", "honeypot");
    expect(logger.info).not.toHaveBeenCalled();
    // …and roll up in the next day's first heartbeat.
    recordAcceptedSubmission(logger, DAY2, "leads");
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        checks: 3,
        leads_accepted: 1,
        leads_bot: 1,
        showing_contact_accepted: 1,
        showing_contact_bot: 0,
      }),
      "Lead-form bot-guard heartbeat",
    );
  });
});
