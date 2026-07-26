import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import type { Logger } from "pino";
import { logger as defaultLogger } from "./logger";
import { createDailyClaim } from "./dailyClaim";
import { createDailyHeartbeat } from "./dailyHeartbeat";
import { mailerConfigured } from "./mailer";
import { sendKnowledgeCheckAlert } from "./email";

/**
 * Watchdog for the Knowledge Center's prerendered pages.
 *
 * Every production /knowledge/<slug> page must serve its OWN prerendered
 * HTML — its own canonical link and FAQPage JSON-LD — not the SPA homepage
 * shell. A publish (or an artifact.toml rewrite edit) can silently break a
 * rewrite, after which crawlers index the homepage instead of the answer.
 * The manual smoke-check (`check:knowledge` in the web artifact) verifies
 * this, but only when someone remembers to run it.
 *
 * This module runs the same checks automatically from the api-server. A
 * publish restarts this server, so the immediate start-up check doubles as a
 * post-publish check; the interval then catches anything that breaks later.
 *
 * Slugs are discovered from the production sitemap (regenerated on every
 * build, so it can't drift from the article data) and a deterministic
 * ~10-slug sample is checked, plus the /knowledge index and llms-full.txt.
 *
 * Alerting matches the apex-watchdog conventions: at most one email per UTC
 * day, enforced cluster-wide via the shared `email_throttle_counters` table
 * (INSERT … ON CONFLICT DO NOTHING RETURNING), with a per-process in-memory
 * fallback when the database is unreachable. Individual page fetch errors
 * are logged but never alerted — a transient network blip is ambiguous,
 * while a broken rewrite always produces a definitive wrong-content 200.
 * Checks only run in production — dev/test workspaces would produce noise.
 */

const SITE = "https://www.rentatexhibit.com";
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 hours
const FETCH_TIMEOUT_MS = 20_000;
const SAMPLE_SIZE = 10;
const DAY_MS = 24 * 60 * 60 * 1000;
const USER_AGENT = "exhibit-knowledge-check/1.0";
/**
 * How many consecutive runs where EVERY fetch errored (production totally
 * unreachable) before escalating to an alert. At the 6-hour interval, 4 runs
 * ≈ a full day of unreachability — no longer plausibly a transient blip.
 */
const UNREACHABLE_ESCALATION_RUNS = 4;

/**
 * Once-per-UTC-day alert dedupe (shared implementation — see dailyClaim.ts):
 * cluster-wide database claim with a per-process in-memory fallback.
 */
const dailyClaim = createDailyClaim({
  prefix: "knowledgecheck",
  claimFailedMessage:
    "Knowledge-check alert database claim failed; falling back to in-memory dedupe",
});

/**
 * Daily liveness heartbeat (shared implementation — see dailyHeartbeat.ts),
 * mirroring the apex-redirect watchdog's. Healthy runs log at debug level,
 * which production (info-level) suppresses — so without this, a
 * silently-dead interval is indistinguishable from weeks of healthy checks.
 * Once per UTC day (after the first run of a new day) we emit a single
 * info-level line summarizing the runs since the previous heartbeat,
 * proving the watchdog is still checking.
 */
const heartbeat = createDailyHeartbeat({
  outcomes: ["healthy", "unreachable", "unhealthy"] as const,
  message: "Knowledge-page watchdog heartbeat — still checking prerendered pages",
  extraFields: { intervalHours: CHECK_INTERVAL_MS / 3_600_000 },
});

function recordAndMaybeHeartbeat(
  log: Logger,
  now: number,
  outcome: "healthy" | "unreachable" | "unhealthy",
): void {
  heartbeat.record(log, now, outcome);
}

/**
 * Consecutive runs in which every single fetch failed. This is only the
 * per-process mirror; the authoritative count is persisted in the shared
 * `email_throttle_counters` table (key below) so a server restart mid-outage
 * (e.g. a redeploy attempt) cannot reset the ~day-long escalation clock.
 */
let consecutiveUnreachableRuns = 0;

/** Shared-table key holding the persisted consecutive-unreachable-run count. */
const UNREACHABLE_COUNTER_KEY = "knowledgecheck:unreachable-runs";

/** Outcome of one full check run. Exported for tests. */
export interface KnowledgeCheckResult {
  /** Definitive content problems (wrong canonical, missing JSON-LD, …). */
  failures: string[];
  /** Ambiguous fetch/network errors — logged, never alerted. */
  fetchErrors: string[];
  /** Number of checks attempted (pages + index + llms-full.txt). */
  checkedCount: number;
}

async function fetchText(
  url: string,
  fetchImpl: typeof fetch,
): Promise<{ status: number; body: string }> {
  const res = await fetchImpl(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { "user-agent": USER_AGENT },
  });
  return { status: res.status, body: await res.text() };
}

