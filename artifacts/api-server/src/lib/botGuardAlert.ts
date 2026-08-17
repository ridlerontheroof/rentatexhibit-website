import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import type { Logger } from "pino";
import { createDailyHeartbeat } from "./dailyHeartbeat";
import { createDailyClaim } from "./dailyClaim";
import { mailerConfigured } from "./mailer";
import { logger as defaultLogger } from "./logger";
import { announceWatchdogStarted } from "./startupSummary";
import {
  sendAcceptedSilenceAlert,
  sendAcceptedSpikeAlert,
  sendBotGuardAlert,
} from "./email";

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
 *  - Accepted submissions bump their own shared per-UTC-day counter; when
 *    the day's accepts cross ACCEPTED_SPIKE_ALERT_THRESHOLD an anomaly
 *    alert goes out (same once-per-day dedupe) — the signature of a bot
 *    that fully evades the guard is spam *accepted* into the inbox.
 *  - Every accept also stamps a shared last-accepted timestamp; an hourly
 *    watchdog (startAcceptedVolumeWatch) alerts when nothing has been
 *    accepted for ACCEPTED_SILENCE_ALERT_HOURS — the signature of silently
 *    broken forms is accepted volume going to zero.
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

/**
 * Accepted (guard-passing) submissions in a single UTC day before the
 * anomaly alert. Normal traffic is a handful of real leads a day; several
 * times that in one day is either an exceptional leasing day or a smarter
 * bot fully evading the guard and spamming the leasing inbox — either way
 * worth a human skimming the inbox.
 */
export const ACCEPTED_SPIKE_ALERT_THRESHOLD = 20;

/**
 * Hours without a single accepted submission before the silence alert.
 * Leads arrive most days but quiet weekends happen; three full days of
 * zero accepted submissions across BOTH forms is unusual enough to suspect
 * silent breakage (frontend error, broken route, guard false-positives).
 */
export const ACCEPTED_SILENCE_ALERT_HOURS = 72;

/** How often the silence watchdog re-checks the last-accepted timestamp. */
const SILENCE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Shared-table key holding the epoch *seconds* of the most recent accepted
 * submission (the table's `count` column is a 32-bit integer, so seconds,
 * not milliseconds). Refreshed on every accept with a far-future expiry so
 * the throttle sweep never removes it mid-silence.
 */
const LAST_ACCEPTED_KEY = "botguard:last-accepted";
const LAST_ACCEPTED_TTL_MS = 365 * 24 * 60 * 60 * 1000;

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

const acceptedSpikeClaim = createDailyClaim({
  prefix: "botguard-accepted-spike",
  claimFailedMessage:
    "Accepted-lead spike alert database claim failed; falling back to in-memory dedupe",
});

const silenceClaim = createDailyClaim({
  prefix: "botguard-silence",
  claimFailedMessage:
    "Accepted-lead silence alert database claim failed; falling back to in-memory dedupe",
});

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * How long the per-day accept/reject counter rows stay in the shared table
 * before the throttle sweep may remove them. These rows double as the only
 * durable day-by-day bot-guard history (deployment log retention resets on
 * every publish), so they must outlive any reasonable audit window — the
 * 2026-08-04 week-of-traffic re-check would have been impossible with a
 * tight sweep and the previous 2-day expiry. Do not shorten below ~30 days.
 *
 * Known test data in the day-by-day history: `botguard:accepted:2026-08-17`
 * counted 2 — BOTH were deliberate end-to-end test submissions (production
 * leads 41/42, "Leasing Disregard" test contacts), not real prospects. That
 * day had ZERO real leads; exclude it when tuning the spike/silence
 * thresholds against historical daily counts.
 */
export const DAILY_COUNTER_RETENTION_DAYS = 45;

