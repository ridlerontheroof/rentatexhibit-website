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
    expect(inspectSubmission({ ...human, xh_note: "" })).toEqual({ bot: false });
    expect(inspectSubmission({ ...human, xh_note: "   " })).toEqual({ bot: false });
  });

  it("flags a filled honeypot", () => {
    expect(inspectSubmission({ ...human, xh_note: "Acme Corp" })).toEqual({
      bot: true,
      reason: "honeypot",
    });
  });

  it("no longer flags the legacy `company` field — Safari autofilled it for real visitors", () => {
    // Regression guard for the 2026-07-27 production incident: profile
    // autofill filled the old "Company"-labelled honeypot from real visitors'
    // contact cards. Cached bundles may still send it; it must pass.
    expect(inspectSubmission({ ...human, company: "Lovelace Analytics" })).toEqual({ bot: false });
  });

  it("flags an implausibly fast fill", () => {
    expect(inspectSubmission({ ...human, elapsedMs: 350 })).toEqual({
      bot: true,
      reason: "too_fast",
    });
  });

  it("passes when elapsedMs is absent (pure-autofill visitors never type)", () => {
    expect(inspectSubmission({ ...human, xh_note: "" })).toEqual({ bot: false });
  });

  it("passes a plausible fill time", () => {
    expect(inspectSubmission({ ...human, elapsedMs: MIN_HUMAN_FILL_MS })).toEqual({ bot: false });
    expect(inspectSubmission({ ...human, elapsedMs: 14_000 })).toEqual({ bot: false });
  });

  it("ignores garbage guard values (schema validation owns those)", () => {
    expect(inspectSubmission({ ...human, elapsedMs: "fast" })).toEqual({ bot: false });
    expect(inspectSubmission({ ...human, elapsedMs: -5 })).toEqual({ bot: false });
    expect(inspectSubmission({ ...human, elapsedMs: NaN })).toEqual({ bot: false });
    expect(inspectSubmission({ ...human, xh_note: 42 })).toEqual({ bot: false });
    expect(inspectSubmission(null)).toEqual({ bot: false });
    expect(inspectSubmission("string body")).toEqual({ bot: false });
  });
});

describe("withoutBotGuardFields", () => {
  it("strips only the guard fields (including the legacy company name)", () => {
    expect(
      withoutBotGuardFields({ ...human, xh_note: "", company: "Autofilled Inc", elapsedMs: 9000 }),
    ).toEqual(human);
  });

  it("leaves non-object bodies alone", () => {
    expect(withoutBotGuardFields(null)).toBeNull();
    expect(withoutBotGuardFields("x")).toBe("x");
  });
});