/** Extract /knowledge/<slug> slugs from the production sitemap XML. */
export function parseKnowledgeSlugs(sitemapXml: string): string[] {
  const slugs = new Set<string>();
  const re = new RegExp(
    `${SITE.replace(/[/.]/g, "\\$&")}/knowledge/([a-z0-9-]+)`,
    "g",
  );
  for (let m; (m = re.exec(sitemapXml)); ) slugs.add(m[1]!);
  return [...slugs];
}

/** Deterministic ~SAMPLE_SIZE sample: first, last, and evenly spaced between. */
export function sampleSlugs(slugs: string[]): string[] {
  if (slugs.length <= SAMPLE_SIZE) return slugs;
  const step = Math.max(1, Math.ceil(slugs.length / (SAMPLE_SIZE - 1)));
  const picked = new Map<number, string>();
  for (let i = 0; i < slugs.length; i += step) picked.set(i, slugs[i]!);
  picked.set(slugs.length - 1, slugs[slugs.length - 1]!);
  return [...picked.values()];
}

/**
 * Decide whether one /knowledge/<slug> response is its own prerendered page.
 * Returns a problem description, or null when the page looks healthy.
 * The canonical link is the decisive signal: the SPA fallback serves the
 * homepage canonical, so a broken rewrite can never pass this check.
 */
export function evaluateKnowledgePage(
  slug: string,
  status: number,
  body: string,
): string | null {
  const url = `${SITE}/knowledge/${slug}`;
  if (status !== 200) return `${url}: HTTP ${status}`;
  const canonical = `${url}`;
  if (
    !body.includes(`rel="canonical" href="${canonical}"`) &&
    !body.includes(`href="${canonical}" rel="canonical"`)
  ) {
    return `${url}: canonical link missing or wrong — likely serving the SPA fallback (broken artifact.toml rewrite).`;
  }
  if (!/"@type":\s*"FAQPage"/.test(body)) {
    return `${url}: FAQPage JSON-LD missing.`;
  }
  if (!/<title>[^<]+<\/title>/.test(body)) {
    return `${url}: no <title> found in the prerendered HTML.`;
  }
  return null;
}

/**
 * Run every check once against production and report the outcome.
 * Exported for tests. Never throws.
 */
export async function runKnowledgeChecks(
  log: Logger = defaultLogger,
  fetchImpl: typeof fetch = fetch,
): Promise<KnowledgeCheckResult> {
  const failures: string[] = [];
  const fetchErrors: string[] = [];
  let checkedCount = 0;

  // --- Discover slugs from the sitemap ------------------------------------
  let slugs: string[];
  checkedCount++;
  try {
    const { status, body } = await fetchText(`${SITE}/sitemap.xml`, fetchImpl);
    if (status !== 200) {
      failures.push(`${SITE}/sitemap.xml: HTTP ${status}`);
      return { failures, fetchErrors, checkedCount };
    }
    slugs = parseKnowledgeSlugs(body);
    if (slugs.length === 0) {
      failures.push(
        `${SITE}/sitemap.xml: contains no /knowledge/ URLs — Knowledge Center entries dropped from the sitemap.`,
      );
      return { failures, fetchErrors, checkedCount };
    }
  } catch (err) {
    fetchErrors.push(
      `${SITE}/sitemap.xml: fetch error: ${(err as Error).message}`,
    );
    return { failures, fetchErrors, checkedCount };
  }

  // --- Sampled article pages ----------------------------------------------
  const sample = sampleSlugs(slugs);
  for (const slug of sample) {
    const url = `${SITE}/knowledge/${slug}`;
    checkedCount++;
    try {
      const { status, body } = await fetchText(url, fetchImpl);
      const problem = evaluateKnowledgePage(slug, status, body);
      if (problem) failures.push(problem);
    } catch (err) {
      fetchErrors.push(`${url}: fetch error: ${(err as Error).message}`);
    }
  }

  // --- Knowledge index -----------------------------------------------------
  checkedCount++;
  try {
    const { status, body } = await fetchText(`${SITE}/knowledge`, fetchImpl);
    if (status !== 200) failures.push(`${SITE}/knowledge: HTTP ${status}`);
    else if (!/<title>[^<]*Knowledge/i.test(body)) {
      failures.push(
        `${SITE}/knowledge: index page <title> does not mention Knowledge — SPA fallback?`,
      );
    }
  } catch (err) {
    fetchErrors.push(
      `${SITE}/knowledge: fetch error: ${(err as Error).message}`,
    );
  }

  // --- llms-full.txt ---------------------------------------------------------
  checkedCount++;
  try {
    const { status, body } = await fetchText(`${SITE}/llms-full.txt`, fetchImpl);
    if (status !== 200) failures.push(`${SITE}/llms-full.txt: HTTP ${status}`);
    else if (
      body.length < 1000 ||
      !body.includes(`/knowledge/${sample[0]!}`)
    ) {
      failures.push(
        `${SITE}/llms-full.txt: reachable but missing knowledge content (no entry for a sampled article).`,
      );
    }
  } catch (err) {
    fetchErrors.push(
      `${SITE}/llms-full.txt: fetch error: ${(err as Error).message}`,
    );
  }

  if (fetchErrors.length > 0) {
    log.warn(
      { fetchErrors },
      "Knowledge-page check had transient fetch errors (not alert-worthy)",
    );
  }
  return { failures, fetchErrors, checkedCount };
}

