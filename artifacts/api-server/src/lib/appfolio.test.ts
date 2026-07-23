import { describe, expect, it } from "vitest";
import {
  isExhibitRow,
  isSafeNextPageUrl,
  normalizeRow,
  parseDetailDescription,
  parseDetailPhotos,
  parseDetailVideo,
  parseDetailSections,
  parseDetailTitle,
  listableUidFromListingUrl,
  parseListingsHtml,
  sanitizeMarketingTitle,
} from "./appfolio";

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

  it("never pairs a card's link with the next card's address (regression: off-by-one)", () => {
    // Real page structure: each card's detail link comes FIRST, then its
    // placeholder <img> (data-original + alt with the unit), then an address
    // anchor repeating the same link. A greedy cross-card regex would pair
    // uuid-1 with Apt 2801 here.
    const html = `
      <a href="/listings/detail/aaaaaaaa-0000-0000-0000-000000000001"><img src="placeholder.png" alt="165 W Superior St, Apt. 1301, Chicago, IL 60654" /></a>
      <img data-original="https://images.cdn.appfolio.com/db/images/one/medium.jpg" alt="165 W Superior St, Apt. 1301, Chicago, IL 60654" />
      <a href="/listings/detail/aaaaaaaa-0000-0000-0000-000000000001">165 W Superior St, Apt. 1301, Chicago, IL 60654</a>
      <a href="/listings/detail/bbbbbbbb-0000-0000-0000-000000000002"><img src="placeholder.png" alt="165 W Superior St, Apt. 2801, Chicago, IL 60654" /></a>
      <img data-original="https://images.cdn.appfolio.com/db/images/two/medium.jpg" alt="165 W Superior St, Apt. 2801, Chicago, IL 60654" />
      <a href="/listings/detail/bbbbbbbb-0000-0000-0000-000000000002">165 W Superior St, Apt. 2801, Chicago, IL 60654</a>`;
    const media = parseListingsHtml(html);
    expect(media.get("1301")?.listingUrl).toContain("aaaaaaaa");
    expect(media.get("1301")?.photoUrl).toContain("/one/");
    expect(media.get("2801")?.listingUrl).toContain("bbbbbbbb");
    expect(media.get("2801")?.photoUrl).toContain("/two/");
  });

  it("returns an empty map for markup without listing cards", () => {
    expect(parseListingsHtml("<html><body>No listings</body></html>").size).toBe(0);
  });
});

describe("parseDetailPhotos", () => {
  it("leads with the unit-specific images/ gallery (as large.jpg, deduped by id), then appends the property-wide marketing set", () => {
    const html = `
      <img src="https://images.cdn.appfolio.com/db/images/abc/medium.jpg" />
      <img src="https://images.cdn.appfolio.com/db/images/abc/large.jpg" />
      <img src="https://images.cdn.appfolio.com/db/images/def-456/medium.jpg" />
      <a href="https://images.cdn.appfolio.com/db/leads_marketing_photos/aaa-111/original.jpg">
        <img src="https://images.cdn.appfolio.com/db/leads_marketing_photos/aaa-111/original.jpg" /></a>
      <a href="https://images.cdn.appfolio.com/db/leads_marketing_photos/bbb-222/original.jpg"></a>`;
    expect(parseDetailPhotos(html)).toEqual([
      "https://images.cdn.appfolio.com/db/images/abc/large.jpg",
      "https://images.cdn.appfolio.com/db/images/def-456/large.jpg",
      "https://images.cdn.appfolio.com/db/leads_marketing_photos/aaa-111/original.jpg",
      "https://images.cdn.appfolio.com/db/leads_marketing_photos/bbb-222/original.jpg",
    ]);
  });

  it("drops the excluded Highland Partners logo photo from the gallery", () => {
    const html = `
      <img src="https://images.cdn.appfolio.com/db/images/abc/large.jpg" />
      <img src="https://images.cdn.appfolio.com/db/images/a2d081fb-43de-4bf9-9089-5e9d2525575a/large.jpg" />`;
    expect(parseDetailPhotos(html)).toEqual([
      "https://images.cdn.appfolio.com/db/images/abc/large.jpg",
    ]);
  });

  it("drops the excluded logo photo from the marketing set too", () => {
    const html = `
      <a href="https://images.cdn.appfolio.com/db/leads_marketing_photos/a2d081fb-43de-4bf9-9089-5e9d2525575a/original.jpg"></a>
      <a href="https://images.cdn.appfolio.com/db/leads_marketing_photos/bbb-222/original.jpg"></a>`;
    expect(parseDetailPhotos(html)).toEqual([
      "https://images.cdn.appfolio.com/db/leads_marketing_photos/bbb-222/original.jpg",
    ]);
  });

  it("uses only the marketing set when no gallery images exist", () => {
    const html = `
      <a href="https://images.cdn.appfolio.com/db/leads_marketing_photos/aaa-111/original.jpg"></a>
      <a href="https://images.cdn.appfolio.com/db/leads_marketing_photos/aaa-111/original.jpg"></a>
      <a href="https://images.cdn.appfolio.com/db/leads_marketing_photos/bbb-222/original.jpg"></a>`;
    expect(parseDetailPhotos(html)).toEqual([
      "https://images.cdn.appfolio.com/db/leads_marketing_photos/aaa-111/original.jpg",
      "https://images.cdn.appfolio.com/db/leads_marketing_photos/bbb-222/original.jpg",
    ]);
  });

  it("returns empty for pages without gallery photos", () => {
    expect(parseDetailPhotos("<html></html>")).toEqual([]);
  });
});

