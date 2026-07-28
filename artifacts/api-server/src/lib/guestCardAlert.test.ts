/**
 * Unit tests for the guest-card rejection alert: a failed AppFolio push for
 * an accepted lead emails the leasing inbox with the lead's details, at most
 * once per lead per UTC day (shared claim with in-memory fallback), and
 * never throws.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Logger } from "pino";

vi.mock("./email", () => ({
  sendGuestCardFailureAlert: vi.fn(async () => {}),
}));
vi.mock("./mailer", () => ({ mailerConfigured: vi.fn(() => true) }));

// Simulate the shared `email_throttle_counters` daily-claim upsert
// (INSERT … ON CONFLICT DO NOTHING RETURNING).
const sharedClaims = new Set<string>();
let dbDown = false;
vi.mock("@workspace/db", () => ({
  db: {
    execute: vi.fn(async (query: unknown) => {
      if (dbDown) throw new Error("db unreachable");
      const text = JSON.stringify(query);
      const key = text.match(/guestcardfail:[^"\\]+/)?.[0];
      if (!key) return { rows: [] };
      if (sharedClaims.has(key)) return { rows: [] };
      sharedClaims.add(key);
      return { rows: [{ count: 1 }] };
    }),
  },
}));

import { sendGuestCardFailureAlert } from "./email";
import { mailerConfigured } from "./mailer";
import {
  __resetGuestCardAlertForTests,
  reportGuestCardFailure,
} from "./guestCardAlert";

const log = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
} as unknown as Logger;

const NOW = Date.parse("2026-07-28T15:00:00Z");

const details = {
  leadId: 42,
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@example.com",
  phone: "3125550100",
  unit: "2801",
  source: null,
  errorMessage: "AppFolio guest card failed: status 422 body=<empty>",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(mailerConfigured).mockReturnValue(true);
  sharedClaims.clear();
  dbDown = false;
  __resetGuestCardAlertForTests();
});

describe("reportGuestCardFailure", () => {
  it("emails the leasing inbox with the lead's details on first failure", async () => {
    await reportGuestCardFailure(log, NOW, details);
    expect(vi.mocked(sendGuestCardFailureAlert)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(sendGuestCardFailureAlert)).toHaveBeenCalledWith({
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "3125550100",
      unit: "2801",
      source: null,
      detail: details.errorMessage,
    });
  });

  it("dedupes repeat failures for the same lead the same day", async () => {
    await reportGuestCardFailure(log, NOW, details);
    await reportGuestCardFailure(log, NOW + 60_000, details);
    expect(vi.mocked(sendGuestCardFailureAlert)).toHaveBeenCalledTimes(1);
  });

  it("alerts separately for a different lead the same day", async () => {
    await reportGuestCardFailure(log, NOW, details);
    await reportGuestCardFailure(log, NOW, { ...details, leadId: 43 });
    expect(vi.mocked(sendGuestCardFailureAlert)).toHaveBeenCalledTimes(2);
  });

  it("alerts again for the same lead on a new UTC day", async () => {
    await reportGuestCardFailure(log, NOW, details);
    await reportGuestCardFailure(log, NOW + 24 * 60 * 60 * 1000, details);
    expect(vi.mocked(sendGuestCardFailureAlert)).toHaveBeenCalledTimes(2);
  });

  it("falls back to in-memory dedupe when the database is down", async () => {
    dbDown = true;
    await reportGuestCardFailure(log, NOW, details);
    await reportGuestCardFailure(log, NOW + 60_000, details);
    expect(vi.mocked(sendGuestCardFailureAlert)).toHaveBeenCalledTimes(1);
  });

  it("skips the send (with a warning) when the mailer is unconfigured", async () => {
    vi.mocked(mailerConfigured).mockReturnValue(false);
    await reportGuestCardFailure(log, NOW, details);
    expect(vi.mocked(sendGuestCardFailureAlert)).not.toHaveBeenCalled();
    expect(log.warn).toHaveBeenCalled();
  });

  it("never throws when the send itself fails", async () => {
    vi.mocked(sendGuestCardFailureAlert).mockRejectedValueOnce(
      new Error("smtp down"),
    );
    await expect(reportGuestCardFailure(log, NOW, details)).resolves.toBeUndefined();
    expect(log.error).toHaveBeenCalled();
  });

  it("passes a real campaign source through to the alert", async () => {
    await reportGuestCardFailure(log, NOW, {
      ...details,
      source: "Website (GoogleAds-SpringPromo)",
    });
    expect(vi.mocked(sendGuestCardFailureAlert)).toHaveBeenCalledWith(
      expect.objectContaining({ source: "Website (GoogleAds-SpringPromo)" }),
    );
  });
});
