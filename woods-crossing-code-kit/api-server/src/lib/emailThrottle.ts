import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { logger } from "./logger";

/**
 * Defense-in-depth throttling for outbound *prospect confirmation* emails.
 *
 * The per-IP rate limit on `POST /api/leads` only slows a single client. An
 * attacker with many IPs (cloud VMs, residential proxies, a botnet) can rotate
 * addresses and keep submitting, which would otherwise let them aim a stream of
 * "confirmation" emails — sent from the leasing team's Gmail account — at any
 * inbox they supply in the `email` field.
 *
 * These caps are keyed on things the attacker cannot rotate for free:
 *   - the *recipient* address (blocks flooding one victim inbox), and
 *   - the *total* number of confirmations sent (blocks using us as a spam
 *     cannon and protects the sending account from Gmail throttling/suspension).
 *
 * The counters live in PostgreSQL (`email_throttle_counters`) so the caps are
 * enforced *cluster-wide*: on an autoscale deployment every replica shares the
 * same daily buckets, and an attacker spreading requests across replicas can
 * no longer multiply the effective limit by the replica count. Each bucket
 * covers one UTC day and is incremented atomically with
 * `INSERT … ON CONFLICT DO UPDATE … WHERE count < max`.
 *
 * If the database is unreachable, the guard fails over to per-process
 * in-memory counters — the same behaviour as before the shared counters
 * existed — so a database outage degrades the guard to per-replica caps
 * instead of either disabling it or blocking legitimate confirmations.
 */

/** Rolling window used by the in-memory fallback counters. */
const WINDOW_MS = 24 * 60 * 60 * 1000;

function positiveIntFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

/** Max confirmation emails delivered to a single address within the window. */
const PER_RECIPIENT_MAX = positiveIntFromEnv(
  "CONFIRMATION_EMAIL_PER_RECIPIENT_DAILY_MAX",
  3,
);

/** Max confirmation emails delivered across all recipients within the window. */
const GLOBAL_MAX = positiveIntFromEnv(
  "CONFIRMATION_EMAIL_GLOBAL_DAILY_MAX",
  300,
);

/** Normalize an email so simple casing/whitespace tricks can't split the count. */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** UTC day stamp (YYYY-MM-DD) used to bucket the shared counters. */
function utcDay(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

/**
 * Atomically increment the shared counter for `key` unless it has already
 * reached `max`. Returns `true` when the increment happened (send allowed).
 *
 * Uses a single upsert so concurrent replicas can never both pass a cap:
 * the conditional UPDATE only fires while `count < max`, and when it doesn't
 * fire no row comes back.
 */
async function incrementSharedCounter(
  key: string,
  max: number,
  now: number,
): Promise<boolean> {
  // Rows become irrelevant once their UTC day has passed; keep them for two
  // days so debugging a cap event is still possible, then sweep them.
  const expiresAt = new Date(now + 2 * WINDOW_MS);
  const result = await db.execute(sql`
    INSERT INTO email_throttle_counters (key, count, expires_at)
    VALUES (${key}, 1, ${expiresAt})
    ON CONFLICT (key) DO UPDATE
      SET count = email_throttle_counters.count + 1
      WHERE email_throttle_counters.count < ${max}
    RETURNING count
  `);
  return result.rows.length > 0;
}

/** Opportunistically sweep expired buckets so the table can't grow unbounded. */
async function sweepExpiredCounters(now: number): Promise<void> {
  try {
    await db.execute(
      sql`DELETE FROM email_throttle_counters WHERE expires_at < ${new Date(now)}`,
    );
  } catch (err) {
    logger.warn({ err }, "Failed to sweep expired email throttle counters");
  }
}

/**
 * Record that a confirmation email is about to be sent to `email` and report
 * whether doing so is allowed. When it returns `false` the caller must NOT send
 * — a cap has been reached and the send is suppressed.
 */
export async function allowProspectConfirmation(
  email: string,
  now: number = Date.now(),
): Promise<boolean> {
  const recipient = normalizeEmail(email);
  const day = utcDay(now);

  try {
    // Check the per-recipient cap first so a blocked victim address does not
    // consume global budget.
    const recipientAllowed = await incrementSharedCounter(
      `rcpt:${recipient}:${day}`,
      PER_RECIPIENT_MAX,
      now,
    );
    if (!recipientAllowed) {
      logger.warn(
        { perRecipientMax: PER_RECIPIENT_MAX },
        "Suppressed prospect confirmation email: per-recipient daily cap reached",
      );
      return false;
    }

    const globalAllowed = await incrementSharedCounter(
      `global:${day}`,
      GLOBAL_MAX,
      now,
    );
    if (!globalAllowed) {
      logger.warn(
        { globalMax: GLOBAL_MAX },
        "Suppressed prospect confirmation email: global daily cap reached",
      );
      return false;
    }

    // ~1% of allowed sends also sweep expired rows; cheap and unbounded-safe.
    if (Math.random() < 0.01) void sweepExpiredCounters(now);

    return true;
  } catch (err) {
    logger.error(
      { err },
      "Email throttle database check failed; falling back to in-memory counters",
    );
    return allowProspectConfirmationInMemory(recipient, now);
  }
}

// ---------------------------------------------------------------------------
// In-memory fallback (per-process). Only used when the database is
// unreachable; provides the pre-shared-counter level of protection so a DB
// outage never disables the guard entirely.
// ---------------------------------------------------------------------------

/** Timestamps (ms) of recent global sends, oldest first. */
let globalSends: number[] = [];
/** Per-recipient timestamps (ms) of recent sends, oldest first. */
const recipientSends = new Map<string, number[]>();

function pruneOlderThan(timestamps: number[], cutoff: number): number[] {
  // Timestamps are appended in order, so drop from the front until fresh.
  let i = 0;
  while (i < timestamps.length && timestamps[i] <= cutoff) i++;
  return i === 0 ? timestamps : timestamps.slice(i);
}

function allowProspectConfirmationInMemory(
  recipient: string,
  now: number,
): boolean {
  const cutoff = now - WINDOW_MS;

  globalSends = pruneOlderThan(globalSends, cutoff);
  const recent = pruneOlderThan(recipientSends.get(recipient) ?? [], cutoff);

  if (recent.length >= PER_RECIPIENT_MAX) {
    recipientSends.set(recipient, recent);
    logger.warn(
      { perRecipientMax: PER_RECIPIENT_MAX },
      "Suppressed prospect confirmation email: per-recipient daily cap reached (in-memory fallback)",
    );
    return false;
  }

  if (globalSends.length >= GLOBAL_MAX) {
    recipientSends.set(recipient, recent);
    logger.warn(
      { globalMax: GLOBAL_MAX },
      "Suppressed prospect confirmation email: global daily cap reached (in-memory fallback)",
    );
    return false;
  }

  recent.push(now);
  globalSends.push(now);
  recipientSends.set(recipient, recent);

  // Opportunistically drop empty/stale recipient buckets so the map can't grow
  // without bound under a rotating-address attack.
  if (recipientSends.size > 10_000) {
    for (const [key, times] of recipientSends) {
      const fresh = pruneOlderThan(times, cutoff);
      if (fresh.length === 0) recipientSends.delete(key);
      else recipientSends.set(key, fresh);
    }
  }

  return true;
}

/** Test-only helper to reset the in-memory fallback counters between cases. */
export function __resetEmailThrottleForTests(): void {
  globalSends = [];
  recipientSends.clear();
}