/**
 * Persist one more consecutive-unreachable run in the shared table and
 * return the new total. Throws when the database is unreachable — the
 * caller falls back to the per-process mirror.
 */
async function bumpUnreachableShared(now: number): Promise<number> {
  const expiresAt = new Date(now + 2 * DAY_MS);
  const result = await db.execute(sql`
    INSERT INTO email_throttle_counters (key, count, expires_at)
    VALUES (${UNREACHABLE_COUNTER_KEY}, 1, ${expiresAt})
    ON CONFLICT (key) DO UPDATE
      SET count = email_throttle_counters.count + 1,
          expires_at = ${expiresAt}
    RETURNING count
  `);
  const count = Number(result.rows[0]?.count);
  return Number.isFinite(count) ? count : 0;
}

/** Clear the persisted unreachable-run counter after a reachable run. */
async function resetUnreachableShared(): Promise<void> {
  await db.execute(sql`
    DELETE FROM email_throttle_counters
    WHERE key = ${UNREACHABLE_COUNTER_KEY}
  `);
}

/**
 * Run one full knowledge check and alert (once/day) on definitive failures.
 * Exported for tests. Best-effort: never throws, so a network or mail
 * outage can't crash the interval.
 */
export async function checkKnowledgePagesOnce(
  log: Logger = defaultLogger,
  now: number = Date.now(),
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const result = await runKnowledgeChecks(log, fetchImpl);

  // Track total-unreachability: a run where EVERY attempted fetch errored.
  // A single such run is treated as transient, but many in a row means
  // production (or DNS/CDN) has been down for ~a day and must escalate.
  const allFetchesErrored =
    result.fetchErrors.length > 0 &&
    result.fetchErrors.length === result.checkedCount;
  if (allFetchesErrored) {
    consecutiveUnreachableRuns += 1;
    try {
      // The persisted count survives restarts; the in-memory mirror only
      // matters when the database itself is unreachable, so take whichever
      // clock has been running longer.
      const shared = await bumpUnreachableShared(now);
      consecutiveUnreachableRuns = Math.max(
        consecutiveUnreachableRuns,
        shared,
      );
    } catch (err) {
      log.error(
        { err },
        "Failed to persist unreachable-run counter; using in-memory count",
      );
    }
  } else {
    consecutiveUnreachableRuns = 0;
    try {
      await resetUnreachableShared();
    } catch (err) {
      log.error(
        { err },
        "Failed to clear persisted unreachable-run counter after a reachable run",
      );
    }
  }

  let failures = result.failures;
  if (
    failures.length === 0 &&
    allFetchesErrored &&
    consecutiveUnreachableRuns >= UNREACHABLE_ESCALATION_RUNS
  ) {
    failures = [
      `Production has been unreachable for ${consecutiveUnreachableRuns} consecutive knowledge-page check runs (every fetch failed each time) — likely a DNS, CDN, or hosting outage. Latest errors: ${result.fetchErrors.join("; ")}`,
    ];
  }

  recordAndMaybeHeartbeat(
    log,
    now,
    failures.length > 0
      ? "unhealthy"
      : allFetchesErrored
        ? "unreachable"
        : "healthy",
  );

  if (failures.length === 0) {
    log.debug(
      { checkedCount: result.checkedCount },
      "Knowledge-page check passed",
    );
    return;
  }

  log.error(
    { failures, checkedCount: result.checkedCount },
    "Knowledge Center pages are serving the wrong content — crawlers see the homepage instead of the answers",
  );

  try {
    if (!(await dailyClaim.claim(log, now))) return;
    if (!mailerConfigured()) return;
    await sendKnowledgeCheckAlert({
      failures,
      checkedCount: result.checkedCount,
    });
  } catch (err) {
    log.error({ err }, "Failed to send knowledge-check failure alert");
  }
}

/**
 * Start the periodic knowledge-page watchdog. Production only — dev and
 * test runs would hit the live domain and generate meaningless alerts.
 * Kicks off an immediate check (a publish restarts the server, so this is
 * the post-publish check), then repeats every CHECK_INTERVAL_MS.
 */
export function startKnowledgePageCheck(log: Logger = defaultLogger): void {
  if (process.env.NODE_ENV !== "production") return;
  void checkKnowledgePagesOnce(log);
  const timer = setInterval(
    () => void checkKnowledgePagesOnce(log),
    CHECK_INTERVAL_MS,
  );
  timer.unref?.();
  log.info(
    { site: SITE, intervalHours: CHECK_INTERVAL_MS / 3_600_000 },
    "Knowledge-page watchdog started",
  );
}

/** Test-only: clear the per-process fallback dedupe state. */
export function __resetKnowledgeCheckForTests(): void {
  dailyClaim.reset();
  consecutiveUnreachableRuns = 0;
  heartbeat.reset();
}
