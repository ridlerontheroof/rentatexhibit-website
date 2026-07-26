import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./email", () => ({ sendRentedCheckAlert: vi.fn(async () => {}) }));
vi.mock("./mailer", () => ({ mailerConfigured: vi.fn(() => true) }));
vi.mock("./logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

// Simulate the shared `email_throttle_counters` table (same contract as the
// knowledgeCheck tests): daily-claim inserts return a row only when new;
// DO UPDATE counters increment; DELETE clears. Stores survive
// __resetRentedCheckForTests(), mimicking a restart (memory lost, DB kept).
const sharedKeys = new Set<string>();
const sharedCounters = new Map<string, number>();
let dbDown = false;
vi.mock("@workspace/db", () => ({
  db: {
    execute: vi.fn(async (query: { queryChunks?: unknown[] }) => {
      if (dbDown) throw new Error("db unreachable");
      const text = JSON.stringify(query);
      const key = text.match(/rentedcheck:[^"\\]+/)?.[0];
      if (typeof key !== "string") return { rows: [] };
      if (text.includes("DELETE")) {
        sharedCounters.delete(key);
        return { rows: [] };
      }
      if (text.includes("DO UPDATE")) {
        const next = (sharedCounters.get(key) ?? 0) + 1;
        sharedCounters.set(key, next);
        return { rows: [{ count: next }] };
      }
      if (sharedKeys.has(key)) return { rows: [] };
      sharedKeys.add(key);
      return { rows: [{ count: 1 }] };
    }),
  },
}));

import {
  checkRentedNoindexOnce,
  isUnsupportedEnvironment,
  resolveCheckScript,
  __resetRentedCheckForTests,
  type RentedCheckRun,
} from "./rentedCheck";
import { sendRentedCheckAlert } from "./email";
import { mailerConfigured } from "./mailer";
import { logger } from "./logger";

const sendAlert = vi.mocked(sendRentedCheckAlert);
const mailerConfiguredMock = vi.mocked(mailerConfigured);
const log = logger as never;

const DAY1 = Date.parse("2026-07-26T10:00:00Z");
const DAY1_LATER = Date.parse("2026-07-26T22:00:00Z");
const DAY2 = Date.parse("2026-07-27T10:00:00Z");

const pass = (): Promise<RentedCheckRun> =>
  Promise.resolve({ exitCode: 0, outputTail: "All rented-unit indexability checks passed" });
const fail = (): Promise<RentedCheckRun> =>
  Promise.resolve({
    exitCode: 1,
    outputTail: "FAIL  https://…/available-units/0505: robots meta missing noindex",
  });
const noChromium = (): Promise<RentedCheckRun> =>
  Promise.resolve({
    exitCode: 1,
    outputTail:
      "Rented-unit indexability check errored: No headless Chromium found (checked CHROME_BIN, PATH, ms-playwright cache, nix store).",
  });
const spawnError = (): Promise<RentedCheckRun> =>
  Promise.resolve({ exitCode: null, outputTail: "", error: "killed after timeout" });

beforeEach(() => {
  vi.clearAllMocks();
  sharedKeys.clear();
  sharedCounters.clear();
  dbDown = false;
  mailerConfiguredMock.mockReturnValue(true);
  __resetRentedCheckForTests();
});

describe("resolveCheckScript", () => {
  it("finds the check script from the repo root and from the package dir", () => {
    // Test runs with cwd = artifacts/api-server; the script lives two levels up.
    expect(resolveCheckScript()).toMatch(
      /artifacts\/exhibit-on-superior\/scripts\/check-rented-noindex\.mjs$/,
    );
    expect(resolveCheckScript("/nonexistent/place")).toBeNull();
  });
});

describe("isUnsupportedEnvironment", () => {
  it("detects the no-Chromium error, but not real failures", async () => {
    expect(isUnsupportedEnvironment(await noChromium())).toBe(true);
    expect(isUnsupportedEnvironment(await fail())).toBe(false);
    expect(isUnsupportedEnvironment(await pass())).toBe(false);
  });
});

describe("checkRentedNoindexOnce", () => {
  it("does not alert when the check passes", async () => {
    await checkRentedNoindexOnce(log, DAY1, pass);
    expect(sendAlert).not.toHaveBeenCalled();
    // Each passing run logs an info line so deploy logs show the outcome.
    expect(vi.mocked(logger.info)).toHaveBeenCalledWith(
      { mode: "chromium" },
      "Rented-unit indexability check passed",
    );
  });

  it("labels a passing HTTP-fallback run with its reduced mode", async () => {
    const httpPass = (): Promise<RentedCheckRun> =>
      Promise.resolve({
        exitCode: 0,
        outputTail:
          "MODE: http-fallback (no headless Chromium in this environment) — running browserless HTTP-level subset.\nAll HTTP-level subset of the rented-unit indexability checks passed",
      });
    await checkRentedNoindexOnce(log, DAY1, httpPass);
    expect(sendAlert).not.toHaveBeenCalled();
    expect(vi.mocked(logger.info)).toHaveBeenCalledWith(
      { mode: "http-fallback" },
      "Rented-unit indexability check passed",
    );
  });

  it("alerts once per UTC day on a definitive failure, again the next day", async () => {
    await checkRentedNoindexOnce(log, DAY1, fail);
    expect(sendAlert).toHaveBeenCalledTimes(1);
    expect(sendAlert.mock.calls[0]![0].summary).toContain("exited 1");
    expect(sendAlert.mock.calls[0]![0].outputTail).toContain("FAIL");

    await checkRentedNoindexOnce(log, DAY1_LATER, fail);
    expect(sendAlert).toHaveBeenCalledTimes(1); // same day → deduped

    await checkRentedNoindexOnce(log, DAY2, fail);
    expect(sendAlert).toHaveBeenCalledTimes(2);
  });

  it("dedupes across a restart via the shared claim", async () => {
    await checkRentedNoindexOnce(log, DAY1, fail);
    expect(sendAlert).toHaveBeenCalledTimes(1);
    __resetRentedCheckForTests(); // restart: memory gone, DB rows kept
    await checkRentedNoindexOnce(log, DAY1_LATER, fail);
    expect(sendAlert).toHaveBeenCalledTimes(1);
  });

  it("does not alert when the mailer is unconfigured", async () => {
    mailerConfiguredMock.mockReturnValue(false);
    await checkRentedNoindexOnce(log, DAY1, fail);
    expect(sendAlert).not.toHaveBeenCalled();
  });

  it("treats a missing Chromium as unsupported: warns once, never alerts", async () => {
    await checkRentedNoindexOnce(log, DAY1, noChromium);
    await checkRentedNoindexOnce(log, DAY1_LATER, noChromium);
    expect(sendAlert).not.toHaveBeenCalled();
    expect(vi.mocked(logger.warn)).toHaveBeenCalledTimes(1);
  });

  it("does not alert on a single errored run, but escalates after 4 in a row", async () => {
    for (let i = 0; i < 3; i++) {
      await checkRentedNoindexOnce(log, DAY1, spawnError);
    }
    expect(sendAlert).not.toHaveBeenCalled();
    await checkRentedNoindexOnce(log, DAY1, spawnError);
    expect(sendAlert).toHaveBeenCalledTimes(1);
    expect(sendAlert.mock.calls[0]![0].summary).toContain("4 consecutive runs");
  });

  it("persists the errored-run streak across restarts", async () => {
    await checkRentedNoindexOnce(log, DAY1, spawnError);
    await checkRentedNoindexOnce(log, DAY1, spawnError);
    __resetRentedCheckForTests(); // restart mid-outage
    await checkRentedNoindexOnce(log, DAY1, spawnError);
    expect(sendAlert).not.toHaveBeenCalled();
    await checkRentedNoindexOnce(log, DAY1, spawnError);
    expect(sendAlert).toHaveBeenCalledTimes(1);
  });

  it("a successful run resets the errored-run streak", async () => {
    for (let i = 0; i < 3; i++) {
      await checkRentedNoindexOnce(log, DAY1, spawnError);
    }
    await checkRentedNoindexOnce(log, DAY1, pass);
    for (let i = 0; i < 3; i++) {
      await checkRentedNoindexOnce(log, DAY1, spawnError);
    }
    expect(sendAlert).not.toHaveBeenCalled();
  });

  it("a same-day FAIL alert does not swallow the watchdog-blind escalation", async () => {
    await checkRentedNoindexOnce(log, DAY1, fail);
    expect(sendAlert).toHaveBeenCalledTimes(1);
    for (let i = 0; i < 4; i++) {
      await checkRentedNoindexOnce(log, DAY1_LATER, spawnError);
    }
    expect(sendAlert).toHaveBeenCalledTimes(2);
    expect(sendAlert.mock.calls[1]![0].summary).toContain("consecutive runs");
  });

  it("a same-day watchdog-blind escalation does not swallow the FAIL alert", async () => {
    for (let i = 0; i < 4; i++) {
      await checkRentedNoindexOnce(log, DAY1, spawnError);
    }
    expect(sendAlert).toHaveBeenCalledTimes(1);
    await checkRentedNoindexOnce(log, DAY1_LATER, fail);
    expect(sendAlert).toHaveBeenCalledTimes(2);
    expect(sendAlert.mock.calls[1]![0].summary).toContain("exited 1");
  });

  it("the escalation itself is still deduped once per day", async () => {
    for (let i = 0; i < 4; i++) {
      await checkRentedNoindexOnce(log, DAY1, spawnError);
    }
    expect(sendAlert).toHaveBeenCalledTimes(1);
    await checkRentedNoindexOnce(log, DAY1_LATER, spawnError);
    expect(sendAlert).toHaveBeenCalledTimes(1); // still blind, same day → deduped
  });

  it("falls back to in-memory counting when the database is down", async () => {
    dbDown = true;
    for (let i = 0; i < 4; i++) {
      await checkRentedNoindexOnce(log, DAY1, spawnError);
    }
    expect(sendAlert).toHaveBeenCalledTimes(1);
  });

  it("never throws when the alert send fails", async () => {
    sendAlert.mockRejectedValueOnce(new Error("smtp down"));
    await expect(checkRentedNoindexOnce(log, DAY1, fail)).resolves.toBeUndefined();
    expect(vi.mocked(logger.error)).toHaveBeenCalled();
  });
});
