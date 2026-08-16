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
import { sendRentedCheckAlert } from "./email";

/**
 * Watchdog for rented-unit indexability (the second half of the web
 * artifact's `check:postpublish`).
 *
 * The knowledge-page half already runs always-on in this server
 * (knowledgeCheck.ts). This module completes the coverage: it periodically
 * runs the real `scripts/check-rented-noindex.mjs` from the web artifact as
 * a child process against production. That script renders a rented unit's
 * page in headless Chromium and asserts noindex/sold-out-title/no-Offer —
 * exactly what the workspace-only `postpublish` workflow runs, so there is
 * one implementation of the checks, not two.
 *
 * Environment reality: the deployed runtime ships no Chromium (only the
 * nodejs module closure). The script now degrades itself: with no Chromium
 * it runs a browserless HTTP-level subset (raw-page integrity + shipped
 * bundle still contains the sold-out/noindex logic) and exits 0/1 like the
 * full check, printing a "MODE: http-fallback" marker that this module
 * surfaces in its per-run log line. So:
 *   - "No headless Chromium found" (only possible from an older script
 *     build) → outcome `unsupported`: logged loudly, never emailed.
 *   - Spawn/timeout problems → outcome `errored`: ambiguous, logged only,
 *     but escalated to an alert after several consecutive runs (mirroring
 *     knowledgeCheck's unreachability escalation) via a counter persisted
 *     in the shared `email_throttle_counters` table.
 *   - Definitive FAIL exit → outcome `unhealthy`: email alert, at most one
 *     per UTC day, deduped cluster-wide (shared dailyClaim).
 *
 * The child process is fully isolated: a crashing or OOM-killed Chromium
 * cannot take the API server down, and a hard timeout kills a hung run.
 * Checks only run in production; RENTED_CHECK_DISABLED=1 is a kill switch.
 */

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 hours
/**
 * Delay before the startup (post-publish) run. Deployment log ingestion
 * provably drops the first ~25s of a fresh container's stdout (the 2026-07-26
 * publish lost every log line before 19:24:25Z), so an immediate fast-path
 * run would report its outcome into the void. One minute costs nothing at a
 * 6-hour cadence and makes the post-publish outcome visible in deploy logs.
 */
const STARTUP_DELAY_MS = 60 * 1000;
const RUN_TIMEOUT_MS = 8 * 60 * 1000; // generous: chromium boot + 2 page renders
const DAY_MS = 24 * 60 * 60 * 1000;
/** Consecutive errored runs (spawn/timeout) before escalating to an alert. */
const ERROR_ESCALATION_RUNS = 4;
/** Max characters of combined script output preserved for logs/alerts. */
const OUTPUT_TAIL_CHARS = 4000;

const SCRIPT_REL = path.join(
  "artifacts",
  "YOUR-PROPERTY-SLUG" // WOODS-CROSSING: replace with your artifact slug,
  "scripts",
  "check-rented-noindex.mjs",
);

const dailyClaim = createDailyClaim({
  prefix: "rentedcheck",
  claimFailedMessage:
    "Rented-check alert database claim failed; falling back to in-memory dedupe",
});

const heartbeat = createDailyHeartbeat({
  outcomes: ["healthy", "unhealthy", "unsupported", "errored"] as const,
  message:
    "Rented-unit indexability watchdog heartbeat — still running check-rented-noindex against production",
  extraFields: { intervalHours: CHECK_INTERVAL_MS / 3_600_000 },
});

/** Consecutive errored runs — per-process mirror of the shared counter. */
let consecutiveErroredRuns = 0;
/** Shared-table key holding the persisted consecutive-errored-run count. */
const ERROR_COUNTER_KEY = "rentedcheck:errored-runs";
/** Warn about a missing Chromium at most once per process. */
let warnedUnsupported = false;

/**
 * Locate the check script. The production run command starts from the repo
 * root, but walk upward a little so a different cwd cannot silently disable
 * the watchdog. Exported for tests.
 */
export function resolveCheckScript(cwd: string = process.cwd()): string | null {
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
export interface RentedCheckRun {
  /** Process exit code; null when the spawn itself failed or timed out. */
  exitCode: number | null;
  /** Tail of combined stdout+stderr (bounded). */
  outputTail: string;
  /** Spawn/timeout error message, when exitCode is null. */
  error?: string;
}

export type RentedCheckRunner = () => Promise<RentedCheckRun>;

/** Spawn `node check-rented-noindex.mjs`, capture output, enforce a timeout. */
export function runRentedCheckScript(scriptPath: string): Promise<RentedCheckRun> {
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
    const finish = (run: RentedCheckRun) => {
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
        error: `check-rented-noindex.mjs did not finish within ${RUN_TIMEOUT_MS / 60_000} minutes and was killed`,
      });
    }, RUN_TIMEOUT_MS);
    child.stdout.on("data", append);
    child.stderr.on("data", append);
    child.on("error", (err) =>
      finish({ exitCode: null, outputTail: output, error: err.message }),
    );
    child.on("close", (code) =>
      finish({ exitCode: code, outputTail: output }),
    );
  });
}

