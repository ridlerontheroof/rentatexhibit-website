import app from "./app";
import { logger } from "./lib/logger";
import { startLeadNotificationRetry } from "./lib/leadNotificationRetry";
import { startAvailabilityCacheWarmer } from "./routes/availability";
import { submitCoreUrlsOnce } from "./lib/indexnow";
import { startApexRedirectCheck } from "./lib/apexRedirectCheck";
import { startKnowledgePageCheck } from "./lib/knowledgeCheck";
import { startFloorPlanPageCheck } from "./lib/floorPlanCheck";
import { startShowingSchedulerCheck } from "./lib/showingSchedulerCheck";
import { startTourUnitCheck } from "./lib/tourUnitCheck";
import { startApplyLinkCheck } from "./lib/applyLinkCheck";
import { startRentedNoindexCheck } from "./lib/rentedCheck";
import { startLegacyRedirectCheck } from "./lib/redirectCheck";
import { startGa4DataCheck } from "./lib/ga4DataCheck";
import { startGtmTrackingCheck } from "./lib/gtmCheck";
import { startAcceptedVolumeWatch } from "./lib/botGuardAlert";
import { startSeoWeeklyDigest } from "./lib/seoWeeklyDigest";
import { startStartingPriceCheck } from "./lib/startingPriceCheck";
import { scheduleStartupSummary } from "./lib/startupSummary";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Durable backstop: periodically retry leasing-team notifications for leads
  // whose fire-and-forget send failed (notified_at still NULL).
  startLeadNotificationRetry();

  // Keep the availability snapshot warm so a first visitor after a quiet
  // period never waits on a cold AppFolio round-trip.
  startAvailabilityCacheWarmer(logger);

  // Post-publish one-shot: submit the sitemap's key URLs to IndexNow so
  // Bing/Copilot pick up the freshly published pages (production only,
  // best-effort, never blocks startup).
  submitCoreUrlsOnce(logger);

  // Watchdog: alert (once/day) if the apex domain stops 301-redirecting to
  // www — e.g. a Domain Connect reconnection re-provisioned the apex A record.
  startApexRedirectCheck(logger);

  // Watchdog: verify the production /knowledge pages still serve their own
  // prerendered HTML after every publish (server restart = post-publish
  // check), then every 6 hours; alerts at most once per day on failure.
  startKnowledgePageCheck(logger);

  // Watchdog: verify the production /floor-plans hub, sampled slug pages,
  // and the 404 stub still serve their own prerendered HTML after every
  // publish, then every 6 hours; alerts at most once per day on failure
  // (always-on twin of scripts/check-floor-plan-pages.mjs).
  startFloorPlanPageCheck(logger);

  // Watchdog: hourly probe of AppFolio's unofficial showing-scheduler
  // endpoints (slot fetch + IDV status) against a posted unit; alerts
  // (once/day) on sustained failure or an enabled IDV gate.
  startShowingSchedulerCheck(logger);

  // Watchdog: hourly check that the hidden "Tour" unit still resolves via
  // the reserved TOUR token (powers the /schedule-a-tour "no specific
  // apartment" path); alerts (once/day) when resolution fails several runs
  // in a row — the signature of the unit being renamed or deleted.
  startTourUnitCheck(logger);

  // Watchdog: hourly probe of the derived AppFolio rental-application URL
  // for a posted unit (the "Apply Now" hand-off target); alerts the leasing
  // inbox (once/day) when it answers 4xx/5xx for several runs in a row —
  // the signature of AppFolio changing its application URL structure.
  startApplyLinkCheck(logger);

  // Watchdog: run the web artifact's rented-unit indexability check (the
  // other half of check:postpublish) on startup (= post-publish) and every
  // 6 hours, alerting (once/day) on definitive failures. Gracefully logs
  // and skips when the runtime has no headless Chromium.
  startRentedNoindexCheck(logger);

  // Watchdog: run the web artifact's legacy-redirect check (every legacy
  // URL must 301 in one hop to its mapped target) on startup (= post-publish)
  // and every 6 hours, alerting (once/day) on definitive failures.
  startLegacyRedirectCheck(logger);

  // Watchdog: run the web artifact's GTM/GA4 tracking check (the published
  // GTM container must carry the expected GA4 measurement ID) on startup
  // and every 6 hours, alerting (once/day) on definitive failures. A
  // GTM-side republish never restarts this server, so the interval is the
  // real detection path for a container published without the tag.
  startGtmTrackingCheck(logger);

  // Watchdog: query the GA4 Data API for real recorded visitors (activeUsers
  // over a trailing processed window) every 6 hours, alerting (once/day)
  // when the count is ~zero — catches consent-mode misconfigurations, broken
  // GA4 streams, and data filters that drop every hit while the tag-side
  // gtmCheck still passes. Needs GA4_SERVICE_ACCOUNT_JSON + GA4_PROPERTY_ID.
  startGa4DataCheck(logger);

  // Watchdog: hourly check of the shared last-accepted-submission timestamp;
  // alerts (once/day) when no lead has been accepted for an unusually long
  // stretch — the signature of silently broken forms.
  startAcceptedVolumeWatch(logger);

  // Watchdog: check that the homepage's baked "Apartments currently start at
  // $X,XXX" figure matches the live /api/availability minimum on startup
  // (= post-publish) and every 6 hours, alerting the leasing inbox (once/day)
  // when a mismatch is detected — the always-on twin of
  // scripts/check-starting-price.mjs.
  startStartingPriceCheck(logger);

  // Weekly SEO digest: once per ISO week (claim-gated, checked every 6h),
  // pull Search Console movers, near-winner queries (position 8–20), blog
  // article stats, and GA4 page movers, and email the digest to the leasing
  // inbox. Alerts the ops inbox when Search Console access is not granted.
  startSeoWeeklyDigest(logger);

  // The deploy runtime drops roughly the first ~25s of container stdout, so
  // the synchronous "… watchdog started" lines above never reach deployment
  // logs. Emit one deferred "Watchdogs online: …" summary after the blackout
  // window so every publish is auditably self-announcing.
  scheduleStartupSummary(logger);
});
