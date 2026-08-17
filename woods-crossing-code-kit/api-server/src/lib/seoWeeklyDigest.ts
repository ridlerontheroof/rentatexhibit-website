import { createSign } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import type { Logger } from "pino";
import { logger as defaultLogger } from "./logger";
import { announceWatchdogStarted } from "./startupSummary";
import { createDailyHeartbeat } from "./dailyHeartbeat";
import { mailerConfigured } from "./mailer";
import { sendSeoWeeklyDigest, sendSeoDigestFailureAlert } from "./email";
import { buildBlogReminder, type BlogReminder } from "./blogQueue";

/**
 * Weekly SEO movers digest — the measurement-cadence half of the SEO
 * playbook (docs/seo/PLAYBOOK_COMPLIANCE_REPORT.md §6).
 *
 * Once per ISO week the api-server pulls Google Search Console search
 * analytics for two adjacent 7-day windows and emails the leasing inbox a
 * digest of:
 *   - top rising / falling queries (week-over-week clicks),
 *   - top rising / falling pages,
 *   - "near-winner" queries sitting at average position 8–20 with
 *     meaningful impressions (one content refresh from page one),
 *   - every published /blog article URL with its current search stats, so
 *     content decay on the new guides is caught early,
 *   - GA4 page movers (activeUsers week-over-week) when GA4 credentials
 *     are present.
 *
 * Auth reuses the GA4 service account (GA4_SERVICE_ACCOUNT_JSON): the same
 * JWT-bearer flow as ga4DataCheck, with the Search Console read scope added.
 * The service account's email must ALSO be added as a user on the Search
 * Console property — until then every GSC call answers 403, which this
 * module classifies as `unauthorized` and turns into a once-per-week alert
 * to the ops inbox telling the owner exactly what to grant.
 *
 * Scheduling mirrors the other always-on watchdogs (interval runs, no cron
 * in the deploy runtime): the check runs every 6 hours, but sending is
 * gated by a cluster-wide once-per-ISO-week claim in the shared
 * `email_throttle_counters` table, so exactly one digest goes out per week
 * regardless of replicas/restarts, and a failed run simply retries at the
 * next interval until the week is claimed.
 *
 * Classification:
 *   - success → digest emailed once per ISO week (claim-gated).
 *   - GSC 403/404 → `unauthorized`: alert email (once per ISO week) with
 *     grant instructions; retries next week.
 *   - other API/network errors → `errored`: logged, retried next interval,
 *     escalated to an alert after several consecutive failures (persisted
 *     counter, same pattern as ga4DataCheck).
 *   - GA4_SERVICE_ACCOUNT_JSON missing → `unsupported`: logged loudly once.
 * Production only; SEO_DIGEST_DISABLED=1 is a kill switch.
 */

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 hours
/** Same rationale as ga4DataCheck: first ~25s of container stdout is dropped. */
const STARTUP_DELAY_MS = 2 * 60 * 1000;
const FETCH_TIMEOUT_MS = 30 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
/** Consecutive errored runs before escalating to an alert (~2 days blind). */
const ERROR_ESCALATION_RUNS = 8;

// Read from SITE_URL env var (property-config identity.canonicalOrigin).
// Used for sitemap.xml fetches and digest link-backs. Same var as indexnow/apexCheck.
const _SITE_FOR_DIGEST = process.env.SITE_URL?.trim();
if (!_SITE_FOR_DIGEST) {
  throw new Error(
    "SITE_URL env var is required for seoWeeklyDigest but is not set. " +
    "Set it to your canonical www origin (identity.canonicalOrigin from property-config.json).",
  );
}
const SITE = _SITE_FOR_DIGEST.replace(/\/$/, "");
/**
 * Default Search Console property. The site is verified at the domain level;
 * override with GSC_SITE_URL (e.g. a url-prefix property
 * "https://YOUR-DOMAIN.com /* WOODS-CROSSING: replace *//") if the grant lands elsewhere.
 */
