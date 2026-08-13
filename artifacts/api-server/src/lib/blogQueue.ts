import snapshot from "./blogQueueSnapshot.json";
import type { BlogPageStats, NearWinner } from "./seoWeeklyDigest";

/**
 * Blog-queue state for the weekly "next guide up" reminder in the SEO
 * digest email.
 *
 * The editorial plan (blogClusterPlan.ts) and the article list live in the
 * web artifact; importing them across the artifact boundary would couple the
 * api-server build to web source. Instead the web artifact exports a
 * committed JSON snapshot (blogQueueSnapshot.json in this directory) via
 * `pnpm --filter @workspace/exhibit-on-superior run generate:blog-queue`,
 * with a parity test on the web side that fails whenever the plan or the
 * article set drifts from the snapshot.
 */

export interface BlogQueueEntry {
  slug: string;
  workingTitle: string;
  targetQuery: string;
  pillarTitle: string;
}

export interface BlogPendingDraft {
  slug: string;
  title: string;
}

export interface BlogQueueSnapshot {
  queue: BlogQueueEntry[];
  pendingDrafts: BlogPendingDraft[];
  publishedCount: number;
  plannedTotal: number;
}

/** A published guide whose search clicks are slipping (refresh candidate). */
export interface BlogRefreshCandidate {
  url: string;
  currentClicks: number;
  previousClicks: number;
  currentImpressions: number;
  previousImpressions: number;
  position: number;
}

export interface BlogReminder {
  /** draft: true articles awaiting human review — "review & publish these first". */
  pendingDrafts: BlogPendingDraft[];
  /** Next planned-but-unwritten guide (null once the cluster plan is exhausted). */
  nextUp: BlogQueueEntry | null;
  /** Planned guides still unwritten after nextUp. */
  queueRemaining: number;
  publishedCount: number;
  plannedTotal: number;
  /**
   * Refresh mode (only when the plan is exhausted and nothing is drafted):
   * the weakest published guide from this week's digest data, or null when
   * the digest has no blog stats this week.
   */
  refreshCandidate: BlogRefreshCandidate | null;
  /** Refresh-mode fallback: the top near-winner query, when present. */
  refreshNearWinner: NearWinner | null;
}

export function readBlogQueueSnapshot(): BlogQueueSnapshot {
  return snapshot as BlogQueueSnapshot;
}

/**
 * Weakest published guide this week: biggest week-over-week click drop
 * first, then biggest impressions drop, then worst (highest) average
 * position — so with zero movement the reminder still points at the guide
 * ranked furthest from page one.
 */
export function weakestBlogPage(blogPages: BlogPageStats[]): BlogRefreshCandidate | null {
  if (blogPages.length === 0) return null;
  const sorted = [...blogPages].sort(
    (a, b) =>
      a.currentClicks - a.previousClicks - (b.currentClicks - b.previousClicks) ||
      a.currentImpressions - a.previousImpressions - (b.currentImpressions - b.previousImpressions) ||
      b.position - a.position,
  );
  const w = sorted[0]!;
  return {
    url: w.url,
    currentClicks: w.currentClicks,
    previousClicks: w.previousClicks,
    currentImpressions: w.currentImpressions,
    previousImpressions: w.previousImpressions,
    position: w.position,
  };
}

/**
 * Assemble the "next guide up" reminder from the committed queue snapshot
 * plus this week's digest data (for refresh mode).
 */
export function buildBlogReminder(
  digest: { blogPages: BlogPageStats[]; nearWinners: NearWinner[] },
  queue: BlogQueueSnapshot = readBlogQueueSnapshot(),
): BlogReminder {
  const nextUp = queue.queue[0] ?? null;
  const refreshMode = nextUp === null && queue.pendingDrafts.length === 0;
  return {
    pendingDrafts: queue.pendingDrafts,
    nextUp,
    queueRemaining: Math.max(0, queue.queue.length - 1),
    publishedCount: queue.publishedCount,
    plannedTotal: queue.plannedTotal,
    refreshCandidate: refreshMode ? weakestBlogPage(digest.blogPages) : null,
    refreshNearWinner:
      refreshMode && digest.blogPages.length === 0 ? (digest.nearWinners[0] ?? null) : null,
  };
}
