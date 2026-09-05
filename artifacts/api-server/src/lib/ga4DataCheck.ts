import { createHash, createSign } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import type { Logger } from "pino";
import { logger as defaultLogger } from "./logger";
import { announceWatchdogStarted } from "./startupSummary";
import { createDailyClaim } from "./dailyClaim";
import { createDailyHeartbeat } from "./dailyHeartbeat";
import { mailerConfigured } from "./mailer";
import { sendGa4DataCheckAlert } from "./email";

/**
 * Watchdog for GA4 *data* — real visitors actually being recorded.
 *
 * The gtmCheck watchdog verifies the published GTM container still carries
 * the GA4 tag, but it checks configuration, not data: a consent-mode
 * misconfiguration, a broken GA4 property/stream, or a filter dropping all
 * hits would still pass while zero visitors get recorded. This module closes
 * that gap by querying the GA4 Data API (runReport, `activeUsers` over a
 * trailing window ending yesterday) and alerting when the count is
 * implausibly low.
 *
 * The window deliberately ends at "yesterday" and spans several days: GA4
 * standard-property data can take 24–48 hours to finish processing, so a
 * same-day zero is meaningless, while several consecutive processed days at
 * ~zero is the signature of tracking being silently off.
 *
 * Auth is a Google service account (JWT-bearer OAuth flow, no SDK): the
 * service-account JSON key lives in the GA4_SERVICE_ACCOUNT_JSON secret and
 * the numeric property ID in GA4_PROPERTY_ID. The service account's email
 * must be added as a Viewer on the GA4 property.
 *
 * Classification mirrors gtmCheck.ts:
 *   - Definitive FAIL (activeUsers below threshold over the window)
 *     → outcome `unhealthy`: email alert, at most one per UTC day, deduped
 *     cluster-wide via the shared dailyClaim.
 *   - Auth/network/API problems → outcome `errored`: ambiguous, logged only,
 *     but escalated to an alert after several consecutive runs via a counter
 *     persisted in the shared `email_throttle_counters` table.
 *   - Missing credentials/property ID → outcome `unsupported`: logged
 *     loudly once, never emailed.
 * Checks only run in production; GA4_DATA_CHECK_DISABLED=1 is a kill switch.
 */

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 hours
/**
 * Delay before the startup run. Deployment log ingestion drops the first
 * ~25s of a fresh container's stdout, so an immediate run would report its
 * outcome into the void (same rationale as gtmCheck).
 */
const STARTUP_DELAY_MS = 90 * 1000;
/** Two HTTPS calls (token + report); a minute is generous. */
const FETCH_TIMEOUT_MS = 30 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
/** Consecutive errored runs (auth/network/API) before escalating to an alert. */
const ERROR_ESCALATION_RUNS = 4;

/**
 * Trailing fully-processed window: 3 days ending yesterday. Long enough to
 * absorb GA4's 24–48h processing lag and one slow midweek day; short enough
 * that a real outage alerts within days, not weeks.
 */
const WINDOW_START = "3daysAgo";
const WINDOW_END = "yesterday";
/**
 * Alert when the window's activeUsers is at or below this. The site records
 * dozens of daily visitors; three processed days at ≤ this floor means
 * tracking is effectively off. Overridable via GA4_MIN_ACTIVE_USERS.
 */
const DEFAULT_MIN_ACTIVE_USERS = 1;
/** Do not judge map-event absence during genuinely quiet traffic windows. */
const DEFAULT_MIN_SIGHTMAP_SESSIONS = 50;
const REQUIRED_SIGHTMAP_EVENTS = [
  "sightmap_impression",
  "sightmap_unit_selected",
  "sightmap_filter_change",
] as const;
const SIGHTMAP_TRIPWIRE_EVENTS = [
  "sightmap_apply_click",
  "sightmap_outbound_click",
] as const;
const SIGHTMAP_EVENTS = [
  ...REQUIRED_SIGHTMAP_EVENTS,
  ...SIGHTMAP_TRIPWIRE_EVENTS,
] as const;

const OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const OAUTH_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

