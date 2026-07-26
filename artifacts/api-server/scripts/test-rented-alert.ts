/**
 * Task-421 one-off: exercise the rented-check FAIL alert path end-to-end.
 * Injects a mock runner (exitCode 1) into checkRentedNoindexOnce so the real
 * sendRentedCheckAlert → Gmail SMTP → dailyClaim path runs, without touching
 * production or a real rented unit. Run with SEED_ALERT_EMAIL pointed at a
 * test/verifiable inbox.
 *
 * Usage: SEED_ALERT_EMAIL=... node /tmp/test-rented-alert.mjs
 */
import { checkRentedNoindexOnce, __resetRentedCheckForTests } from "../src/lib/rentedCheck";
import { logger } from "../src/lib/logger";

const runner = async () => ({
  exitCode: 1,
  outputTail:
    "SYNTHETIC TEST (task 421) — this is a forced FAIL injected via a mock runner to confirm the alert email path. No rented unit is actually indexable.",
});

async function main() {
  logger.info({ recipient: process.env.SEED_ALERT_EMAIL }, "Run 1: expect alert email send");
  await checkRentedNoindexOnce(logger, Date.now(), runner);

  logger.info({}, "Run 2 (same day): expect dailyClaim dedupe — NO second email");
  await checkRentedNoindexOnce(logger, Date.now(), runner);

  logger.info({}, "Done");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
