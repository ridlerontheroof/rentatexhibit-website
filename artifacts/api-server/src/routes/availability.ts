import { Router, type IRouter } from "express";
import { fetchAvailability, type AvailabilityPayload } from "../lib/appfolio";
import { sendSeedStaleAlert } from "../lib/email";
import bakedSeed from "../data/availabilitySeed.json";

const router: IRouter = Router();

/**
 * GET /availability — live available units from the AppFolio Unit Vacancy
 * report, proxied server-side so the Reports API credentials never reach the
 * browser.
 *
 * Responses are cached in memory for five minutes (AppFolio rate-limits to 7
 * requests per 15 seconds, so refreshes must never be per-visitor). If a
 * refresh fails we keep serving the last good snapshot; when nothing has ever
 * been fetched (or credentials are missing) the endpoint returns 503 and the
 * web app hides its live-availability UI.
 */

const CACHE_TTL_MS = 5 * 60 * 1000;

// Background warmer cadence: slightly inside the TTL so the cache is refreshed
// just before it would expire — a first visitor after a quiet period is served
// straight from memory instead of waiting on the AppFolio round-trip.
const WARM_INTERVAL_MS = CACHE_TTL_MS - 30 * 1000;

// Build-time baked seed (see scripts/fetch-availability-seed.mjs): last-known
// availability committed into the bundle so a cold-started autoscale instance
// can answer instantly while the first live AppFolio fetch completes. Seeds
// older than this are ignored — better to briefly hide the UI than show
// long-gone units. Keep in sync with the web app's snapshot max age.
const SEED_MAX_AGE_MS = 48 * 60 * 60 * 1000;

let cached: { payload: AvailabilityPayload; fetchedAt: number } | null = null;
let inflight: Promise<AvailabilityPayload> | null = null;

/**
 * Outcome of the last baked-seed evaluation, surfaced on /healthz so the
 * leasing team (or an uptime monitor) can see when deploys have become so
 * infrequent that cold starts no longer benefit from the committed snapshot.
 *
 *  - "used":       the seed was fresh and pre-populated the cache
 *  - "stale":      the seed exists but is past SEED_MAX_AGE_MS — redeploy soon
 *  - "invalid":    the committed file is malformed/placeholder
 *  - "superseded": the cache already held live data, seed not needed
 *  - "unevaluated": the seeding path has not run yet
 */
export type BakedSeedStatus = "used" | "stale" | "invalid" | "superseded" | "unevaluated";

export interface BakedSeedHealth {
  status: BakedSeedStatus;
  /** ISO timestamp the committed seed claims for its data, when parseable. */
  seedUpdatedAt: string | null;
  /** Age of the seed in whole hours at evaluation time, when parseable. */
  seedAgeHours: number | null;
  /** Max age in hours before the seed is considered stale. */
  maxAgeHours: number;
}

let seedHealth: BakedSeedHealth = {
  status: "unevaluated",
  seedUpdatedAt: null,
  seedAgeHours: null,
  maxAgeHours: SEED_MAX_AGE_MS / (60 * 60 * 1000),
};

/** Current baked-seed health, exposed on the /healthz endpoint. */
export function getBakedSeedHealth(): BakedSeedHealth {
  return seedHealth;
}

/** Un-narrowed view of the module-level cache (see route catch block). */
function getCached(): { payload: AvailabilityPayload; fetchedAt: number } | null {
  return cached;
}

/**
 * Pre-populate the empty cold-start cache from the baked build-time seed,
 * marked as fetched at its own updatedAt so it reads as stale and the next
 * request (or the startup warm-up) still triggers a live refresh. No-op when
 * the cache already holds data or the seed is missing/too old.
 */
export function seedCacheFromBakedSnapshot(now = Date.now()): boolean {
  const maxAgeHours = SEED_MAX_AGE_MS / (60 * 60 * 1000);
  if (cached) {
    seedHealth = { status: "superseded", seedUpdatedAt: null, seedAgeHours: null, maxAgeHours };
    return false;
  }
  const seed = bakedSeed as unknown as AvailabilityPayload;
  if (!seed || !Array.isArray(seed.units) || typeof seed.updatedAt !== "string") {
    seedHealth = { status: "invalid", seedUpdatedAt: null, seedAgeHours: null, maxAgeHours };
    return false;
  }
  const updatedAt = Date.parse(seed.updatedAt);
  if (!Number.isFinite(updatedAt)) {
    seedHealth = { status: "invalid", seedUpdatedAt: null, seedAgeHours: null, maxAgeHours };
    return false;
  }
  const seedAgeHours = Math.floor((now - updatedAt) / (60 * 60 * 1000));
  if (now - updatedAt > SEED_MAX_AGE_MS) {
    seedHealth = { status: "stale", seedUpdatedAt: seed.updatedAt, seedAgeHours, maxAgeHours };
    return false;
  }
  seedHealth = { status: "used", seedUpdatedAt: seed.updatedAt, seedAgeHours, maxAgeHours };
  cached = { payload: seed, fetchedAt: updatedAt };
  return true;
}

/** Test-only: clear module-level cache state. */
export function resetAvailabilityCacheForTests(): void {
  cached = null;
  inflight = null;
  staleSeedAlertSent = false;
  seedHealth = {
    status: "unevaluated",
    seedUpdatedAt: null,
    seedAgeHours: null,
    maxAgeHours: SEED_MAX_AGE_MS / (60 * 60 * 1000),
  };
}

