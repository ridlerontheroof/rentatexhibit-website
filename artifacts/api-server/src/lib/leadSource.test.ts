/**
 * Server-side lead-source validation — the trust boundary for what reaches
 * AppFolio's lead list and the leasing team's notification emails. Only the
 * `Website (UTM-HERE)` convention passes (alphanumerics/hyphens inside the
 * parentheses); everything else falls back to the default label.
 */
import { describe, expect, it } from "vitest";
import { DEFAULT_LEAD_SOURCE, LEAD_SOURCE_MAX_LENGTH, sanitizeLeadSource } from "./leadSource";

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
    expect(sanitizeLeadSource("Website (Google_Ads)")).toBe(DEFAULT_LEAD_SOURCE);
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
