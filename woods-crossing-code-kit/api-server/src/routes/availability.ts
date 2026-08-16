import { Router, type IRouter } from "express";
import { fetchAvailability, type AvailabilityPayload } from "../lib/appfolio";
import { sendSeedStaleAlert } from "../lib/email";
import bakedSeed from "../data/availabilitySeed.json";
import { changedUnitUrls, inventoryChanged, notifyAvailabilityChanged } from "../lib/indexnow";
import { logger } from "../lib/logger";

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
const WARM_INTERVAL_MS = CACHE_TTL_MS - 30 * 1000;

// Build-time baked seed: last-known availability committed into the bundle so
// a cold-started autoscale instance can answer instantly while the first live
// AppFolio fetch completes. Seeds older than 48h are ignored.
const SEED_MAX_AGE_MS = 48 * 60 * 60 * 1000;

let cached: { payload: AvailabilityPayload; fetchedAt: number } | null = null;
let inflight: Promise<AvailabilityPayload> | null = null;

export type BakedSeedStatus = "used" | "stale" | "invalid" | "superseded" | "unevaluated";

export interface BakedSeedHealth {
  status: BakedSeedStatus;
  seedUpdatedAt: string | null;
  seedAgeHours: number | null;
  maxAgeHours: number;
}

let seedHealth: BakedSeedHealth = {
  status: "unevaluated",
  seedUpdatedAt: null,
  seedAgeHours: null,
  maxAgeHours: SEED_MAX_AGE_MS / (60 * 60 * 1000),
};

export function getBakedSeedHealth(): BakedSeedHealth {
  return seedHealth;
}

function getCached(): { payload: AvailabilityPayload; fetchedAt: number } | null {
  return cached;
}

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

let staleSeedAlertSent = false;

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

async function refreshAvailability(
  clientId: string,
  clientSecret: string,
): Promise<AvailabilityPayload> {
  inflight ??= fetchAvailability(clientId, clientSecret).finally(() => { inflight = null; });
  const payload = await inflight;
  const previous = cached?.payload ?? null;
  cached = { payload, fetchedAt: Date.now() };
  if (inventoryChanged(previous, payload)) {
    notifyAvailabilityChanged(logger, changedUnitUrls(previous, payload));
  }
  return payload;
}

export function startAvailabilityCacheWarmer(
  log: { info: (o: object, msg: string) => void; warn: (o: object, msg: string) => void } = {
    info: () => {},
    warn: () => {},
  },
): NodeJS.Timeout | null {
  const clientId = process.env.APPFOLIO_CLIENT_ID;
  const clientSecret = process.env.APPFOLIO_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  if (seedCacheFromBakedSnapshot()) {
    log.info({}, "Availability cache seeded from baked build-time snapshot");
  } else {
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

  if (!clientId || !clientSecret) {
    res.status(503).json({ error: "Availability feed is not configured" });
    return;
  }

  if (cached) {
    const fresh = Date.now() - cached.fetchedAt < CACHE_TTL_MS;
    if (!fresh) {
      refreshAvailability(clientId, clientSecret).catch((err) => {
        req.log.warn({ err }, "Background availability refresh failed; keeping stale snapshot");
      });
    }
    res.json(cached.payload);
    return;
  }

  try {
    const payload = await refreshAvailability(clientId, clientSecret);
    res.json(payload);
  } catch (err) {
    req.log.error({ err }, "Failed to refresh AppFolio availability");
    const lastGood = getCached();
    if (lastGood) { res.json(lastGood.payload); return; }
    res.status(503).json({ error: "Availability feed is temporarily unavailable" });
  }
});

export default router;
