import { timingSafeEqual } from "node:crypto";
import { Router, type IRouter } from "express";
import {
  EXPECTED_WATCHDOGS,
  getStartedWatchdogs,
} from "../lib/startupSummary";
import { alertMissingWatchdogs } from "../lib/watchdogRosterAlert";
import { logger } from "../lib/logger";

/**
 * Constant-time bearer-token check for the POST /watchdog-roster/alert
 * endpoint. Returns true only when WATCHDOG_ALERT_TOKEN is configured and
 * the request's Authorization header carries an exactly-matching token.
 * Uses timingSafeEqual so the response time does not reveal token length.
 */
function isAuthorized(authHeader: string | undefined): boolean {
  const expected = process.env.WATCHDOG_ALERT_TOKEN;
  if (!expected) return false; // token not configured → reject all
  const token =
    typeof authHeader === "string" && authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : "";
  if (token.length === 0 || token.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(token, "utf8"), Buffer.from(expected, "utf8"));
  } catch {
    return false;
  }
}

const router: IRouter = Router();

/**
 * GET /watchdog-roster
 *
 * Returns the live watchdog roster so check-watchdog-roster.mjs can assert
 * that every expected watchdog registered itself after a publish restarts the
 * server. The response is intentionally simple JSON with no auth requirement
 * — it reveals only watchdog names, not operational data.
 *
 * Fields:
 *   expected  — canonical list from EXPECTED_WATCHDOGS (the source of truth)
 *   started   — watchdogs that called announceWatchdogStarted() this runtime
 *   missing   — expected names absent from started (empty = all present)
 */
router.get("/watchdog-roster", (_req, res) => {
  const started = getStartedWatchdogs();
  const missing = (EXPECTED_WATCHDOGS as readonly string[]).filter(
    (name) => !started.includes(name),
  );
  res.json({
    expected: [...EXPECTED_WATCHDOGS],
    started,
    missing,
  });
});

/**
 * POST /watchdog-roster/alert
 *
 * Called by check-watchdog-roster.mjs when it detects missing watchdogs.
 * Sends a claim-gated ops-inbox email (at most once per UTC day) naming the
 * absent watchdogs and linking to the deployment logs.
 *
 * Body: { missing: string[] }
 *   missing  — watchdog names confirmed absent; must all be members of
 *              EXPECTED_WATCHDOGS (validated server-side so the endpoint
 *              cannot be used to send arbitrary content).
 *
 * Returns 204 on success (alert sent or already claimed today).
 * Returns 400 when the body is malformed or names unknown watchdogs.
 */
router.post("/watchdog-roster/alert", (req, res) => {
  if (!isAuthorized(req.headers.authorization)) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  const { missing } = req.body as { missing?: unknown };
  if (
    !Array.isArray(missing) ||
    missing.length === 0 ||
    missing.some((n) => typeof n !== "string")
  ) {
    res.status(400).json({ error: "missing must be a non-empty string array" });
    return;
  }
  const knownNames = new Set<string>(EXPECTED_WATCHDOGS as readonly string[]);
  const unknown = (missing as string[]).filter((n) => !knownNames.has(n));
  if (unknown.length > 0) {
    res.status(400).json({
      error: "unknown watchdog names",
      unknown,
    });
    return;
  }
  // Fire-and-forget: claim-gated, best-effort.
  void alertMissingWatchdogs(missing as string[], logger);
  res.status(204).end();
});

export default router;
