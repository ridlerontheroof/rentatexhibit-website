import { describe, expect, it } from "vitest";
import { createDailyInfoGate } from "./dailyHeartbeat";

const DAY1 = Date.UTC(2026, 7, 10, 8, 0, 0);
const DAY1_LATER = Date.UTC(2026, 7, 10, 21, 0, 0);
const DAY2 = Date.UTC(2026, 7, 11, 0, 30, 0);

describe("createDailyInfoGate", () => {
  it("allows info exactly once per UTC day, starting with the first call", () => {
    const gate = createDailyInfoGate();
    expect(gate.shouldInfo(DAY1)).toBe(true);
    expect(gate.shouldInfo(DAY1_LATER)).toBe(false);
    expect(gate.shouldInfo(DAY2)).toBe(true);
    expect(gate.shouldInfo(DAY2)).toBe(false);
  });

  it("reset() clears the day marker", () => {
    const gate = createDailyInfoGate();
    expect(gate.shouldInfo(DAY1)).toBe(true);
    gate.reset();
    expect(gate.shouldInfo(DAY1)).toBe(true);
  });
});
