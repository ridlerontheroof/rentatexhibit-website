import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./email", () => ({
  sendBotGuardAlert: vi.fn(async () => {}),
  sendAcceptedSpikeAlert: vi.fn(async () => {}),
  sendAcceptedSilenceAlert: vi.fn(async () => {}),
}));
vi.mock("./mailer", () => ({ mailerConfigured: vi.fn(() => true) }));
vi.mock("./logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

// Simulate the shared `email_throttle_counters` table: daily-claim keys use
// INSERT … ON CONFLICT DO NOTHING RETURNING; the per-day rejection counter
// uses INSERT … ON CONFLICT DO UPDATE … RETURNING count.
const sharedClaims = new Set<string>();
const sharedCounts = new Map<string, number>();
let sharedLastAcceptedSec: number | null = null;
let dbDown = false;
vi.mock("@workspace/db", () => ({
  db: {
    execute: vi.fn(async (query: { queryChunks?: unknown[] }) => {
      if (dbDown) throw new Error("db unreachable");
      const text = JSON.stringify(query);
      if (text.includes("botguard:last-accepted")) {
        if (text.includes("SELECT")) {
          return {
            rows:
              sharedLastAcceptedSec === null
                ? []
                : [{ count: sharedLastAcceptedSec }],
          };
        }
        // Upsert: the epoch-seconds param is the only bare 9-11 digit number.
        const sec = text.match(/[^\d.]([0-9]{9,11})[^\d.]/)?.[1];
        if (sec) sharedLastAcceptedSec = Number(sec);
        return { rows: [] };
      }
      const counterKey = text.match(/botguard:(?:rejected|accepted):[0-9-]+/)?.[0];
      if (typeof counterKey === "string") {
        const next = (sharedCounts.get(counterKey) ?? 0) + 1;
        sharedCounts.set(counterKey, next);
        return { rows: [{ count: next }] };
      }
      const claimKey = text.match(
        /botguard-(?:spike|accepted-spike|silence):[^"\\]+/,
      )?.[0];
      if (typeof claimKey !== "string") return { rows: [] };
      if (sharedClaims.has(claimKey)) return { rows: [] };
      sharedClaims.add(claimKey);
      return { rows: [{ count: 1 }] };
    }),
  },
}));

import {
  ACCEPTED_SILENCE_ALERT_HOURS,
  ACCEPTED_SPIKE_ALERT_THRESHOLD,
  BOT_REJECTION_ALERT_THRESHOLD,
  checkAcceptedSilence,
  recordAcceptedSubmission,
  recordBotRejection,
  __resetBotGuardAlertForTests,
} from "./botGuardAlert";
import {
  sendAcceptedSilenceAlert,
  sendAcceptedSpikeAlert,
  sendBotGuardAlert,
} from "./email";
import { mailerConfigured } from "./mailer";
import { logger } from "./logger";

const sendAlert = vi.mocked(sendBotGuardAlert);
const sendSpikeAlert = vi.mocked(sendAcceptedSpikeAlert);
const sendSilenceAlert = vi.mocked(sendAcceptedSilenceAlert);
const mailerConfiguredMock = vi.mocked(mailerConfigured);

const DAY1 = Date.parse("2026-07-26T10:00:00Z");
const DAY1_LATER = Date.parse("2026-07-26T22:00:00Z");
const DAY2 = Date.parse("2026-07-27T10:00:00Z");

describe("bot-guard rejection spike alert", () => {
  beforeEach(() => {
    __resetBotGuardAlertForTests();
    sharedClaims.clear();
    sharedCounts.clear();
    sharedLastAcceptedSec = null;
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
      await recordAcceptedSubmission(logger, DAY1, "leads");
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

describe("accepted-lead volume spike alert", () => {
  beforeEach(() => {
    __resetBotGuardAlertForTests();
    sharedClaims.clear();
    sharedCounts.clear();
    sharedLastAcceptedSec = null;
    dbDown = false;
    vi.clearAllMocks();
    mailerConfiguredMock.mockReturnValue(true);
  });

  it("does not alert below the daily threshold", async () => {
    for (let i = 1; i < ACCEPTED_SPIKE_ALERT_THRESHOLD; i++) {
      await recordAcceptedSubmission(logger, DAY1, "leads");
    }
    expect(sendSpikeAlert).not.toHaveBeenCalled();
  });

  it("alerts once the day's accepts cross the threshold, with a per-route breakdown", async () => {
    for (let i = 1; i < ACCEPTED_SPIKE_ALERT_THRESHOLD; i++) {
      await recordAcceptedSubmission(logger, DAY1, "leads");
    }
    await recordAcceptedSubmission(logger, DAY1, "showing_contact");
    expect(sendSpikeAlert).toHaveBeenCalledExactlyOnceWith({
      acceptedToday: ACCEPTED_SPIKE_ALERT_THRESHOLD,
      threshold: ACCEPTED_SPIKE_ALERT_THRESHOLD,
      breakdown: [
        `leads: ${ACCEPTED_SPIKE_ALERT_THRESHOLD - 1}`,
        "showing_contact: 1",
      ],
    });
  });

  it("bot rejections never count toward the accepted threshold", async () => {
    for (let i = 0; i < ACCEPTED_SPIKE_ALERT_THRESHOLD * 2; i++) {
      await recordBotRejection(logger, DAY1, "leads", "honeypot");
    }
    await recordAcceptedSubmission(logger, DAY1, "leads");
    expect(sendSpikeAlert).not.toHaveBeenCalled();
  });

  it("the persisted daily count survives a process restart", async () => {
    for (let i = 1; i < ACCEPTED_SPIKE_ALERT_THRESHOLD; i++) {
      await recordAcceptedSubmission(logger, DAY1, "leads");
    }
    __resetBotGuardAlertForTests();
    await recordAcceptedSubmission(logger, DAY1, "leads");
    expect(sendSpikeAlert).toHaveBeenCalledTimes(1);
  });

  it("throttles to one alert per UTC day, and resets the count next day", async () => {
    for (let i = 0; i < ACCEPTED_SPIKE_ALERT_THRESHOLD + 3; i++) {
      await recordAcceptedSubmission(logger, DAY1, "leads");
    }
    await recordAcceptedSubmission(logger, DAY1_LATER, "leads");
    expect(sendSpikeAlert).toHaveBeenCalledTimes(1);
    await recordAcceptedSubmission(logger, DAY2, "leads");
    expect(sendSpikeAlert).toHaveBeenCalledTimes(1);
    for (let i = 1; i < ACCEPTED_SPIKE_ALERT_THRESHOLD; i++) {
      await recordAcceptedSubmission(logger, DAY2, "leads");
    }
    expect(sendSpikeAlert).toHaveBeenCalledTimes(2);
  });

  it("falls back to in-memory counting and dedupe when the database is down", async () => {
    dbDown = true;
    for (let i = 0; i < ACCEPTED_SPIKE_ALERT_THRESHOLD + 2; i++) {
      await recordAcceptedSubmission(logger, DAY1, "leads");
    }
    expect(sendSpikeAlert).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalled();
  });

  it("does not send when the mailer is unconfigured", async () => {
    mailerConfiguredMock.mockReturnValue(false);
    for (let i = 0; i < ACCEPTED_SPIKE_ALERT_THRESHOLD; i++) {
      await recordAcceptedSubmission(logger, DAY1, "leads");
    }
    expect(sendSpikeAlert).not.toHaveBeenCalled();
  });

  it("never throws when the alert send fails", async () => {
    sendSpikeAlert.mockRejectedValueOnce(new Error("smtp down"));
    for (let i = 1; i < ACCEPTED_SPIKE_ALERT_THRESHOLD; i++) {
      await recordAcceptedSubmission(logger, DAY1, "leads");
    }
    await expect(
      recordAcceptedSubmission(logger, DAY1, "leads"),
    ).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalled();
  });
});

describe("accepted-lead silence alert", () => {
  const HOUR = 60 * 60 * 1000;
  const THRESHOLD_MS = ACCEPTED_SILENCE_ALERT_HOURS * HOUR;

  beforeEach(() => {
    __resetBotGuardAlertForTests();
    sharedClaims.clear();
    sharedCounts.clear();
    sharedLastAcceptedSec = null;
    dbDown = false;
    vi.clearAllMocks();
    mailerConfiguredMock.mockReturnValue(true);
  });

  it("seeds a baseline instead of alerting when no timestamp exists yet", async () => {
    await checkAcceptedSilence(logger, DAY1);
    expect(sendSilenceAlert).not.toHaveBeenCalled();
    expect(sharedLastAcceptedSec).toBe(Math.floor(DAY1 / 1000));
    // Silence measured from the seeded baseline, not from epoch.
    await checkAcceptedSilence(logger, DAY1 + THRESHOLD_MS - HOUR);
    expect(sendSilenceAlert).not.toHaveBeenCalled();
  });

  it("alerts once the silence crosses the threshold, measured from the last accept", async () => {
    await recordAcceptedSubmission(logger, DAY1, "leads");
    await checkAcceptedSilence(logger, DAY1 + THRESHOLD_MS - HOUR);
    expect(sendSilenceAlert).not.toHaveBeenCalled();
    await checkAcceptedSilence(logger, DAY1 + THRESHOLD_MS + HOUR);
    expect(sendSilenceAlert).toHaveBeenCalledTimes(1);
    const call = sendSilenceAlert.mock.calls[0]?.[0];
    expect(call?.thresholdHours).toBe(ACCEPTED_SILENCE_ALERT_HOURS);
    expect(call?.hoursSinceLast).toBeGreaterThanOrEqual(
      ACCEPTED_SILENCE_ALERT_HOURS,
    );
    expect(call?.lastAcceptedAt).toContain("2026-07-26");
  });

  it("reads the shared timestamp, so an accept on another replica suppresses the alert", async () => {
    // Another replica accepted recently: only the shared table knows.
    sharedLastAcceptedSec = Math.floor((DAY1 + THRESHOLD_MS) / 1000);
    await checkAcceptedSilence(logger, DAY1 + THRESHOLD_MS + HOUR);
    expect(sendSilenceAlert).not.toHaveBeenCalled();
  });

  it("dedupes to one alert per UTC day but re-alerts on later days of continued silence", async () => {
    await recordAcceptedSubmission(logger, DAY1, "leads");
    const firstAlertAt = DAY1 + THRESHOLD_MS + HOUR;
    await checkAcceptedSilence(logger, firstAlertAt);
    await checkAcceptedSilence(logger, firstAlertAt + HOUR);
    expect(sendSilenceAlert).toHaveBeenCalledTimes(1);
    await checkAcceptedSilence(logger, firstAlertAt + 24 * HOUR);
    expect(sendSilenceAlert).toHaveBeenCalledTimes(2);
  });

  it("a new accepted submission resets the silence clock", async () => {
    await recordAcceptedSubmission(logger, DAY1, "leads");
    await recordAcceptedSubmission(logger, DAY1 + THRESHOLD_MS, "showing_contact");
    await checkAcceptedSilence(logger, DAY1 + THRESHOLD_MS + HOUR);
    expect(sendSilenceAlert).not.toHaveBeenCalled();
  });

  it("falls back to the in-memory last-accept when the database is down", async () => {
    await recordAcceptedSubmission(logger, DAY1, "leads");
    dbDown = true;
    await checkAcceptedSilence(logger, DAY1 + THRESHOLD_MS + HOUR);
    expect(sendSilenceAlert).toHaveBeenCalledTimes(1);
    // Same process, same day: in-memory claim fallback dedupes.
    await checkAcceptedSilence(logger, DAY1 + THRESHOLD_MS + 2 * HOUR);
    expect(sendSilenceAlert).toHaveBeenCalledTimes(1);
  });

  it("never throws when the alert send fails", async () => {
    sendSilenceAlert.mockRejectedValueOnce(new Error("smtp down"));
    await recordAcceptedSubmission(logger, DAY1, "leads");
    await expect(
      checkAcceptedSilence(logger, DAY1 + THRESHOLD_MS + HOUR),
    ).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalled();
  });

  it("does not send when the mailer is unconfigured", async () => {
    mailerConfiguredMock.mockReturnValue(false);
    await recordAcceptedSubmission(logger, DAY1, "leads");
    await checkAcceptedSilence(logger, DAY1 + THRESHOLD_MS + HOUR);
    expect(sendSilenceAlert).not.toHaveBeenCalled();
  });
});
