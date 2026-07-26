import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import type { Logger } from "pino";

/**
 * Shared once-per-UTC-day alert dedupe claim for the watchdog modules
 * (apex-redirect check, knowledge-page check, fee-copy alert).
 *
 * The claim lives in PostgreSQL (the shared `email_throttle_counters`
 * table), so the "once per day" rule is enforced *cluster-wide*: on an
 * autoscale deployment every replica shares the same daily claims, and
 * restarts/cold starts cannot re-send. Claiming is a single
 * `INSERT … ON CONFLICT DO NOTHING RETURNING`, so two concurrent replicas
 * can never both win the same claim.
 *
 * If the database is unreachable, the claim falls back to a per-process
 * in-memory map — a DB outage degrades dedupe to per-replica instead of
 * either disabling alerts or spamming the inbox. Successful shared claims
 * are mirrored into the in-memory map so a later DB outage the same day
 * (same process) still can't re-send.
 *
 * The factory is parameterized by the throttle-key prefix and the
 * fallback-path log message, so all three watchdogs share the exact same
 * claim/expiry/fallback rule while keeping their existing throttle keys and
 * log messages. The fee-copy alert additionally keys claims by a per-finding
 * `subKey` (its (unit, text) hash); the other two use the plain daily key.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export interface DailyClaim {
  /**
   * Try to claim today's alert slot (optionally scoped by `subKey`).
   * Returns true when this process won the claim. Never throws: a database
   * failure logs `claimFailedMessage` (merged with `logFields`) at error
   * level and falls back to the per-process in-memory dedupe.
   */
  claim(
    log: Logger,
    now: number,
    options?: { subKey?: string; logFields?: Record<string, unknown> },
  ): Promise<boolean>;
  /** Test-only: clear the per-process fallback dedupe state. */
  reset(): void;
}

function utcDay(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

export function createDailyClaim(options: {
  /** Throttle-key prefix, e.g. "apexredirect" → key "apexredirect:<day>". */
  prefix: string;
  /** Error-level message logged when the database claim fails. */
  claimFailedMessage: string;
}): DailyClaim {
  const { prefix, claimFailedMessage } = options;

  /** subKey ("" when unkeyed) → UTC day ("YYYY-MM-DD") last claimed.
   *  In-memory fallback, only authoritative when the database is unreachable. */
  const claimedOn = new Map<string, string>();

  /**
   * Try to claim the shared once-per-day alert slot. Returns true when this
   * process won the claim. Throws when the database is unreachable — the
   * caller falls back to per-process memory.
   */
  async function claimShared(key: string, now: number): Promise<boolean> {
    // Rows become irrelevant once their UTC day has passed; keep them for two
    // days so debugging is possible, then the throttle's sweep removes them.
    const expiresAt = new Date(now + 2 * DAY_MS);
    const result = await db.execute(sql`
      INSERT INTO email_throttle_counters (key, count, expires_at)
      VALUES (${key}, 1, ${expiresAt})
      ON CONFLICT (key) DO NOTHING
      RETURNING count
    `);
    return result.rows.length > 0;
  }

  /** Per-process claim used as the fallback when the database is unreachable. */
  function claimInMemory(subKey: string, day: string): boolean {
    if (claimedOn.get(subKey) === day) return false;
    claimedOn.set(subKey, day);
    return true;
  }

  /** Sweep stale entries so the fallback map can't grow unbounded across weeks. */
  function sweepMemory(day: string): void {
    for (const [key, seenDay] of claimedOn) {
      if (seenDay !== day) claimedOn.delete(key);
    }
  }

  return {
    async claim(log, now, opts) {
      const subKey = opts?.subKey ?? "";
      const day = utcDay(now);
      const key =
        subKey === ""
          ? `${prefix}:${day}`
          : `${prefix}:${subKey}:${day}`;
      let claimed: boolean;
      try {
        claimed = await claimShared(key, now);
        // Mirror successful shared claims so a later DB outage the same day
        // (same process) still can't re-send.
        if (claimed) claimedOn.set(subKey, day);
      } catch (err) {
        log.error({ ...opts?.logFields, err }, claimFailedMessage);
        claimed = claimInMemory(subKey, day);
      }
      sweepMemory(day);
      return claimed;
    },
    reset() {
      claimedOn.clear();
    },
  };
}
