import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./email", () => ({ sendApexRedirectAlert: vi.fn(async () => {}) }));
vi.mock("./mailer", () => ({ mailerConfigured: vi.fn(() => true) }));
vi.mock("./logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
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
      const key = text.match(/apexredirect:[^"\\]+/)?.[0];
      if (typeof key !== "string") return { rows: [] };
      if (sharedKeys.has(key)) return { rows: [] };
      sharedKeys.add(key);
      return { rows: [{ count: 1 }] };
    }),
  },
}));

import {
  checkApexRedirectOnce,
  evaluateApexResponse,
  __resetApexRedirectCheckForTests,
} from "./apexRedirectCheck";
import { sendApexRedirectAlert } from "./email";
import { mailerConfigured } from "./mailer";
import { logger } from "./logger";

const sendAlert = vi.mocked(sendApexRedirectAlert);
const mailerConfiguredMock = vi.mocked(mailerConfigured);

const DAY1 = Date.parse("2026-07-26T10:00:00Z");
const DAY1_LATER = Date.parse("2026-07-26T22:00:00Z");
const DAY2 = Date.parse("2026-07-27T10:00:00Z");

function fetchReturning(status: number, location: string | null): typeof fetch {
  return vi.fn(async () => ({
    status,
    headers: new Headers(location ? { location } : {}),
    body: null,
  })) as unknown as typeof fetch;
}

describe("evaluateApexResponse", () => {
  it("accepts a 301 to https://www", () => {
    expect(
      evaluateApexResponse(301, "https://www.rentatexhibit.com/fees").healthy,
    ).toBe(true);
  });

  it("accepts a 301 to http://www (Squarespace's first hop)", () => {
    expect(
      evaluateApexResponse(301, "http://www.rentatexhibit.com/fees").healthy,
    ).toBe(true);
  });

  it("accepts a 308", () => {
    expect(
      evaluateApexResponse(308, "https://www.rentatexhibit.com/fees").healthy,
    ).toBe(true);
  });

  it("rejects a 200 (apex serving the site again)", () => {
    const r = evaluateApexResponse(200, null);
    expect(r.healthy).toBe(false);
    expect(r.problem).toMatch(/HTTP 200/);
  });

  it("rejects a temporary 302", () => {
    expect(
      evaluateApexResponse(302, "https://www.rentatexhibit.com/fees").healthy,
    ).toBe(false);
  });

  it("rejects a 301 missing its Location header", () => {
    expect(evaluateApexResponse(301, null).healthy).toBe(false);
  });

  it("rejects a 301 pointing at the wrong host", () => {
    const r = evaluateApexResponse(301, "https://rentatexhibit.com/fees");
    expect(r.healthy).toBe(false);
    expect(r.problem).toContain("www.rentatexhibit.com");
  });
});

describe("checkApexRedirectOnce", () => {
  beforeEach(() => {
    __resetApexRedirectCheckForTests();
    sharedKeys.clear();
    dbDown = false;
    vi.clearAllMocks();
    mailerConfiguredMock.mockReturnValue(true);
  });

  it("does not alert when the redirect is healthy", async () => {
    await checkApexRedirectOnce(
      logger,
      DAY1,
      fetchReturning(301, "http://www.rentatexhibit.com/fees"),
    );
    expect(sendAlert).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("alerts when the apex serves the site (HTTP 200)", async () => {
    await checkApexRedirectOnce(logger, DAY1, fetchReturning(200, null));
    expect(sendAlert).toHaveBeenCalledExactlyOnceWith({
      status: 200,
      location: null,
      problem: expect.stringContaining("HTTP 200"),
    });
  });

  it("throttles to one alert per UTC day, cluster-wide", async () => {
    const bad = fetchReturning(200, null);
    await checkApexRedirectOnce(logger, DAY1, bad);
    await checkApexRedirectOnce(logger, DAY1_LATER, bad);
    expect(sendAlert).toHaveBeenCalledTimes(1);
    // A "different replica" (fresh in-memory state, same shared table) also
    // cannot re-send on the same day.
    __resetApexRedirectCheckForTests();
    await checkApexRedirectOnce(logger, DAY1_LATER, bad);
    expect(sendAlert).toHaveBeenCalledTimes(1);
    // Next day it fires again.
    await checkApexRedirectOnce(logger, DAY2, bad);
    expect(sendAlert).toHaveBeenCalledTimes(2);
  });

  it("falls back to in-memory dedupe when the database is down", async () => {
    dbDown = true;
    const bad = fetchReturning(200, null);
    await checkApexRedirectOnce(logger, DAY1, bad);
    await checkApexRedirectOnce(logger, DAY1_LATER, bad);
    expect(sendAlert).toHaveBeenCalledTimes(1);
  });

  it("logs but does not alert when the apex is unreachable", async () => {
    const failing = vi.fn(async () => {
      throw new Error("network down");
    }) as unknown as typeof fetch;
    await checkApexRedirectOnce(logger, DAY1, failing);
    expect(sendAlert).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledOnce();
  });

  it("still logs the error when the mailer is unconfigured", async () => {
    mailerConfiguredMock.mockReturnValue(false);
    await checkApexRedirectOnce(logger, DAY1, fetchReturning(200, null));
    expect(sendAlert).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });

  it("never throws when the alert send fails", async () => {
    sendAlert.mockRejectedValueOnce(new Error("smtp down"));
    await expect(
      checkApexRedirectOnce(logger, DAY1, fetchReturning(200, null)),
    ).resolves.toBeUndefined();
  });
});