/** True when the run failed only because no headless Chromium exists here. */
export function isUnsupportedEnvironment(run: RentedCheckRun): boolean {
  return (
    run.exitCode !== 0 && /No headless Chromium found/i.test(run.outputTail)
  );
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
 * Run one rented-unit check and alert (once/day, cluster-deduped) on a
 * definitive failure. Best-effort: never throws.
 */
export async function checkRentedNoindexOnce(
  log: Logger = defaultLogger,
  now: number = Date.now(),
  runner?: RentedCheckRunner,
  scriptResolver: typeof resolveCheckScript = resolveCheckScript,
): Promise<void> {
  let run: RentedCheckRun;
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
          "Rented-unit check script not found — the deployed bundle is missing the web artifact's scripts; the rented-noindex half of check:postpublish is NOT running here",
        );
      }
      return;
    }
    run = await runRentedCheckScript(script);
  }

  // --- classify ------------------------------------------------------------
  if (run.exitCode !== 0 && isUnsupportedEnvironment(run)) {
    heartbeat.record(log, now, "unsupported");
    if (!warnedUnsupported) {
      warnedUnsupported = true;
      log.warn(
        {},
        "Rented-unit check cannot run here: no headless Chromium in this environment. The workspace `postpublish` watcher still covers this check; only the knowledge-page half runs always-on.",
      );
    }
    return;
  }

  const errored = run.exitCode === null;
  if (errored) {
    consecutiveErroredRuns += 1;
    try {
      const shared = await bumpErroredShared(now);
      consecutiveErroredRuns = Math.max(consecutiveErroredRuns, shared);
    } catch (err) {
      log.error(
        { err },
        "Failed to persist rented-check errored-run counter; using in-memory count",
      );
    }
  } else {
    consecutiveErroredRuns = 0;
    try {
      await resetErroredShared();
    } catch (err) {
      log.error(
        { err },
        "Failed to clear persisted rented-check errored-run counter",
      );
    }
  }

  let failureSummary: string | null = null;
  let isBlindEscalation = false;
  if (run.exitCode !== null && run.exitCode !== 0) {
    failureSummary = `check-rented-noindex.mjs exited ${run.exitCode} — a rented apartment page may be indexable with stale pricing.`;
  } else if (errored && consecutiveErroredRuns >= ERROR_ESCALATION_RUNS) {
    isBlindEscalation = true;
    failureSummary = `The rented-unit indexability check has failed to complete for ${consecutiveErroredRuns} consecutive runs (${run.error ?? "unknown error"}) — the watchdog has effectively been blind for ~a day.`;
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
        "Rented-unit check run errored (ambiguous — not alert-worthy yet)",
      );
    } else {
      // info (not debug): deployment logs must show each run's outcome —
      // the once-daily heartbeat alone is too sparse to confirm a publish.
      log.info(
        { mode: /MODE: http-fallback/.test(run.outputTail) ? "http-fallback" : "chromium" },
        "Rented-unit indexability check passed",
      );
    }
    return;
  }

  log.error(
    { exitCode: run.exitCode, error: run.error, outputTail: run.outputTail },
    "Rented-unit indexability check FAILED against production",
  );

  try {
    // The definitive-FAIL alert and the watchdog-blind escalation are
    // different problems with different fixes — give each its own daily
    // dedupe slot (subKey) so a same-day FAIL alert can't swallow the
    // escalation email, or vice versa.
    const claimOptions = isBlindEscalation ? { subKey: "blind" } : undefined;
    if (!(await dailyClaim.claim(log, now, claimOptions))) return;
    if (!mailerConfigured()) return;
    await sendRentedCheckAlert({
      summary: failureSummary,
      outputTail: run.outputTail,
    });
  } catch (err) {
    log.error({ err }, "Failed to send rented-check failure alert");
  }
}

/**
 * Start the periodic rented-unit indexability watchdog. Production only.
 * Runs the post-publish check STARTUP_DELAY_MS after boot (a publish
 * restarts this server; the delay keeps the outcome out of the log-ingestion
 * blind spot at container start), then repeats every CHECK_INTERVAL_MS.
 */
export function startRentedNoindexCheck(log: Logger = defaultLogger): void {
  if (process.env.NODE_ENV !== "production") return;
  if (process.env.RENTED_CHECK_DISABLED === "1") {
    log.warn({}, "Rented-unit indexability watchdog disabled via RENTED_CHECK_DISABLED=1");
    return;
  }
  const startupTimer = setTimeout(
    () => void checkRentedNoindexOnce(log),
    STARTUP_DELAY_MS,
  );
  startupTimer.unref?.();
  const timer = setInterval(
    () => void checkRentedNoindexOnce(log),
    CHECK_INTERVAL_MS,
  );
  timer.unref?.();
  log.info(
    {
      intervalHours: CHECK_INTERVAL_MS / 3_600_000,
      startupDelaySeconds: STARTUP_DELAY_MS / 1000,
    },
    "Rented-unit indexability watchdog started",
  );
  announceWatchdogStarted("rented-noindex");
}

/** Test-only: clear the per-process fallback state. */
export function __resetRentedCheckForTests(): void {
  dailyClaim.reset();
  heartbeat.reset();
  consecutiveErroredRuns = 0;
  warnedUnsupported = false;
}
