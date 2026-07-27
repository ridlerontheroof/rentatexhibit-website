import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import type { Logger } from "pino";
import { logger as defaultLogger } from "./logger";
import { createDailyClaim } from "./dailyClaim";
import { createDailyHeartbeat } from "./dailyHeartbeat";
import { mailerConfigured } from "./mailer";
import { sendFloorPlanCheckAlert } from "./email";

/**
 * Watchdog for the floor-plan landing pages (always-on twin of the web
 * artifact's `scripts/check-floor-plan-pages.mjs`, which only runs while
 * the workspace `postpublish` watcher is open).
 *
 * The /floor-plans hub and every /floor-plans/<slug> page must serve their
 * OWN prerendered HTML — their own canonical link and FloorPlan/ItemList
 * JSON-LD — not the SPA homepage shell. A publish (or an artifact.toml
 * rewrite edit) can silently drop a slug's rewrite pair, after which
 * crawlers index a blank shell. Unknown slugs must serve the noindex
 * not-found stub with a REAL 404 status (soft-404 guard).
 *
 * This is an HTTP-only port rather than a child-process spawn of the
 * workspace script: that script derives slugs by tsImport-ing the web
 * artifact's TS source via tsx, which the deployed api-server bundle does
 * not ship. Instead, slugs are discovered from the production sitemap
 * (regenerated on every build from the same floorPlanPages.ts source of
 * truth, so the check cannot drift from the published set) — exactly the
 * knowledgeCheck.ts pattern.
 *
 * Cadence and alerting match the existing twins: immediate run on startup
 * (a publish restarts this server, so that doubles as the post-publish
 * check), then every 6 hours; failures email the ops inbox at most once
 * per UTC day via the shared cluster-wide daily claim, with an in-memory
 * fallback when the database is unreachable. Ambiguous fetch errors are
 * logged, never alerted — except total unreachability sustained for ~a
 * day, which escalates. Production only.
 */

const SITE = "https://www.rentatexhibit.com";
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 hours
const FETCH_TIMEOUT_MS = 20_000;
const SAMPLE_SIZE = 8;
const DAY_MS = 24 * 60 * 60 * 1000;
const USER_AGENT = "exhibit-floor-plan-check/1.0";
/**
 * Consecutive all-fetches-errored runs (production totally unreachable)
 * before escalating to an alert — ~a day at the 6-hour cadence.
 */
const UNREACHABLE_ESCALATION_RUNS = 4;

const dailyClaim = createDailyClaim({
  prefix: "floorplancheck",
  claimFailedMessage:
    "Floor-plan-check alert database claim failed; falling back to in-memory dedupe",
});

const heartbeat = createDailyHeartbeat({
  outcomes: ["healthy", "unreachable", "unhealthy"] as const,
  message:
    "Floor-plan-page watchdog heartbeat — still checking prerendered pages",
  extraFields: { intervalHours: CHECK_INTERVAL_MS / 3_600_000 },
});

/** Consecutive totally-unreachable runs — per-process mirror of the shared counter. */
let consecutiveUnreachableRuns = 0;
/** Shared-table key holding the persisted consecutive-unreachable-run count. */
const UNREACHABLE_COUNTER_KEY = "floorplancheck:unreachable-runs";

