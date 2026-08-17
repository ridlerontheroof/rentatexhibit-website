import { Router, type IRouter } from "express";
import {
  EXPECTED_WATCHDOGS,
  getStartedWatchdogs,
} from "../lib/startupSummary";

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

export default router;
