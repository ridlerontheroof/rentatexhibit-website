import type { Logger } from "pino";
import { logger as defaultLogger } from "./logger";

/**
 * Deferred "watchdogs online" startup summary.
 *
 * The deploy runtime drops roughly the first ~25 seconds of container
 * stdout, so every watchdog's synchronous "… watchdog started" boot line
 * never reaches deployment logs. Each watchdog registers itself here at
 * start time (announceWatchdogStarted), and index.ts schedules a single
 * summary line (scheduleStartupSummary) emitted after the blackout window,
 * listing exactly which watchdogs actually started — production gates and
 * kill switches included, because a gated-off watchdog never registers.
 */

/** Emit the summary after the ~25s stdout blackout, with margin. */
export const STARTUP_SUMMARY_DELAY_MS = 30 * 1000;

/**
 * Canonical list of every watchdog that MUST be running in production.
 * Keep this in sync with the start*() calls in index.ts — the order matches
 * registration order there so diffs are obvious. The /watchdog-roster API
 * endpoint and check-watchdog-roster.mjs compare the live started set against
 * this list; any missing name causes a non-zero exit in check:postpublish.
 */
export const EXPECTED_WATCHDOGS = [
  "apex-redirect",
  "knowledge-pages",
  "floor-plan-pages",
  "showing-scheduler",
  "tour-unit",
  "apply-link",
  "rented-noindex",
  "legacy-redirects",
  "ga4-tracking",
  "ga4-visitor-data",
  "accepted-lead-silence",
  "starting-price",
  "seo-weekly-digest",
] as const;

const startedWatchdogs: string[] = [];
let summaryTimer: NodeJS.Timeout | null = null;

/**
 * Record that a watchdog started. Call exactly where the watchdog logs its
 * own "… watchdog started" line (i.e. after all early-return gates).
 */
export function announceWatchdogStarted(name: string): void {
  if (!startedWatchdogs.includes(name)) startedWatchdogs.push(name);
}

/**
 * Return a snapshot of the watchdogs that have registered so far.
 * Used by the /watchdog-roster API route so check-watchdog-roster.mjs can
 * verify the live server's started set against EXPECTED_WATCHDOGS without
 * scraping deployment logs.
 */
export function getStartedWatchdogs(): string[] {
  return [...startedWatchdogs];
}

/** Log the summary immediately (exported for tests and reuse). */
export function logStartupSummary(log: Logger = defaultLogger): void {
  log.info(
    {
      watchdogCount: startedWatchdogs.length,
      watchdogs: [...startedWatchdogs],
    },
    startedWatchdogs.length > 0
      ? `Watchdogs online: ${startedWatchdogs.join(", ")}`
      : "Watchdogs online: none started (non-production or all gated off)",
  );
}

/**
 * Schedule the one-shot deferred summary. Safe to call once at boot after
 * all start*() calls; the timer is unref'd so it never keeps a test process
 * alive.
 */
export function scheduleStartupSummary(
  log: Logger = defaultLogger,
  delayMs: number = STARTUP_SUMMARY_DELAY_MS,
): void {
  if (summaryTimer) return;
  summaryTimer = setTimeout(() => logStartupSummary(log), delayMs);
  summaryTimer.unref?.();
}

/** Test-only: clear registered watchdogs and any pending timer. */
export function __resetStartupSummaryForTests(): void {
  startedWatchdogs.length = 0;
  if (summaryTimer) clearTimeout(summaryTimer);
  summaryTimer = null;
}
