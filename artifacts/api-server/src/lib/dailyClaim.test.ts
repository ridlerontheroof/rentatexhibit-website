import { beforeEach, describe, expect, it, vi } from "vitest";

// Simulate the shared `email_throttle_counters` table: an INSERT … ON CONFLICT
// DO NOTHING RETURNING returns a row only when the key was newly inserted.
const sharedKeys = new Set<string>();
let dbDown = false;
vi.mock("@workspace/db", () => ({
  db: {
    execute: vi.fn(async (query: { queryChunks?: unknown[] }) => {
      if (dbDown) throw new Error("db unreachable");
      const text = JSON.stringify(query);
      const key = text.match(/testprefix:[^"\\]+/)?.[0];
      if (typeof key !== "string") return { rows: [] };
      if (sharedKeys.has(key)) return { rows: [] };
      sharedKeys.add(key);
      return { rows: [{ count: 1 }] };
    }),
  },
}));

import { createDailyClaim } from "./dailyClaim";
import { db } from "@workspace/db";
import type { Logger } from "pino";

const dbExecute = vi.mocked(db.execute);

const log = {
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
} as unknown as Logger;
const logError = vi.mocked(
  (log as unknown as { error: (...args: unknown[]) => void }).error,
);

const DAY1 = Date.parse("2026-07-26T10:00:00Z");
const DAY1_LATER = Date.parse("2026-07-26T22:00:00Z");
const DAY2 = Date.parse("2026-07-27T10:00:00Z");

function makeClaim() {
  return createDailyClaim({
    prefix: "testprefix",
    claimFailedMessage: "daily claim failed",
  });
}

describe("createDailyClaim", () => {
  beforeEach(() => {
    sharedKeys.clear();
    dbDown = false;
    vi.clearAllMocks();
  });

  it("wins the first claim of the day, loses later ones the same day", async () => {
    const claim = makeClaim();
    expect(await claim.claim(log, DAY1)).toBe(true);
    expect(await claim.claim(log, DAY1_LATER)).toBe(false);
    expect(logError).not.toHaveBeenCalled();
  });

  it("dedupes cluster-wide: another process (fresh memory, same table) loses", async () => {
    const claimA = makeClaim();
    const claimB = makeClaim(); // simulates a second replica
    expect(await claimA.claim(log, DAY1)).toBe(true);
    expect(await claimB.claim(log, DAY1_LATER)).toBe(false);
  });

  it("wins again on the next UTC day", async () => {
    const claim = makeClaim();
    expect(await claim.claim(log, DAY1)).toBe(true);
    expect(await claim.claim(log, DAY2)).toBe(true);
  });

  it("falls back to in-memory dedupe when the database is down", async () => {
    dbDown = true;
    const claim = makeClaim();
    expect(await claim.claim(log, DAY1)).toBe(true);
    expect(await claim.claim(log, DAY1_LATER)).toBe(false);
    expect(logError).toHaveBeenCalledTimes(2);
    expect(logError.mock.calls[0]?.[1]).toBe("daily claim failed");
  });

  it("merges logFields into the DB-failure error log", async () => {
    dbDown = true;
    const claim = makeClaim();
    await claim.claim(log, DAY1, { logFields: { unit: "0606" } });
    expect(logError).toHaveBeenCalledWith(
      expect.objectContaining({ unit: "0606", err: expect.any(Error) }),
      "daily claim failed",
    );
  });

  it("mirror-on-success: a DB outage after a shared win still can't re-send", async () => {
    const claim = makeClaim();
    expect(await claim.claim(log, DAY1)).toBe(true); // shared claim wins
    dbDown = true; // database drops mid-day
    expect(await claim.claim(log, DAY1_LATER)).toBe(false);
    expect(await claim.claim(log, DAY1_LATER)).toBe(false);
  });

  it("DB outage after a shared *loss* does not grant the fallback claim... unless memory never saw it", async () => {
    // Replica B lost the shared claim (replica A holds it). Without a mirror
    // of the loss, B's memory is empty — documenting the degraded-dedupe
    // contract: a later DB outage lets B win its per-process fallback once.
    const claimA = makeClaim();
    const claimB = makeClaim();
    expect(await claimA.claim(log, DAY1)).toBe(true);
    expect(await claimB.claim(log, DAY1)).toBe(false);
    dbDown = true;
    expect(await claimB.claim(log, DAY1_LATER)).toBe(true); // per-replica degrade
    expect(await claimB.claim(log, DAY1_LATER)).toBe(false); // but only once
  });

  it("scopes shared claims by subKey", async () => {
    const claim = makeClaim();
    expect(await claim.claim(log, DAY1, { subKey: "a" })).toBe(true);
    expect(await claim.claim(log, DAY1, { subKey: "b" })).toBe(true);
    expect(await claim.claim(log, DAY1_LATER, { subKey: "a" })).toBe(false);
    expect(await claim.claim(log, DAY1_LATER, { subKey: "b" })).toBe(false);
    // The unkeyed claim is independent of subKey-scoped ones.
    expect(await claim.claim(log, DAY1_LATER)).toBe(true);
  });

  it("scopes in-memory fallback claims by subKey too", async () => {
    dbDown = true;
    const claim = makeClaim();
    expect(await claim.claim(log, DAY1, { subKey: "a" })).toBe(true);
    expect(await claim.claim(log, DAY1, { subKey: "b" })).toBe(true);
    expect(await claim.claim(log, DAY1_LATER, { subKey: "a" })).toBe(false);
  });

  it("mirrors subKey wins so a later outage can't re-send that subKey", async () => {
    const claim = makeClaim();
    expect(await claim.claim(log, DAY1, { subKey: "a" })).toBe(true);
    dbDown = true;
    expect(await claim.claim(log, DAY1_LATER, { subKey: "a" })).toBe(false);
  });

  it("day rollover sweeps stale in-memory entries", async () => {
    dbDown = true;
    const claim = makeClaim();
    expect(await claim.claim(log, DAY1, { subKey: "a" })).toBe(true);
    expect(await claim.claim(log, DAY1, { subKey: "b" })).toBe(true);
    // First claim of day 2 sweeps day-1 entries…
    expect(await claim.claim(log, DAY2, { subKey: "a" })).toBe(true);
    // …so day-1 keys are gone (fresh claims for day 2 succeed once each).
    expect(await claim.claim(log, DAY2, { subKey: "b" })).toBe(true);
    expect(await claim.claim(log, DAY2, { subKey: "a" })).toBe(false);
  });

  it("uses the plain key when unkeyed and embeds the subKey otherwise", async () => {
    const claim = makeClaim();
    await claim.claim(log, DAY1);
    await claim.claim(log, DAY1, { subKey: "abc123" });
    expect(sharedKeys).toContain("testprefix:2026-07-26");
    expect(sharedKeys).toContain("testprefix:abc123:2026-07-26");
  });

  it("reset() clears the fallback memory", async () => {
    dbDown = true;
    const claim = makeClaim();
    expect(await claim.claim(log, DAY1)).toBe(true);
    claim.reset();
    expect(await claim.claim(log, DAY1)).toBe(true);
  });

  it("never throws when the database is down", async () => {
    dbDown = true;
    dbExecute.mockRejectedValueOnce(new Error("connection reset"));
    const claim = makeClaim();
    await expect(claim.claim(log, DAY1)).resolves.toBe(true);
  });
});
