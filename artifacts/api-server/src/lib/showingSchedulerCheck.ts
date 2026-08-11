import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import type { Logger } from "pino";
import { logger as defaultLogger } from "./logger";
import { createDailyClaim } from "./dailyClaim";
import { createDailyHeartbeat, createDailyInfoGate } from "./dailyHeartbeat";
import { mailerConfigured } from "./mailer";
import { sendShowingSchedulerAlert } from "./email";
import { listableUidFromListingUrl } from "./appfolio";
import {
  fetchShowingAvailabilities,
  isIdentityVerificationEnabled,
  propertyTodayMMDDYYYY,
} from "./showings";
import { getAvailabilitySnapshot } from "../routes/availability";
import { detectSlotFormatDrift } from "./showingFormatAlert";

/**
 * Watchdog for the Exhibit-branded showing scheduler.
 *
 * The scheduler replicates AppFolio's *unofficial* hosted-form requests
 * (see showings.ts) — AppFolio can change those endpoints, add CSRF or
 * captcha protection, or enable identity verification (IDV) at any time.
 * The page falls back safely (lead capture + hosted-page handoff), so a
 * quiet breakage strands nobody — but the branded flow silently stops
 * working until a human notices. The route heartbeat only counts real
 * visitor traffic; a slow leasing week can hide a break for days.
 *
 * This module proactively probes the two anonymous halves of the flow
 * against a currently posted unit:
 *
 *   1. GET /listings/api/listings/<uid>/availabilities — the slot fetch
 *      the /showings/slots route depends on.
 *   2. GET /listings/api/showings_identity_verifications/status — the IDV
 *      gate. IDV switching ON is a definitive config change that disables
 *      branded booking entirely, so it alerts immediately (once/day).
 *
 * Probe failures are ambiguous (transient AppFolio blip vs. a real endpoint
 * change), so a single failed run never alerts. Consecutive failing runs
 * are counted in the shared `email_throttle_counters` table (mirroring the
 * knowledge-check's unreachable escalation) so restarts can't reset the
 * clock; once the streak reaches ESCALATION_RUNS the watchdog alerts —
 * at most one email per UTC day, enforced cluster-wide via the shared
 * daily claim with a per-process in-memory fallback.
 *
 * When no unit is currently posted there is nothing to probe against; the
 * run records "skipped" and the failure streak resets (a probe gap is not
 * evidence the scheduler broke). Checks only run in production — dev/test
 * workspaces would produce noise against the live AppFolio database.
 */

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // hourly — the probe is two cheap GETs
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Consecutive failing runs before the sustained-failure alert. At the
 * hourly interval, 3 runs ≈ three hours of the branded scheduler being
 * broken — no longer plausibly a transient AppFolio blip.
 */
export const ESCALATION_RUNS = 3;

/** Shared-table key holding the persisted consecutive-failure count. */
const FAILURE_COUNTER_KEY = "showingscheduler:failed-runs";

/**
 * Once-per-UTC-day alert dedupe (shared implementation — see dailyClaim.ts):
 * cluster-wide database claim with a per-process in-memory fallback.
 */
const dailyClaim = createDailyClaim({
  prefix: "showingscheduler",
  claimFailedMessage:
    "Showing-scheduler alert database claim failed; falling back to in-memory dedupe",
});

/**
 * Daily liveness heartbeat (shared implementation — see dailyHeartbeat.ts),
 * mirroring the other watchdogs'. Healthy probes log at debug level, which
 * production (info-level) suppresses — so without this, a silently-dead
 * interval is indistinguishable from weeks of healthy probes.
 */
// The probe is hourly; logging every healthy run at info would add ~24
// near-identical lines a day, so only the first passing probe of each UTC
// day is promoted to info (deployment logs are INFO+) and the rest stay debug.
// Skipped runs never consume the gate — the first real pass of the day logs info.
const passInfoGate = createDailyInfoGate();

const heartbeat = createDailyHeartbeat({
  outcomes: ["healthy", "failed", "idv_enabled", "skipped"] as const,
  message: "Showing-scheduler watchdog heartbeat — still probing AppFolio's booking flow",
  extraFields: { intervalHours: CHECK_INTERVAL_MS / 3_600_000 },
});

/**
 * Per-process mirror of the consecutive-failure count; the authoritative
 * count is persisted in the shared table so a restart mid-outage cannot
 * reset the escalation clock.
 */
let consecutiveFailedRuns = 0;

