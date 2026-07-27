import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./email", () => ({ sendFloorPlanCheckAlert: vi.fn(async () => {}) }));
vi.mock("./mailer", () => ({ mailerConfigured: vi.fn(() => true) }));
vi.mock("./logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

// Simulate the shared `email_throttle_counters` table (see
// knowledgeCheck.test.ts for the pattern): the stores survive
// __resetFloorPlanCheckForTests(), which mimics a server restart
// (in-memory state lost, database rows kept).
const sharedKeys = new Set<string>();
const sharedCounters = new Map<string, number>();
let dbDown = false;
vi.mock("@workspace/db", () => ({
  db: {
    execute: vi.fn(async (query: { queryChunks?: unknown[] }) => {
      if (dbDown) throw new Error("db unreachable");
      const text = JSON.stringify(query);
      const key = text.match(/floorplancheck:[^"\\]+/)?.[0];
      if (typeof key !== "string") return { rows: [] };
      if (text.includes("DELETE")) {
        sharedCounters.delete(key);
        return { rows: [] };
      }
      if (text.includes("DO UPDATE")) {
        const next = (sharedCounters.get(key) ?? 0) + 1;
        sharedCounters.set(key, next);
        return { rows: [{ count: next }] };
      }
      if (sharedKeys.has(key)) return { rows: [] };
      sharedKeys.add(key);
      return { rows: [{ count: 1 }] };
    }),
  },
}));

import {
  checkFloorPlanPagesOnce,
  evaluateFloorPlanPage,
  parseFloorPlanSlugs,
  runFloorPlanChecks,
  sampleSlugs,
  __resetFloorPlanCheckForTests,
} from "./floorPlanCheck";
import { sendFloorPlanCheckAlert } from "./email";
import { mailerConfigured } from "./mailer";
import { logger } from "./logger";

const sendAlert = vi.mocked(sendFloorPlanCheckAlert);
const mailerConfiguredMock = vi.mocked(mailerConfigured);

const SITE = "https://www.rentatexhibit.com";
const DAY1 = Date.parse("2026-07-26T10:00:00Z");
const DAY1_LATER = Date.parse("2026-07-26T22:00:00Z");
const DAY2 = Date.parse("2026-07-27T10:00:00Z");

const SLUGS = Array.from({ length: 20 }, (_, i) => `plan-${i}`);

function sitemapXml(slugs: string[] = SLUGS): string {
  return `<?xml version="1.0"?><urlset><url><loc>${SITE}/floor-plans</loc></url>${slugs
    .map((s) => `<url><loc>${SITE}/floor-plans/${s}</loc></url>`)
    .join("")}<url><loc>${SITE}/fees</loc></url></urlset>`;
}

function goodPage(slug: string): string {
  return `<html><head><title>Plan | Exhibit On Superior</title><link rel="canonical" href="${SITE}/floor-plans/${slug}"/><script type="application/ld+json">{"@type": "FloorPlan"}</script></head><body></body></html>`;
}

const GOOD_HUB = `<html><head><title>Floor Plan Layouts, Studio to 3 Bedroom | Exhibit On Superior</title><link rel="canonical" href="${SITE}/floor-plans"/><script type="application/ld+json">{"@type": "ItemList"}</script></head><body></body></html>`;

const NOT_FOUND_STUB = `<html><head><meta name="robots" content="noindex"/><title>Not Found</title></head><body></body></html>`;

const HOMEPAGE_SHELL = `<html><head><title>Exhibit On Superior</title><link rel="canonical" href="${SITE}/"/></head><body></body></html>`;

/** fetch stub keyed by URL predicate → response body/status. */
function makeFetch(
  handler: (url: string) => { status: number; body: string } | Error,
): typeof fetch {
  return vi.fn(async (input: string | URL) => {
    const url = String(input);
    const res = handler(url);
    if (res instanceof Error) throw res;
    return {
      status: res.status,
      text: async () => res.body,
    };
  }) as unknown as typeof fetch;
}

function healthyFetch(): typeof fetch {
  return makeFetch((url) => {
    if (url.endsWith("/sitemap.xml")) return { status: 200, body: sitemapXml() };
    if (url.endsWith("/floor-plans")) return { status: 200, body: GOOD_HUB };
    if (url.includes("this-slug-does-not-exist-check"))
      return { status: 404, body: NOT_FOUND_STUB };
    const slug = url.split("/floor-plans/")[1];
    if (slug) return { status: 200, body: goodPage(slug) };
    return { status: 404, body: "" };
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  sharedKeys.clear();
  sharedCounters.clear();
  dbDown = false;
  mailerConfiguredMock.mockReturnValue(true);
  __resetFloorPlanCheckForTests();
});

describe("parseFloorPlanSlugs / sampleSlugs", () => {
  it("extracts unique floor-plan slugs from the sitemap", () => {
    const slugs = parseFloorPlanSlugs(sitemapXml(["a-b", "c-1", "a-b"]));
    expect(slugs).toEqual(["a-b", "c-1"]);
  });

  it("ignores the hub URL itself", () => {
    const slugs = parseFloorPlanSlugs(
      `<url><loc>${SITE}/floor-plans</loc></url>`,
    );
    expect(slugs).toEqual([]);
  });

  it("samples deterministically, keeping first and last", () => {
    const sample = sampleSlugs(SLUGS);
    expect(sample.length).toBeLessThanOrEqual(9);
    expect(sample[0]).toBe(SLUGS[0]);
    expect(sample).toContain(SLUGS[SLUGS.length - 1]);
    expect(sampleSlugs(SLUGS)).toEqual(sample);
  });

  it("returns all slugs when there are few", () => {
    expect(sampleSlugs(["a", "b"])).toEqual(["a", "b"]);
  });
});

describe("evaluateFloorPlanPage", () => {
  it("accepts a healthy prerendered page", () => {
    expect(evaluateFloorPlanPage("a-b", 200, goodPage("a-b"))).toBeNull();
  });

  it("flags the SPA homepage shell (wrong canonical)", () => {
    expect(evaluateFloorPlanPage("a-b", 200, HOMEPAGE_SHELL)).toMatch(
      /canonical/,
    );
  });

  it("flags non-200 status", () => {
    expect(evaluateFloorPlanPage("a-b", 404, "")).toMatch(/HTTP 404/);
  });

  it("flags missing FloorPlan JSON-LD", () => {
    const body = goodPage("a-b").replace("FloorPlan", "WebPage");
    expect(evaluateFloorPlanPage("a-b", 200, body)).toMatch(/FloorPlan/);
  });
});

describe("runFloorPlanChecks", () => {
  it("passes on a healthy production site", async () => {
    const result = await runFloorPlanChecks(logger as never, healthyFetch());
    expect(result.failures).toEqual([]);
    expect(result.checkedCount).toBeGreaterThan(8);
  });

  it("fails when the sitemap has no floor-plan URLs", async () => {
    const fetchImpl = makeFetch((url) =>
      url.endsWith("/sitemap.xml")
        ? { status: 200, body: sitemapXml([]) }
        : { status: 200, body: "" },
    );
    const result = await runFloorPlanChecks(logger as never, fetchImpl);
    expect(result.failures[0]).toMatch(/no \/floor-plans\/ URLs/);
  });

  it("treats a sitemap fetch error as transient, not a failure", async () => {
    const fetchImpl = makeFetch(() => new Error("network down"));
    const result = await runFloorPlanChecks(logger as never, fetchImpl);
    expect(result.failures).toEqual([]);
    expect(result.fetchErrors.length).toBe(1);
  });

  it("flags a broken hub page (SPA shell)", async () => {
    const fetchImpl = makeFetch((url) => {
      if (url.endsWith("/sitemap.xml")) return { status: 200, body: sitemapXml() };
      if (url.endsWith("/floor-plans")) return { status: 200, body: HOMEPAGE_SHELL };
      if (url.includes("this-slug-does-not-exist-check"))
        return { status: 404, body: NOT_FOUND_STUB };
      const slug = url.split("/floor-plans/")[1];
      return { status: 200, body: goodPage(slug ?? "") };
    });
    const result = await runFloorPlanChecks(logger as never, fetchImpl);
    expect(result.failures).toEqual([
      expect.stringMatching(/floor-plans: canonical/),
    ]);
  });

  it("flags a hub missing ItemList JSON-LD", async () => {
    const fetchImpl = makeFetch((url) => {
      if (url.endsWith("/sitemap.xml")) return { status: 200, body: sitemapXml() };
      if (url.endsWith("/floor-plans"))
        return { status: 200, body: GOOD_HUB.replace("ItemList", "WebPage") };
      if (url.includes("this-slug-does-not-exist-check"))
        return { status: 404, body: NOT_FOUND_STUB };
      const slug = url.split("/floor-plans/")[1];
      return { status: 200, body: goodPage(slug ?? "") };
    });
    const result = await runFloorPlanChecks(logger as never, fetchImpl);
    expect(result.failures).toEqual([expect.stringMatching(/ItemList/)]);
  });

  it("flags a soft-404 for unknown slugs", async () => {
    const fetchImpl = makeFetch((url) => {
      if (url.endsWith("/sitemap.xml")) return { status: 200, body: sitemapXml() };
      if (url.endsWith("/floor-plans")) return { status: 200, body: GOOD_HUB };
      if (url.includes("this-slug-does-not-exist-check"))
        return { status: 200, body: HOMEPAGE_SHELL }; // soft-404!
      const slug = url.split("/floor-plans/")[1];
      return { status: 200, body: goodPage(slug ?? "") };
    });
    const result = await runFloorPlanChecks(logger as never, fetchImpl);
    expect(result.failures).toEqual([expect.stringMatching(/soft-404/)]);
  });

  it("flags a 404 stub missing the noindex robots meta", async () => {
    const fetchImpl = makeFetch((url) => {
      if (url.endsWith("/sitemap.xml")) return { status: 200, body: sitemapXml() };
      if (url.endsWith("/floor-plans")) return { status: 200, body: GOOD_HUB };
      if (url.includes("this-slug-does-not-exist-check"))
        return { status: 404, body: "<html><head></head></html>" };
      const slug = url.split("/floor-plans/")[1];
      return { status: 200, body: goodPage(slug ?? "") };
    });
    const result = await runFloorPlanChecks(logger as never, fetchImpl);
    expect(result.failures).toEqual([expect.stringMatching(/noindex/)]);
  });
});

describe("checkFloorPlanPagesOnce alerting", () => {
  function brokenFetch(): typeof fetch {
    return makeFetch((url) => {
      if (url.endsWith("/sitemap.xml")) return { status: 200, body: sitemapXml() };
      if (url.endsWith("/floor-plans")) return { status: 200, body: GOOD_HUB };
      if (url.includes("this-slug-does-not-exist-check"))
        return { status: 404, body: NOT_FOUND_STUB };
      // Every slug page serves the SPA homepage shell.
      return { status: 200, body: HOMEPAGE_SHELL };
    });
  }

  it("does not alert when everything is healthy", async () => {
    await checkFloorPlanPagesOnce(logger as never, DAY1, healthyFetch());
    expect(sendAlert).not.toHaveBeenCalled();
  });

  it("alerts once per UTC day on failures", async () => {
    await checkFloorPlanPagesOnce(logger as never, DAY1, brokenFetch());
    expect(sendAlert).toHaveBeenCalledTimes(1);
    expect(sendAlert.mock.calls[0]![0].failures.length).toBeGreaterThan(0);

    await checkFloorPlanPagesOnce(logger as never, DAY1_LATER, brokenFetch());
    expect(sendAlert).toHaveBeenCalledTimes(1);

    await checkFloorPlanPagesOnce(logger as never, DAY2, brokenFetch());
    expect(sendAlert).toHaveBeenCalledTimes(2);
  });

  it("falls back to in-memory dedupe when the database is down", async () => {
    dbDown = true;
    await checkFloorPlanPagesOnce(logger as never, DAY1, brokenFetch());
    await checkFloorPlanPagesOnce(logger as never, DAY1_LATER, brokenFetch());
    expect(sendAlert).toHaveBeenCalledTimes(1);
  });

  it("does not alert on transient fetch errors", async () => {
    const fetchImpl = makeFetch(() => new Error("timeout"));
    await checkFloorPlanPagesOnce(logger as never, DAY1, fetchImpl);
    expect(sendAlert).not.toHaveBeenCalled();
  });

  it("escalates after 4 consecutive all-fetch-error runs, throttled once/day", async () => {
    const deadFetch = makeFetch(() => new Error("ENOTFOUND"));
    for (let i = 0; i < 3; i++) {
      await checkFloorPlanPagesOnce(logger as never, DAY1, deadFetch);
    }
    expect(sendAlert).not.toHaveBeenCalled();

    await checkFloorPlanPagesOnce(logger as never, DAY1, deadFetch);
    expect(sendAlert).toHaveBeenCalledTimes(1);
    expect(sendAlert.mock.calls[0]![0].failures[0]).toMatch(/unreachable/);

    await checkFloorPlanPagesOnce(logger as never, DAY1_LATER, deadFetch);
    expect(sendAlert).toHaveBeenCalledTimes(1);

    await checkFloorPlanPagesOnce(logger as never, DAY2, deadFetch);
    expect(sendAlert).toHaveBeenCalledTimes(2);
  });

  it("the unreachable-run counter survives a server restart mid-outage", async () => {
    const deadFetch = makeFetch(() => new Error("ENOTFOUND"));
    await checkFloorPlanPagesOnce(logger as never, DAY1, deadFetch);
    await checkFloorPlanPagesOnce(logger as never, DAY1, deadFetch);

    __resetFloorPlanCheckForTests();

    await checkFloorPlanPagesOnce(logger as never, DAY1, deadFetch);
    expect(sendAlert).not.toHaveBeenCalled();

    await checkFloorPlanPagesOnce(logger as never, DAY1, deadFetch);
    expect(sendAlert).toHaveBeenCalledTimes(1);
    expect(sendAlert.mock.calls[0]![0].failures[0]).toMatch(/unreachable/);
  });

  it("a healthy run clears the persisted counter too", async () => {
    const deadFetch = makeFetch(() => new Error("ENOTFOUND"));
    for (let i = 0; i < 3; i++) {
      await checkFloorPlanPagesOnce(logger as never, DAY1, deadFetch);
    }
    await checkFloorPlanPagesOnce(logger as never, DAY1, healthyFetch());

    __resetFloorPlanCheckForTests();
    for (let i = 0; i < 3; i++) {
      await checkFloorPlanPagesOnce(logger as never, DAY1, deadFetch);
    }
    expect(sendAlert).not.toHaveBeenCalled();
  });

  it("still escalates via the in-memory mirror when the database is down", async () => {
    dbDown = true;
    const deadFetch = makeFetch(() => new Error("ENOTFOUND"));
    for (let i = 0; i < 4; i++) {
      await checkFloorPlanPagesOnce(logger as never, DAY1, deadFetch);
    }
    expect(sendAlert).toHaveBeenCalledTimes(1);
  });

  it("a partially-reachable run (some fetches succeed) does not count as unreachable", async () => {
    const partialFetch = makeFetch((url) =>
      url.endsWith("/sitemap.xml")
        ? { status: 200, body: sitemapXml() }
        : new Error("timeout"),
    );
    for (let i = 0; i < 6; i++) {
      await checkFloorPlanPagesOnce(logger as never, DAY1, partialFetch);
    }
    expect(sendAlert).not.toHaveBeenCalled();
  });

  it("skips the send (but still claims) when the mailer is unconfigured", async () => {
    mailerConfiguredMock.mockReturnValue(false);
    await checkFloorPlanPagesOnce(logger as never, DAY1, brokenFetch());
    expect(sendAlert).not.toHaveBeenCalled();
  });

  const heartbeats = () =>
    vi
      .mocked(logger.info)
      .mock.calls.filter(
        ([, msg]) => typeof msg === "string" && msg.includes("heartbeat"),
      );

  it("emits an info heartbeat on the first check, then at most once per UTC day", async () => {
    await checkFloorPlanPagesOnce(logger as never, DAY1, healthyFetch());
    expect(heartbeats()).toHaveLength(1);
    await checkFloorPlanPagesOnce(logger as never, DAY1_LATER, healthyFetch());
    expect(heartbeats()).toHaveLength(1);
    await checkFloorPlanPagesOnce(logger as never, DAY2, healthyFetch());
    const beats = heartbeats();
    expect(beats).toHaveLength(2);
    expect(beats[1]?.[0]).toMatchObject({ checks: 2, healthy: 2 });
  });
});
