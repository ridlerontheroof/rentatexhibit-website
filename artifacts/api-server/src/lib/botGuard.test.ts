import { describe, expect, it } from "vitest";
import { inspectSubmission, withoutBotGuardFields, MIN_HUMAN_FILL_MS } from "./botGuard";

const human = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  phone: "312-555-0100",
};

describe("inspectSubmission", () => {
  it("passes a normal submission with no guard fields (legacy clients)", () => {
    expect(inspectSubmission(human)).toEqual({ bot: false });
  });

  it("passes an empty or whitespace honeypot", () => {
    expect(inspectSubmission({ ...human, company: "" })).toEqual({ bot: false });
    expect(inspectSubmission({ ...human, company: "   " })).toEqual({ bot: false });
  });

  it("flags a filled honeypot", () => {
    expect(inspectSubmission({ ...human, company: "Acme Corp" })).toEqual({
      bot: true,
      reason: "honeypot",
    });
  });

  it("flags an implausibly fast fill", () => {
    expect(inspectSubmission({ ...human, elapsedMs: 350 })).toEqual({
      bot: true,
      reason: "too_fast",
    });
  });

  it("passes a plausible fill time", () => {
    expect(inspectSubmission({ ...human, elapsedMs: MIN_HUMAN_FILL_MS })).toEqual({ bot: false });
    expect(inspectSubmission({ ...human, elapsedMs: 14_000 })).toEqual({ bot: false });
  });

  it("ignores garbage guard values (schema validation owns those)", () => {
    expect(inspectSubmission({ ...human, elapsedMs: "fast" })).toEqual({ bot: false });
    expect(inspectSubmission({ ...human, elapsedMs: -5 })).toEqual({ bot: false });
    expect(inspectSubmission({ ...human, elapsedMs: NaN })).toEqual({ bot: false });
    expect(inspectSubmission({ ...human, company: 42 })).toEqual({ bot: false });
    expect(inspectSubmission(null)).toEqual({ bot: false });
    expect(inspectSubmission("string body")).toEqual({ bot: false });
  });
});

describe("withoutBotGuardFields", () => {
  it("strips only the guard fields", () => {
    expect(withoutBotGuardFields({ ...human, company: "", elapsedMs: 9000 })).toEqual(human);
  });

  it("leaves non-object bodies alone", () => {
    expect(withoutBotGuardFields(null)).toBeNull();
    expect(withoutBotGuardFields("x")).toBe("x");
  });
});