/** Injectable dependencies so tests can drive the probe without network. */
export interface ShowingProbeDeps {
  /** Resolve a posted unit's listable UID to probe against, or null when none is posted. */
  resolveProbeUid(): Promise<string | null>;
  /** Probe the slot fetch (throws on failure, like the route's dependency). */
  probeSlots(listableUid: string): Promise<void>;
  /** Probe the IDV status endpoint; resolves to whether IDV is enabled. */
  probeIdv(): Promise<boolean>;
}

/** Pick the first posted unit with a public listing from the availability snapshot. */
async function defaultResolveProbeUid(): Promise<string | null> {
  const snapshot = await getAvailabilitySnapshot();
  for (const unit of snapshot?.units ?? []) {
    const uid = unit.listingUrl ? listableUidFromListingUrl(unit.listingUrl) : null;
    if (uid) return uid;
  }
  return null;
}

const defaultDeps: ShowingProbeDeps = {
  resolveProbeUid: defaultResolveProbeUid,
  probeSlots: async (listableUid) => {
    // The slot fetch already throws loudly on any non-OK status or a
    // response missing the showing duration — exactly the failures that
    // would break the /showings/slots route.
    const availabilities = await fetchShowingAvailabilities(
      listableUid,
      propertyTodayMMDDYYYY(),
    );
    // Silent-filtering guard (the 2026-07 slot-format drift): a response can
    // be perfectly well-formed HTTP-wise while the parser drops every slot.
    // Fire the immediate once-a-day leasing alert AND fail the probe so the
    // sustained-failure escalation also engages.
    if (detectSlotFormatDrift(defaultLogger, Date.now(), availabilities)) {
      throw new Error(
        `slot format unrecognized — AppFolio sent ${availabilities.rawTimeslotCount} timeslot(s) but none parsed`,
      );
    }
    // AppFolio says future openings exist, yet even after the jump-ahead
    // re-fetch we surfaced zero slots: some layer is silently filtering.
    if (
      availabilities.futureAvailabilitiesExist &&
      availabilities.days.every((d) => d.slots.length === 0)
    ) {
      throw new Error(
        "AppFolio reports future availabilities exist, but the slots fetch yielded none within the jump-ahead window — silent filtering suspected",
      );
    }
  },
  probeIdv: () => isIdentityVerificationEnabled(),
};

/**
 * Persist one more consecutive failing run in the shared table and return
 * the new total. Throws when the database is unreachable — the caller
 * falls back to the per-process mirror.
 */
async function bumpFailureShared(now: number): Promise<number> {
  const expiresAt = new Date(now + 2 * DAY_MS);
  const result = await db.execute(sql`
    INSERT INTO email_throttle_counters (key, count, expires_at)
    VALUES (${FAILURE_COUNTER_KEY}, 1, ${expiresAt})
    ON CONFLICT (key) DO UPDATE
      SET count = email_throttle_counters.count + 1,
          expires_at = ${expiresAt}
    RETURNING count
  `);
  const count = Number(result.rows[0]?.count);
  return Number.isFinite(count) ? count : 0;
}

/** Clear the persisted failure counter after a healthy (or skipped) run. */
async function resetFailureShared(): Promise<void> {
  await db.execute(sql`
    DELETE FROM email_throttle_counters
    WHERE key = ${FAILURE_COUNTER_KEY}
  `);
}

async function recordFailedRun(log: Logger, now: number): Promise<number> {
  consecutiveFailedRuns += 1;
  try {
    // The persisted count survives restarts; the in-memory mirror only
    // matters when the database itself is unreachable, so take whichever
    // clock has been running longer.
    const shared = await bumpFailureShared(now);
    consecutiveFailedRuns = Math.max(consecutiveFailedRuns, shared);
  } catch (err) {
    log.error(
      { err },
      "Failed to persist showing-scheduler failure counter; using in-memory count",
    );
  }
  return consecutiveFailedRuns;
}

async function recordRecoveredRun(log: Logger): Promise<void> {
  consecutiveFailedRuns = 0;
  try {
    await resetFailureShared();
  } catch (err) {
    log.error(
      { err },
      "Failed to clear persisted showing-scheduler failure counter after a healthy run",
    );
  }
}

