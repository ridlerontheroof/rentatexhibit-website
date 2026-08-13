import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import type { Logger } from "pino";
import { logger as defaultLogger } from "./logger";
import { announceWatchdogStarted } from "./startupSummary";
import { createDailyClaim } from "./dailyClaim";
import { createDailyHeartbeat } from "./dailyHeartbeat";
import { mailerConfigured } from "./mailer";
import { sendGtmCheckAlert } from "./email";

/**
 * Watchdog for GA4 visitor tracking (the always-on twin of the web
 * artifact's `scripts/check-gtm-tracking.mjs`, which the workspace-only
 * postpublish watcher runs).
 *
 * Google Analytics was silently off for weeks because the GTM container was
 * published EMPTY — gtm.js still loaded, nothing on the site broke, and no
 * page view was ever sent. The check fetches the PUBLISHED container from
 * Google's CDN and fails unless the expected GA4 measurement ID is present,
 * so a republish-without-the-tag becomes a loud alert instead of weeks of
 * missing data.
 *
 * This module periodically runs the real check script as a child process, so
 * there is one implementation of the check (container-ID parse from
 * index.html, expected-measurement-ID guard), not two. The script needs only
 * Node's global fetch — no Chromium — so it runs fully in the deployed
 * runtime. Note the trigger here is a GTM-side publish (Google Tag Manager),
 * which does NOT restart this server — the 6-hour interval is the real
 * detection path; the startup run just covers site publishes too.
 *
 * Classification mirrors redirectCheck.ts:
 *   - Definitive FAIL exit (no/wrong measurement ID, unpublished container)
 *     → outcome `unhealthy`: email alert, at most one per UTC day, deduped
 *     cluster-wide via the shared dailyClaim.
 *   - Spawn/timeout problems → outcome `errored`: ambiguous, logged only,
 *     but escalated to an alert after several consecutive runs via a counter
 *     persisted in the shared `email_throttle_counters` table.
 *   - Missing script in the deployed bundle → outcome `unsupported`: logged
 *     loudly once, never emailed.
 * Checks only run in production; GTM_CHECK_DISABLED=1 is a kill switch.
 */

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 hours
/**
 * Delay before the startup run. Deployment log ingestion drops the first
 * ~25s of a fresh container's stdout, so an immediate run would report its
 * outcome into the void (same rationale as redirectCheck).
 */
const STARTUP_DELAY_MS = 60 * 1000;
/** One fetch against Google's CDN; a minute is generous. */
const RUN_TIMEOUT_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
/** Consecutive errored runs (spawn/timeout) before escalating to an alert. */
const ERROR_ESCALATION_RUNS = 4;
/** Max characters of combined script output preserved for logs/alerts. */
const OUTPUT_TAIL_CHARS = 4000;

const SCRIPT_REL = path.join(
  "artifacts",
  "exhibit-on-superior",
  "scripts",
  "check-gtm-tracking.mjs",
);

const dailyClaim = createDailyClaim({
  prefix: "gtmcheck",
  claimFailedMessage:
    "GTM-check alert database claim failed; falling back to in-memory dedupe",
});

const heartbeat = createDailyHeartbeat({
  outcomes: ["healthy", "unhealthy", "unsupported", "errored"] as const,
  message:
    "GA4 tracking watchdog heartbeat — still checking the published GTM container for the GA4 tag",
  extraFields: { intervalHours: CHECK_INTERVAL_MS / 3_600_000 },
});

/** Consecutive errored runs — per-process mirror of the shared counter. */
let consecutiveErroredRuns = 0;
/** Shared-table key holding the persisted consecutive-errored-run count. */
const ERROR_COUNTER_KEY = "gtmcheck:errored-runs";
/** Warn about a missing script at most once per process. */
let warnedUnsupported = false;

/**
 * Locate the check script. The production run command starts from the repo
 * root, but walk upward a little so a different cwd cannot silently disable
 * the watchdog. Exported for tests.
 */