function utcDay(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

/** Per-process per-day rejection count; authoritative only when the DB is down. */
let memoryDay: string | null = null;
let memoryRejections = 0;

/** Per-process per-day route/reason breakdown for the alert body. */
let breakdown = new Map<string, number>();

/** Per-process per-day accepted count; authoritative only when the DB is down. */
let memoryAcceptedDay: string | null = null;
let memoryAccepted = 0;

/** Per-process per-day accepted per-route breakdown for the alert body. */
let acceptedBreakdown = new Map<string, number>();

/**
 * Per-process most-recent accept (ms); fallback when the DB is unreachable.
 * Null until the first accept or silence-check baseline of this process.
 */
let memoryLastAcceptedAt: number | null = null;

/**
 * Bump the shared per-day rejection counter and return the day's total.
 * Keyed by UTC day so the count naturally resets at midnight; rows are
 * retained for DAILY_COUNTER_RETENTION_DAYS as durable audit history.
 */
async function bumpRejectionShared(now: number): Promise<number> {
  const key = `botguard:rejected:${utcDay(now)}`;
  const expiresAt = new Date(now + DAILY_COUNTER_RETENTION_DAYS * DAY_MS);
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

/** Bump the shared per-day accepted counter and return the day's total. */
async function bumpAcceptedShared(now: number): Promise<number> {
  const key = `botguard:accepted:${utcDay(now)}`;
  const expiresAt = new Date(now + DAILY_COUNTER_RETENTION_DAYS * DAY_MS);
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

/**
 * Stamp the shared last-accepted timestamp (epoch seconds in `count`).
 * Refreshed on every accept — and seeded by the silence watchdog's first
 * run — with a long expiry so the throttle sweep can't delete it while a
 * genuine silence is in progress.
 */
async function touchLastAcceptedShared(now: number): Promise<void> {
  const seconds = Math.floor(now / 1000);
  const expiresAt = new Date(now + LAST_ACCEPTED_TTL_MS);
  await db.execute(sql`
    INSERT INTO email_throttle_counters (key, count, expires_at)
    VALUES (${LAST_ACCEPTED_KEY}, ${seconds}, ${expiresAt})
    ON CONFLICT (key) DO UPDATE
      SET count = ${seconds},
          expires_at = ${expiresAt}
  `);
}

/** Read the shared last-accepted timestamp (ms), or null when never set. */
async function readLastAcceptedShared(): Promise<number | null> {
  const result = await db.execute(sql`
    SELECT count FROM email_throttle_counters WHERE key = ${LAST_ACCEPTED_KEY}
  `);
  const seconds = Number(result.rows[0]?.count);
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : null;
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

function bumpAcceptedMemory(now: number): number {
  const day = utcDay(now);
  if (memoryAcceptedDay !== day) {
    memoryAcceptedDay = day;
    memoryAccepted = 0;
    acceptedBreakdown = new Map();
  }
  memoryAccepted += 1;
  return memoryAccepted;
}

/**
 * Record an accepted (human) form submission: counts it into the daily
 * heartbeat, stamps the shared last-accepted timestamp (feeding the silence
 * watchdog), bumps the shared per-day accepted counter, and — once the
 * day's total crosses ACCEPTED_SPIKE_ALERT_THRESHOLD — emails the
 * operational inbox, at most once per UTC day. A spike in *accepted*
 * submissions is the signature of a smarter bot that fully evades the
 * guard: spam reaching the leasing inbox looks like ordinary leads here.
 * Never throws; call fire-and-forget from routes.
 */
export async function recordAcceptedSubmission(
  log: Logger,
  now: number,
  route: GuardedRoute,
): Promise<void> {
  heartbeat.record(log, now, `${route}_accepted`);

  // In-memory count first (also rolls the day + breakdown over), then take
  // whichever count is larger — same pattern as the rejection counter.
  let acceptedToday = bumpAcceptedMemory(now);
  acceptedBreakdown.set(route, (acceptedBreakdown.get(route) ?? 0) + 1);
  memoryLastAcceptedAt = now;
  try {
    const [sharedCount] = await Promise.all([
      bumpAcceptedShared(now),
      touchLastAcceptedShared(now),
    ]);
    acceptedToday = Math.max(acceptedToday, sharedCount);
  } catch (err) {
    log.error(
      { err },
      "Failed to persist accepted-submission counter; using in-memory count",
    );
  }

  if (acceptedToday < ACCEPTED_SPIKE_ALERT_THRESHOLD) return;

  try {
    if (!(await acceptedSpikeClaim.claim(log, now))) return;
    if (!mailerConfigured()) return;
    await sendAcceptedSpikeAlert({
      acceptedToday,
      threshold: ACCEPTED_SPIKE_ALERT_THRESHOLD,
      breakdown: [...acceptedBreakdown.entries()].map(
        ([key, count]) => `${key}: ${count}`,
      ),
    });
  } catch (err) {
    log.error({ err }, "Failed to send accepted-lead volume spike alert");
  }
}

/**
 * One silence-watchdog check: read the shared last-accepted timestamp and
 * alert (once per UTC day, shared dedupe) when nothing has been accepted
 * for ACCEPTED_SILENCE_ALERT_HOURS. When no timestamp exists yet (first
 * deploy of this feature, or the row was somehow lost), the check seeds it
 * with `now` so the silence clock starts from a known point instead of
 * alerting immediately. Never throws. Exported for tests; production entry
 * point is startAcceptedVolumeWatch.
 */
export async function checkAcceptedSilence(
  log: Logger,
  now: number,
): Promise<void> {
  let lastAcceptedAt: number | null = null;
  let sharedReadable = false;
  try {
    lastAcceptedAt = await readLastAcceptedShared();
    sharedReadable = true;
  } catch (err) {
    log.error(
      { err },
      "Failed to read shared last-accepted timestamp; using in-memory fallback",
    );
  }
  // In-memory value can be fresher (this replica accepted while the DB write
  // failed) — and is the only signal at all during a DB outage.
  if (memoryLastAcceptedAt !== null) {
    lastAcceptedAt = Math.max(lastAcceptedAt ?? 0, memoryLastAcceptedAt);
  }

  if (lastAcceptedAt === null) {
    // No baseline anywhere: seed the clock at `now` rather than alerting on
    // day one of the feature. Memory always; shared table when reachable.
    memoryLastAcceptedAt = now;
    if (sharedReadable) {
      try {
        await touchLastAcceptedShared(now);
      } catch (err) {
        log.error(
          { err },
          "Failed to seed shared last-accepted timestamp baseline",
        );
      }
    }
    return;
  }

  const silenceMs = now - lastAcceptedAt;
  if (silenceMs < ACCEPTED_SILENCE_ALERT_HOURS * 60 * 60 * 1000) return;

  try {
    if (!(await silenceClaim.claim(log, now))) return;
    if (!mailerConfigured()) return;
    await sendAcceptedSilenceAlert({
      hoursSinceLast: silenceMs / (60 * 60 * 1000),
      lastAcceptedAt: new Date(lastAcceptedAt).toISOString(),
      thresholdHours: ACCEPTED_SILENCE_ALERT_HOURS,
    });
  } catch (err) {
    log.error({ err }, "Failed to send accepted-lead silence alert");
  }
}

/**
 * Start the hourly accepted-lead silence watchdog. Production only —
 * dev/test workspaces see no real traffic and would alert constantly.
 * Rejections and heartbeats fire on visitor traffic, but a *silence* has no
 * triggering event by definition, so it needs its own interval.
 */
export function startAcceptedVolumeWatch(log: Logger = defaultLogger): void {
  if (process.env.NODE_ENV !== "production") return;
  void checkAcceptedSilence(log, Date.now());
  const timer = setInterval(
    () => void checkAcceptedSilence(log, Date.now()),
    SILENCE_CHECK_INTERVAL_MS,
  );
  timer.unref?.();
  log.info({}, "Accepted-lead silence watchdog started");
  announceWatchdogStarted("accepted-lead-silence");
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
  acceptedSpikeClaim.reset();
  silenceClaim.reset();
  memoryDay = null;
  memoryRejections = 0;
  breakdown = new Map();
  memoryAcceptedDay = null;
  memoryAccepted = 0;
  acceptedBreakdown = new Map();
  memoryLastAcceptedAt = null;
}
