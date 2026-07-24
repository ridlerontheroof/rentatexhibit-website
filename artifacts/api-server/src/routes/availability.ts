import { Router, type IRouter } from "express";
import { fetchAvailability, type AvailabilityPayload } from "../lib/appfolio";
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
  if (cached) return false;
  const seed = bakedSeed as unknown as AvailabilityPayload;
  if (!seed || !Array.isArray(seed.units) || typeof seed.updatedAt !== "string") return false;
  const updatedAt = Date.parse(seed.updatedAt);
  if (!Number.isFinite(updatedAt) || now - updatedAt > SEED_MAX_AGE_MS) return false;
  cached = { payload: seed, fetchedAt: updatedAt };
  return true;
}

/** Test-only: clear module-level cache state. */
export function resetAvailabilityCacheForTests(): void {
  cached = null;
  inflight = null;
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