export function resolveGtmCheckScript(
  cwd: string = process.cwd(),
): string | null {
  let dir = cwd;
  for (let i = 0; i < 4; i++) {
    const candidate = path.join(dir, SCRIPT_REL);
    if (existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

/** Result of one child-process run of the check script. */
export interface GtmCheckRun {
  /** Process exit code; null when the spawn itself failed or timed out. */
  exitCode: number | null;
  /** Tail of combined stdout+stderr (bounded). */
  outputTail: string;
  /** Spawn/timeout error message, when exitCode is null. */
  error?: string;
}

export type GtmCheckRunner = () => Promise<GtmCheckRun>;

/** Spawn `node check-gtm-tracking.mjs`, capture output, enforce a timeout. */
export function runGtmCheckScript(scriptPath: string): Promise<GtmCheckRun> {
  return new Promise((resolve) => {
    let output = "";
    const append = (chunk: Buffer) => {
      output = (output + chunk.toString()).slice(-OUTPUT_TAIL_CHARS * 2);
    };
    const child = spawn(process.execPath, [scriptPath], {
      cwd: path.dirname(scriptPath),
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });
    let settled = false;
    const finish = (run: GtmCheckRun) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ ...run, outputTail: run.outputTail.slice(-OUTPUT_TAIL_CHARS) });
    };
    const timer = setTimeout(() => {
      try {
        child.kill("SIGKILL");
      } catch {
        /* already gone */
      }
      finish({
        exitCode: null,
        outputTail: output,
        error: `check-gtm-tracking.mjs did not finish within ${RUN_TIMEOUT_MS / 1000} seconds and was killed`,
      });
    }, RUN_TIMEOUT_MS);
    child.stdout.on("data", append);
    child.stderr.on("data", append);
    child.on("error", (err) =>
      finish({ exitCode: null, outputTail: output, error: err.message }),
    );
    child.on("close", (code) => finish({ exitCode: code, outputTail: output }));
  });
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
 * Run one GTM/GA4 tracking check and alert (once/day, cluster-deduped) on a
 * definitive failure. Best-effort: never throws.
 */
export async function checkGtmTrackingOnce(
  log: Logger = defaultLogger,
  now: number = Date.now(),
  runner?: GtmCheckRunner,
  scriptResolver: typeof resolveGtmCheckScript = resolveGtmCheckScript,
): Promise<void> {
  let run: GtmCheckRun;
  if (runner) {
    run = await runner();
  } else {
    const script = scriptResolver();
    if (!script) {
      heartbeat.record(log, now, "unsupported");
      if (!warnedUnsupported) {
        warnedUnsupported = true;
        log.error(
          { script: SCRIPT_REL, cwd: process.cwd() },
          "GTM tracking check script not found — the deployed bundle is missing the web artifact's scripts; the GA4-tracking watchdog is NOT running here",
        );
      }
      return;
    }
    run = await runGtmCheckScript(script);
  }

  // --- classify ------------------------------------------------------------
  const errored = run.exitCode === null;
  if (errored) {
    consecutiveErroredRuns += 1;
    try {
      const shared = await bumpErroredShared(now);
      consecutiveErroredRuns = Math.max(consecutiveErroredRuns, shared);
    } catch (err) {
      log.error(
        { err },
        "Failed to persist GTM-check errored-run counter; using in-memory count",
      );
    }
  } else {
    consecutiveErroredRuns = 0;
    try {
      await resetErroredShared();
    } catch (err) {
      log.error(
        { err },
        "Failed to clear persisted GTM-check errored-run counter",
      );
    }
  }

  let failureSummary: string | null = null;
  let isBlindEscalation = false;
  if (run.exitCode !== null && run.exitCode !== 0) {
    failureSummary = `check-gtm-tracking.mjs exited ${run.exitCode} — the published GTM container is missing the GA4 tag (or is unpublished), so visitor tracking is silently OFF.`;
  } else if (errored && consecutiveErroredRuns >= ERROR_ESCALATION_RUNS) {
    isBlindEscalation = true;
    failureSummary = `The GA4 tracking check has failed to complete for ${consecutiveErroredRuns} consecutive runs (${run.error ?? "unknown error"}) — the watchdog has effectively been blind for ~a day.`;
  }

  heartbeat.record(
    log,
    now,
    failureSummary ? "unhealthy" : errored ? "errored" : "healthy",
  );

  if (!failureSummary) {
    if (errored) {
      log.warn(
        { error: run.error, consecutiveErroredRuns },
        "GTM tracking check run errored (ambiguous — not alert-worthy yet)",
      );
    } else {
      // info (not debug): deployment logs must show each run's outcome —
      // the once-daily heartbeat alone is too sparse to confirm a publish.
      log.info({}, "GTM tracking check passed");
    }
    return;
  }

  log.error(
    { exitCode: run.exitCode, error: run.error, outputTail: run.outputTail },
    "GTM tracking check FAILED — visitor tracking may be silently off",
  );

  try {
    // The definitive-FAIL alert and the watchdog-blind escalation are
    // different problems with different fixes — give each its own daily
    // dedupe slot (subKey) so a same-day FAIL alert can't swallow the
    // escalation email, or vice versa.
    const claimOptions = isBlindEscalation ? { subKey: "blind" } : undefined;
    if (!(await dailyClaim.claim(log, now, claimOptions))) return;
    if (!mailerConfigured()) return;
    await sendGtmCheckAlert({
      summary: failureSummary,
      outputTail: run.outputTail,
    });
  } catch (err) {
    log.error({ err }, "Failed to send GTM-check failure alert");
  }
}

/**
 * Start the periodic GA4-tracking watchdog. Production only.
 * Runs STARTUP_DELAY_MS after boot (keeps the outcome out of the
 * log-ingestion blind spot at container start), then repeats every
 * CHECK_INTERVAL_MS — the interval is the real detection path, since a
 * GTM-side republish never restarts this server.
 */
export function startGtmTrackingCheck(log: Logger = defaultLogger): void {
  if (process.env.NODE_ENV !== "production") return;
  if (process.env.GTM_CHECK_DISABLED === "1") {
    log.warn({}, "GA4 tracking watchdog disabled via GTM_CHECK_DISABLED=1");
    return;
  }
  const startupTimer = setTimeout(
    () => void checkGtmTrackingOnce(log),
    STARTUP_DELAY_MS,
  );
  startupTimer.unref?.();
  const timer = setInterval(
    () => void checkGtmTrackingOnce(log),
    CHECK_INTERVAL_MS,
  );
  timer.unref?.();
  log.info(
    {
      intervalHours: CHECK_INTERVAL_MS / 3_600_000,
      startupDelaySeconds: STARTUP_DELAY_MS / 1000,
    },
    "GA4 tracking watchdog started",
  );
  announceWatchdogStarted("ga4-tracking");
}

/** Test-only: clear the per-process fallback state. */
export function __resetGtmCheckForTests(): void {
  dailyClaim.reset();
  heartbeat.reset();
  consecutiveErroredRuns = 0;
  warnedUnsupported = false;
}
