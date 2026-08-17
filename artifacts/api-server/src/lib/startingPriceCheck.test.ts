import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./email", () => ({
  sendStartingPriceCheckAlert: vi.fn(async () => {}),
}));
vi.mock("./mailer", () => ({ mailerConfigured: vi.fn(() => true) }));
vi.mock("./logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

// Simulate the shared `email_throttle_counters` table:
//   - INSERT … ON CONFLICT DO NOTHING RETURNING (daily alert claim) returns a
//     row only when the key was newly inserted.
// The store survives __resetStartingPriceCheckForTests(), which mimics a
// server restart (in-memory state lost, database rows kept).
const sharedKeys = new Set<string>();
let dbDown = false;
vi.mock("@workspace/db", () => ({
  db: {
    execute: vi.fn(async (query: { queryChunks?: unknown[] }) => {
      if (dbDown) throw new Error("db unreachable");
      const text = JSON.stringify(query);
      const key = text.match(/startingpricecheck:[^"\\]+/)?.[0];
      if (typeof key !== "string") return { rows: [] };
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
const log = logger as never;

const DAY1 = Date.parse("2026-07-26T10:00:00Z");
const DAY1_LATER = Date.parse("2026-07-26T22:00:00Z");
const DAY2 = Date.parse("2026-07-27T10:00:00Z");

const LIVE_MIN = 2395;
const BAKED_STALE = 2195;

/** Builds a minimal homepage HTML with the sentence in the visible body. */
function homepageWithVisibleRent(rent: number): string {
  return `<html><body><p>Apartments currently start at $${rent.toLocaleString("en-US")} per month.</p></body></html>`;
}

/** Builds homepage HTML with the rent baked into a FAQPage JSON-LD block. */
function homepageWithJsonLdRent(rent: number): string {
  const ld = JSON.stringify({
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is the starting price?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `Apartments currently start at $${rent.toLocaleString("en-US")} per month.`,
        },
      },
    ],
  });
  return `<html><head><script type="application/ld+json">${ld}</script></head><body></body></html>`;
}

/** Homepage that uses fallback wording — no price baked in. */
const HOMEPAGE_NO_PRICE = `<html><body><p>Contact us to learn about current pricing.</p></body></html>`;

/** A valid /api/availability response body. */
function availabilityBody(rents: number[]): string {
  return JSON.stringify({ units: rents.map((r) => ({ rent: r })) });
}

/** fetch stub keyed by URL predicate → response body/status. */
function makeFetch(
  handler: (url: string) => { status: number; body: string } | Error,
): typeof fetch {
  return vi.fn(async (input: string | URL) => {
    const url = String(input);
    const res = handler(url);
    if (res instanceof Error) throw res;
    return { status: res.status, text: async () => res.body };
  }) as unknown as typeof fetch;
}

/** fetch that returns a healthy availability feed and a homepage with a matching price. */
function healthyFetch(rent = LIVE_MIN): typeof fetch {
  return makeFetch((url) => {
    if (url.includes("/api/availability"))
      return { status: 200, body: availabilityBody([rent, rent + 500]) };
    return { status: 200, body: homepageWithVisibleRent(rent) };
  });
}

/** fetch that returns a live min of LIVE_MIN but the homepage bakes BAKED_STALE. */
function mismatchFetch(): typeof fetch {
  return makeFetch((url) => {
    if (url.includes("/api/availability"))
      return { status: 200, body: availabilityBody([LIVE_MIN]) };
    return { status: 200, body: homepageWithVisibleRent(BAKED_STALE) };
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  sharedKeys.clear();
  dbDown = false;
  mailerConfiguredMock.mockReturnValue(true);
  __resetStartingPriceCheckForTests();
});

// ---------------------------------------------------------------------------
// extractStartingRentFromText
// ---------------------------------------------------------------------------

describe("extractStartingRentFromText", () => {
  it("extracts the rent from the canonical sentence", () => {
    expect(
      extractStartingRentFromText(
        "Apartments currently start at $2,395 per month.",
      ),
    ).toBe(2395);
  });

  it("returns null when the sentence is absent (fallback wording)", () => {
    expect(
      extractStartingRentFromText("Contact us to learn about current pricing."),
    ).toBeNull();
  });

  it("handles a price without a comma", () => {
    expect(
      extractStartingRentFromText(
        "Apartments currently start at $995 per month",
      ),
    ).toBe(995);
  });

  it("handles a price with a comma correctly (comma stripped)", () => {
    expect(
      extractStartingRentFromText(
        "Apartments currently start at $1,850 per month",
      ),
    ).toBe(1850);
  });

  it("is case-insensitive", () => {
    expect(
      extractStartingRentFromText(
        "APARTMENTS CURRENTLY START AT $2,000 PER MONTH",
      ),
    ).toBe(2000);
  });
});

// ---------------------------------------------------------------------------
// extractStartingRentFromJsonLd
// ---------------------------------------------------------------------------

describe("extractStartingRentFromJsonLd", () => {
  it("extracts rent from a direct FAQPage node", () => {
    const blob = {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Apartments currently start at $2,395 per month.",
          },
        },
      ],
    };
    expect(extractStartingRentFromJsonLd(blob)).toBe(2395);
  });

  it("extracts rent from a FAQPage node nested inside @graph", () => {
    const blob = {
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "WebSite", name: "Exhibit On Superior" },
        {
          "@type": "FAQPage",
          mainEntity: {
            "@type": "Question",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Apartments currently start at $1,950 per month.",
            },
          },
        },
      ],
    };
    expect(extractStartingRentFromJsonLd(blob)).toBe(1950);
  });

  it("returns null when no FAQPage node is present", () => {
    const blob = { "@type": "WebSite", name: "Exhibit On Superior" };
    expect(extractStartingRentFromJsonLd(blob)).toBeNull();
  });

  it("returns null when FAQPage has no matching answer text", () => {
    const blob = {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Contact leasing for pricing details.",
          },
        },
      ],
    };
    expect(extractStartingRentFromJsonLd(blob)).toBeNull();
  });

  it("returns null for non-object inputs", () => {
    expect(extractStartingRentFromJsonLd(null)).toBeNull();
    expect(extractStartingRentFromJsonLd("string")).toBeNull();
    expect(extractStartingRentFromJsonLd(42)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// runStartingPriceChecks
// ---------------------------------------------------------------------------

describe("runStartingPriceChecks", () => {
  it("returns a fetchError (not a failure) when the availability API is non-200", async () => {
    const fetchImpl = makeFetch((url) =>
      url.includes("/api/availability")
        ? { status: 503, body: "" }
        : { status: 200, body: homepageWithVisibleRent(LIVE_MIN) },
    );
    const result = await runStartingPriceChecks(log, fetchImpl);
    expect(result.failures).toEqual([]);
    expect(result.fetchError).toMatch(/HTTP 503/);
  });

  it("returns a fetchError when the availability API throws", async () => {
    const fetchImpl = makeFetch((url) =>
      url.includes("/api/availability")
        ? new Error("ECONNREFUSED")
        : { status: 200, body: "" },
    );
    const result = await runStartingPriceChecks(log, fetchImpl);
    expect(result.failures).toEqual([]);
    expect(result.fetchError).toMatch(/ECONNREFUSED/);
  });

  it("returns a fetchError when the availability response is not valid JSON", async () => {
    const fetchImpl = makeFetch((url) =>
      url.includes("/api/availability")
        ? { status: 200, body: "not json" }
        : { status: 200, body: "" },
    );
    const result = await runStartingPriceChecks(log, fetchImpl);
    expect(result.failures).toEqual([]);
    expect(result.fetchError).toMatch(/not valid JSON/);
  });

  it("returns a fetchError when the homepage is non-200", async () => {
    const fetchImpl = makeFetch((url) =>
      url.includes("/api/availability")
        ? { status: 200, body: availabilityBody([LIVE_MIN]) }
        : { status: 503, body: "" },
    );
    const result = await runStartingPriceChecks(log, fetchImpl);
    expect(result.failures).toEqual([]);
    expect(result.fetchError).toMatch(/homepage/);
    expect(result.fetchError).toMatch(/HTTP 503/);
  });

  it("fails (not fetchError) when the feed has zero units and homepage bakes a price", async () => {
    const fetchImpl = makeFetch((url) =>
      url.includes("/api/availability")
        ? { status: 200, body: JSON.stringify({ units: [] }) }
        : { status: 200, body: homepageWithVisibleRent(LIVE_MIN) },
    );
    const result = await runStartingPriceChecks(log, fetchImpl);
    expect(result.fetchError).toBeUndefined();
    expect(result.failures.length).toBe(1);
    expect(result.failures[0]).toMatch(/no usable minimum rent/);
  });

  it("passes with noBakedPrice when the feed has zero units and homepage has no price", async () => {
    const fetchImpl = makeFetch((url) =>
      url.includes("/api/availability")
        ? { status: 200, body: JSON.stringify({ units: [] }) }
        : { status: 200, body: HOMEPAGE_NO_PRICE },
    );
    const result = await runStartingPriceChecks(log, fetchImpl);
    expect(result.failures).toEqual([]);
    expect(result.noBakedPrice).toBe(true);
    expect(result.fetchError).toBeUndefined();
  });

  it("passes with noBakedPrice when the homepage uses fallback wording", async () => {
    const fetchImpl = makeFetch((url) =>
      url.includes("/api/availability")
        ? { status: 200, body: availabilityBody([LIVE_MIN]) }
        : { status: 200, body: HOMEPAGE_NO_PRICE },
    );
    const result = await runStartingPriceChecks(log, fetchImpl);
    expect(result.failures).toEqual([]);
    expect(result.noBakedPrice).toBe(true);
  });

  it("passes when baked visible price matches the live minimum", async () => {
    const result = await runStartingPriceChecks(log, healthyFetch());
    expect(result.failures).toEqual([]);
    expect(result.noBakedPrice).toBe(false);
    expect(result.fetchError).toBeUndefined();
  });

  it("fails when the visible copy bakes a stale price", async () => {
    const result = await runStartingPriceChecks(log, mismatchFetch());
    expect(result.failures.length).toBe(1);
    expect(result.failures[0]).toMatch(/visible FAQ copy/);
    expect(result.failures[0]).toMatch(new RegExp(`\\$${BAKED_STALE.toLocaleString("en-US")}`));
    expect(result.failures[0]).toMatch(new RegExp(`\\$${LIVE_MIN.toLocaleString("en-US")}`));
  });

  it("fails when the FAQPage JSON-LD bakes a stale price", async () => {
    const fetchImpl = makeFetch((url) =>
      url.includes("/api/availability")
        ? { status: 200, body: availabilityBody([LIVE_MIN]) }
        : { status: 200, body: homepageWithJsonLdRent(BAKED_STALE) },
    );
    const result = await runStartingPriceChecks(log, fetchImpl);
    // extractStartingRentFromText strips <script> blocks before matching, so
    // the rent sentence inside the JSON-LD block is not mistaken for visible
    // copy — exactly one failure (the FAQPage JSON-LD one) is reported.
    expect(result.failures.length).toBe(1);
    expect(result.failures[0]).toMatch(/FAQPage JSON-LD/);
  });

  it("emits two failures when both visible copy and JSON-LD bake stale prices", async () => {
    const ld = JSON.stringify({
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          acceptedAnswer: {
            text: `Apartments currently start at $${BAKED_STALE.toLocaleString("en-US")} per month.`,
          },
        },
      ],
    });
    const html = `<html><head><script type="application/ld+json">${ld}</script></head>` +
      `<body><p>Apartments currently start at $${BAKED_STALE.toLocaleString("en-US")} per month.</p></body></html>`;
    const fetchImpl = makeFetch((url) =>
      url.includes("/api/availability")
        ? { status: 200, body: availabilityBody([LIVE_MIN]) }
        : { status: 200, body: html },
    );
    const result = await runStartingPriceChecks(log, fetchImpl);
    expect(result.failures.length).toBe(2);
  });

  it("uses the minimum rent across all units", async () => {
    const fetchImpl = makeFetch((url) =>
      url.includes("/api/availability")
        ? { status: 200, body: availabilityBody([3000, LIVE_MIN, 4500]) }
        : { status: 200, body: homepageWithVisibleRent(LIVE_MIN) },
    );
    const result = await runStartingPriceChecks(log, fetchImpl);
    expect(result.failures).toEqual([]);
  });

  // -------------------------------------------------------------------------
  // One-side-stale isolation: both visible copy AND JSON-LD carry a price,
  // but only one of them is stale.  The failures array must name only the
  // broken side — the healthy side must not appear in the output.
  // -------------------------------------------------------------------------

  /**
   * Build a page that has both a visible FAQ sentence and a FAQPage JSON-LD
   * block, each potentially carrying a different rent figure.
   */
  function homepageWithBothRents(visibleRent: number, jsonLdRent: number): string {
    const ld = JSON.stringify({
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is the starting price?",
          acceptedAnswer: {
            "@type": "Answer",
            text: `Apartments currently start at $${jsonLdRent.toLocaleString("en-US")} per month.`,
          },
        },
      ],
    });
    return (
      `<html><head><script type="application/ld+json">${ld}</script></head>` +
      `<body><p>Apartments currently start at $${visibleRent.toLocaleString("en-US")} per month.</p></body></html>`
    );
  }

  it("names only 'FAQPage JSON-LD' when visible copy is current but JSON-LD is stale", async () => {
    // Visible copy = LIVE_MIN (correct), JSON-LD = BAKED_STALE (stale).
    const fetchImpl = makeFetch((url) =>
      url.includes("/api/availability")
        ? { status: 200, body: availabilityBody([LIVE_MIN]) }
        : { status: 200, body: homepageWithBothRents(LIVE_MIN, BAKED_STALE) },
    );
    const result = await runStartingPriceChecks(log, fetchImpl);
    expect(result.failures.length).toBe(1);
    expect(result.failures[0]).toMatch(/FAQPage JSON-LD/);
    expect(result.failures[0]).not.toMatch(/visible FAQ copy/);
  });

  it("names only 'visible FAQ copy' when JSON-LD is current but visible copy is stale", async () => {
    // JSON-LD = LIVE_MIN (correct), visible copy = BAKED_STALE (stale).
    const fetchImpl = makeFetch((url) =>
      url.includes("/api/availability")
        ? { status: 200, body: availabilityBody([LIVE_MIN]) }
        : { status: 200, body: homepageWithBothRents(BAKED_STALE, LIVE_MIN) },
    );
    const result = await runStartingPriceChecks(log, fetchImpl);
    expect(result.failures.length).toBe(1);
    expect(result.failures[0]).toMatch(/visible FAQ copy/);
    expect(result.failures[0]).not.toMatch(/FAQPage JSON-LD/);
  });
});

