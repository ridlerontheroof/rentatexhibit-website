import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  confirmGa4LowResult,
  type Ga4LowResult,
} from "./ga4LowConfirmation";

const FINGERPRINT = "a1b2c3d4e5f6";

function sequence(...results: Ga4LowResult[]) {
  let index = 0;
  const calls: number[] = [];
  return {
    calls,
    query: async () => {
      calls.push(index);
      return results[Math.min(index++, results.length - 1)];
    },
  };
}

function logger() {
  const entries: Array<{ fields: Record<string, unknown>; message: string }> = [];
  return {
    entries,
    log: {
      warn(fields: Record<string, unknown>, message: string) {
        entries.push({ fields, message });
      },
    },
  };
}

describe("confirmGa4LowResult", () => {
  it("returns a persistent at-or-below-floor confirmation for alert classification", async () => {
    const next = sequence({ activeUsers: 1 });
    const captured = logger();
    const result = await confirmGa4LowResult({
      initial: { activeUsers: 0 },
      minActiveUsers: 1,
      configFingerprint: FINGERPRINT,
      query: next.query,
      log: captured.log,
    });

    assert.deepEqual(result, { activeUsers: 1 });
    assert.equal(next.calls.length, 1);
    assert.equal(captured.entries[0].fields.initialActiveUsers, 0);
    assert.equal(captured.entries[0].fields.confirmationActiveUsers, 1);
    assert.equal(captured.entries[0].fields.configFingerprint, FINGERPRINT);
    assert.match(captured.entries[0].message, /confirmed/);
  });

  it("returns a recovered confirmation as healthy", async () => {
    const next = sequence({ activeUsers: 200 });
    const captured = logger();
    const result = await confirmGa4LowResult({
      initial: { activeUsers: 0 },
      minActiveUsers: 1,
      configFingerprint: FINGERPRINT,
      query: next.query,
      log: captured.log,
    });

    assert.deepEqual(result, { activeUsers: 200 });
    assert.match(captured.entries[0].message, /recovered/);
  });

  it("returns an errored confirmation as ambiguous", async () => {
    const next = sequence({
      activeUsers: null,
      error: "temporary report failure",
    });
    const captured = logger();
    const result = await confirmGa4LowResult({
      initial: { activeUsers: 0 },
      minActiveUsers: 1,
      configFingerprint: FINGERPRINT,
      query: next.query,
      log: captured.log,
    });

    assert.deepEqual(result, {
      activeUsers: null,
      error: "temporary report failure",
    });
    assert.equal(
      captured.entries[0].fields.confirmationError,
      "temporary report failure",
    );
    assert.match(captured.entries[0].message, /ambiguous/);
  });
});