import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import type { Logger } from "pino";
import { logger as defaultLogger } from "./logger";
import { createDailyClaim } from "./dailyClaim";
import { createDailyHeartbeat } from "./dailyHeartbeat";
import { mailerConfigured } from "./mailer";
import { sendRedirectCheckAlert } from "./email";

/**
 * Watchdog for legacy-URL 301 redirects (the always-on twin of the web
 * artifact's `scripts/check-legacy-redirects.mjs`, which the workspace-only
 * postpublish watcher runs).
 *
 * Every legacy URL in the web artifact's src/data/legacyRedirects.ts must
 * answer a SINGLE-HOP 301 to its mapped target on the live site. A publish
 * can silently break this (a missing artifact.toml rewrite pair drops the
 * prerendered redirect stub, so the server never learns the 301) — after
 * which Google-indexed legacy URLs soft-404 into the SPA shell.
 *
 * This module periodically runs the real check script as a child process, so
 * there is one implementation of the checks (including the TS-source parser
 * with its exact-count guard), not two. A publish restarts this server, so
 * the delayed start-up run doubles as the post-publish check; the interval
 * then catches anything that breaks later. The script needs only Node's
 * global fetch — no Chromium — so it runs fully in the deployed runtime.
 *
 * Classification mirrors rentedCheck.ts:
 *   - Definitive FAIL exit (broken/missing 301) → outcome `unhealthy`:
 *     email alert, at most one per UTC day, deduped cluster-wide via the
 *     shared dailyClaim.
 *   - Spawn/timeout problems → outcome `errored`: ambiguous, logged only,
 *     but escalated to an alert after several consecutive runs via a counter
 *     persisted in the shared `email_throttle_counters` table.
 *   - Missing script in the deployed bundle → outcome `unsupported`: logged
 *     loudly once, never emailed.
 * Checks only run in production; REDIRECT_CHECK_DISABLED=1 is a kill switch.
 */

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 hours
/**
 * Delay before the startup (post-publish) run. Deployment log ingestion
 * drops the first ~25s of a fresh container's stdout, so an immediate run
 * would report its outcome into the void (same rationale as rentedCheck).
 */
const STARTUP_DELAY_MS = 60 * 1000;
/** ~24 sequential fetches against production; 3 minutes is generous. */
const RUN_TIMEOUT_MS = 3 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
/** Consecutive errored runs (spawn/timeout) before escalating to an alert. */
const ERROR_ESCALATION_RUNS = 4;
/** Max characters of combined script output preserved for logs/alerts. */
const OUTPUT_TAIL_CHARS = 4000;

const SCRIPT_REL = path.join(
  "artifacts",
  "exhibit-on-superior",
  "scripts",
  "check-legacy-redirects.mjs",
);

const dailyClaim = createDailyClaim({
  prefix: "redirectcheck",
  claimFailedMessage:
    "Redirect-check alert database claim failed; falling back to in-memory dedupe",
});

const heartbeat = createDailyHeartbeat({
  outcomes: ["healthy", "unhealthy", "unsupported", "errored"] as const,
  message:
    "Legacy-redirect watchdog heartbeat — still checking live 301s against production",
  extraFields: { intervalHours: CHECK_INTERVAL_MS / 3_600_000 },
});

/** Consecutive errored runs — per-process mirror of the shared counter. */
let consecutiveErroredRuns = 0;
/** Shared-table key holding the persisted consecutive-errored-run count. */
const ERROR_COUNTER_KEY = "redirectcheck:errored-runs";
/** Warn about a missing script at most once per process. */
let warnedUnsupported = false;

/**
 * Locate the check script. The production run command starts from the repo
 * root, but walk upward a little so a different cwd cannot silently disable
 * the watchdog. Exported for tests.
 */