describe("parseDetailVideo", () => {
  it("extracts the YouTube watch URL from the page", () => {
    const html = `
      <img src="https://img.youtube.com/vi/ZC8_gb9stKU/0.jpg" />
      <a href="https://www.youtube.com/watch?v=ZC8_gb9stKU">Video Tour</a>`;
    expect(parseDetailVideo(html)).toBe("https://www.youtube.com/watch?v=ZC8_gb9stKU");
  });

  it("returns null when the page has no video", () => {
    expect(parseDetailVideo("<html></html>")).toBeNull();
  });
});

describe("parseDetailSections", () => {
  it("extracts h3-titled list sections with decoded, tag-stripped items", () => {
    const html = `
      <h3 class="fw-normal mt-3">Rental Terms</h3>
      <ul class="list fw-light js-show-rental-terms">
        <li class="list__item">Rent: $2,271</li>
        <li class="list__item">Application Fee: $60</li>
        <li class="list__item">Available 9/24/26</li>
      </ul>
      <h3 class="fw-normal mt-3">Pet Policy</h3>
      <ul class="list js-pet-policy-list fw-light">
        <li class="list__item js-pet-policy-item">Cats allowed</li><li class="list__item">Dogs &amp; cats</li>
      </ul>
      <h3 class="fw-normal mt-3">Empty Section</h3>
      <ul class="list"></ul>`;
    expect(parseDetailSections(html)).toEqual([
      {
        title: "Rental Terms",
        items: ["Rent: $2,271", "Application Fee: $60", "Available 9/24/26"],
      },
      { title: "Pet Policy", items: ["Cats allowed", "Dogs & cats"] },
    ]);
  });

  it("extracts the listing headline and description", () => {
    const html = `
      <h2 class="listing-detail__title">Smart Living on Display. Call Today!</h2>
      <p class="listing-detail__description hand-hidden fw-light">Exhibit on Superior is a tower.<br/>Second line &amp; more.</p>`;
    expect(parseDetailTitle(html)).toBe("Smart Living on Display. Call Today!");
    expect(parseDetailDescription(html)).toBe("Exhibit on Superior is a tower.\nSecond line & more.");
    expect(parseDetailTitle("<html></html>")).toBeNull();
    expect(parseDetailDescription("<html></html>")).toBeNull();
  });

  it("renders hostile encoded content as inert plain text", () => {
    const html = `
      <h2 class="listing-detail__title">&lt;script&gt;alert(1)&lt;/script&gt; Tour today</h2>
      <p class="listing-detail__description">Nice <b>view</b> &amp; more &lt;img src=x onerror=alert(1)&gt;</p>`;
    expect(parseDetailTitle(html)).toBe("<script>alert(1)</script> Tour today");
    expect(parseDetailDescription(html)).toBe("Nice view & more <img src=x onerror=alert(1)>");
    // Values are plain strings; the frontend renders them as React text nodes,
    // so decoded markup is displayed literally, never executed.
  });

  it("returns empty for pages without sections", () => {
    expect(parseDetailSections("<html><body><h3>Title</h3><p>text</p></body></html>")).toEqual([]);
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
      photos: [],
      details: [],
      marketingTitle: null,
      description: null,
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
      photos: [],
      details: [],
      marketingTitle: null,
      description: null,
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
      photos: [],
      details: [],
      marketingTitle: null,
      description: null,
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

describe("sanitizeMarketingTitle", () => {
  it("rewrites phone-first tour CTAs to point at the on-page button", () => {
    expect(sanitizeMarketingTitle("Smart Living on Display. Call Today and Schedule Your Tour!")).toBe(
      "Smart Living on Display. Schedule Your Tour Today!",
    );
  });

  it("removes property-wide amenities (sauna, pool) from the with-list", () => {
    expect(
      sanitizeMarketingTitle(
        "Luxury 1-Bedroom Apartment with Sauna, Pool & In-Unit Laundry in River North Chicago",
      ),
    ).toBe("Luxury 1-Bedroom Apartment with In-Unit Laundry in River North Chicago");
  });

  it("keeps multiple unit-specific items with correct separators", () => {
    expect(
      sanitizeMarketingTitle(
        "Luxury 2-Bedroom Apartment with Pool, Balcony & In-Unit Laundry in River North Chicago",
      ),
    ).toBe("Luxury 2-Bedroom Apartment with Balcony & In-Unit Laundry in River North Chicago");
  });

  it("drops the whole with-clause when nothing unit-specific remains", () => {
    expect(sanitizeMarketingTitle("Studio Apartment with Sauna & Pool in River North")).toBe(
      "Studio Apartment in River North",
    );
  });

  it("leaves titles without property amenities untouched", () => {
    const t = "Smart Living on Display. Modern Studio Homes in River North Chicago";
    expect(sanitizeMarketingTitle(t)).toBe(t);
    const t2 = "Luxury 1-Bedroom Apartment with In-Unit Laundry in River North Chicago";
    expect(sanitizeMarketingTitle(t2)).toBe(t2);
  });

  it("passes through null", () => {
    expect(sanitizeMarketingTitle(null)).toBeNull();
  });
});

describe("listableUidFromListingUrl", () => {
  it("extracts the uid from a public listing URL", () => {
    expect(
      listableUidFromListingUrl(
        "https://highlandrealestatepartners.appfolio.com/listings/detail/b4a6281b-d2ac-4c79-ac63-ea7dc852df51",
      ),
    ).toBe("b4a6281b-d2ac-4c79-ac63-ea7dc852df51");
  });

  it("tolerates benign URL variations (query, fragment, trailing slash, uppercase hex)", () => {
    expect(
      listableUidFromListingUrl(
        "https://highlandrealestatepartners.appfolio.com/listings/detail/b4a6281b-d2ac-4c79-ac63-ea7dc852df51?source=website",
      ),
    ).toBe("b4a6281b-d2ac-4c79-ac63-ea7dc852df51");
    expect(
      listableUidFromListingUrl(
        "https://highlandrealestatepartners.appfolio.com/listings/detail/b4a6281b-d2ac-4c79-ac63-ea7dc852df51/#gallery",
      ),
    ).toBe("b4a6281b-d2ac-4c79-ac63-ea7dc852df51");
    expect(
      listableUidFromListingUrl(
        "https://highlandrealestatepartners.appfolio.com/listings/detail/B4A6281B-D2AC-4C79-AC63-EA7DC852DF51",
      ),
    ).toBe("b4a6281b-d2ac-4c79-ac63-ea7dc852df51");
  });

  it("rejects non-listing and non-https URLs", () => {
    expect(listableUidFromListingUrl("https://evil.example.com/phish")).toBeNull();
    expect(
      listableUidFromListingUrl(
        "https://notappfolio.com/listings/detail/b4a6281b-d2ac-4c79-ac63-ea7dc852df51",
      ),
    ).toBeNull();
    expect(
      listableUidFromListingUrl(
        "https://appfolio.com.evil.example/listings/detail/b4a6281b-d2ac-4c79-ac63-ea7dc852df51",
      ),
    ).toBeNull();
    expect(
      listableUidFromListingUrl("http://highlandrealestatepartners.appfolio.com/listings/detail/b4a6281b-d2ac-4c79-ac63-ea7dc852df51"),
    ).toBeNull();
  });
});