// Derived from SITE_URL env var (property-config identity.canonicalOrigin) by
// stripping "https://www." and prepending "sc-domain:", e.g.:
//   SITE_URL=https://www.woodscrossing.com → sc-domain:woodscrossing.com
// Override with GSC_SITE_URL env var if your Search Console property is
// a URL-prefix property instead of a domain property.
const _SITE_URL_FOR_GSC = process.env.SITE_URL?.trim();
const DEFAULT_GSC_SITE_URL: string = process.env.GSC_SITE_URL?.trim() ||
  (_SITE_URL_FOR_GSC
    ? `sc-domain:${new URL(_SITE_URL_FOR_GSC).hostname.replace(/^www\./, "")}`
    : (() => { throw new Error("Either GSC_SITE_URL or SITE_URL env var must be set for seoWeeklyDigest."); })());
/** Near-winner filter: min impressions in the current window. */
const DEFAULT_MIN_IMPRESSIONS = 10;
/** Near-winner filter: average position band (page 2, cusp of page 1). */
const NEAR_WINNER_MIN_POSITION = 8;
const NEAR_WINNER_MAX_POSITION = 20;
/** Rows shown per digest section. */
const TOP_N = 8;
/** Rows requested from the GSC API per report. */
const GSC_ROW_LIMIT = 250;

const OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
/** One token covers both APIs. */
const OAUTH_SCOPES =
  "https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/analytics.readonly";

const WEEKLY_CLAIM_PREFIX = "seodigest";
const ERROR_COUNTER_KEY = "seodigest:errored-runs";

const heartbeat = createDailyHeartbeat({
  outcomes: ["sent", "already-sent", "unauthorized", "unsupported", "errored"] as const,
  message:
    "Weekly SEO digest watchdog heartbeat — still checking Search Console for the week's movers digest",
  extraFields: { intervalHours: CHECK_INTERVAL_MS / 3_600_000 },
});

let consecutiveErroredRuns = 0;
let warnedUnsupported = false;
/** In-memory fallback for the weekly claim when the database is unreachable. */
const claimedWeeks = new Map<string, string>();

// --- configuration -----------------------------------------------------------

export interface SeoDigestConfig {
  clientEmail: string;
  privateKey: string;
  gscSiteUrl: string;
  /** Numeric GA4 property ID; null → GA4 movers section skipped. */
  ga4PropertyId: string | null;
  minImpressions: number;
}

/**
 * Read credentials from the environment. Returns null (→ `unsupported`)
 * when the service-account secret is absent; throws when a value is present
 * but malformed so a typo'd secret surfaces as repeated `errored`.
 */
export function readSeoDigestConfig(
  env: NodeJS.ProcessEnv = process.env,
): SeoDigestConfig | null {
  const raw = env.GA4_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;
  let parsed: { client_email?: unknown; private_key?: unknown };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      "GA4_SERVICE_ACCOUNT_JSON is not valid JSON — paste the full service-account key file contents",
    );
  }
  const clientEmail = parsed.client_email;
  const privateKey = parsed.private_key;
  if (typeof clientEmail !== "string" || typeof privateKey !== "string") {
    throw new Error(
      "GA4_SERVICE_ACCOUNT_JSON is missing client_email/private_key — paste the full service-account key file contents",
    );
  }
  const ga4PropertyId = env.GA4_PROPERTY_ID?.trim() || null;
  if (ga4PropertyId && !/^\d+$/.test(ga4PropertyId)) {
    throw new Error(
      `GA4_PROPERTY_ID must be the numeric GA4 property ID (got ${JSON.stringify(ga4PropertyId)})`,
    );
  }
  const minRaw = env.SEO_DIGEST_MIN_IMPRESSIONS?.trim();
  let minImpressions = DEFAULT_MIN_IMPRESSIONS;
  if (minRaw) {
    const n = Number(minRaw);
    if (!Number.isFinite(n) || n < 0) {
      throw new Error(
        `SEO_DIGEST_MIN_IMPRESSIONS must be a non-negative number (got ${JSON.stringify(minRaw)})`,
      );
    }
    minImpressions = n;
  }
  return {
    clientEmail,
    privateKey,
    gscSiteUrl: env.GSC_SITE_URL?.trim() || DEFAULT_GSC_SITE_URL,
    ga4PropertyId,
    minImpressions,
  };
}

// --- date windows -------------------------------------------------------------

export interface DigestWindows {
  /** Current 7-day window (inclusive), e.g. { start: "2026-08-04", end: "2026-08-10" }. */
  current: { start: string; end: string };
  /** The 7 days immediately before it. */
  previous: { start: string; end: string };
}

function isoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * Two adjacent 7-day windows, with the current one ending 3 days ago —
 * Search Console data lags ~2–3 days, so a window ending "yesterday" would
 * systematically undercount the newest days and fake a "falling" trend.
 */
export function digestWindows(now: number): DigestWindows {
  const end = now - 3 * DAY_MS;
  return {
    current: { start: isoDate(end - 6 * DAY_MS), end: isoDate(end) },
    previous: { start: isoDate(end - 13 * DAY_MS), end: isoDate(end - 7 * DAY_MS) },
  };
}

/** ISO-8601 week key, e.g. "2026-W33" — the once-per-week claim unit. */
export function isoWeekKey(now: number): string {
  const d = new Date(now);
  // Shift to the Thursday of this week (ISO weeks belong to the year of
  // their Thursday), all in UTC.
  const day = d.getUTCDay() || 7;
  const thursday = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 4 - day),
  );
  const yearStart = Date.UTC(thursday.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((thursday.getTime() - yearStart) / DAY_MS + 1) / 7);
  return `${thursday.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

// --- Google auth ----------------------------------------------------------------

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function buildJwtAssertion(
  clientEmail: string,
  privateKey: string,
  nowSeconds: number,
): string {
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({
      iss: clientEmail,
      scope: OAUTH_SCOPES,
      aud: OAUTH_TOKEN_URL,
      iat: nowSeconds,
      exp: nowSeconds + 3600,
    }),
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const signature = b64url(signer.sign(privateKey));
  return `${header}.${claims}.${signature}`;
}

async function fetchJson(
  url: string,
  init: RequestInit,
  fetchImpl: typeof fetch,
): Promise<{ status: number; body: unknown }> {
  const res = await fetchImpl(url, {
    ...init,
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    /* non-JSON error body */
  }
  return { status: res.status, body };
}

async function fetchAccessToken(
  config: SeoDigestConfig,
  now: number,
  fetchImpl: typeof fetch,
): Promise<string> {
  const assertion = buildJwtAssertion(
    config.clientEmail,
    config.privateKey,
    Math.floor(now / 1000),
  );
  const { status, body } = await fetchJson(
    OAUTH_TOKEN_URL,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }).toString(),
    },
    fetchImpl,
  );
  const token = (body as { access_token?: unknown } | null)?.access_token;
  if (status !== 200 || typeof token !== "string") {
    const detail =
      (body as { error_description?: unknown } | null)?.error_description ??
      (body as { error?: unknown } | null)?.error ??
      "no body";
    throw new Error(`Google OAuth token exchange failed (HTTP ${status}): ${String(detail)}`);
  }
  return token;
}

// --- Search Console -------------------------------------------------------------

export interface GscRow {
  key: string;
  clicks: number;
  impressions: number;
  position: number;
}

/**
 * Thrown when the property answers 403/404 — either the service account lacks
 * user access or the Search Console API is not enabled in the GCP project.
 * `reason` is "SERVICE_DISABLED" when the API itself is off; for all other
 * 403/404s it is "PERMISSION_DENIED" (service account not added as a user).
 */
export class GscUnauthorizedError extends Error {
  constructor(
    public readonly httpStatus: number,
    message: string,
    public readonly reason: "SERVICE_DISABLED" | "PERMISSION_DENIED" = "PERMISSION_DENIED",
  ) {
    super(message);
    this.name = "GscUnauthorizedError";
  }
}

function parseGscRows(body: unknown): GscRow[] {
  const rows = (body as { rows?: unknown[] } | null)?.rows;
  if (!Array.isArray(rows)) return [];
  const out: GscRow[] = [];
  for (const r of rows) {
    const row = r as {
      keys?: unknown[];
      clicks?: unknown;
      impressions?: unknown;
      position?: unknown;
    };
    const key = row.keys?.[0];
    if (typeof key !== "string") continue;
    out.push({
      key,
      clicks: Number(row.clicks) || 0,
      impressions: Number(row.impressions) || 0,
      position: Number(row.position) || 0,
    });
  }
  return out;
}

async function queryGsc(
  config: SeoDigestConfig,
  token: string,
  dimension: "query" | "page",
  window: { start: string; end: string },
  fetchImpl: typeof fetch,
): Promise<GscRow[]> {
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(config.gscSiteUrl)}/searchAnalytics/query`;
  const { status, body } = await fetchJson(
    url,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate: window.start,
        endDate: window.end,
        dimensions: [dimension],
        rowLimit: GSC_ROW_LIMIT,
      }),
    },
    fetchImpl,
  );
  if (status === 403 || status === 404) {
    const error = (body as { error?: { message?: unknown; details?: { reason?: unknown }[] } } | null)?.error;
    const message = error?.message ?? "no body";
    // Distinguish "API not enabled in GCP project" from "service account not a
    // Search Console user" — they need different remediation steps.
    const isApiDisabled =
      error?.details?.some((d) => d?.reason === "SERVICE_DISABLED") ?? false;
    throw new GscUnauthorizedError(
      status,
      `Search Console rejected ${config.gscSiteUrl} (HTTP ${status}): ${String(message)}`,
      isApiDisabled ? "SERVICE_DISABLED" : "PERMISSION_DENIED",
    );
  }
  if (status !== 200) {
    const message =
      (body as { error?: { message?: unknown } } | null)?.error?.message ?? "no body";
    throw new Error(
      `GSC searchAnalytics.query failed (HTTP ${status}): ${String(message)}`,
    );
  }
  return parseGscRows(body);
}

