import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import type { Logger } from "pino";
import { createDailyHeartbeat } from "./dailyHeartbeat";
import { createDailyClaim } from "./dailyClaim";
import { mailerConfigured } from "./mailer";
import { sendBotGuardAlert } from "./email";

/**
 * Bot-guard observability for the public lead-capture forms.
 *
 * The bot guard (botGuard.ts) silently swallows detected spam — /api/leads
 * even fake-succeeds so bots don't adapt — and per-IP rate limiting caps
 * bursts. That silence is deliberate for the bot, but it also means nothing
 * tells the team when a smarter bot starts slipping through (accepted-lead
 * volume creeps up) or when rejections spike (an attack, or a false-positive
 * bug quietly turning away real prospects). This module makes both visible:
 *
 *  - Every submission outcome (accepted vs bot-rejected, per route) is
 *    counted into the shared once-per-UTC-day heartbeat, so the daily info
 *    log line shows accepted/rejected counts per form even on quiet days.
 *  - Bot rejections additionally bump a per-UTC-day counter persisted in
 *    the shared `email_throttle_counters` table (so restarts and autoscale
 *    replicas share one count). When the day's rejections cross
 *    BOT_REJECTION_ALERT_THRESHOLD, an email alert goes to the operational
 *    inbox, at most once per UTC day (dailyClaim dedupe).
 *
 * Everything here is best-effort and fire-and-forget: a database or mail
 * outage must never affect a visitor's request.
 */

/**
 * Bot rejections in a single UTC day before alerting. Normal traffic sees a
 * handful of dumb form bots a day at most; a spike past this is either a
 * targeted attack worth knowing about or a guard bug rejecting real
 * prospects — both need a human to look at the logs.
 */
export const BOT_REJECTION_ALERT_THRESHOLD = 10;

/** The public forms the bot guard protects, as heartbeat label prefixes. */
export type GuardedRoute = "leads" | "showing_contact";

const heartbeat = createDailyHeartbeat({
  outcomes: [
    "leads_accepted",
    "leads_bot",
    "showing_contact_accepted",
    "showing_contact_bot",
  ],
  message: "Lead-form bot-guard heartbeat",
});

const dailyClaim = createDailyClaim({
  prefix: "botguard-spike",
  claimFailedMessage:
    "Bot-guard spike alert database claim failed; falling back to in-memory dedupe",
});

const DAY_MS = 24 * 60 * 60 * 1000;

function utcDay(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

/** Per-process per-day rejection count; authoritative only when the DB is down. */
let memoryDay: string | null = null;
let memoryRejections = 0;

/** Per-process per-day route/reason breakdown for the alert body. */
let breakdown = new Map<string, number>();

/**
 * Bump the shared per-day rejection counter and return the day's total.
 * Keyed by UTC day so the count naturally resets at midnight; rows expire
 * via the throttle sweep after two days.
 */
async function bumpRejectionShared(now: number): Promise<number> {
  const key = `botguard:rejected:${utcDay(now)}`;
  const expiresAt = new Date(now + 2 * DAY_MS);
  const result = await db.execute(sql`
    INSERT INTO email_throttle_counters (key, count, expires_at)
    VALUES (${key}, 1, ${expiresAt})
    ON CONFLICT (key) DO UPDATE
      SET count = email_throttle_counters.count + 1,
          expires_at = ${expiresAt}
    RETURNING count
  `);
  const count = Number(result.rows[0]?.count);
  return Number.isFinite(count) ? count : 0;
}

function bumpMemory(now: number): number {
  const day = utcDay(now);
  if (memoryDay !== day) {
    memoryDay = day;
    memoryRejections = 0;
    breakdown = new Map();
  }
  memoryRejections += 1;
  return memoryRejections;
}

/**
 * Record an accepted (human) form submission into the daily heartbeat.
 * Synchronous and infallible — safe to call inline in a route handler.
 */
export function recordAcceptedSubmission(
  log: Logger,
  now: number,
  route: GuardedRoute,
): void {
  heartbeat.record(log, now, `${route}_accepted`);
}

/**
 * Record a bot-rejected submission: counts it into the daily heartbeat,
 * bumps the shared per-day rejection counter, and — once the day's total
 * crosses BOT_REJECTION_ALERT_THRESHOLD — emails the operational inbox, at
 * most once per UTC day. Never throws; call fire-and-forget from routes.
 */
export async function recordBotRejection(
  log: Logger,
  now: number,
  route: GuardedRoute,
  reason: string,
): Promise<void> {
  heartbeat.record(log, now, `${route}_bot`);

  // In-memory count first (also rolls the day + breakdown over), then take
  // whichever count is larger: the persisted one survives restarts and spans
  // replicas; the in-memory one covers a DB outage.
  let rejectedToday = bumpMemory(now);
  const bdKey = `${route}/${reason}`;
  breakdown.set(bdKey, (breakdown.get(bdKey) ?? 0) + 1);
  try {
    rejectedToday = Math.max(rejectedToday, await bumpRejectionShared(now));
  } catch (err) {
    log.error(
      { err },
      "Failed to persist bot-guard rejection counter; using in-memory count",
    );
  }

  if (rejectedToday < BOT_REJECTION_ALERT_THRESHOLD) return;

  try {
    if (!(await dailyClaim.claim(log, now))) return;
    if (!mailerConfigured()) return;
    await sendBotGuardAlert({
      rejectedToday,
      threshold: BOT_REJECTION_ALERT_THRESHOLD,
      breakdown: [...breakdown.entries()].map(
        ([key, count]) => `${key}: ${count}`,
      ),
    });
  } catch (err) {
    log.error({ err }, "Failed to send bot-guard rejection spike alert");
  }
}

/** Test-only: clear heartbeat, counters, breakdown, and dedupe state. */
export function __resetBotGuardAlertForTests(): void {
  heartbeat.reset();
  dailyClaim.reset();
  memoryDay = null;
  memoryRejections = 0;
  breakdown = new Map();
}
