import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { logger } from "./logger";
import { mailerConfigured } from "./mailer";
import { sendFeeCopyAlert } from "./email";

/**
 * Notify the leasing team when the fee-policy sanitizer actually removes
 * copy from an AppFolio listing (description sentence or detail line item).
 *
 * The sanitizer keeps the *site* consistent with the leasing-confirmed fee
 * policy, but the contradictory text still lives in AppFolio — on its hosted
 * listing pages and in ILS syndication — so the leasing team needs to fix it
 * at the source. The availability cache warmer refetches every ~4.5 minutes,
 * which would re-detect the same unchanged text hundreds of times a day;
 * this module dedupes to at most one email per offending (unit, text) pair
 * per UTC day.
 *
 * The dedupe key lives in PostgreSQL (the same `email_throttle_counters`
 * table the confirmation-email throttle uses), so the "once per day" rule is
 * enforced *cluster-wide*: on an autoscale deployment every replica shares
 * the same daily claims, and restarts/cold starts cannot re-send. Claiming is
 * a single `INSERT … ON CONFLICT DO NOTHING RETURNING`, so two concurrent
 * replicas can never both win the same (unit, text, day) claim.
 *
 * If the database is unreachable, the guard falls back to the previous
 * per-process in-memory map — a DB outage degrades dedupe to per-replica
 * instead of either disabling alerts or spamming the inbox.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** hash(unit + removed text) → UTC day ("YYYY-MM-DD") it was last notified.
 *  In-memory fallback, only authoritative when the database is unreachable. */
const notifiedOn = new Map<string, string>();

function utcDay(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

function keyFor(unit: string, text: string): string {
  return createHash("sha256").update(`${unit}\n${text}`).digest("hex");
}

/**
 * Try to claim the shared once-per-day slot for a (unit, text) hash.
 * Returns true when this process won the claim (nobody notified today yet).
 * Throws when the database is unreachable — the caller falls back to memory.
 */
async function claimShared(
  hash: string,
  day: string,
  now: number,
): Promise<boolean> {
  // Rows become irrelevant once their UTC day has passed; keep them for two
  // days so debugging is possible, then the throttle's sweep removes them.
  const expiresAt = new Date(now + 2 * DAY_MS);
  const result = await db.execute(sql`
    INSERT INTO email_throttle_counters (key, count, expires_at)
    VALUES (${`feecopy:${hash}:${day}`}, 1, ${expiresAt})
    ON CONFLICT (key) DO NOTHING
    RETURNING count
  `);
  return result.rows.length > 0;
}

/** Opportunistically sweep expired rows so the shared table can't grow unbounded. */
async function sweepExpired(now: number): Promise<void> {
  try {
    await db.execute(
      sql`DELETE FROM email_throttle_counters WHERE expires_at < ${new Date(now)}`,
    );
  } catch (err) {
    logger.warn({ err }, "Failed to sweep expired fee-copy alert claims");
  }
}

/** Per-process claim used as the fallback when the database is unreachable. */
function claimInMemory(hash: string, day: string): boolean {
  if (notifiedOn.get(hash) === day) return false;
  notifiedOn.set(hash, day);
  return true;
}

/**
 * Report sanitizer-stripped listing copy for a unit. Logs every new finding
 * and emails the leasing inbox at most once per (unit, text) per UTC day —
 * cluster-wide via the shared database claim. Best-effort: never throws, so
 * a mail or DB outage can't fail the availability refresh that detected the
 * problem.
 */
export async function reportStrippedFeeCopy(
  unit: string,
  removed: string[],
  now: number = Date.now(),
): Promise<void> {
  try {
    const day = utcDay(now);
    // Only items not yet notified today trigger an email; claiming happens
    // before the send so a slow send can't race a concurrent re-detection
    // into a duplicate. (A failed send is retried naturally the next day —
    // the copy is still wrong in AppFolio until a human fixes it.)
    const fresh: string[] = [];
    for (const text of [...new Set(removed)]) {
      const hash = keyFor(unit, text);
      let claimed: boolean;
      try {
        claimed = await claimShared(hash, day, now);
        // Mirror successful shared claims into memory so a later DB outage
        // (same process, same day) still can't re-send.
        if (claimed) notifiedOn.set(hash, day);
      } catch (err) {
        logger.error(
          { err, unit },
          "Fee-copy alert database claim failed; falling back to in-memory dedupe",
        );
        claimed = claimInMemory(hash, day);
      }
      if (claimed) fresh.push(text);
    }
    if (fresh.length === 0) return;

    logger.warn(
      { unit, removed: fresh },
      "AppFolio listing copy contradicts the published fee policy; stripped from the site — notifying leasing team",
    );

    // ~1% of alerts also sweep expired shared rows; cheap and unbounded-safe.
    if (Math.random() < 0.01) void sweepExpired(now);

    if (!mailerConfigured()) return;
    await sendFeeCopyAlert({ unit, removed: fresh });

    // Sweep stale entries so the fallback map can't grow unbounded across weeks.
    for (const [key, seenDay] of notifiedOn) {
      if (seenDay !== day) notifiedOn.delete(key);
    }
  } catch (err) {
    logger.error({ err, unit }, "Failed to send fee-copy contradiction alert");
  }
}

/** Test-only: clear the per-process fallback dedupe state. */
export function __resetFeeCopyAlertForTests(): void {
  notifiedOn.clear();
}