const dailyClaim = createDailyClaim({
  prefix: "ga4datacheck",
  claimFailedMessage:
    "GA4-data alert database claim failed; falling back to in-memory dedupe",
});

const heartbeat = createDailyHeartbeat({
  outcomes: ["healthy", "unhealthy", "unsupported", "errored"] as const,
  message:
    "GA4 visitor-data watchdog heartbeat — still checking the GA4 Data API for real recorded visitors",
  extraFields: { intervalHours: CHECK_INTERVAL_MS / 3_600_000 },
});

/** Consecutive errored runs — per-process mirror of the shared counter. */
let consecutiveErroredRuns = 0;
/** Shared-table key holding the persisted consecutive-errored-run count. */
const ERROR_COUNTER_KEY = "ga4datacheck:errored-runs";
/** Warn about missing credentials at most once per process. */
let warnedUnsupported = false;

// --- configuration -----------------------------------------------------------

export interface Ga4Config {
  propertyId: string;
  clientEmail: string;
  privateKey: string;
  minActiveUsers: number;
  minSightMapSessions: number;
}

function configFingerprint(config: Ga4Config): string {
  return createHash("sha256")
    .update(`${config.propertyId}\0${config.clientEmail}`)
    .digest("hex")
    .slice(0, 12);
}

/**
 * Read and validate the GA4 credentials from the environment. Returns null
 * (→ `unsupported`) when the secret or property ID is absent; throws when a
 * value is present but malformed, so a typo'd secret surfaces as a loud
 * repeated `errored` rather than silently disabling the watchdog.
 */
export function readGa4Config(
  env: NodeJS.ProcessEnv = process.env,
): Ga4Config | null {
  const raw = env.GA4_SERVICE_ACCOUNT_JSON?.trim();
  const propertyId = env.GA4_PROPERTY_ID?.trim();
  if (!raw || !propertyId) return null;
  if (!/^\d+$/.test(propertyId)) {
    throw new Error(
      `GA4_PROPERTY_ID must be the numeric GA4 property ID (got ${JSON.stringify(propertyId)}) — not the G-… measurement ID`,
    );
  }
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
  const minRaw = env.GA4_MIN_ACTIVE_USERS?.trim();
  let minActiveUsers = DEFAULT_MIN_ACTIVE_USERS;
  if (minRaw) {
    const n = Number(minRaw);
    if (!Number.isFinite(n) || n < 0) {
      throw new Error(`GA4_MIN_ACTIVE_USERS must be a non-negative number (got ${JSON.stringify(minRaw)})`);
    }
    minActiveUsers = n;
  }
  const minSightMapSessions = readNonNegativeEnvNumber(
    env.GA4_MIN_SIGHTMAP_SESSIONS,
    "GA4_MIN_SIGHTMAP_SESSIONS",
    DEFAULT_MIN_SIGHTMAP_SESSIONS,
  );
  return { propertyId, clientEmail, privateKey, minActiveUsers, minSightMapSessions };
}

