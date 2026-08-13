import { describe, expect, it } from "vitest";
import {
  buildBlogReminder,
  readBlogQueueSnapshot,
  weakestBlogPage,
  type BlogQueueSnapshot,
} from "./blogQueue";
import type { BlogPageStats, NearWinner } from "./seoWeeklyDigest";

function page(url: string, over: Partial<BlogPageStats> = {}): BlogPageStats {
  return {
    url,
    currentClicks: 0,
    previousClicks: 0,
    currentImpressions: 0,
    previousImpressions: 0,
    position: 0,
    ...over,
  };
}

const NEAR_WINNER: NearWinner = {
  query: "river north parking",
  impressions: 40,
  clicks: 2,
  position: 11.2,
};

const QUEUED: BlogQueueSnapshot = {
  queue: [
    {
      slug: "next-guide",
      workingTitle: "Next Guide",
      targetQuery: "next guide query",
      pillarTitle: "Pillar",
    },
    {
      slug: "later-guide",
      workingTitle: "Later Guide",
      targetQuery: "later query",
      pillarTitle: "Pillar",
    },
  ],
  pendingDrafts: [],
  publishedCount: 8,
  plannedTotal: 18,
};

describe("readBlogQueueSnapshot", () => {
  it("reads the committed snapshot with a sane shape", () => {
    const snap = readBlogQueueSnapshot();
    expect(Array.isArray(snap.queue)).toBe(true);
    expect(Array.isArray(snap.pendingDrafts)).toBe(true);
    expect(snap.plannedTotal).toBeGreaterThan(0);
    for (const e of snap.queue) {
      expect(e.slug).toMatch(/^[a-z0-9-]+$/);
      expect(e.workingTitle.length).toBeGreaterThan(0);
    }
  });
});

describe("buildBlogReminder", () => {
  it("names the next unwritten guide when the queue has entries", () => {
    const r = buildBlogReminder({ blogPages: [], nearWinners: [] }, QUEUED);
    expect(r.nextUp?.slug).toBe("next-guide");
    expect(r.queueRemaining).toBe(1);
    expect(r.refreshCandidate).toBeNull();
    expect(r.refreshNearWinner).toBeNull();
  });

  it("surfaces pending drafts ahead of new drafting", () => {
    const r = buildBlogReminder(
      { blogPages: [], nearWinners: [] },
      { ...QUEUED, pendingDrafts: [{ slug: "drafted", title: "Drafted Guide" }] },
    );
    expect(r.pendingDrafts).toEqual([{ slug: "drafted", title: "Drafted Guide" }]);
    expect(r.nextUp?.slug).toBe("next-guide");
  });

  it("does NOT enter refresh mode while drafts are pending, even with an empty queue", () => {
    const r = buildBlogReminder(
      { blogPages: [page("https://x/blog/a")], nearWinners: [] },
      {
        ...QUEUED,
        queue: [],
        pendingDrafts: [{ slug: "drafted", title: "Drafted Guide" }],
      },
    );
    expect(r.nextUp).toBeNull();
    expect(r.refreshCandidate).toBeNull();
  });

  it("switches to refresh mode when the plan is exhausted: weakest blog page wins", () => {
    const blogPages = [
      page("https://x/blog/steady", { currentClicks: 5, previousClicks: 5 }),
      page("https://x/blog/slipping", { currentClicks: 1, previousClicks: 9, position: 14 }),
    ];
    const r = buildBlogReminder(
      { blogPages, nearWinners: [NEAR_WINNER] },
      { ...QUEUED, queue: [], pendingDrafts: [] },
    );
    expect(r.refreshCandidate?.url).toBe("https://x/blog/slipping");
    // Near-winner fallback only used when there are no blog stats at all.
    expect(r.refreshNearWinner).toBeNull();
  });

  it("falls back to the top near-winner when refresh mode has no blog stats", () => {
    const r = buildBlogReminder(
      { blogPages: [], nearWinners: [NEAR_WINNER] },
      { ...QUEUED, queue: [], pendingDrafts: [] },
    );
    expect(r.refreshCandidate).toBeNull();
    expect(r.refreshNearWinner?.query).toBe("river north parking");
  });
});

describe("weakestBlogPage", () => {
  it("returns null for no pages", () => {
    expect(weakestBlogPage([])).toBeNull();
  });

  it("orders by click drop, then impressions drop, then worst position", () => {
    expect(
      weakestBlogPage([
        page("a", { currentClicks: 3, previousClicks: 3, position: 8 }),
        page("b", { currentClicks: 3, previousClicks: 3, position: 19 }),
      ])?.url,
    ).toBe("b");
    expect(
      weakestBlogPage([
        page("a", { currentImpressions: 10, previousImpressions: 50 }),
        page("b", { currentImpressions: 10, previousImpressions: 10 }),
      ])?.url,
    ).toBe("a");
  });
});
