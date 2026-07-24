import { Router, type IRouter } from "express";
import { fetchAvailability, type AvailabilityPayload } from "../lib/appfolio";

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

let cached: { payload: AvailabilityPayload; fetchedAt: number } | null = null;
let inflight: Promise<AvailabilityPayload> | null = null;

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

  const fresh = cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS;
  if (cached && fresh) {
    res.json(cached.payload);
    return;
  }

  try {
    // Coalesce concurrent refreshes into a single upstream request.
    const payload = await refreshAvailability(clientId, clientSecret);
    res.json(payload);
  } catch (err) {
    req.log.error({ err }, "Failed to refresh AppFolio availability");
    if (cached) {
      res.json(cached.payload);
      return;
    }
    res.status(503).json({ error: "Availability feed is temporarily unavailable" });
  }
});

export default router;
