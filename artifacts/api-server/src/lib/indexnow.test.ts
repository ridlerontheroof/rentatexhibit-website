import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AVAILABILITY_URLS,
  CORE_SITEMAP_URLS,
  INDEXNOW_KEY,
  SITE_URL,
  changedUnitUrls,
  unitPageUrl,
  inventoryChanged,
  inventoryFingerprint,
  notifyAvailabilityChanged,
  pingIndexNow,
  resetIndexNowForTests,
  submitCoreUrlsOnce,
} from "./indexnow";
import type { AvailabilityPayload, AvailableUnit } from "./appfolio";

const unit = (overrides: Partial<AvailableUnit>): AvailableUnit =>
  ({
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
    ...overrides,
  }) as AvailableUnit;

const payload = (units: AvailableUnit[]): AvailabilityPayload => ({
  units,
  updatedAt: new Date().toISOString(),
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  resetIndexNowForTests();
});

describe("IndexNow key file parity", () => {
  it("matches the key file hosted by the web artifact", () => {
    // The web site must serve <SITE_URL>/<KEY>.txt containing the key, or
    // IndexNow rejects every ping. The file lives in the sibling artifact.
    const keyFile = path.resolve(
      __dirname,
      "../../../exhibit-on-superior/public",
      `${INDEXNOW_KEY}.txt`,
    );
    expect(readFileSync(keyFile, "utf8").trim()).toBe(INDEXNOW_KEY);
  });

  it("submits sane URL sets", () => {
    for (const u of [...AVAILABILITY_URLS, ...CORE_SITEMAP_URLS]) {
      expect(u.startsWith(SITE_URL)).toBe(true);
    }
    expect(CORE_SITEMAP_URLS).toContain(`${SITE_URL}/available-units`);
  });
});

describe("inventory diffing", () => {
  const a = unit({});

  it("no change -> same fingerprint, no notification", () => {
    expect(inventoryChanged(payload([a]), payload([unit({})]))).toBe(false);
  });

  it("cold start (no previous snapshot) never counts as a change", () => {
    expect(inventoryChanged(null, payload([a]))).toBe(false);
  });

  it("detects new, rented, and re-priced/re-dated units", () => {
    const prev = payload([a]);
    expect(inventoryChanged(prev, payload([a, unit({ unit: "0610" })]))).toBe(true); // new
    expect(inventoryChanged(prev, payload([]))).toBe(true); // rented
    expect(inventoryChanged(prev, payload([unit({ rent: 4300 })]))).toBe(true); // re-priced
    expect(inventoryChanged(prev, payload([unit({ availableOn: "2026-10-01" })]))).toBe(true); // re-dated
  });

  it("changedUnitUrls lists added, removed, and re-priced/re-dated unit pages", () => {
    const prev = payload([a, unit({ unit: "0610", rent: 2271 })]);
    // Added:
    expect(
      changedUnitUrls(prev, payload([a, unit({ unit: "0610", rent: 2271 }), unit({ unit: "2801" })])),
    ).toEqual([unitPageUrl("2801")]);
    // Removed (rented) — the sold-out page still needs a recrawl:
    expect(changedUnitUrls(prev, payload([a]))).toEqual([unitPageUrl("0610")]);
    // Re-priced:
    expect(changedUnitUrls(prev, payload([a, unit({ unit: "0610", rent: 2400 })]))).toEqual([
      unitPageUrl("0610"),
    ]);
    // No change / cold start:
    expect(changedUnitUrls(prev, payload([a, unit({ unit: "0610", rent: 2271 })]))).toEqual([]);
    expect(changedUnitUrls(null, payload([a]))).toEqual([]);
  });

  it("ignores unit order and non-inventory churn (photos, copy)", () => {
    const p1 = payload([a, unit({ unit: "0610", rent: 2271 })]);
    const p2 = payload([
      unit({ unit: "0610", rent: 2271, photos: ["x.jpg"], marketingTitle: "New!" }),
      unit({}),
    ]);
    expect(inventoryFingerprint(p1)).toBe(inventoryFingerprint(p2));
  });
});

describe("pingIndexNow", () => {
  it("POSTs the key, keyLocation, and URL list; true on 200/202", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 202 });
    vi.stubGlobal("fetch", fetchMock);
    await expect(pingIndexNow([`${SITE_URL}/available-units`])).resolves.toBe(true);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.key).toBe(INDEXNOW_KEY);
    expect(body.keyLocation).toBe(`${SITE_URL}/${INDEXNOW_KEY}.txt`);
    expect(body.host).toBe("www.rentatexhibit.com");
    expect(body.urlList).toEqual([`${SITE_URL}/available-units`]);
  });

  it("never throws: rejected status and network failure both return false", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403 }));
    await expect(pingIndexNow([SITE_URL])).resolves.toBe(false);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(pingIndexNow([SITE_URL])).resolves.toBe(false);
  });

  it("skips empty URL lists without calling fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(pingIndexNow([])).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("production gating", () => {
  it("availability-change and core submissions are no-ops outside production", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("NODE_ENV", "test");
    notifyAvailabilityChanged();
    submitCoreUrlsOnce();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("core sitemap submission fires exactly once in production", () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("NODE_ENV", "production");
    submitCoreUrlsOnce();
    submitCoreUrlsOnce();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.urlList).toEqual(CORE_SITEMAP_URLS);
  });

  it("availability change pings the availability URLs in production", () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("NODE_ENV", "production");
    notifyAvailabilityChanged();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.urlList).toEqual(AVAILABILITY_URLS);
  });

  it("availability change includes the affected per-unit page URLs", () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("NODE_ENV", "production");
    notifyAvailabilityChanged(undefined, [unitPageUrl("0610"), unitPageUrl("2801")]);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.urlList).toEqual([
      ...AVAILABILITY_URLS,
      unitPageUrl("0610"),
      unitPageUrl("2801"),
    ]);
  });
});
