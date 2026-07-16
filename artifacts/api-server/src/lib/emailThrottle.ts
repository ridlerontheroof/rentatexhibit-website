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
 * The counters are in-process and reset on restart. That is acceptable for a
 * spam-abuse guard: it caps sustained volume without any external dependency,
 * and legitimate leasing traffic stays well under these limits.
 */

/** Rolling window over which the caps are measured. */
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

/** Timestamps (ms) of recent global sends, oldest first. */
let globalSends: number[] = [];
/** Per-recipient timestamps (ms) of recent sends, oldest first. */
const recipientSends = new Map<string, number[]>();

/** Normalize an email so simple casing/whitespace tricks can't split the count. */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function pruneOlderThan(timestamps: number[], cutoff: number): number[] {
  // Timestamps are appended in order, so drop from the front until fresh.
  let i = 0;
  while (i < timestamps.length && timestamps[i] <= cutoff) i++;
  return i === 0 ? timestamps : timestamps.slice(i);
}

/**
 * Record that a confirmation email is about to be sent to `email` and report
 * whether doing so is allowed. When it returns `false` the caller must NOT send
 * — a cap has been reached and the send is suppressed.
 */
export function allowProspectConfirmation(
  email: string,
  now: number = Date.now(),
): boolean {
  const cutoff = now - WINDOW_MS;
  const recipient = normalizeEmail(email);

  globalSends = pruneOlderThan(globalSends, cutoff);
  const recent = pruneOlderThan(recipientSends.get(recipient) ?? [], cutoff);

  if (recent.length >= PER_RECIPIENT_MAX) {
    recipientSends.set(recipient, recent);
    logger.warn(
      { perRecipientMax: PER_RECIPIENT_MAX },
      "Suppressed prospect confirmation email: per-recipient daily cap reached",
    );
    return false;
  }

  if (globalSends.length >= GLOBAL_MAX) {
    recipientSends.set(recipient, recent);
    logger.warn(
      { globalMax: GLOBAL_MAX },
      "Suppressed prospect confirmation email: global daily cap reached",
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

/** Test-only helper to reset the in-memory counters between cases. */
export function __resetEmailThrottleForTests(): void {
  globalSends = [];
  recipientSends.clear();
}
