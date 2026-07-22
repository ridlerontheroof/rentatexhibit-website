import { describe, expect, it } from "vitest";
import { isExhibitRow, isSafeNextPageUrl, normalizeRow } from "./appfolio";

describe("isSafeNextPageUrl", () => {
  it("accepts same-host HTTPS and relative pagination URLs", () => {
    expect(isSafeNextPageUrl("https://highlandptrs.appfolio.com/api/v2/reports/unit_vacancy.json?page=2")).toBe(true);
    expect(isSafeNextPageUrl("/api/v2/reports/unit_vacancy.json?page=2")).toBe(true);
  });

  it("rejects off-host or non-HTTPS URLs so Basic auth never leaves AppFolio", () => {
    expect(isSafeNextPageUrl("https://evil.example.com/steal")).toBe(false);
    expect(isSafeNextPageUrl("http://highlandptrs.appfolio.com/api/v2/reports/x.json")).toBe(false);
  });
});

describe("isExhibitRow", () => {
  it("keeps rows whose property mentions Exhibit", () => {
    expect(isExhibitRow({ property_name: "Exhibit on Superior - 165 W Superior St" })).toBe(true);
    expect(isExhibitRow({ PropertyName: "EXHIBIT" })).toBe(true);
  });

  it("drops rows for other properties", () => {
    expect(isExhibitRow({ property_name: "Some Other Building" })).toBe(false);
  });

  it("keeps rows with no property column (pre-filtered report views)", () => {
    expect(isExhibitRow({ unit_name: "0606" })).toBe(true);
  });
});

describe("normalizeRow", () => {
  it("normalizes a typical detail-view row with tolerant key matching", () => {
    const unit = normalizeRow({
      property_name: "Exhibit on Superior",
      unit_name: "0606",
      bedrooms: "1",
      bathrooms: "1.0",
      square_feet: "745",
      advertised_rent: "$2,650.00",
      available_on: "2026-08-15",
    });
    expect(unit).toEqual({
      unit: "0606",
      bedrooms: 1,
      bathrooms: 1,
      sqft: 745,
      rent: 2650,
      availableOn: "2026-08-15",
    });
  });

  it("handles alternate column spellings and missing values", () => {
    const unit = normalizeRow({
      "Unit Number": 1204,
      Bd: 2,
      Ba: 2,
      SqFt: "1,101",
      "Market Rent": 3800,
    });
    expect(unit).toEqual({
      unit: "1204",
      bedrooms: 2,
      bathrooms: 2,
      sqft: 1101,
      rent: 3800,
      availableOn: null,
    });
  });

  it("does not mistake days-vacant for the available date", () => {
    const unit = normalizeRow({
      unit_name: "0703",
      days_vacant: "12",
      available_on: "2026-09-01",
    });
    expect(unit?.availableOn).toBe("2026-09-01");
  });

  it("returns null when the row has no unit identifier", () => {
    expect(normalizeRow({ advertised_rent: "$2,000.00" })).toBeNull();
  });
});
