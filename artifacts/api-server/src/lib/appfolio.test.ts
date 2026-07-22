import { describe, expect, it } from "vitest";
import { isExhibitRow, isSafeNextPageUrl, normalizeRow, parseListingsHtml } from "./appfolio";

const NO_MEDIA = { photoUrl: null, listingUrl: null, videoUrl: null };

describe("parseListingsHtml", () => {
  it("maps apartment numbers to cover photo and detail URL, deduplicating repeats", () => {
    const html = `
      <a href="/listings/detail/15ac6d84-747c-4aa6-9b02-ce2be59e4d69" class="js-link">
        <img class="listing-item__image lazy" data-original="https://images.cdn.appfolio.com/db/images/abc/medium.jpg" alt="165 W Superior St, Apt. 1301, Chicago, IL 60654" src="placeholder.png" />
      </a>
      <a href="/listings/detail/15ac6d84-747c-4aa6-9b02-ce2be59e4d69">
        <img data-original="https://images.cdn.appfolio.com/db/images/abc/medium.jpg" alt="165 W Superior St, Apt. 1301, Chicago, IL 60654" src="p.png" />
      </a>
      <a href="/listings/detail/57dda21c-7fd6-446a-899a-c4776ceb4afa">
        <img data-original="https://images.cdn.appfolio.com/db/images/def/medium.jpg" alt="165 W Superior St, Apt. 0807, Chicago, IL 60654" src="p.png" />
      </a>`;
    const media = parseListingsHtml(html);
    expect(media.size).toBe(2);
    expect(media.get("1301")).toEqual({
      photoUrl: "https://images.cdn.appfolio.com/db/images/abc/medium.jpg",
      listingUrl:
        "https://highlandrealestatepartners.appfolio.com/listings/detail/15ac6d84-747c-4aa6-9b02-ce2be59e4d69",
    });
    expect(media.get("0807")?.photoUrl).toContain("/def/");
  });

  it("returns an empty map for markup without listing cards", () => {
    expect(parseListingsHtml("<html><body>No listings</body></html>").size).toBe(0);
  });
});

describe("isSafeNextPageUrl", () => {
  it("accepts same-host HTTPS and relative pagination URLs", () => {
    expect(isSafeNextPageUrl("https://highlandrealestatepartners.appfolio.com/api/v2/reports/unit_vacancy.json?page=2")).toBe(true);
    expect(isSafeNextPageUrl("/api/v2/reports/unit_vacancy.json?page=2")).toBe(true);
  });

  it("rejects off-host or non-HTTPS URLs so Basic auth never leaves AppFolio", () => {
    expect(isSafeNextPageUrl("https://evil.example.com/steal")).toBe(false);
    expect(isSafeNextPageUrl("https://highlandptrs.appfolio.com/api/v2/reports/x.json")).toBe(false);
    expect(isSafeNextPageUrl("http://highlandrealestatepartners.appfolio.com/api/v2/reports/x.json")).toBe(false);
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
      photoUrl: null,
      listingUrl: null,
      videoUrl: null,
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
      photoUrl: null,
      listingUrl: null,
      videoUrl: null,
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

  it("normalizes a real unit_vacancy detail row (combined bed/bath, turn-date fallback)", () => {
    const unit = normalizeRow({
      advertised_rent: "4222.00",
      property_name: "Exhibit on Superior",
      unit: "0208",
      unit_tags: null,
      unit_type: "ex2bd08a",
      bed_and_bath: "2/2.00",
      sqft: 1003,
      unit_status: "Notice-Unrented",
      days_vacant: null,
      available_on: null,
      unit_turn_target_date: "2026-09-09",
      advertised_rent1_month_lease: { id: "1", value: null },
      unit_id: 4597,
    });
    expect(unit).toEqual({
      unit: "0208",
      bedrooms: 2,
      bathrooms: 2,
      sqft: 1003,
      rent: 4222,
      availableOn: "2026-09-09",
      photoUrl: null,
      listingUrl: null,
      videoUrl: null,
    });
  });

  it("drops units that are already re-rented", () => {
    expect(
      normalizeRow({ unit: "1506", unit_status: "Notice-Rented", advertised_rent: "3823.00" }),
    ).toBeNull();
    expect(
      normalizeRow({ unit: "1506", unit_status: "Vacant-Rented", advertised_rent: "3823.00" }),
    ).toBeNull();
  });
});
