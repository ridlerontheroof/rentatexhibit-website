/**
 * Server-side lead-source validation — the trust boundary for what reaches
 * AppFolio's lead list and the leasing team's notification emails. Only the
 * `Website (UTM-HERE)` convention passes (alphanumerics/hyphens inside the
 * parentheses); everything else falls back to the default label.
 */
import { describe, expect, it } from "vitest";
import {
  auditRawSource,
  auditSourceLabel,
  DEFAULT_LEAD_SOURCE,
  LEAD_SOURCE_MAX_LENGTH,
  sanitizeLeadSource,
} from "./leadSource";

describe("sanitizeLeadSource", () => {
  it("passes through a convention-shaped campaign label", () => {
    expect(sanitizeLeadSource("Website (GoogleAds-SpringPromo)")).toBe(
      "Website (GoogleAds-SpringPromo)",
    );
    expect(sanitizeLeadSource("Website (GoogleAds)")).toBe("Website (GoogleAds)");
    expect(sanitizeLeadSource("Website (Facebook-OpenHouse2026)")).toBe(
      "Website (Facebook-OpenHouse2026)",
    );
    expect(sanitizeLeadSource("  Website (GoogleAds)  ")).toBe("Website (GoogleAds)");
  });

  it("falls back to the default when absent (default behavior unchanged)", () => {
    expect(sanitizeLeadSource(undefined)).toBe(DEFAULT_LEAD_SOURCE);
    expect(sanitizeLeadSource(null)).toBe(DEFAULT_LEAD_SOURCE);
    expect(sanitizeLeadSource("")).toBe(DEFAULT_LEAD_SOURCE);
    expect(sanitizeLeadSource("   ")).toBe(DEFAULT_LEAD_SOURCE);
  });

  it("rejects junk values back to the default", () => {
    expect(sanitizeLeadSource("<script>alert(1)</script>")).toBe(DEFAULT_LEAD_SOURCE);
    expect(sanitizeLeadSource('"; DROP TABLE leads; --')).toBe(DEFAULT_LEAD_SOURCE);
    expect(sanitizeLeadSource("Website (line\nbreak)")).toBe(DEFAULT_LEAD_SOURCE);
    expect(sanitizeLeadSource("Google Ads — Spring Promo")).toBe(DEFAULT_LEAD_SOURCE);
    expect(sanitizeLeadSource(42)).toBe(DEFAULT_LEAD_SOURCE);
  });

  it("rejects spaces or special characters inside the parentheses", () => {
    expect(sanitizeLeadSource("Website (Google Ads)")).toBe(DEFAULT_LEAD_SOURCE);
    // Underscore is allowed — the contact-link label "Website (Exhibit_ContactUs)".
    expect(sanitizeLeadSource("Website (Google_Ads)")).toBe("Website (Google_Ads)");
    expect(sanitizeLeadSource("Website (Exhibit_ContactUs)")).toBe("Website (Exhibit_ContactUs)");
    expect(sanitizeLeadSource("Website (Google.Ads)")).toBe(DEFAULT_LEAD_SOURCE);
    expect(sanitizeLeadSource("Website ()")).toBe(DEFAULT_LEAD_SOURCE);
    expect(sanitizeLeadSource("Site (GoogleAds)")).toBe(DEFAULT_LEAD_SOURCE);
  });

  it("caps the length", () => {
    expect(sanitizeLeadSource(`Website (${"x".repeat(LEAD_SOURCE_MAX_LENGTH)})`)).toBe(
      DEFAULT_LEAD_SOURCE,
    );
    const maxToken = "x".repeat(LEAD_SOURCE_MAX_LENGTH - "Website ()".length);
    expect(sanitizeLeadSource(`Website (${maxToken})`)).toBe(`Website (${maxToken})`);
  });

  it("the default label itself is stable under validation", () => {
    expect(sanitizeLeadSource(DEFAULT_LEAD_SOURCE)).toBe(DEFAULT_LEAD_SOURCE);
  });
});

describe("auditRawSource (PII-safe audit rendering)", () => {
  it("never echoes client content — sanitizer-accepted values reduce to <accepted>", () => {
    expect(auditRawSource("Website (GoogleAds_IL-Chicago_Luxury-Apartments)")).toBe("<accepted>");
    expect(auditRawSource("Website (GoogleAds-SpringPromo)")).toBe("<accepted>");
    // Even name/phone-shaped tokens wrapped in the accepted grammar are not
    // echoed by the audit field; the sanitized `source` field carries any
    // accepted label.
    expect(auditRawSource("Website (JaneDoe)")).toBe("<accepted>");
    expect(auditRawSource("Website (3125550100)")).toBe("<accepted>");
  });

  it("fingerprints everything else — names, tokens, emails, phones, addresses, free text", () => {
    for (const raw of [
      "jane.doe@example.com",
      "312-555-0100",
      "3125550100",
      "John",
      "JaneDoe",
      "Mary-Jane",
      "John Smith",
      "165 W Superior St, Chicago",
      "please call me about apt 2801",
      "<script>alert(1)</script>",
      "Website (two words)",
      // Bare tokens (not full labels) are also client content — fingerprint.
      "GoogleAds_IL-Chicago_Luxury-Apartments",
    ]) {
      const out = auditRawSource(raw);
      expect(out).toMatch(
        /^<rejected len=\d+ digits=\d+ hasAt=(true|false) hasSpace=(true|false) labelPrefixed=(true|false)>$/,
      );
      expect(out).not.toContain(raw);
    }
  });

  it("auditSourceLabel is contentless: default marker or non-reversible hash", () => {
    expect(auditSourceLabel(DEFAULT_LEAD_SOURCE)).toBe("default");
    const label = "Website (GoogleAds_IL-Chicago_Luxury-Apartments)";
    const out = auditSourceLabel(label);
    expect(out).toMatch(/^campaign sha256=[0-9a-f]{12} len=48$/);
    expect(out).not.toContain("GoogleAds");
    // Deterministic — the expected campaign's hash can be computed offline
    // and compared against deployment logs.
    expect(auditSourceLabel(label)).toBe(out);
    // Name/phone-shaped accepted labels never appear in the audit output.
    expect(auditSourceLabel("Website (JaneDoe)")).not.toContain("JaneDoe");
    expect(auditSourceLabel("Website (3125550100)")).not.toContain("3125550100");
  });

  it("marks absent, empty, and non-string values distinctly", () => {
    expect(auditRawSource(undefined)).toBeNull();
    expect(auditRawSource(null)).toBeNull();
    expect(auditRawSource("   ")).toBe("<empty>");
    expect(auditRawSource(42)).toBe("<non-string number>");
  });

  it("never logs over-long values verbatim", () => {
    const long = `Website (${"A".repeat(LEAD_SOURCE_MAX_LENGTH)})`;
    expect(auditRawSource(long)).toMatch(/^<rejected /);
  });
});