/** Outcome of one full check run. Exported for tests. */
export interface FloorPlanCheckResult {
  /** Definitive content problems (wrong canonical, missing JSON-LD, soft-404, …). */
  failures: string[];
  /** Ambiguous fetch/network errors — logged, never alerted directly. */
  fetchErrors: string[];
  /** Number of checks attempted (hub + pages + 404 stub). */
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

/** Extract /floor-plans/<slug> slugs from the production sitemap XML. */
export function parseFloorPlanSlugs(sitemapXml: string): string[] {
  const slugs = new Set<string>();
  const re = new RegExp(
    `${SITE.replace(/[/.]/g, "\\$&")}/floor-plans/([a-z0-9-]+)`,
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
 * Decide whether one /floor-plans/<slug> response is its own prerendered
 * page. Returns a problem description, or null when healthy. The canonical
 * link is the decisive signal: the SPA fallback serves the homepage
 * canonical, so a broken rewrite can never pass this check.
 */
export function evaluateFloorPlanPage(
  slug: string,
  status: number,
  body: string,
): string | null {
  const url = `${SITE}/floor-plans/${slug}`;
  if (status !== 200) return `${url}: HTTP ${status}`;
  const canonical = url;
  if (
    !body.includes(`rel="canonical" href="${canonical}"`) &&
    !body.includes(`href="${canonical}" rel="canonical"`)
  ) {
    return `${url}: canonical link missing or wrong — likely serving the SPA fallback (broken artifact.toml rewrite).`;
  }
  if (!/"@type":\s*"FloorPlan"/.test(body)) {
    return `${url}: FloorPlan JSON-LD missing.`;
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
export async function runFloorPlanChecks(
  log: Logger = defaultLogger,
  fetchImpl: typeof fetch = fetch,
): Promise<FloorPlanCheckResult> {
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
    slugs = parseFloorPlanSlugs(body);
    if (slugs.length === 0) {
      failures.push(
        `${SITE}/sitemap.xml: contains no /floor-plans/ URLs — floor-plan pages dropped from the sitemap.`,
      );
      return { failures, fetchErrors, checkedCount };
    }
  } catch (err) {
    fetchErrors.push(
      `${SITE}/sitemap.xml: fetch error: ${(err as Error).message}`,
    );
    return { failures, fetchErrors, checkedCount };
  }

  // --- Hub page (/floor-plans) ---------------------------------------------
  checkedCount++;
  try {
    const { status, body } = await fetchText(`${SITE}/floor-plans`, fetchImpl);
    if (status !== 200) failures.push(`${SITE}/floor-plans: HTTP ${status}`);
    else {
      const canonical = `${SITE}/floor-plans`;
      if (
        !body.includes(`rel="canonical" href="${canonical}"`) &&
        !body.includes(`href="${canonical}" rel="canonical"`)
      ) {
        failures.push(
          `${SITE}/floor-plans: canonical link missing or wrong — likely serving the SPA fallback (broken artifact.toml rewrite).`,
        );
      } else if (!/"@type":\s*"ItemList"/.test(body)) {
        failures.push(`${SITE}/floor-plans: ItemList JSON-LD missing.`);
      }
    }
  } catch (err) {
    fetchErrors.push(
      `${SITE}/floor-plans: fetch error: ${(err as Error).message}`,
    );
  }

  // --- Sampled slug pages ----------------------------------------------------
  const sample = sampleSlugs(slugs);
  for (const slug of sample) {
    const url = `${SITE}/floor-plans/${slug}`;
    checkedCount++;
    try {
      const { status, body } = await fetchText(url, fetchImpl);
      const problem = evaluateFloorPlanPage(slug, status, body);
      if (problem) failures.push(problem);
    } catch (err) {
      fetchErrors.push(`${url}: fetch error: ${(err as Error).message}`);
    }
  }

  // --- Unknown slug → not-found stub with a REAL 404 (soft-404 guard) --------
  checkedCount++;
  const notFoundUrl = `${SITE}/floor-plans/this-slug-does-not-exist-check`;
  try {
    const { status, body } = await fetchText(notFoundUrl, fetchImpl);
    if (status !== 404) {
      failures.push(
        `${notFoundUrl}: expected HTTP 404, got ${status} — unknown floor-plan slugs must not soft-404 (production server should serve the noindex stub with a 404 status).`,
      );
    } else if (!/name="robots"[^>]*noindex|noindex[^>]*name="robots"/.test(body)) {
      failures.push(`${notFoundUrl}: 404 body is missing a noindex robots meta.`);
    }
  } catch (err) {
    fetchErrors.push(`${notFoundUrl}: fetch error: ${(err as Error).message}`);
  }

  if (fetchErrors.length > 0) {
    log.warn(
      { fetchErrors },
      "Floor-plan-page check had transient fetch errors (not alert-worthy)",
    );
  }
  return { failures, fetchErrors, checkedCount };
}

// --- shared consecutive-unreachable counter (survives restarts) --------------

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

async function resetUnreachableShared(): Promise<void> {
  await db.execute(sql`
    DELETE FROM email_throttle_counters
    WHERE key = ${UNREACHABLE_COUNTER_KEY}
  `);
}

/**
 * Run one full floor-plan check and alert (once/day) on definitive failures.
 * Exported for tests. Best-effort: never throws, so a network or mail
 * outage can't crash the interval.
 */
export async function checkFloorPlanPagesOnce(
  log: Logger = defaultLogger,
  now: number = Date.now(),
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const result = await runFloorPlanChecks(log, fetchImpl);

  const allFetchesErrored =
    result.fetchErrors.length > 0 &&
    result.fetchErrors.length === result.checkedCount;
  if (allFetchesErrored) {
    consecutiveUnreachableRuns += 1;
    try {
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
      `Production has been unreachable for ${consecutiveUnreachableRuns} consecutive floor-plan-page check runs (every fetch failed each time) — likely a DNS, CDN, or hosting outage. Latest errors: ${result.fetchErrors.join("; ")}`,
    ];
  }

  heartbeat.record(
    log,
    now,
    failures.length > 0
      ? "unhealthy"
      : allFetchesErrored
        ? "unreachable"
        : "healthy",
  );

  if (failures.length === 0) {
    log.info(
      { checkedCount: result.checkedCount },
      "Floor-plan-page check passed",
    );
    return;
  }

  log.error(
    { failures, checkedCount: result.checkedCount },
    "Floor-plan pages are serving the wrong content — crawlers see the homepage shell instead of the plan pages",
  );

  try {
    if (!(await dailyClaim.claim(log, now))) return;
    if (!mailerConfigured()) return;
    await sendFloorPlanCheckAlert({
      failures,
      checkedCount: result.checkedCount,
    });
  } catch (err) {
    log.error({ err }, "Failed to send floor-plan-check failure alert");
  }
}

/**
 * Start the periodic floor-plan-page watchdog. Production only — dev and
 * test runs would hit the live domain and generate meaningless alerts.
 * Kicks off an immediate check (a publish restarts the server, so this is
 * the post-publish check), then repeats every CHECK_INTERVAL_MS.
 */
export function startFloorPlanPageCheck(log: Logger = defaultLogger): void {
  if (process.env.NODE_ENV !== "production") return;
  void checkFloorPlanPagesOnce(log);
  const timer = setInterval(
    () => void checkFloorPlanPagesOnce(log),
    CHECK_INTERVAL_MS,
  );
  timer.unref?.();
  log.info(
    { site: SITE, intervalHours: CHECK_INTERVAL_MS / 3_600_000 },
    "Floor-plan-page watchdog started",
  );
}

/** Test-only: clear the per-process fallback dedupe state. */
export function __resetFloorPlanCheckForTests(): void {
  dailyClaim.reset();
  consecutiveUnreachableRuns = 0;
  heartbeat.reset();
}