// --- GA4 page movers (best-effort) ------------------------------------------------

export interface Ga4PageMover {
  pagePath: string;
  currentUsers: number;
  previousUsers: number;
}

async function queryGa4PageUsers(
  config: SeoDigestConfig,
  token: string,
  windows: DigestWindows,
  fetchImpl: typeof fetch,
): Promise<Ga4PageMover[]> {
  if (!config.ga4PropertyId) return [];
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${config.ga4PropertyId}:runReport`;
  const { status, body } = await fetchJson(
    url,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dateRanges: [
          { startDate: windows.current.start, endDate: windows.current.end },
          { startDate: windows.previous.start, endDate: windows.previous.end },
        ],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "activeUsers" }],
        limit: 200,
      }),
    },
    fetchImpl,
  );
  if (status !== 200) {
    const message =
      (body as { error?: { message?: unknown } } | null)?.error?.message ?? "no body";
    throw new Error(`GA4 runReport failed (HTTP ${status}): ${String(message)}`);
  }
  // With two dateRanges the API appends a dateRange dimension value
  // ("date_range_0" = first range) to every row.
  const rows = (body as { rows?: unknown[] } | null)?.rows ?? [];
  const byPath = new Map<string, Ga4PageMover>();
  for (const r of rows as {
    dimensionValues?: { value?: unknown }[];
    metricValues?: { value?: unknown }[];
  }[]) {
    const path = r.dimensionValues?.[0]?.value;
    const range = r.dimensionValues?.[1]?.value;
    const users = Number(r.metricValues?.[0]?.value) || 0;
    if (typeof path !== "string") continue;
    const entry =
      byPath.get(path) ?? { pagePath: path, currentUsers: 0, previousUsers: 0 };
    if (range === "date_range_1") entry.previousUsers += users;
    else entry.currentUsers += users;
    byPath.set(path, entry);
  }
  return [...byPath.values()];
}

// --- blog URLs from the production sitemap ----------------------------------------

export function parseBlogUrls(sitemapXml: string): string[] {
  const urls = new Set<string>();
  const re = /<loc>\s*(https?:\/\/[^<]*\/blog\/[^<\s]+?)\/?\s*<\/loc>/g;
  for (let m; (m = re.exec(sitemapXml)); ) urls.add(m[1]!.replace(/\/$/, ""));
  return [...urls].sort();
}

async function fetchBlogUrls(fetchImpl: typeof fetch): Promise<string[]> {
  const res = await fetchImpl(`${SITE}/sitemap.xml`, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { "User-Agent": "property-site-seo-digest/1.0" },
  });
  if (res.status !== 200) {
    throw new Error(`${SITE}/sitemap.xml answered HTTP ${res.status}`);
  }
  return parseBlogUrls(await res.text());
}

// --- digest assembly ---------------------------------------------------------------

export interface Mover {
  key: string;
  currentClicks: number;
  previousClicks: number;
  currentImpressions: number;
  previousImpressions: number;
  /** Average position in the current window (0 = no data). */
  position: number;
}

export interface NearWinner {
  query: string;
  impressions: number;
  clicks: number;
  position: number;
}

export interface BlogPageStats {
  url: string;
  currentClicks: number;
  previousClicks: number;
  currentImpressions: number;
  previousImpressions: number;
  position: number;
}

export interface SeoDigestData {
  windows: DigestWindows;
  siteUrl: string;
  risingQueries: Mover[];
  fallingQueries: Mover[];
  risingPages: Mover[];
  fallingPages: Mover[];
  nearWinners: NearWinner[];
  blogPages: BlogPageStats[];
  /** null → GA4 section unavailable (missing property ID or query failed). */
  ga4Risers: Ga4PageMover[] | null;
  ga4Fallers: Ga4PageMover[] | null;
  /** Non-fatal problems worth a line in the email (e.g. GA4 query failed). */
  notes: string[];
  /** "Next guide up" cadence reminder (blog queue snapshot + refresh mode). */
  blogReminder: BlogReminder;
}

/** Join two GSC reports into week-over-week movers. Exported for tests. */
export function computeMovers(current: GscRow[], previous: GscRow[]): Mover[] {
  const byKey = new Map<string, Mover>();
  for (const row of current) {
    byKey.set(row.key, {
      key: row.key,
      currentClicks: row.clicks,
      previousClicks: 0,
      currentImpressions: row.impressions,
      previousImpressions: 0,
      position: row.position,
    });
  }
  for (const row of previous) {
    const entry =
      byKey.get(row.key) ?? {
        key: row.key,
        currentClicks: 0,
        previousClicks: 0,
        currentImpressions: 0,
        previousImpressions: 0,
        position: 0,
      };
    entry.previousClicks = row.clicks;
    entry.previousImpressions = row.impressions;
    byKey.set(row.key, entry);
  }
  return [...byKey.values()];
}

function clicksDelta(m: Mover): number {
  return m.currentClicks - m.previousClicks;
}

function impressionsDelta(m: Mover): number {
  return m.currentImpressions - m.previousImpressions;
}

/**
 * Top movers by click delta (impressions delta as tiebreaker so low-click
 * sites still surface movement). Exported for tests.
 */
export function topMovers(
  movers: Mover[],
  direction: "rising" | "falling",
  n: number = TOP_N,
): Mover[] {
  const signed = direction === "rising" ? 1 : -1;
  return movers
    .filter((m) => {
      const d = clicksDelta(m) * signed;
      const di = impressionsDelta(m) * signed;
      return d > 0 || (d === 0 && di > 0);
    })
    .sort(
      (a, b) =>
        (clicksDelta(b) - clicksDelta(a)) * signed ||
        (impressionsDelta(b) - impressionsDelta(a)) * signed,
    )
    .slice(0, n);
}

/** Queries at position 8–20 with meaningful impressions. Exported for tests. */
export function nearWinnersOf(
  currentQueries: GscRow[],
  minImpressions: number,
  n: number = TOP_N * 2,
): NearWinner[] {
  return currentQueries
    .filter(
      (r) =>
        r.position >= NEAR_WINNER_MIN_POSITION &&
        r.position <= NEAR_WINNER_MAX_POSITION &&
        r.impressions >= minImpressions,
    )
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, n)
    .map((r) => ({
      query: r.key,
      impressions: r.impressions,
      clicks: r.clicks,
      position: r.position,
    }));
}

/** Per-blog-URL stats from the page movers (zeros when Google shows no data). */
export function blogPageStats(blogUrls: string[], pageMovers: Mover[]): BlogPageStats[] {
  const byUrl = new Map<string, Mover>();
  for (const m of pageMovers) byUrl.set(m.key.replace(/\/$/, ""), m);
  return blogUrls.map((url) => {
    const m = byUrl.get(url);
    return {
      url,
      currentClicks: m?.currentClicks ?? 0,
      previousClicks: m?.previousClicks ?? 0,
      currentImpressions: m?.currentImpressions ?? 0,
      previousImpressions: m?.previousImpressions ?? 0,
      position: m?.position ?? 0,
    };
  });
}

export type DigestFetcher = (
  config: SeoDigestConfig,
  now: number,
) => Promise<SeoDigestData>;

/** Pull everything and assemble the digest. Throws GscUnauthorizedError on 403/404. */
export async function fetchSeoDigestData(
  config: SeoDigestConfig,
  now: number = Date.now(),
  fetchImpl: typeof fetch = fetch,
): Promise<SeoDigestData> {
  const windows = digestWindows(now);
  const token = await fetchAccessToken(config, now, fetchImpl);

  const [curQueries, prevQueries, curPages, prevPages] = await Promise.all([
    queryGsc(config, token, "query", windows.current, fetchImpl),
    queryGsc(config, token, "query", windows.previous, fetchImpl),
    queryGsc(config, token, "page", windows.current, fetchImpl),
    queryGsc(config, token, "page", windows.previous, fetchImpl),
  ]);

  const notes: string[] = [];

  let blogUrls: string[] = [];
  try {
    blogUrls = await fetchBlogUrls(fetchImpl);
  } catch (err) {
    notes.push(
      `Blog section unavailable this week: could not read the production sitemap (${err instanceof Error ? err.message : String(err)}).`,
    );
  }

  let ga4Risers: Ga4PageMover[] | null = null;
  let ga4Fallers: Ga4PageMover[] | null = null;
  if (config.ga4PropertyId) {
    try {
      const ga4 = await queryGa4PageUsers(config, token, windows, fetchImpl);
      const delta = (m: Ga4PageMover) => m.currentUsers - m.previousUsers;
      ga4Risers = ga4
        .filter((m) => delta(m) > 0)
        .sort((a, b) => delta(b) - delta(a))
        .slice(0, TOP_N);
      ga4Fallers = ga4
        .filter((m) => delta(m) < 0)
        .sort((a, b) => delta(a) - delta(b))
        .slice(0, TOP_N);
    } catch (err) {
      notes.push(
        `GA4 movers unavailable this week: ${err instanceof Error ? err.message : String(err)}.`,
      );
    }
  } else {
    notes.push("GA4 movers skipped: GA4_PROPERTY_ID is not set.");
  }

  const queryMovers = computeMovers(curQueries, prevQueries);
  const pageMovers = computeMovers(curPages, prevPages);

  const blogPages = blogPageStats(blogUrls, pageMovers);
  const nearWinners = nearWinnersOf(curQueries, config.minImpressions);

  return {
    windows,
    siteUrl: config.gscSiteUrl,
    risingQueries: topMovers(queryMovers, "rising"),
    fallingQueries: topMovers(queryMovers, "falling"),
    risingPages: topMovers(pageMovers, "rising"),
    fallingPages: topMovers(pageMovers, "falling"),
    nearWinners,
    blogPages,
    ga4Risers,
    ga4Fallers,
    notes,
    blogReminder: buildBlogReminder({ blogPages, nearWinners }),
  };
}

// --- weekly claim + shared error counter -------------------------------------------

/**
 * Claim this ISO week's slot for `subKey` ("digest" or "alert").
 * Cluster-wide via email_throttle_counters; in-memory fallback per process.
 */
async function claimWeek(
  log: Logger,
  now: number,
  subKey: string,
): Promise<boolean> {
  const week = isoWeekKey(now);
  const key = `${WEEKLY_CLAIM_PREFIX}:${subKey}:${week}`;
  try {
    const expiresAt = new Date(now + 14 * DAY_MS);
    const result = await db.execute(sql`
      INSERT INTO email_throttle_counters (key, count, expires_at)
      VALUES (${key}, 1, ${expiresAt})
      ON CONFLICT (key) DO NOTHING
      RETURNING count
    `);
    const claimed = result.rows.length > 0;
    // Mirror the outcome so a later DB outage the same week can't re-send.
    claimedWeeks.set(subKey, week);
    return claimed;
  } catch (err) {
    log.error(
      { err, key },
      "SEO-digest weekly claim failed; falling back to in-memory dedupe",
    );
    if (claimedWeeks.get(subKey) === week) return false;
    claimedWeeks.set(subKey, week);
    return true;
  }
}

/**
 * Release a previously-won weekly claim after a failed send, so the next
 * interval run can retry instead of treating the week as delivered. Deletes
 * the shared row and clears the in-memory mirror; best-effort (if the DB is
 * unreachable the in-memory clear still lets THIS process retry).
 */
async function releaseWeek(log: Logger, now: number, subKey: string): Promise<void> {
  const week = isoWeekKey(now);
  const key = `${WEEKLY_CLAIM_PREFIX}:${subKey}:${week}`;
  claimedWeeks.delete(subKey);
  try {
    await db.execute(sql`
      DELETE FROM email_throttle_counters WHERE key = ${key}
    `);
  } catch (err) {
    log.error(
      { err, key },
      "Failed to release SEO-digest weekly claim after a failed send; retry may wait for another replica or next week",
    );
  }
}

async function bumpErroredShared(now: number): Promise<number> {
  const expiresAt = new Date(now + 7 * DAY_MS);
  const result = await db.execute(sql`
    INSERT INTO email_throttle_counters (key, count, expires_at)
    VALUES (${ERROR_COUNTER_KEY}, 1, ${expiresAt})
    ON CONFLICT (key) DO UPDATE
      SET count = email_throttle_counters.count + 1,
          expires_at = ${expiresAt}
    RETURNING count
  `);
  const count = Number(result.rows[0]?.count);
  return Number.isFinite(count) ? count : 0;
}

async function resetErroredShared(): Promise<void> {
  await db.execute(sql`
    DELETE FROM email_throttle_counters WHERE key = ${ERROR_COUNTER_KEY}
  `);
}

// --- the check -----------------------------------------------------------------------

/**
 * Run one weekly-digest check: if this ISO week's digest has not been sent
 * yet, pull the data and send it. Best-effort: never throws.
 */
export async function checkSeoDigestOnce(
  log: Logger = defaultLogger,
  now: number = Date.now(),
  fetcher: DigestFetcher = fetchSeoDigestData,
  env: NodeJS.ProcessEnv = process.env,
): Promise<void> {
  let config: SeoDigestConfig | null;
  try {
    config = readSeoDigestConfig(env);
  } catch (err) {
    heartbeat.record(log, now, "errored");
    await recordError(log, now, err instanceof Error ? err.message : String(err));
    return;
  }
  if (!config) {
    heartbeat.record(log, now, "unsupported");
    if (!warnedUnsupported) {
      warnedUnsupported = true;
      log.error(
        {},
        "Weekly SEO digest has NO credentials — set GA4_SERVICE_ACCOUNT_JSON (the same service account is used for Search Console); no digest emails will be sent",
      );
    }
    return;
  }

  let data: SeoDigestData;
  try {
    data = await fetcher(config, now);
  } catch (err) {
    if (err instanceof GscUnauthorizedError) {
      heartbeat.record(log, now, "unauthorized");
      log.error(
        { httpStatus: err.httpStatus, siteUrl: config.gscSiteUrl, reason: err.reason },
        err.reason === "SERVICE_DISABLED"
          ? "Weekly SEO digest cannot read Search Console — the Search Console API is not enabled in the GCP project"
          : "Weekly SEO digest cannot read Search Console — the service account is not authorized on the property",
      );
      try {
        if (!mailerConfigured()) return;
        if (!(await claimWeek(log, now, "alert"))) return;
        await sendSeoDigestFailureAlert({
          serviceAccountEmail: config.clientEmail,
          siteUrl: config.gscSiteUrl,
          detail: err.message,
          gscReason: err.reason,
        });
      } catch (sendErr) {
        log.error({ err: sendErr }, "Failed to send SEO-digest authorization alert");
        // Give the week's alert slot back so the next interval run retries.
        await releaseWeek(log, now, "alert");
      }
      return;
    }
    heartbeat.record(log, now, "errored");
    await recordError(log, now, err instanceof Error ? err.message : String(err));
    return;
  }

  // Success — clear the error counter, then send at most once per ISO week.
  consecutiveErroredRuns = 0;
  try {
    await resetErroredShared();
  } catch (err) {
    log.error({ err }, "Failed to clear persisted SEO-digest errored-run counter");
  }

  // Check the mailer BEFORE claiming: an unconfigured mailer must not burn
  // the week's one send slot.
  if (!mailerConfigured()) {
    heartbeat.record(log, now, "errored");
    log.error(
      {},
      "Weekly SEO digest data is ready but the mailer is unconfigured (GMAIL_APP_PASSWORD missing) — digest not sent",
    );
    return;
  }
  if (!(await claimWeek(log, now, "digest"))) {
    heartbeat.record(log, now, "already-sent");
    log.debug({ week: isoWeekKey(now) }, "Weekly SEO digest already sent this week");
    return;
  }
  try {
    await sendSeoWeeklyDigest(data);
    heartbeat.record(log, now, "sent");
    log.info(
      {
        week: isoWeekKey(now),
        window: `${data.windows.current.start}..${data.windows.current.end}`,
        risingQueries: data.risingQueries.length,
        fallingQueries: data.fallingQueries.length,
        nearWinners: data.nearWinners.length,
        blogPages: data.blogPages.length,
      },
      "Weekly SEO digest sent",
    );
  } catch (err) {
    heartbeat.record(log, now, "errored");
    log.error({ err }, "Failed to send the weekly SEO digest email");
    // The claim was taken before the send; release it so a later run this
    // week retries instead of silently skipping the whole week.
    await releaseWeek(log, now, "digest");
  }
}

async function recordError(log: Logger, now: number, message: string): Promise<void> {
  consecutiveErroredRuns += 1;
  try {
    const shared = await bumpErroredShared(now);
    consecutiveErroredRuns = Math.max(consecutiveErroredRuns, shared);
  } catch (err) {
    log.error(
      { err },
      "Failed to persist SEO-digest errored-run counter; using in-memory count",
    );
  }
  if (consecutiveErroredRuns >= ERROR_ESCALATION_RUNS) {
    log.error(
      { consecutiveErroredRuns, error: message },
      "Weekly SEO digest has failed repeatedly — escalating to an alert email",
    );
    try {
      const config = readSeoDigestConfig();
      if (!mailerConfigured()) return;
      if (!(await claimWeek(log, now, "alert"))) return;
      try {
        await sendSeoDigestFailureAlert({
          serviceAccountEmail: config?.clientEmail ?? "(unknown — credentials unreadable)",
          siteUrl: config?.gscSiteUrl ?? DEFAULT_GSC_SITE_URL,
          detail: `The check has errored ${consecutiveErroredRuns} runs in a row. Last error: ${message}`,
        });
      } catch (sendErr) {
        log.error({ err: sendErr }, "Failed to send SEO-digest repeated-failure alert");
        // Give the week's alert slot back so a later run retries the alert.
        await releaseWeek(log, now, "alert");
      }
    } catch (err) {
      log.error({ err }, "SEO-digest repeated-failure escalation itself failed");
    }
  } else {
    log.warn(
      { consecutiveErroredRuns, error: message },
      "Weekly SEO digest check errored (will retry next interval)",
    );
  }
}

/**
 * Start the weekly SEO digest watchdog. Production only. Runs shortly after
 * boot, then every CHECK_INTERVAL_MS; sending is claim-gated to once per ISO
 * week cluster-wide.
 */
export function startSeoWeeklyDigest(log: Logger = defaultLogger): void {
  if (process.env.NODE_ENV !== "production") return;
  if (process.env.SEO_DIGEST_DISABLED === "1") {
    log.warn({}, "Weekly SEO digest disabled via SEO_DIGEST_DISABLED=1");
    return;
  }
  const startupTimer = setTimeout(() => void checkSeoDigestOnce(log), STARTUP_DELAY_MS);
  startupTimer.unref?.();
  const timer = setInterval(() => void checkSeoDigestOnce(log), CHECK_INTERVAL_MS);
  timer.unref?.();
  log.info(
    {
      intervalHours: CHECK_INTERVAL_MS / 3_600_000,
      startupDelaySeconds: STARTUP_DELAY_MS / 1000,
    },
    "Weekly SEO digest watchdog started",
  );
  announceWatchdogStarted("seo-weekly-digest");
}

/** Test-only: clear per-process state. */
export function __resetSeoDigestForTests(): void {
  heartbeat.reset();
  consecutiveErroredRuns = 0;
  warnedUnsupported = false;
  claimedWeeks.clear();
}
