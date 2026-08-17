import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./email", () => ({ sendStartingPriceCheckAlert: vi.fn(async () => {}) }));
vi.mock("./mailer", () => ({ mailerConfigured: vi.fn(() => true) }));
vi.mock("./logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

// Simulate the shared `email_throttle_counters` table for the daily claim.
// INSERT … ON CONFLICT DO NOTHING RETURNING: returns a row only when newly inserted.
const sharedKeys = new Set<string>();
let dbDown = false;
vi.mock("@workspace/db", () => ({
  db: {
    execute: vi.fn(async (query: { queryChunks?: unknown[] }) => {
      if (dbDown) throw new Error("db unreachable");
      const text = JSON.stringify(query);
      const key = text.match(/startingpricecheck:[^"\\]+/)?.[0];
      if (typeof key !== "string") return { rows: [] };
      if (text.includes("DELETE")) {
        sharedKeys.delete(key);
        return { rows: [] };
      }
      if (sharedKeys.has(key)) return { rows: [] };
      sharedKeys.add(key);
      return { rows: [{ count: 1 }] };
    }),
  },
}));

import {
  extractStartingRentFromText,
  extractStartingRentFromJsonLd,
  runStartingPriceChecks,
  checkStartingPriceOnce,
  __resetStartingPriceCheckForTests,
} from "./startingPriceCheck";
import { sendStartingPriceCheckAlert } from "./email";
import { mailerConfigured } from "./mailer";
import { logger } from "./logger";

const sendAlert = vi.mocked(sendStartingPriceCheckAlert);
const mailerConfiguredMock = vi.mocked(mailerConfigured);

const DAY1 = Date.parse("2026-07-26T10:00:00Z");
const DAY1_LATER = Date.parse("2026-07-26T22:00:00Z");
const DAY2 = Date.parse("2026-07-27T10:00:00Z");

const LIVE_MIN = 2350;
const STALE_PRICE = 2200;

/** Build a minimal availability API JSON body with the given rent figures. */
function availabilityBody(rents: number[]): string {
  return JSON.stringify({ units: rents.map((rent) => ({ rent })) });
}

/** Build a homepage HTML body with the starting-price sentence in visible copy. */
function homepageWithVisiblePrice(price: number): string {
  return `<html><body><p>Apartments currently start at $${price.toLocaleString("en-US")} per month for a one-bedroom residence.</p></body></html>`;
}

/** Build a homepage HTML body with the price only in FAQPage JSON-LD. */
function homepageWithJsonLdPrice(price: number): string {
  const ld = JSON.stringify({
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        acceptedAnswer: {
          "@type": "Answer",
          text: `Apartments currently start at $${price.toLocaleString("en-US")} per month for a one-bedroom residence.`,
        },
      },
    ],
  });
  return `<html><head><script type="application/ld+json">${ld}</script></head><body><p>Pricing varies.</p></body></html>`;
}

/** Homepage with no starting-price sentence (fallback wording). */
const HOMEPAGE_NO_PRICE =
  "<html><body><p>Contact us for current pricing information.</p></body></html>";

type FetchMap = Record<string, { status: number; body: string } | Error>;

function makeFetch(map: FetchMap): typeof fetch {
  return vi.fn(async (input: string | URL) => {
    const url = String(input);
    for (const [key, val] of Object.entries(map)) {
      if (url.includes(key)) {
        if (val instanceof Error) throw val;
        const { status, body } = val;
        return new Response(body, { status });
      }
    }
    return new Response("not found", { status: 404 });
  }) as unknown as typeof fetch;
}

beforeEach(() => {
  __resetStartingPriceCheckForTests();
  sharedKeys.clear();
  dbDown = false;
  sendAlert.mockClear();
  mailerConfiguredMock.mockReturnValue(true);
  vi.mocked(logger.warn).mockClear();
  vi.mocked(logger.error).mockClear();
  vi.mocked(logger.info).mockClear();
});

// ---------------------------------------------------------------------------
// extractStartingRentFromText
// ---------------------------------------------------------------------------

describe("extractStartingRentFromText", () => {
  it("extracts the rent from the canonical sentence", () => {
    expect(
      extractStartingRentFromText(
        "Apartments currently start at $2,350 per month for a one-bedroom residence.",
      ),
    ).toBe(2350);
  });

  it("handles prices without commas", () => {
    expect(
      extractStartingRentFromText("Apartments currently start at $900 per month for a studio."),
    ).toBe(900);
  });

  it("is case-insensitive", () => {
    expect(
      extractStartingRentFromText("apartments currently start at $1,800 per month for a two-bed."),
    ).toBe(1800);
  });

  it("returns null when the sentence is absent (fallback wording)", () => {
    expect(
      extractStartingRentFromText("Contact us for current pricing information."),
    ).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(extractStartingRentFromText("")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// extractStartingRentFromJsonLd
// ---------------------------------------------------------------------------

describe("extractStartingRentFromJsonLd", () => {
  it("extracts rent from a top-level FAQPage node", () => {
    const blob = {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Apartments currently start at $2,350 per month.",
          },
        },
      ],
    };
    expect(extractStartingRentFromJsonLd(blob)).toBe(2350);
  });

  it("extracts rent from a FAQPage node inside @graph", () => {
    const blob = {
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "LocalBusiness", name: "Exhibit" },
        {
          "@type": "FAQPage",
          mainEntity: [
            {
              acceptedAnswer: {
                text: "Apartments currently start at $2,500 per month for a two-bedroom.",
              },
            },
          ],
        },
      ],
    };
    expect(extractStartingRentFromJsonLd(blob)).toBe(2500);
  });

  it("returns null when no FAQPage node is present", () => {
    const blob = { "@type": "LocalBusiness", name: "Exhibit" };
    expect(extractStartingRentFromJsonLd(blob)).toBeNull();
  });

  it("returns null when FAQPage has no matching sentence", () => {
    const blob = {
      "@type": "FAQPage",
      mainEntity: [
        { acceptedAnswer: { text: "Pricing varies by floor plan." } },
      ],
    };
    expect(extractStartingRentFromJsonLd(blob)).toBeNull();
  });

  it("returns null for non-object input", () => {
    expect(extractStartingRentFromJsonLd(null)).toBeNull();
    expect(extractStartingRentFromJsonLd("string")).toBeNull();
    expect(extractStartingRentFromJsonLd(42)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// runStartingPriceChecks — fetch-error paths (must never produce failures)
// ---------------------------------------------------------------------------

describe("runStartingPriceChecks — fetch errors are not failures", () => {
  it("returns fetchError (no failures) when availability API returns 5xx", async () => {
    const fetch = makeFetch({ "/api/availability": { status: 503, body: "down" } });
    const result = await runStartingPriceChecks(logger as any, fetch);
    expect(result.failures).toHaveLength(0);
    expect(result.fetchError).toMatch(/503/);
  });

  it("returns fetchError (no failures) when availability API returns invalid JSON", async () => {
    const fetch = makeFetch({ "/api/availability": { status: 200, body: "not-json" } });
    const result = await runStartingPriceChecks(logger as any, fetch);
    expect(result.failures).toHaveLength(0);
    expect(result.fetchError).toMatch(/not valid JSON/i);
  });

  it("returns fetchError (no failures) when availability API throws a network error", async () => {
    const fetch = makeFetch({ "/api/availability": new Error("ECONNREFUSED") });
    const result = await runStartingPriceChecks(logger as any, fetch);
    expect(result.failures).toHaveLength(0);
    expect(result.fetchError).toMatch(/ECONNREFUSED/);
  });

  it("returns fetchError (no failures) when homepage returns 5xx", async () => {
    const fetch = makeFetch({
      "/api/availability": { status: 200, body: availabilityBody([LIVE_MIN]) },
      "/": { status: 502, body: "bad gateway" },
    });
    const result = await runStartingPriceChecks(logger as any, fetch);
    expect(result.failures).toHaveLength(0);
    expect(result.fetchError).toMatch(/502/);
  });

  it("returns fetchError (no failures) when homepage throws a network error", async () => {
    const fetch = makeFetch({
      "/api/availability": { status: 200, body: availabilityBody([LIVE_MIN]) },
      "/": new Error("timeout"),
    });
    const result = await runStartingPriceChecks(logger as any, fetch);
    expect(result.failures).toHaveLength(0);
    expect(result.fetchError).toMatch(/timeout/);
  });
});

// ---------------------------------------------------------------------------
// runStartingPriceChecks — no baked price (fallback wording)
// ---------------------------------------------------------------------------

describe("runStartingPriceChecks — no baked price", () => {
  it("returns noBakedPrice=true when the homepage uses fallback wording", async () => {
    const fetch = makeFetch({
      "/api/availability": { status: 200, body: availabilityBody([LIVE_MIN]) },
      "/": { status: 200, body: HOMEPAGE_NO_PRICE },
    });
    const result = await runStartingPriceChecks(logger as any, fetch);
    expect(result.failures).toHaveLength(0);
    expect(result.noBakedPrice).toBe(true);
    expect(result.fetchError).toBeUndefined();
  });

  it("returns noBakedPrice=true when feed is empty AND homepage has no price", async () => {
    const fetch = makeFetch({
      "/api/availability": { status: 200, body: JSON.stringify({ units: [] }) },
      "/": { status: 200, body: HOMEPAGE_NO_PRICE },
    });
    const result = await runStartingPriceChecks(logger as any, fetch);
    expect(result.failures).toHaveLength(0);
    expect(result.noBakedPrice).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// runStartingPriceChecks — feed unusable + baked price present
// ---------------------------------------------------------------------------

describe("runStartingPriceChecks — reachable but unusable feed with baked price", () => {
  it("fails when the feed has zero units but the homepage baked a price", async () => {
    const fetch = makeFetch({
      "/api/availability": { status: 200, body: JSON.stringify({ units: [] }) },
      "/": { status: 200, body: homepageWithVisiblePrice(LIVE_MIN) },
    });
    const result = await runStartingPriceChecks(logger as any, fetch);
    expect(result.failures.length).toBeGreaterThan(0);
    expect(result.failures[0]).toMatch(/no usable minimum rent/i);
  });

  it("fails when feed units have no usable rent but homepage baked a price", async () => {
    const fetch = makeFetch({
      "/api/availability": {
        status: 200,
        body: JSON.stringify({ units: [{ rent: null }, { rent: 0 }] }),
      },
      "/": { status: 200, body: homepageWithVisiblePrice(LIVE_MIN) },
    });
    const result = await runStartingPriceChecks(logger as any, fetch);
    expect(result.failures.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// runStartingPriceChecks — match and mismatch
// ---------------------------------------------------------------------------

describe("runStartingPriceChecks — price comparison", () => {
  it("passes when visible copy matches live minimum", async () => {
    const fetch = makeFetch({
      "/api/availability": { status: 200, body: availabilityBody([LIVE_MIN, 2800]) },
      "/": { status: 200, body: homepageWithVisiblePrice(LIVE_MIN) },
    });
    const result = await runStartingPriceChecks(logger as any, fetch);
    expect(result.failures).toHaveLength(0);
    expect(result.noBakedPrice).toBe(false);
  });

  it("fails when visible copy price differs from live minimum", async () => {
    const fetch = makeFetch({
      "/api/availability": { status: 200, body: availabilityBody([LIVE_MIN]) },
      "/": { status: 200, body: homepageWithVisiblePrice(STALE_PRICE) },
    });
    const result = await runStartingPriceChecks(logger as any, fetch);
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]).toMatch(/visible FAQ copy/i);
    expect(result.failures[0]).toMatch(`$${STALE_PRICE.toLocaleString("en-US")}`);
    expect(result.failures[0]).toMatch(`$${LIVE_MIN.toLocaleString("en-US")}`);
  });

  it("passes when FAQPage JSON-LD price matches live minimum", async () => {
    const fetch = makeFetch({
      "/api/availability": { status: 200, body: availabilityBody([LIVE_MIN]) },
      "/": { status: 200, body: homepageWithJsonLdPrice(LIVE_MIN) },
    });
    const result = await runStartingPriceChecks(logger as any, fetch);
    expect(result.failures).toHaveLength(0);
    expect(result.noBakedPrice).toBe(false);
  });

  it("fails when FAQPage JSON-LD price differs from live minimum", async () => {
    // The raw-HTML scan also finds the price sentence embedded inside the
    // JSON-LD <script> block, so both the visible-copy check and the
    // JSON-LD check fire — expect at least the JSON-LD failure.
    const fetch = makeFetch({
      "/api/availability": { status: 200, body: availabilityBody([LIVE_MIN]) },
      "/": { status: 200, body: homepageWithJsonLdPrice(STALE_PRICE) },
    });
    const result = await runStartingPriceChecks(logger as any, fetch);
    expect(result.failures.length).toBeGreaterThan(0);
    expect(result.failures.some((f) => /FAQPage JSON-LD/i.test(f))).toBe(true);
  });

  it("reports two failures when both visible copy and JSON-LD are stale", async () => {
    const html =
      homepageWithVisiblePrice(STALE_PRICE).replace("</body>", "") +
      `<script type="application/ld+json">${JSON.stringify({
        "@type": "FAQPage",
        mainEntity: [
          {
            acceptedAnswer: {
              text: `Apartments currently start at $${STALE_PRICE.toLocaleString("en-US")} per month for a one-bedroom.`,
            },
          },
        ],
      })}</script></body>`;
    const fetch = makeFetch({
      "/api/availability": { status: 200, body: availabilityBody([LIVE_MIN]) },
      "/": { status: 200, body: html },
    });
    const result = await runStartingPriceChecks(logger as any, fetch);
    expect(result.failures).toHaveLength(2);
  });

  it("uses the minimum across multiple units", async () => {
    const fetch = makeFetch({
      "/api/availability": {
        status: 200,
        body: availabilityBody([3000, LIVE_MIN, 2800]),
      },
      "/": { status: 200, body: homepageWithVisiblePrice(LIVE_MIN) },
    });
    const result = await runStartingPriceChecks(logger as any, fetch);
    expect(result.failures).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// checkStartingPriceOnce — alert lifecycle
// ---------------------------------------------------------------------------

describe("checkStartingPriceOnce — alert lifecycle", () => {
  it("sends no alert when the check passes", async () => {
    const fetch = makeFetch({
      "/api/availability": { status: 200, body: availabilityBody([LIVE_MIN]) },
      "/": { status: 200, body: homepageWithVisiblePrice(LIVE_MIN) },
    });
    await checkStartingPriceOnce(logger as any, DAY1, fetch);
    expect(sendAlert).not.toHaveBeenCalled();
  });

  it("sends no alert when the check has a transient fetch error", async () => {
    const fetch = makeFetch({
      "/api/availability": { status: 503, body: "down" },
    });
    await checkStartingPriceOnce(logger as any, DAY1, fetch);
    expect(sendAlert).not.toHaveBeenCalled();
  });

  it("sends no alert when the homepage has no baked price", async () => {
    const fetch = makeFetch({
      "/api/availability": { status: 200, body: availabilityBody([LIVE_MIN]) },
      "/": { status: 200, body: HOMEPAGE_NO_PRICE },
    });
    await checkStartingPriceOnce(logger as any, DAY1, fetch);
    expect(sendAlert).not.toHaveBeenCalled();
  });

  it("sends an alert on a definitive mismatch", async () => {
    const fetch = makeFetch({
      "/api/availability": { status: 200, body: availabilityBody([LIVE_MIN]) },
      "/": { status: 200, body: homepageWithVisiblePrice(STALE_PRICE) },
    });
    await checkStartingPriceOnce(logger as any, DAY1, fetch);
    expect(sendAlert).toHaveBeenCalledOnce();
    expect(sendAlert).toHaveBeenCalledWith(
      expect.objectContaining({ failures: expect.arrayContaining([expect.stringContaining("stale")]) }),
    );
  });

  it("sends only one alert per UTC day (daily-claim dedupe)", async () => {
    const makeBadFetch = () =>
      makeFetch({
        "/api/availability": { status: 200, body: availabilityBody([LIVE_MIN]) },
        "/": { status: 200, body: homepageWithVisiblePrice(STALE_PRICE) },
      });
    await checkStartingPriceOnce(logger as any, DAY1, makeBadFetch());
    await checkStartingPriceOnce(logger as any, DAY1_LATER, makeBadFetch());
    expect(sendAlert).toHaveBeenCalledOnce();
  });

  it("sends again on the next UTC day after a mismatch", async () => {
    const makeBadFetch = () =>
      makeFetch({
        "/api/availability": { status: 200, body: availabilityBody([LIVE_MIN]) },
        "/": { status: 200, body: homepageWithVisiblePrice(STALE_PRICE) },
      });
    await checkStartingPriceOnce(logger as any, DAY1, makeBadFetch());
    __resetStartingPriceCheckForTests();
    sharedKeys.clear(); // simulate new UTC day
    await checkStartingPriceOnce(logger as any, DAY2, makeBadFetch());
    expect(sendAlert).toHaveBeenCalledTimes(2);
  });

  it("sends no alert when the mailer is not configured", async () => {
    mailerConfiguredMock.mockReturnValue(false);
    const fetch = makeFetch({
      "/api/availability": { status: 200, body: availabilityBody([LIVE_MIN]) },
      "/": { status: 200, body: homepageWithVisiblePrice(STALE_PRICE) },
    });
    await checkStartingPriceOnce(logger as any, DAY1, fetch);
    expect(sendAlert).not.toHaveBeenCalled();
  });

  it("does not throw when the alert send fails", async () => {
    sendAlert.mockRejectedValueOnce(new Error("SMTP error"));
    const fetch = makeFetch({
      "/api/availability": { status: 200, body: availabilityBody([LIVE_MIN]) },
      "/": { status: 200, body: homepageWithVisiblePrice(STALE_PRICE) },
    });
    await expect(
      checkStartingPriceOnce(logger as any, DAY1, fetch),
    ).resolves.toBeUndefined();
  });
});