// ---------------------------------------------------------------------------
// checkStartingPriceOnce — alerting, deduplication, mailer guard
// ---------------------------------------------------------------------------

describe("checkStartingPriceOnce", () => {
  it("does not alert when the check passes", async () => {
    await checkStartingPriceOnce(log, DAY1, healthyFetch());
    expect(sendAlert).not.toHaveBeenCalled();
  });

  it("alerts once per UTC day on a mismatch, again the next day", async () => {
    await checkStartingPriceOnce(log, DAY1, mismatchFetch());
    expect(sendAlert).toHaveBeenCalledTimes(1);
    expect(sendAlert.mock.calls[0]![0].failures.length).toBeGreaterThan(0);

    // Second check the same UTC day — claim already consumed.
    await checkStartingPriceOnce(log, DAY1_LATER, mismatchFetch());
    expect(sendAlert).toHaveBeenCalledTimes(1);

    // First check the next UTC day — new claim.
    await checkStartingPriceOnce(log, DAY2, mismatchFetch());
    expect(sendAlert).toHaveBeenCalledTimes(2);
  });

  it("dedupes the alert across a server restart via the shared DB claim", async () => {
    await checkStartingPriceOnce(log, DAY1, mismatchFetch());
    expect(sendAlert).toHaveBeenCalledTimes(1);

    // Restart: in-memory state lost, DB claim row kept.
    __resetStartingPriceCheckForTests();

    await checkStartingPriceOnce(log, DAY1_LATER, mismatchFetch());
    expect(sendAlert).toHaveBeenCalledTimes(1); // still deduped
  });

  it("falls back to in-memory dedupe when the database is down", async () => {
    dbDown = true;
    await checkStartingPriceOnce(log, DAY1, mismatchFetch());
    expect(sendAlert).toHaveBeenCalledTimes(1);

    await checkStartingPriceOnce(log, DAY1_LATER, mismatchFetch());
    expect(sendAlert).toHaveBeenCalledTimes(1); // in-memory dedupe works
  });

  it("does not alert when the mailer is not configured", async () => {
    mailerConfiguredMock.mockReturnValue(false);
    await checkStartingPriceOnce(log, DAY1, mismatchFetch());
    expect(sendAlert).not.toHaveBeenCalled();
  });

  it("does not alert on a transient fetch error", async () => {
    const fetchImpl = makeFetch(() => new Error("ENOTFOUND"));
    await checkStartingPriceOnce(log, DAY1, fetchImpl);
    expect(sendAlert).not.toHaveBeenCalled();
  });

  it("does not alert when there is no baked price (fallback wording)", async () => {
    const fetchImpl = makeFetch((url) =>
      url.includes("/api/availability")
        ? { status: 200, body: availabilityBody([LIVE_MIN]) }
        : { status: 200, body: HOMEPAGE_NO_PRICE },
    );
    await checkStartingPriceOnce(log, DAY1, fetchImpl);
    expect(sendAlert).not.toHaveBeenCalled();
  });

  it("never throws even when the alert send fails", async () => {
    sendAlert.mockRejectedValueOnce(new Error("smtp down"));
    await expect(
      checkStartingPriceOnce(log, DAY1, mismatchFetch()),
    ).resolves.toBeUndefined();
    expect(vi.mocked(logger.error)).toHaveBeenCalled();
  });
});
