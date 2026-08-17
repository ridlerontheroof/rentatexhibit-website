import { afterEach, describe, expect, it, vi } from "vitest";
import type { Logger } from "pino";
import {
  announceWatchdogStarted,
  EXPECTED_WATCHDOGS,
  getStartedWatchdogs,
  logStartupSummary,
  scheduleStartupSummary,
  STARTUP_SUMMARY_DELAY_MS,
  __resetStartupSummaryForTests,
} from "./startupSummary";

function makeLogger() {
  const info = vi.fn();
  return { log: { info } as unknown as Logger, info };
}

afterEach(() => {
  __resetStartupSummaryForTests();
  vi.useRealTimers();
});

describe("startup watchdog summary", () => {
  it("names every announced watchdog once, in registration order", () => {
    const { log, info } = makeLogger();
    announceWatchdogStarted("apex-redirect");
    announceWatchdogStarted("seo-weekly-digest");
    announceWatchdogStarted("apex-redirect"); // duplicate ignored
    logStartupSummary(log);
    expect(info).toHaveBeenCalledTimes(1);
    const [fields, message] = info.mock.calls[0] as [
      { watchdogCount: number; watchdogs: string[] },
      string,
    ];
    expect(fields.watchdogCount).toBe(2);
    expect(fields.watchdogs).toEqual(["apex-redirect", "seo-weekly-digest"]);
    expect(message).toBe("Watchdogs online: apex-redirect, seo-weekly-digest");
  });

  it("still logs (loudly empty) when nothing started", () => {
    const { log, info } = makeLogger();
    logStartupSummary(log);
    expect(info).toHaveBeenCalledTimes(1);
    expect(info.mock.calls[0]?.[1]).toMatch(/none started/);
  });

  it("defers the scheduled summary past the stdout blackout window", () => {
    vi.useFakeTimers();
    const { log, info } = makeLogger();
    announceWatchdogStarted("seo-weekly-digest");
    scheduleStartupSummary(log);
    scheduleStartupSummary(log); // second call is a no-op
    expect(STARTUP_SUMMARY_DELAY_MS).toBeGreaterThan(25_000);
    vi.advanceTimersByTime(STARTUP_SUMMARY_DELAY_MS - 1);
    expect(info).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(info).toHaveBeenCalledTimes(1);
    expect(info.mock.calls[0]?.[1]).toContain("seo-weekly-digest");
  });
});

describe("EXPECTED_WATCHDOGS", () => {
  it("contains no duplicates", () => {
    const unique = new Set(EXPECTED_WATCHDOGS);
    expect(unique.size).toBe(EXPECTED_WATCHDOGS.length);
  });

  it("has at least as many entries as watchdog files that call announceWatchdogStarted", () => {
    // There are 13 watchdog files as of the last audit; bump this when a new
    // watchdog is added so the reviewer notices EXPECTED_WATCHDOGS was not
    // updated.
    expect(EXPECTED_WATCHDOGS.length).toBeGreaterThanOrEqual(13);
  });
});

describe("getStartedWatchdogs", () => {
  it("returns an empty array before any watchdog registers", () => {
    expect(getStartedWatchdogs()).toEqual([]);
  });

  it("returns a snapshot — mutations to the returned array do not affect the registry", () => {
    announceWatchdogStarted("apex-redirect");
    const snap = getStartedWatchdogs();
    snap.push("injected");
    expect(getStartedWatchdogs()).toEqual(["apex-redirect"]);
  });

  it("reflects every registered watchdog in registration order", () => {
    announceWatchdogStarted("apex-redirect");
    announceWatchdogStarted("knowledge-pages");
    expect(getStartedWatchdogs()).toEqual(["apex-redirect", "knowledge-pages"]);
  });
});
