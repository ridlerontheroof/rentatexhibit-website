import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./email", () => ({
  sendSeoWeeklyDigest: vi.fn(async () => {}),
  sendSeoDigestFailureAlert: vi.fn(async () => {}),
}));
vi.mock("./mailer", () => ({ mailerConfigured: vi.fn(() => true) }));
vi.mock("./logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

// Simulated shared `email_throttle_counters` table (same contract as the
// ga4DataCheck tests). Stores survive __resetSeoDigestForTests(), mimicking a
// restart (memory lost, DB kept).
const sharedKeys = new Set<string>();
const sharedCounters = new Map<string, number>();
let dbDown = false;
vi.mock("@workspace/db", () => ({
  db: {
    execute: vi.fn(async (query: { queryChunks?: unknown[] }) => {
      if (dbDown) throw new Error("db unreachable");
      const text = JSON.stringify(query);
      const key = text.match(/seodigest:[^"\\]+/)?.[0];
      if (typeof key !== "string") return { rows: [] };
      if (text.includes("DELETE")) {
        sharedCounters.delete(key);
        sharedKeys.delete(key);
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
  checkSeoDigestOnce,
  computeMovers,
  digestWindows,
  isoWeekKey,
  nearWinnersOf,
  parseBlogUrls,
  blogPageStats,
  readSeoDigestConfig,
  topMovers,
  GscUnauthorizedError,
  __resetSeoDigestForTests,
  type GscRow,
  type SeoDigestConfig,
  type SeoDigestData,
} from "./seoWeeklyDigest";
import { sendSeoWeeklyDigest, sendSeoDigestFailureAlert } from "./email";
import { mailerConfigured } from "./mailer";
import { logger } from "./logger";

const sendDigest = vi.mocked(sendSeoWeeklyDigest);
const sendAlert = vi.mocked(sendSeoDigestFailureAlert);
const mailerConfiguredMock = vi.mocked(mailerConfigured);
const log = logger as never;

const WEEK1_MON = Date.parse("2026-08-10T09:00:00Z");
const WEEK1_WED = Date.parse("2026-08-12T09:00:00Z");
const WEEK2_MON = Date.parse("2026-08-17T09:00:00Z");

const SA_JSON = JSON.stringify({
  client_email: "watchdog@project.iam.gserviceaccount.com",
  private_key: "-----BEGIN PRIVATE KEY-----\nfake\n-----END PRIVATE KEY-----\n",
});
const ENV_OK: NodeJS.ProcessEnv = {
  GA4_SERVICE_ACCOUNT_JSON: SA_JSON,
  GA4_PROPERTY_ID: "123456789",
};

function emptyData(now: number): SeoDigestData {
  return {
    windows: digestWindows(now),
    siteUrl: "sc-domain:rentatexhibit.com",
    risingQueries: [],
    fallingQueries: [],
    risingPages: [],
    fallingPages: [],
    nearWinners: [],
    blogPages: [],
    ga4Risers: null,
    ga4Fallers: null,
    notes: [],
    blogReminder: {
      pendingDrafts: [],
      nextUp: {
        slug: "chicago-move-in-costs-explained",
        workingTitle: "Move-In Costs in Chicago: What Renters Actually Pay",
        targetQuery: "apartment move in costs chicago",
        pillarTitle: "How to Rent an Apartment in Chicago: The Complete Guide",
      },
      queueRemaining: 9,
      publishedCount: 8,
      plannedTotal: 18,
      refreshCandidate: null,
      refreshNearWinner: null,
    },
  };
}

const okFetcher = vi.fn(async (_c: SeoDigestConfig, now: number) => emptyData(now));

beforeEach(() => {
  vi.clearAllMocks();
  __resetSeoDigestForTests();
  sharedKeys.clear();
  sharedCounters.clear();
  dbDown = false;
  mailerConfiguredMock.mockReturnValue(true);
});

describe("readSeoDigestConfig", () => {
  it("returns null without the service-account secret", () => {
    expect(readSeoDigestConfig({})).toBeNull();
  });

  it("parses config and defaults the GSC property", () => {
    const config = readSeoDigestConfig(ENV_OK)!;
    expect(config.clientEmail).toBe("watchdog@project.iam.gserviceaccount.com");
    expect(config.gscSiteUrl).toBe("sc-domain:rentatexhibit.com");
    expect(config.ga4PropertyId).toBe("123456789");
    expect(config.minImpressions).toBe(10);
  });

  it("honors GSC_SITE_URL and SEO_DIGEST_MIN_IMPRESSIONS overrides", () => {
    const config = readSeoDigestConfig({
      ...ENV_OK,
      GSC_SITE_URL: "https://www.rentatexhibit.com/",
      SEO_DIGEST_MIN_IMPRESSIONS: "25",
    })!;
    expect(config.gscSiteUrl).toBe("https://www.rentatexhibit.com/");
    expect(config.minImpressions).toBe(25);
  });

  it("tolerates a missing GA4 property (GSC-only digest)", () => {
    const config = readSeoDigestConfig({ GA4_SERVICE_ACCOUNT_JSON: SA_JSON })!;
    expect(config.ga4PropertyId).toBeNull();
  });

  it("throws on malformed JSON instead of silently disabling", () => {
    expect(() =>
      readSeoDigestConfig({ GA4_SERVICE_ACCOUNT_JSON: "not json" }),
    ).toThrow(/not valid JSON/);
  });
});

describe("date windows", () => {
  it("builds adjacent 7-day windows ending 3 days back", () => {
    const w = digestWindows(Date.parse("2026-08-13T12:00:00Z"));
    expect(w.current).toEqual({ start: "2026-08-04", end: "2026-08-10" });
    expect(w.previous).toEqual({ start: "2026-07-28", end: "2026-08-03" });
  });

  it("computes ISO week keys (year boundary included)", () => {
    expect(isoWeekKey(Date.parse("2026-08-13T12:00:00Z"))).toBe("2026-W33");
    expect(isoWeekKey(Date.parse("2026-01-01T12:00:00Z"))).toBe("2026-W01");
    // 2027-01-01 is a Friday → belongs to ISO week 2026-W53.
    expect(isoWeekKey(Date.parse("2027-01-01T12:00:00Z"))).toBe("2026-W53");
  });
});

describe("movers & near-winners", () => {
  const cur: GscRow[] = [
    { key: "studio apartments chicago", clicks: 12, impressions: 300, position: 6.1 },
    { key: "exhibit on superior reviews", clicks: 2, impressions: 80, position: 9.4 },
    { key: "streeterville apartments", clicks: 1, impressions: 40, position: 14.2 },
    { key: "convertible apartment", clicks: 0, impressions: 5, position: 12.0 },
  ];
  const prev: GscRow[] = [
    { key: "studio apartments chicago", clicks: 4, impressions: 250, position: 7.0 },
    { key: "exhibit on superior reviews", clicks: 9, impressions: 120, position: 8.8 },
    { key: "gone query", clicks: 3, impressions: 60, position: 5.0 },
  ];

  it("computes week-over-week movers including new and vanished keys", () => {
    const movers = computeMovers(cur, prev);
    const rising = topMovers(movers, "rising");
    const falling = topMovers(movers, "falling");
    expect(rising[0]!.key).toBe("studio apartments chicago");
    expect(rising[0]!.previousClicks).toBe(4);
    expect(falling.map((m) => m.key)).toEqual([
      "exhibit on superior reviews",
      "gone query",
    ]);
    // A vanished query still carries its previous stats.
    const gone = falling.find((m) => m.key === "gone query")!;
    expect(gone.currentClicks).toBe(0);
    expect(gone.previousClicks).toBe(3);
  });

  it("filters near-winners to position 8–20 with the impressions floor", () => {
    const winners = nearWinnersOf(cur, 10);
    expect(winners.map((w) => w.query)).toEqual([
      "exhibit on superior reviews",
      "streeterville apartments",
    ]);
    // Below the impressions floor → excluded even in the position band.
    expect(winners.find((w) => w.query === "convertible apartment")).toBeUndefined();
  });
});

describe("blog URLs", () => {
  it("extracts /blog/ article URLs from sitemap XML", () => {
    const xml = `<urlset>
      <url><loc>https://www.rentatexhibit.com/</loc></url>
      <url><loc>https://www.rentatexhibit.com/blog</loc></url>
      <url><loc>https://www.rentatexhibit.com/blog/streeterville-guide</loc></url>
      <url><loc>https://www.rentatexhibit.com/blog/moving-checklist/</loc></url>
    </urlset>`;
    expect(parseBlogUrls(xml)).toEqual([
      "https://www.rentatexhibit.com/blog/moving-checklist",
      "https://www.rentatexhibit.com/blog/streeterville-guide",
    ]);
  });

  it("joins blog URLs to page stats with zeros for unseen articles", () => {
    const stats = blogPageStats(
      ["https://x.com/blog/a", "https://x.com/blog/b"],
      [
        {
          key: "https://x.com/blog/a",
          currentClicks: 5,
          previousClicks: 2,
          currentImpressions: 90,
          previousImpressions: 40,
          position: 11.2,
        },
      ],
    );
    expect(stats[0]!.currentClicks).toBe(5);
    expect(stats[1]).toMatchObject({
      url: "https://x.com/blog/b",
      currentClicks: 0,
      previousClicks: 0,
      position: 0,
    });
  });
});

describe("checkSeoDigestOnce", () => {
  it("sends the digest once per ISO week, cluster-deduped", async () => {
    await checkSeoDigestOnce(log, WEEK1_MON, okFetcher, ENV_OK);
    expect(sendDigest).toHaveBeenCalledTimes(1);

    // Later run in the same week (even after a restart) does not re-send.
    __resetSeoDigestForTests();
    await checkSeoDigestOnce(log, WEEK1_WED, okFetcher, ENV_OK);
    expect(sendDigest).toHaveBeenCalledTimes(1);

    // A new ISO week sends again.
    await checkSeoDigestOnce(log, WEEK2_MON, okFetcher, ENV_OK);
    expect(sendDigest).toHaveBeenCalledTimes(2);
  });

  it("falls back to in-memory weekly dedupe when the database is down", async () => {
    dbDown = true;
    await checkSeoDigestOnce(log, WEEK1_MON, okFetcher, ENV_OK);
    await checkSeoDigestOnce(log, WEEK1_WED, okFetcher, ENV_OK);
    expect(sendDigest).toHaveBeenCalledTimes(1);
  });

  it("does nothing quietly when credentials are missing (unsupported)", async () => {
    await checkSeoDigestOnce(log, WEEK1_MON, okFetcher, {});
    expect(okFetcher).not.toHaveBeenCalled();
    expect(sendDigest).not.toHaveBeenCalled();
    expect(sendAlert).not.toHaveBeenCalled();
  });

  it("alerts (once per week) with grant instructions on GSC 403", async () => {
    const unauthorized = vi.fn(async () => {
      throw new GscUnauthorizedError(403, "User does not have sufficient permission");
    });
    await checkSeoDigestOnce(log, WEEK1_MON, unauthorized, ENV_OK);
    expect(sendDigest).not.toHaveBeenCalled();
    expect(sendAlert).toHaveBeenCalledTimes(1);
    expect(sendAlert.mock.calls[0]![0]).toMatchObject({
      serviceAccountEmail: "watchdog@project.iam.gserviceaccount.com",
      siteUrl: "sc-domain:rentatexhibit.com",
    });

    // Same week → no second alert; next week → alert again.
    await checkSeoDigestOnce(log, WEEK1_WED, unauthorized, ENV_OK);
    expect(sendAlert).toHaveBeenCalledTimes(1);
    await checkSeoDigestOnce(log, WEEK2_MON, unauthorized, ENV_OK);
    expect(sendAlert).toHaveBeenCalledTimes(2);
  });

  it("retries transient errors without alerting, then escalates after repeats", async () => {
    const flaky = vi.fn(async () => {
      throw new Error("network timeout");
    });
    for (let i = 0; i < 7; i++) {
      await checkSeoDigestOnce(log, WEEK1_MON + i * 60_000, flaky, ENV_OK);
    }
    expect(sendAlert).not.toHaveBeenCalled();
    // 8th consecutive failure escalates. (Config read inside escalation uses
    // process.env, which has no SA JSON in tests → placeholder email is fine.)
    await checkSeoDigestOnce(log, WEEK1_MON + 8 * 60_000, flaky, ENV_OK);
    expect(sendAlert).toHaveBeenCalledTimes(1);

    // A later success clears the counter and still sends the digest.
    await checkSeoDigestOnce(log, WEEK1_WED, okFetcher, ENV_OK);
    expect(sendDigest).toHaveBeenCalledTimes(1);
    expect(sharedCounters.has("seodigest:errored-runs")).toBe(false);
  });

  it("releases the weekly claim when the digest send fails, so a later run retries", async () => {
    sendDigest.mockRejectedValueOnce(new Error("SMTP down"));
    await checkSeoDigestOnce(log, WEEK1_MON, okFetcher, ENV_OK);
    expect(sendDigest).toHaveBeenCalledTimes(1);

    // Same week, later interval (even after a restart): the failed send did
    // not burn the week — the digest goes out on the retry.
    __resetSeoDigestForTests();
    await checkSeoDigestOnce(log, WEEK1_WED, okFetcher, ENV_OK);
    expect(sendDigest).toHaveBeenCalledTimes(2);

    // And once actually sent, the week is claimed for good.
    await checkSeoDigestOnce(log, WEEK1_WED + 60_000, okFetcher, ENV_OK);
    expect(sendDigest).toHaveBeenCalledTimes(2);
  });

  it("releases the weekly alert claim when the authorization alert send fails", async () => {
    const unauthorized = vi.fn(async () => {
      throw new GscUnauthorizedError(403, "no access");
    });
    sendAlert.mockRejectedValueOnce(new Error("SMTP down"));
    await checkSeoDigestOnce(log, WEEK1_MON, unauthorized, ENV_OK);
    expect(sendAlert).toHaveBeenCalledTimes(1);

    // Retry later the same week succeeds and then dedupes.
    await checkSeoDigestOnce(log, WEEK1_WED, unauthorized, ENV_OK);
    expect(sendAlert).toHaveBeenCalledTimes(2);
    await checkSeoDigestOnce(log, WEEK1_WED + 60_000, unauthorized, ENV_OK);
    expect(sendAlert).toHaveBeenCalledTimes(2);
  });

  it("releases the weekly alert claim when the repeated-error escalation send fails", async () => {
    const flaky = vi.fn(async () => {
      throw new Error("network timeout");
    });
    sendAlert.mockRejectedValueOnce(new Error("SMTP down"));
    // Drive to the 8-run escalation threshold; the 8th run's alert send fails.
    for (let i = 0; i < 8; i++) {
      await checkSeoDigestOnce(log, WEEK1_MON + i * 60_000, flaky, ENV_OK);
    }
    expect(sendAlert).toHaveBeenCalledTimes(1);

    // The failed send released the week's alert claim: the next errored run
    // (still past the threshold) retries the alert and succeeds.
    await checkSeoDigestOnce(log, WEEK1_WED, flaky, ENV_OK);
    expect(sendAlert).toHaveBeenCalledTimes(2);

    // Once delivered, the alert dedupes for the rest of the week.
    await checkSeoDigestOnce(log, WEEK1_WED + 60_000, flaky, ENV_OK);
    expect(sendAlert).toHaveBeenCalledTimes(2);
  });

  it("does not consume the weekly claim when the mailer is unconfigured", async () => {
    mailerConfiguredMock.mockReturnValue(false);
    await checkSeoDigestOnce(log, WEEK1_MON, okFetcher, ENV_OK);
    expect(sendDigest).not.toHaveBeenCalled();
  });
});