async function alertOncePerDay(
  log: Logger,
  now: number,
  opts: { reason: "idv_enabled" | "sustained_failure"; detail: string; failedRuns: number },
): Promise<void> {
  try {
    if (!(await dailyClaim.claim(log, now))) return;
    if (!mailerConfigured()) return;
    await sendShowingSchedulerAlert(opts);
  } catch (err) {
    log.error({ err }, "Failed to send showing-scheduler broken alert");
  }
}

/**
 * Run one probe of the showing-scheduler flow and alert (once/day) on a
 * sustained failure or an enabled IDV gate. Exported for tests.
 * Best-effort: never throws, so a network or mail outage can't crash the
 * interval.
 */
export async function checkShowingSchedulerOnce(
  log: Logger = defaultLogger,
  now: number = Date.now(),
  deps: ShowingProbeDeps = defaultDeps,
): Promise<void> {
  // --- Find a posted unit to probe against --------------------------------
  let probeUid: string | null;
  try {
    probeUid = await deps.resolveProbeUid();
  } catch (err) {
    // Snapshot trouble is an availability-pipeline problem with its own
    // alerting, not evidence the scheduler broke; treat like "nothing posted".
    log.warn({ err }, "Showing-scheduler probe could not resolve a posted unit");
    probeUid = null;
  }
  if (!probeUid) {
    // debug (not gated info): a skipped run must not consume the daily info
    // gate, or a later same-day pass would lose its info-level confirmation.
    log.debug("Showing-scheduler probe skipped — no posted unit to probe against");
    heartbeat.record(log, now, "skipped");
    await recordRecoveredRun(log);
    return;
  }

  // --- Probe both anonymous halves of the flow ----------------------------
  const failures: string[] = [];
  try {
    await deps.probeSlots(probeUid);
  } catch (err) {
    failures.push(`slot fetch failed: ${(err as Error).message}`);
  }

  let idvEnabled = false;
  try {
    idvEnabled = await deps.probeIdv();
  } catch (err) {
    failures.push(`IDV status check failed: ${(err as Error).message}`);
  }

  // --- IDV switched on: definitive, alert immediately ---------------------
  if (idvEnabled) {
    heartbeat.record(log, now, "idv_enabled");
    log.error(
      "AppFolio identity verification is now ENABLED — the branded showing scheduler cannot book; visitors are being sent to the hosted page",
    );
    await alertOncePerDay(log, now, {
      reason: "idv_enabled",
      detail:
        "The AppFolio identity-verification status endpoint now reports enabled: true. Branded booking requires a Persona ID check the site cannot proxy, so every visitor is handed off to AppFolio's hosted page.",
      failedRuns: 0,
    });
    return;
  }

  // --- Healthy run ----------------------------------------------------------
  if (failures.length === 0) {
    log[passInfoGate.shouldInfo(now) ? "info" : "debug"](
      { probeUid },
      "Showing-scheduler probe passed",
    );
    heartbeat.record(log, now, "healthy");
    await recordRecoveredRun(log);
    return;
  }

  // --- Failed run: escalate only when sustained ----------------------------
  heartbeat.record(log, now, "failed");
  const failedRuns = await recordFailedRun(log, now);
  log.error(
    { failures, probeUid, failedRuns, escalationRuns: ESCALATION_RUNS },
    "Showing-scheduler probe failed — AppFolio's unofficial booking endpoints may have changed",
  );
  if (failedRuns < ESCALATION_RUNS) return;

  await alertOncePerDay(log, now, {
    reason: "sustained_failure",
    detail: failures.join("; "),
    failedRuns,
  });
}

/**
 * Start the periodic showing-scheduler watchdog. Production only — dev and
 * test runs would probe the live AppFolio database and generate noise.
 * Kicks off an immediate probe, then repeats every CHECK_INTERVAL_MS.
 */
export function startShowingSchedulerCheck(log: Logger = defaultLogger): void {
  if (process.env.NODE_ENV !== "production") return;
  void checkShowingSchedulerOnce(log);
  const timer = setInterval(
    () => void checkShowingSchedulerOnce(log),
    CHECK_INTERVAL_MS,
  );
  timer.unref?.();
  log.info(
    { intervalHours: CHECK_INTERVAL_MS / 3_600_000, escalationRuns: ESCALATION_RUNS },
    "Showing-scheduler watchdog started",
  );
}

/** Test-only: clear the per-process fallback dedupe state. */
export function __resetShowingSchedulerCheckForTests(): void {
  dailyClaim.reset();
  consecutiveFailedRuns = 0;
  heartbeat.reset();
  passInfoGate.reset();
}