/** One alert per process — cold starts are rare, and one email is enough. */
let staleSeedAlertSent = false;

/**
 * Email the leasing team (best-effort, once per process) when the baked seed
 * was rejected for being older than SEED_MAX_AGE_MS. No email when the seed
 * is fresh, superseded, or the mailer is unconfigured.
 */
export async function alertIfSeedStale(
  log: { warn: (o: object, msg: string) => void } = { warn: () => {} },
): Promise<void> {
  if (seedHealth.status !== "stale" || staleSeedAlertSent) return;
  staleSeedAlertSent = true;
  log.warn(
    { seedUpdatedAt: seedHealth.seedUpdatedAt, seedAgeHours: seedHealth.seedAgeHours },
    "Baked availability seed is stale — cold starts will wait on the first live AppFolio fetch",
  );
  try {
    await sendSeedStaleAlert(seedHealth);
  } catch (err) {
    log.warn({ err }, "Failed to send stale-seed alert email");
  }
}

/**
 * Refresh the in-memory snapshot from AppFolio, coalescing concurrent callers
 * into a single upstream request (rate limit: 7 req / 15 s, shared by the
 * route handler, the snapshot getter, and the background warmer).
 */
async function refreshAvailability(
  clientId: string,
  clientSecret: string,
): Promise<AvailabilityPayload> {
  inflight ??= fetchAvailability(clientId, clientSecret).finally(() => {
    inflight = null;
  });
  const payload = await inflight;
  cached = { payload, fetchedAt: Date.now() };
  return payload;
}

/**
 * Keep the availability cache warm in the background so a cold cache never
 * penalizes the first visitor. Failures are logged and the last good snapshot
 * keeps serving (same stale-on-error behavior as the route). No-op when the
 * AppFolio credentials are not configured.
 */
export function startAvailabilityCacheWarmer(
  log: { info: (o: object, msg: string) => void; warn: (o: object, msg: string) => void } = {
    info: () => {},
    warn: () => {},
  },
): NodeJS.Timeout | null {
  const clientId = process.env.APPFOLIO_CLIENT_ID;
  const clientSecret = process.env.APPFOLIO_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  // Cold start on autoscale: the process may be brand new with an empty
  // cache. Load the baked build-time seed (marked stale) so the very first
  // visitor is served instantly while the startup warm-up fetches live data.
  if (seedCacheFromBakedSnapshot()) {
    log.info({}, "Availability cache seeded from baked build-time snapshot");
  } else {
    // Seed rejected (usually: past its 48h max age because deploys have been
    // infrequent). Tell the leasing team once so cold starts don't quietly
    // regress to slow first responses.
    void alertIfSeedStale(log);
  }

  const warm = async (reason: string) => {
    try {
      await refreshAvailability(clientId, clientSecret);
      log.info({ reason }, "Availability cache warmed");
    } catch (err) {
      log.warn({ err, reason }, "Availability cache warm-up failed; keeping last good snapshot");
    }
  };

  void warm("startup");
  const timer = setInterval(() => void warm("interval"), WARM_INTERVAL_MS);
  timer.unref();
  return timer;
}

/**
 * Current availability snapshot for other routes (e.g. attaching a tour lead
 * to its unit's AppFolio listing). Serves the in-memory cache when present —
 * even if stale — and only goes upstream when nothing has ever been fetched,
 * so lead submissions never burn through AppFolio's rate limit.
 */
export async function getAvailabilitySnapshot(): Promise<AvailabilityPayload | null> {
  if (cached) return cached.payload;
  const clientId = process.env.APPFOLIO_CLIENT_ID;
  const clientSecret = process.env.APPFOLIO_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  try {
    return await refreshAvailability(clientId, clientSecret);
  } catch {
    return null;
  }
}

router.get("/availability", async (req, res) => {
  const clientId = process.env.APPFOLIO_CLIENT_ID;
  const clientSecret = process.env.APPFOLIO_CLIENT_SECRET;

  // Unconfigured is always a 503 — never serve a stale snapshot when the
  // credentials have been removed, since it could show units we can no
  // longer verify against AppFolio.
  if (!clientId || !clientSecret) {
    res.status(503).json({ error: "Availability feed is not configured" });
    return;
  }

  if (cached) {
    const fresh = Date.now() - cached.fetchedAt < CACHE_TTL_MS;
    if (!fresh) {
      // Stale-while-revalidate: serve the last-known snapshot instantly (the
      // baked seed on a cold start, or an aged cache) and refresh in the
      // background — never make a visitor wait on the AppFolio round-trip.
      refreshAvailability(clientId, clientSecret).catch((err) => {
        req.log.warn({ err }, "Background availability refresh failed; keeping stale snapshot");
      });
    }
    res.json(cached.payload);
    return;
  }

  try {
    // Coalesce concurrent refreshes into a single upstream request.
    const payload = await refreshAvailability(clientId, clientSecret);
    res.json(payload);
  } catch (err) {
    req.log.error({ err }, "Failed to refresh AppFolio availability");
    // Re-read the module-level cache via a helper: TS narrows `cached` to
    // `never` here because the earlier `if (cached)` branch returned, but a
    // concurrent request may have populated it while we awaited.
    const lastGood = getCached();
    if (lastGood) {
      res.json(lastGood.payload);
      return;
    }
    res.status(503).json({ error: "Availability feed is temporarily unavailable" });
  }
});

export default router;