function readNonNegativeEnvNumber(
  rawValue: string | undefined,
  name: string,
  fallback: number,
): number {
  const raw = rawValue?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a non-negative number (got ${JSON.stringify(raw)})`);
  }
  return value;
}

// --- Google auth + Data API ---------------------------------------------------

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Build the signed JWT-bearer assertion for the service account. */
export function buildJwtAssertion(
  clientEmail: string,
  privateKey: string,
  nowSeconds: number,
): string {
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({
      iss: clientEmail,
      scope: OAUTH_SCOPE,
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
): Promise<{ status: number; body: unknown }> {
  const res = await fetch(url, {
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

/** Exchange the signed assertion for an access token. Throws on failure. */
async function fetchAccessToken(config: Ga4Config, now: number): Promise<string> {
  const assertion = buildJwtAssertion(
    config.clientEmail,
    config.privateKey,
    Math.floor(now / 1000),
  );
  const { status, body } = await fetchJson(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }).toString(),
  });
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

/** Result of one GA4 Data API query. */
export interface Ga4QueryResult {
  /** Total activeUsers over the trailing window; null on any failure. */
  activeUsers: number | null;
  /** Sessions over the same window; omitted by legacy/test queriers. */
  sessions?: number;
  /** SightMap event totals over the same window. */
  sightMapEvents?: Record<string, number>;
  /** Error message when activeUsers is null. */
  error?: string;
}

export type Ga4Querier = (config: Ga4Config, now: number) => Promise<Ga4QueryResult>;

/** Query GA4 batchRunReports for traffic and SightMap event totals. */
export async function queryGa4ActiveUsers(
  config: Ga4Config,
  now: number = Date.now(),
): Promise<Ga4QueryResult> {
  try {
    const token = await fetchAccessToken(config, now);
    const url = `https://analyticsdata.googleapis.com/v1beta/properties/${config.propertyId}:batchRunReports`;
    const { status, body } = await fetchJson(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          {
            dateRanges: [{ startDate: WINDOW_START, endDate: WINDOW_END }],
            metrics: [{ name: "activeUsers" }, { name: "sessions" }],
          },
          {
            dateRanges: [{ startDate: WINDOW_START, endDate: WINDOW_END }],
            dimensions: [{ name: "eventName" }],
            metrics: [{ name: "eventCount" }],
            dimensionFilter: {
              filter: {
                fieldName: "eventName",
                inListFilter: { values: SIGHTMAP_EVENTS },
              },
            },
          },
        ],
      }),
    });
    if (status !== 200) {
      const message =
        (body as { error?: { message?: unknown } } | null)?.error?.message ??
        "no body";
      return {
        activeUsers: null,
        error: `GA4 batchRunReports failed (HTTP ${status}): ${String(message)}`,
      };
    }
    const reports = (body as { reports?: unknown[] } | null)?.reports;
    if (!Array.isArray(reports) || reports.length < 2) {
      return {
        activeUsers: null,
        error: "GA4 batchRunReports returned fewer than two reports",
      };
    }
    const trafficRow = (reports[0] as { rows?: Array<{ metricValues?: Array<{ value?: unknown }> }> })
      ?.rows?.[0];
    const activeUsers = Number(trafficRow?.metricValues?.[0]?.value ?? 0);
    const sessions = Number(trafficRow?.metricValues?.[1]?.value ?? 0);
    if (!Number.isFinite(activeUsers) || !Number.isFinite(sessions)) {
      return { activeUsers: null, error: "GA4 traffic report returned unparseable metrics" };
    }
    const sightMapEvents = Object.fromEntries(SIGHTMAP_EVENTS.map((name) => [name, 0]));
    const eventRows = (reports[1] as {
      rows?: Array<{
        dimensionValues?: Array<{ value?: unknown }>;
        metricValues?: Array<{ value?: unknown }>;
      }>;
    })?.rows ?? [];
    for (const row of eventRows) {
      const name = row.dimensionValues?.[0]?.value;
      const count = Number(row.metricValues?.[0]?.value);
      if (typeof name === "string" && name in sightMapEvents && Number.isFinite(count)) {
        sightMapEvents[name] = count;
      }
    }
    return { activeUsers, sessions, sightMapEvents };
  } catch (err) {
    return {
      activeUsers: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// --- shared consecutive-error counter (survives restarts) -------------------

async function bumpErroredShared(now: number): Promise<number> {
  const expiresAt = new Date(now + 2 * DAY_MS);
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

/**
 * Run one GA4 visitor-data check and alert (once/day, cluster-deduped) when
 * recorded visitors are implausibly low. Best-effort: never throws.
 */
export async function checkGa4DataOnce(
  log: Logger = defaultLogger,
  now: number = Date.now(),
  querier: Ga4Querier = queryGa4ActiveUsers,
  env: NodeJS.ProcessEnv = process.env,
): Promise<void> {
  let config: Ga4Config | null;
  let result: Ga4QueryResult;
  try {
    config = readGa4Config(env);
  } catch (err) {
    // Present-but-malformed credentials: treat as errored (repeats loudly,
    // escalates) rather than unsupported (one warn, then silence forever).
    config = null;
    result = {
      activeUsers: null,
      error: err instanceof Error ? err.message : String(err),
    };
    return classify(log, now, result);
  }
  if (!config) {
    heartbeat.record(log, now, "unsupported");
    if (!warnedUnsupported) {
      warnedUnsupported = true;
      log.error(
        {},
        "GA4 visitor-data watchdog has NO credentials — set GA4_SERVICE_ACCOUNT_JSON and GA4_PROPERTY_ID; a zero-visitor outage would go unnoticed here",
      );
    }
    return;
  }
  result = await querier(config, now);
  if (isDefinitiveFailure(result, config)) {
    const initialActiveUsers = result.activeUsers;
    const confirmation = await querier(config, now);
    log.warn(
      {
        initialActiveUsers,
        confirmationActiveUsers: confirmation.activeUsers,
        confirmationError: confirmation.error,
        configFingerprint: configFingerprint(config),
      },
      !isDefinitiveFailure(confirmation, config)
        ? "GA4 visitor-data initial low reading recovered on confirmation"
        : "GA4 visitor-data low reading confirmed by a second query",
    );
    result = confirmation;
  }
  return classify(log, now, result, config);
}

async function classify(
  log: Logger,
  now: number,
  result: Ga4QueryResult,
  config?: Ga4Config,
): Promise<void> {
  const fingerprint = config ? configFingerprint(config) : undefined;
  const errored = result.activeUsers === null;
  if (errored) {
    consecutiveErroredRuns += 1;
    try {
      const shared = await bumpErroredShared(now);
      consecutiveErroredRuns = Math.max(consecutiveErroredRuns, shared);
    } catch (err) {
      log.error(
        { err },
        "Failed to persist GA4-data errored-run counter; using in-memory count",
      );
    }
  } else {
    consecutiveErroredRuns = 0;
    try {
      await resetErroredShared();
    } catch (err) {
      log.error({ err }, "Failed to clear persisted GA4-data errored-run counter");
    }
  }

  const minActiveUsers = config?.minActiveUsers ?? DEFAULT_MIN_ACTIVE_USERS;
  let failureSummary: string | null = null;
  let isBlindEscalation = false;
  if (result.activeUsers !== null && result.activeUsers <= minActiveUsers) {
    failureSummary = `GA4 recorded only ${result.activeUsers} active user(s) between ${WINDOW_START} and ${WINDOW_END} (alert floor: ${minActiveUsers}). The tag may look fine while consent mode, a broken GA4 stream, or a data filter drops every hit — real visitors are NOT being recorded.`;
  } else if (config) {
    failureSummary = sightMapFailureSummary(result, config);
  }
  if (!failureSummary && errored && consecutiveErroredRuns >= ERROR_ESCALATION_RUNS) {
    isBlindEscalation = true;
    failureSummary = `The GA4 visitor-data check has failed to complete for ${consecutiveErroredRuns} consecutive runs (${result.error ?? "unknown error"}) — the watchdog has effectively been blind for ~a day. Check the GA4 service-account credentials and property access.`;
  }

  heartbeat.record(
    log,
    now,
    failureSummary ? "unhealthy" : errored ? "errored" : "healthy",
  );

  if (!failureSummary) {
    if (errored) {
      log.warn(
        { error: result.error, consecutiveErroredRuns, configFingerprint: fingerprint },
        "GA4 visitor-data check errored (ambiguous — not alert-worthy yet)",
      );
    } else {
      // info (not debug): deployment logs must show each run's outcome.
      log.info(
        {
          activeUsers: result.activeUsers,
          sessions: result.sessions,
          sightMapEvents: result.sightMapEvents,
          window: `${WINDOW_START}..${WINDOW_END}`,
          configFingerprint: fingerprint,
        },
        "GA4 visitor-data check passed",
      );
    }
    return;
  }

  log.error(
    {
      activeUsers: result.activeUsers,
      sessions: result.sessions,
      sightMapEvents: result.sightMapEvents,
      error: result.error,
      configFingerprint: fingerprint,
    },
    "GA4 visitor-data check FAILED — real visitors are not showing up in Google Analytics",
  );

  try {
    // Zero-visitor FAIL and watchdog-blind escalation are different problems
    // with different fixes — separate daily dedupe slots (subKey).
    const isSightMapFailure = failureSummary.includes("SightMap");
    const claimOptions = isBlindEscalation
      ? { subKey: "blind" }
      : isSightMapFailure
        ? { subKey: "sightmap" }
        : undefined;
    if (!(await dailyClaim.claim(log, now, claimOptions))) return;
    if (!mailerConfigured()) return;
    await sendGa4DataCheckAlert({
      summary: failureSummary,
      activeUsers: result.activeUsers,
      window: `${WINDOW_START} → ${WINDOW_END}`,
      sessions: result.sessions,
      sightMapEvents: result.sightMapEvents,
    });
  } catch (err) {
    log.error({ err }, "Failed to send GA4-data failure alert");
  }
}

function isDefinitiveFailure(result: Ga4QueryResult, config: Ga4Config): boolean {
  if (result.activeUsers !== null && result.activeUsers <= config.minActiveUsers) return true;
  return sightMapFailureSummary(result, config) !== null;
}

function sightMapFailureSummary(
  result: Ga4QueryResult,
  config: Ga4Config,
): string | null {
  if (!result.sightMapEvents) return null;
  const tripwires = SIGHTMAP_TRIPWIRE_EVENTS.filter(
    (name) => (result.sightMapEvents?.[name] ?? 0) > 0,
  );
  if (tripwires.length > 0) {
    return `SightMap hidden-link tripwire event(s) became non-zero: ${tripwires
      .map((name) => `${name}=${result.sightMapEvents?.[name] ?? 0}`)
      .join(", ")}. The embed may be exposing an apply button or outbound link that should remain disabled.`;
  }
  if ((result.sessions ?? 0) < config.minSightMapSessions) return null;
  const missing = REQUIRED_SIGHTMAP_EVENTS.filter(
    (name) => (result.sightMapEvents?.[name] ?? 0) === 0,
  );
  if (missing.length === 0) return null;
  return `SightMap analytics disappeared despite ${result.sessions} site sessions between ${WINDOW_START} and ${WINDOW_END}: ${missing.join(", ")} recorded zero events (quiet-traffic floor: ${config.minSightMapSessions} sessions). Check GTM, consent, the embed SDK, and the SightMap property configuration.`;
}

/**
 * Start the periodic GA4 visitor-data watchdog. Production only.
 * Runs STARTUP_DELAY_MS after boot, then every CHECK_INTERVAL_MS. Alerts are
 * deduped to once per UTC day regardless of interval.
 */
export function startGa4DataCheck(log: Logger = defaultLogger): void {
  if (process.env.NODE_ENV !== "production") return;
  if (process.env.GA4_DATA_CHECK_DISABLED === "1") {
    log.warn({}, "GA4 visitor-data watchdog disabled via GA4_DATA_CHECK_DISABLED=1");
    return;
  }
  const startupTimer = setTimeout(() => void checkGa4DataOnce(log), STARTUP_DELAY_MS);
  startupTimer.unref?.();
  const timer = setInterval(() => void checkGa4DataOnce(log), CHECK_INTERVAL_MS);
  timer.unref?.();
  log.info(
    {
      intervalHours: CHECK_INTERVAL_MS / 3_600_000,
      startupDelaySeconds: STARTUP_DELAY_MS / 1000,
      window: `${WINDOW_START}..${WINDOW_END}`,
      sightMapEvents: SIGHTMAP_EVENTS,
    },
    "GA4 visitor-data watchdog started",
  );
  announceWatchdogStarted("ga4-visitor-data");
}

/** Test-only: clear the per-process fallback state. */
export function __resetGa4DataCheckForTests(): void {
  dailyClaim.reset();
  heartbeat.reset();
  consecutiveErroredRuns = 0;
  warnedUnsupported = false;
}
