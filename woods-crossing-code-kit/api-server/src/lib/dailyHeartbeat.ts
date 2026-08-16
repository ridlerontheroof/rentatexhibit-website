import type { Logger } from "pino";

/**
 * Shared once-per-UTC-day liveness heartbeat for the watchdog modules
 * (apex-redirect check, fee-copy alert, knowledge-page check).
 *
 * Healthy watchdog checks log at debug level, which production (info-level)
 * suppresses — so without a heartbeat, a silently-dead interval is
 * indistinguishable from weeks of healthy checks. Each watchdog records
 * every check outcome here; the first check of the process emits an
 * immediate info line (so a fresh deploy's logs show liveness right away),
 * then one info line per UTC day summarizing the checks run since the
 * previous heartbeat.
 *
 * The factory is parameterized by the outcome labels (which double as the
 * per-outcome log field names) and the log message, so all three watchdogs
 * share the exact same day-rollover rule and log-line shape while keeping
 * their existing per-module messages and fields.
 */

export interface DailyHeartbeat<Outcome extends string> {
  /**
   * Record one check and, at most once per UTC day (after the first check
   * of a new day), emit the info-level heartbeat line and reset counters.
   */
  record(log: Logger, now: number, outcome: Outcome): void;
  /** Test-only: clear the day marker and all counters. */
  reset(): void;
}

/**
 * Once-per-UTC-day gate for promoting a high-frequency watchdog's
 * healthy-run log line from debug to info. Hourly probes would produce ~24
 * near-identical info lines a day if every pass logged at info; instead the
 * first healthy outcome of each UTC day logs at info (so deployment logs
 * always show a fresh confirmation) and the rest stay at debug.
 */
export interface DailyInfoGate {
  /** True exactly once per UTC day (including the first call of the process). */
  shouldInfo(now: number): boolean;
  /** Test-only: clear the day marker. */
  reset(): void;
}

export function createDailyInfoGate(): DailyInfoGate {
  let day: string | null = null;
  return {
    shouldInfo(now: number): boolean {
      const today = new Date(now).toISOString().slice(0, 10);
      if (day === today) return false;
      day = today;
      return true;
    },
    reset(): void {
      day = null;
    },
  };
}

export function createDailyHeartbeat<Outcome extends string>(options: {
  /** Outcome labels; each becomes a counter field in the heartbeat line. */
  outcomes: readonly Outcome[];
  /** Info-level message logged with each heartbeat. */
  message: string;
  /** Extra static fields merged into every heartbeat line (e.g. intervalHours). */
  extraFields?: Record<string, unknown>;
}): DailyHeartbeat<Outcome> {
  const { outcomes, message, extraFields } = options;

  let heartbeatDay: string | null = null;
  let checksSinceHeartbeat = 0;
  const counts = new Map<Outcome, number>();

  function resetCounters(): void {
    checksSinceHeartbeat = 0;
    for (const o of outcomes) counts.set(o, 0);
  }
  resetCounters();

  return {
    record(log: Logger, now: number, outcome: Outcome): void {
      checksSinceHeartbeat += 1;
      counts.set(outcome, (counts.get(outcome) ?? 0) + 1);

      const day = new Date(now).toISOString().slice(0, 10);
      if (heartbeatDay === null) {
        // First check of this process: emit immediately so a fresh deploy's
        // logs show liveness right away, then settle into once per UTC day.
        heartbeatDay = day;
      } else if (heartbeatDay === day) {
        return;
      }
      heartbeatDay = day;
      const fields: Record<string, unknown> = { checks: checksSinceHeartbeat };
      for (const o of outcomes) fields[o] = counts.get(o) ?? 0;
      if (extraFields) Object.assign(fields, extraFields);
      log.info(fields, message);
      resetCounters();
    },
    reset(): void {
      heartbeatDay = null;
      resetCounters();
    },
  };
}
