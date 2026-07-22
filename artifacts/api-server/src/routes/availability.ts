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

let cached: { payload: AvailabilityPayload; fetchedAt: number } | null = null;
let inflight: Promise<AvailabilityPayload> | null = null;

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
    inflight ??= fetchAvailability(clientId, clientSecret).finally(() => {
      inflight = null;
    });
    const payload = await inflight;
    cached = { payload, fetchedAt: Date.now() };
    return payload;
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
    inflight ??= fetchAvailability(clientId, clientSecret).finally(() => {
      inflight = null;
    });
    const payload = await inflight;
    cached = { payload, fetchedAt: Date.now() };
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
