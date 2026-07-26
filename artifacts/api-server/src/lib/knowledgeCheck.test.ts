import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./email", () => ({ sendKnowledgeCheckAlert: vi.fn(async () => {}) }));
vi.mock("./mailer", () => ({ mailerConfigured: vi.fn(() => true) }));
vi.mock("./logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

// Simulate the shared `email_throttle_counters` table:
//   - INSERT … ON CONFLICT DO NOTHING RETURNING (daily alert claim) returns a
//     row only when the key was newly inserted;
//   - INSERT … ON CONFLICT DO UPDATE … RETURNING (unreachable-run counter)
//     increments and returns the new count;
//   - DELETE (counter reset) removes the row.
// The stores survive __resetKnowledgeCheckForTests(), which mimics a server
// restart (in-memory state lost, database rows kept).
const sharedKeys = new Set<string>();
const sharedCounters = new Map<string, number>();
let dbDown = false;
vi.mock("@workspace/db", () => ({
  db: {
    execute: vi.fn(async (query: { queryChunks?: unknown[] }) => {
      if (dbDown) throw new Error("db unreachable");
      const text = JSON.stringify(query);
      const key = text.match(/knowledgecheck:[^"\\]+/)?.[0];
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
  checkKnowledgePagesOnce,
  evaluateKnowledgePage,
  parseKnowledgeSlugs,
  runKnowledgeChecks,
  sampleSlugs,
  __resetKnowledgeCheckForTests,
} from "./knowledgeCheck";
import { sendKnowledgeCheckAlert } from "./email";
import { mailerConfigured } from "./mailer";
import { logger } from "./logger";

const sendAlert = vi.mocked(sendKnowledgeCheckAlert);
const mailerConfiguredMock = vi.mocked(mailerConfigured);

const SITE = "https://www.rentatexhibit.com";
const DAY1 = Date.parse("2026-07-26T10:00:00Z");
const DAY1_LATER = Date.parse("2026-07-26T22:00:00Z");
const DAY2 = Date.parse("2026-07-27T10:00:00Z");

const SLUGS = Array.from({ length: 25 }, (_, i) => `question-${i}`);

function sitemapXml(slugs: string[] = SLUGS): string {
  return `<?xml version="1.0"?><urlset>${slugs
    .map((s) => `<url><loc>${SITE}/knowledge/${s}</loc></url>`)
    .join("")}<url><loc>${SITE}/fees</loc></url></urlset>`;
}

function goodPage(slug: string): string {
  return `<html><head><title>Q? | Exhibit On Superior Chicago</title><link rel="canonical" href="${SITE}/knowledge/${slug}"/><script type="application/ld+json">{"@type": "FAQPage"}</script></head><body></body></html>`;
}

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
    if (url.endsWith("/llms-full.txt"))
      return {
        status: 200,
        body: `${"x".repeat(1200)}\n${SITE}/knowledge/${SLUGS[0]}`,
      };
    if (url.endsWith("/knowledge"))
      return { status: 200, body: "<title>Knowledge Center</title>" };
    const slug = url.split("/knowledge/")[1];
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
  __resetKnowledgeCheckForTests();
});

describe("parseKnowledgeSlugs / sampleSlugs", () => {
  it("extracts unique knowledge slugs from the sitemap", () => {
    const slugs = parseKnowledgeSlugs(sitemapXml(["a-b", "c-1", "a-b"]));
    expect(slugs).toEqual(["a-b", "c-1"]);
  });

  it("samples deterministically, keeping first and last", () => {
    const sample = sampleSlugs(SLUGS);
    expect(sample.length).toBeLessThanOrEqual(11);
    expect(sample[0]).toBe(SLUGS[0]);
    expect(sample).toContain(SLUGS[SLUGS.length - 1]);
    expect(sampleSlugs(SLUGS)).toEqual(sample);
  });

  it("returns all slugs when there are few", () => {
    expect(sampleSlugs(["a", "b"])).toEqual(["a", "b"]);
  });
});

describe("evaluateKnowledgePage", () => {
  it("accepts a healthy prerendered page", () => {
    expect(evaluateKnowledgePage("a-b", 200, goodPage("a-b"))).toBeNull();
  });

  it("flags the SPA homepage shell (wrong canonical)", () => {
    expect(evaluateKnowledgePage("a-b", 200, HOMEPAGE_SHELL)).toMatch(
      /canonical/,
    );
  });

  it("flags non-200 status", () => {
    expect(evaluateKnowledgePage("a-b", 404, "")).toMatch(/HTTP 404/);
  });

  it("flags missing FAQPage JSON-LD", () => {
    const body = goodPage("a-b").replace("FAQPage", "WebPage");
    expect(evaluateKnowledgePage("a-b", 200, body)).toMatch(/FAQPage/);
  });
});

describe("runKnowledgeChecks", () => {
  it("passes on a healthy production site", async () => {
    const result = await runKnowledgeChecks(logger as never, healthyFetch());
    expect(result.failures).toEqual([]);
    expect(result.checkedCount).toBeGreaterThan(10);
  });

  it("fails when the sitemap has no knowledge URLs", async () => {
    const fetchImpl = makeFetch((url) =>
      url.endsWith("/sitemap.xml")
        ? { status: 200, body: sitemapXml([]) }
        : { status: 200, body: "" },
    );
    const result = await runKnowledgeChecks(logger as never, fetchImpl);
    expect(result.failures[0]).toMatch(/no \/knowledge\/ URLs/);
  });

  it("treats a sitemap fetch error as transient, not a failure", async () => {
    const fetchImpl = makeFetch(() => new Error("network down"));
    const result = await runKnowledgeChecks(logger as never, fetchImpl);
    expect(result.failures).toEqual([]);
    expect(result.fetchErrors.length).toBe(1);
  });

  it("flags a damaged llms-full.txt", async () => {
    const base = healthyFetch();
    const fetchImpl = makeFetch((url) => {
      if (url.endsWith("/llms-full.txt")) return { status: 200, body: "tiny" };
      if (url.endsWith("/sitemap.xml")) return { status: 200, body: sitemapXml() };
      if (url.endsWith("/knowledge"))
        return { status: 200, body: "<title>Knowledge Center</title>" };
      const slug = url.split("/knowledge/")[1];
      return { status: 200, body: goodPage(slug ?? "") };
    });
    void base;
    const result = await runKnowledgeChecks(logger as never, fetchImpl);
    expect(result.failures).toEqual([
      expect.stringMatching(/llms-full\.txt/),
    ]);
  });
});

describe("checkKnowledgePagesOnce alerting", () => {
  function brokenFetch(): typeof fetch {
    return makeFetch((url) => {
      if (url.endsWith("/sitemap.xml")) return { status: 200, body: sitemapXml() };
      if (url.endsWith("/llms-full.txt"))
        return {
          status: 200,
          body: `${"x".repeat(1200)}\n${SITE}/knowledge/${SLUGS[0]}`,
        };
      if (url.endsWith("/knowledge"))
        return { status: 200, body: "<title>Knowledge Center</title>" };
      // Every article page serves the SPA homepage shell.
      return { status: 200, body: HOMEPAGE_SHELL };
    });
  }

  it("does not alert when everything is healthy", async () => {
    await checkKnowledgePagesOnce(logger as never, DAY1, healthyFetch());
    expect(sendAlert).not.toHaveBeenCalled();
  });

  it("alerts once per UTC day on failures", async () => {
    await checkKnowledgePagesOnce(logger as never, DAY1, brokenFetch());
    expect(sendAlert).toHaveBeenCalledTimes(1);
    expect(sendAlert.mock.calls[0]![0].failures.length).toBeGreaterThan(0);

    await checkKnowledgePagesOnce(logger as never, DAY1_LATER, brokenFetch());
    expect(sendAlert).toHaveBeenCalledTimes(1);

    await checkKnowledgePagesOnce(logger as never, DAY2, brokenFetch());
    expect(sendAlert).toHaveBeenCalledTimes(2);
  });

  it("falls back to in-memory dedupe when the database is down", async () => {
    dbDown = true;
    await checkKnowledgePagesOnce(logger as never, DAY1, brokenFetch());
    await checkKnowledgePagesOnce(logger as never, DAY1_LATER, brokenFetch());
    expect(sendAlert).toHaveBeenCalledTimes(1);
  });

  it("does not alert on transient fetch errors", async () => {
    const fetchImpl = makeFetch(() => new Error("timeout"));
    await checkKnowledgePagesOnce(logger as never, DAY1, fetchImpl);
    expect(sendAlert).not.toHaveBeenCalled();
  });

  it("escalates after 4 consecutive all-fetch-error runs, throttled once/day", async () => {
    const deadFetch = makeFetch(() => new Error("ENOTFOUND"));
    for (let i = 0; i < 3; i++) {
      await checkKnowledgePagesOnce(logger as never, DAY1, deadFetch);
    }
    expect(sendAlert).not.toHaveBeenCalled();

    await checkKnowledgePagesOnce(logger as never, DAY1, deadFetch);
    expect(sendAlert).toHaveBeenCalledTimes(1);
    expect(sendAlert.mock.calls[0]![0].failures[0]).toMatch(/unreachable/);

    // Still down later the same day — throttle blocks a second email.
    await checkKnowledgePagesOnce(logger as never, DAY1_LATER, deadFetch);
    expect(sendAlert).toHaveBeenCalledTimes(1);

    // Still down the next day — one more email.
    await checkKnowledgePagesOnce(logger as never, DAY2, deadFetch);
    expect(sendAlert).toHaveBeenCalledTimes(2);
  });

  it("the unreachable-run counter survives a server restart mid-outage", async () => {
    const deadFetch = makeFetch(() => new Error("ENOTFOUND"));
    await checkKnowledgePagesOnce(logger as never, DAY1, deadFetch);
    await checkKnowledgePagesOnce(logger as never, DAY1, deadFetch);

    // Simulate an api-server restart: in-memory state is wiped, but the
    // persisted counter row in email_throttle_counters remains.
    __resetKnowledgeCheckForTests();

    await checkKnowledgePagesOnce(logger as never, DAY1, deadFetch);
    expect(sendAlert).not.toHaveBeenCalled();

    // Fourth consecutive run overall — escalates despite the restart.
    await checkKnowledgePagesOnce(logger as never, DAY1, deadFetch);
    expect(sendAlert).toHaveBeenCalledTimes(1);
    expect(sendAlert.mock.calls[0]![0].failures[0]).toMatch(/unreachable/);
  });

  it("escalates even across multiple restarts, one run per boot", async () => {
    const deadFetch = makeFetch(() => new Error("ENOTFOUND"));
    for (let i = 0; i < 3; i++) {
      await checkKnowledgePagesOnce(logger as never, DAY1, deadFetch);
      __resetKnowledgeCheckForTests();
    }
    expect(sendAlert).not.toHaveBeenCalled();
    await checkKnowledgePagesOnce(logger as never, DAY1, deadFetch);
    expect(sendAlert).toHaveBeenCalledTimes(1);
  });

  it("a healthy run clears the persisted counter too", async () => {
    const deadFetch = makeFetch(() => new Error("ENOTFOUND"));
    for (let i = 0; i < 3; i++) {
      await checkKnowledgePagesOnce(logger as never, DAY1, deadFetch);
    }
    await checkKnowledgePagesOnce(logger as never, DAY1, healthyFetch());

    // Restart, then three more dead runs — persisted count must have been
    // cleared, so the threshold is not reached.
    __resetKnowledgeCheckForTests();
    for (let i = 0; i < 3; i++) {
      await checkKnowledgePagesOnce(logger as never, DAY1, deadFetch);
    }
    expect(sendAlert).not.toHaveBeenCalled();
  });

  it("still escalates via the in-memory mirror when the database is down", async () => {
    dbDown = true;
    const deadFetch = makeFetch(() => new Error("ENOTFOUND"));
    for (let i = 0; i < 4; i++) {
      await checkKnowledgePagesOnce(logger as never, DAY1, deadFetch);
    }
    expect(sendAlert).toHaveBeenCalledTimes(1);
  });

  it("a successful run resets the unreachable-run counter", async () => {
    const deadFetch = makeFetch(() => new Error("ENOTFOUND"));
    for (let i = 0; i < 3; i++) {
      await checkKnowledgePagesOnce(logger as never, DAY1, deadFetch);
    }
    await checkKnowledgePagesOnce(logger as never, DAY1, healthyFetch());
    // Three more failures after the reset — still below the threshold.
    for (let i = 0; i < 3; i++) {
      await checkKnowledgePagesOnce(logger as never, DAY1, deadFetch);
    }
    expect(sendAlert).not.toHaveBeenCalled();
  });

  it("a partially-reachable run (some fetches succeed) does not count as unreachable", async () => {
    // Sitemap loads, but every page fetch errors — not total unreachability.
    const partialFetch = makeFetch((url) =>
      url.endsWith("/sitemap.xml")
        ? { status: 200, body: sitemapXml() }
        : new Error("timeout"),
    );
    for (let i = 0; i < 6; i++) {
      await checkKnowledgePagesOnce(logger as never, DAY1, partialFetch);
    }
    expect(sendAlert).not.toHaveBeenCalled();
  });

  it("skips the send (but still claims) when the mailer is unconfigured", async () => {
    mailerConfiguredMock.mockReturnValue(false);
    await checkKnowledgePagesOnce(logger as never, DAY1, brokenFetch());
    expect(sendAlert).not.toHaveBeenCalled();
  });

  const heartbeats = () =>
    vi
      .mocked(logger.info)
      .mock.calls.filter(
        ([, msg]) => typeof msg === "string" && msg.includes("heartbeat"),
      );

  it("emits an info heartbeat on the first check, then at most once per UTC day", async () => {
    await checkKnowledgePagesOnce(logger as never, DAY1, healthyFetch());
    expect(heartbeats()).toHaveLength(1);
    // Later checks the same UTC day stay silent.
    await checkKnowledgePagesOnce(logger as never, DAY1_LATER, healthyFetch());
    expect(heartbeats()).toHaveLength(1);
    // The first check of the next UTC day emits the summary of the day's checks.
    await checkKnowledgePagesOnce(logger as never, DAY2, healthyFetch());
    const beats = heartbeats();
    expect(beats).toHaveLength(2);
    expect(beats[1]?.[0]).toMatchObject({ checks: 2, healthy: 2 });
  });

  it("counts unreachable and unhealthy runs in the heartbeat", async () => {
    const deadFetch = makeFetch(() => new Error("network down"));
    await checkKnowledgePagesOnce(logger as never, DAY1, deadFetch); // first check -> heartbeat
    await checkKnowledgePagesOnce(logger as never, DAY1_LATER, brokenFetch());
    await checkKnowledgePagesOnce(logger as never, DAY2, healthyFetch());
    const beats = heartbeats();
    expect(beats).toHaveLength(2);
    expect(beats[1]?.[0]).toMatchObject({
      checks: 2,
      healthy: 1,
      unreachable: 0,
      unhealthy: 1,
    });
  });
});