export function resolveRedirectCheckScript(
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
export interface RedirectCheckRun {
  /** Process exit code; null when the spawn itself failed or timed out. */
  exitCode: number | null;
  /** Tail of combined stdout+stderr (bounded). */
  outputTail: string;
  /** Spawn/timeout error message, when exitCode is null. */
  error?: string;
}

export type RedirectCheckRunner = () => Promise<RedirectCheckRun>;

/** Spawn `node check-legacy-redirects.mjs`, capture output, enforce a timeout. */
export function runRedirectCheckScript(
  scriptPath: string,
): Promise<RedirectCheckRun> {
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
    const finish = (run: RedirectCheckRun) => {
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
        error: `check-legacy-redirects.mjs did not finish within ${RUN_TIMEOUT_MS / 60_000} minutes and was killed`,
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
 * Run one legacy-redirect check and alert (once/day, cluster-deduped) on a
 * definitive failure. Best-effort: never throws.
 */
export async function checkLegacyRedirectsOnce(
  log: Logger = defaultLogger,
  now: number = Date.now(),
  runner?: RedirectCheckRunner,
  scriptResolver: typeof resolveRedirectCheckScript = resolveRedirectCheckScript,
): Promise<void> {
  let run: RedirectCheckRun;
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
          "Legacy-redirect check script not found — the deployed bundle is missing the web artifact's scripts; the legacy-redirect half of check:postpublish is NOT running here",
        );
      }
      return;
    }
    run = await runRedirectCheckScript(script);
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
        "Failed to persist redirect-check errored-run counter; using in-memory count",
      );
    }
  } else {
    consecutiveErroredRuns = 0;
    try {
      await resetErroredShared();
    } catch (err) {
      log.error(
        { err },
        "Failed to clear persisted redirect-check errored-run counter",
      );
    }
  }

  let failureSummary: string | null = null;
  let isBlindEscalation = false;
  if (run.exitCode !== null && run.exitCode !== 0) {
    failureSummary = `check-legacy-redirects.mjs exited ${run.exitCode} — a Google-indexed legacy URL may be soft-404ing into the SPA shell instead of 301-redirecting.`;
  } else if (errored && consecutiveErroredRuns >= ERROR_ESCALATION_RUNS) {
    isBlindEscalation = true;
    failureSummary = `The legacy-redirect check has failed to complete for ${consecutiveErroredRuns} consecutive runs (${run.error ?? "unknown error"}) — the watchdog has effectively been blind for ~a day.`;
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
        "Legacy-redirect check run errored (ambiguous — not alert-worthy yet)",
      );
    } else {
      // info (not debug): deployment logs must show each run's outcome —
      // the once-daily heartbeat alone is too sparse to confirm a publish.
      log.info({}, "Legacy-redirect check passed");
    }
    return;
  }

  log.error(
    { exitCode: run.exitCode, error: run.error, outputTail: run.outputTail },
    "Legacy-redirect check FAILED against production",
  );

  try {
    // The definitive-FAIL alert and the watchdog-blind escalation are
    // different problems with different fixes — give each its own daily
    // dedupe slot (subKey) so a same-day FAIL alert can't swallow the
    // escalation email, or vice versa.
    const claimOptions = isBlindEscalation ? { subKey: "blind" } : undefined;
    if (!(await dailyClaim.claim(log, now, claimOptions))) return;
    if (!mailerConfigured()) return;
    await sendRedirectCheckAlert({
      summary: failureSummary,
      outputTail: run.outputTail,
    });
  } catch (err) {
    log.error({ err }, "Failed to send redirect-check failure alert");
  }
}

/**
 * Start the periodic legacy-redirect watchdog. Production only.
 * Runs the post-publish check STARTUP_DELAY_MS after boot (a publish
 * restarts this server; the delay keeps the outcome out of the log-ingestion
 * blind spot at container start), then repeats every CHECK_INTERVAL_MS.
 */
export function startLegacyRedirectCheck(log: Logger = defaultLogger): void {
  if (process.env.NODE_ENV !== "production") return;
  if (process.env.REDIRECT_CHECK_DISABLED === "1") {
    log.warn({}, "Legacy-redirect watchdog disabled via REDIRECT_CHECK_DISABLED=1");
    return;
  }
  const startupTimer = setTimeout(
    () => void checkLegacyRedirectsOnce(log),
    STARTUP_DELAY_MS,
  );
  startupTimer.unref?.();
  const timer = setInterval(
    () => void checkLegacyRedirectsOnce(log),
    CHECK_INTERVAL_MS,
  );
  timer.unref?.();
  log.info(
    {
      intervalHours: CHECK_INTERVAL_MS / 3_600_000,
      startupDelaySeconds: STARTUP_DELAY_MS / 1000,
    },
    "Legacy-redirect watchdog started",
  );
}

/** Test-only: clear the per-process fallback state. */
export function __resetRedirectCheckForTests(): void {
  dailyClaim.reset();
  heartbeat.reset();
  consecutiveErroredRuns = 0;
  warnedUnsupported = false;
}
