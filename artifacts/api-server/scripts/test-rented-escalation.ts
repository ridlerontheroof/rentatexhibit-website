/**
 * Task-437 one-off: exercise the rented-check ERRORED-run escalation path
 * end-to-end. Injects a mock runner returning exitCode null (spawn/timeout)
 * into checkRentedNoindexOnce 4 times: runs 1–3 must only warn, run 4 must
 * send the escalation alert email (real SMTP). A subsequent healthy run must
 * reset the shared errored-run counter in email_throttle_counters.
 *
 * Verification of "email actually sent" per run uses the rentedcheck daily
 * claim row: the alert path claims `rentedcheck:<utc-day>` right before
 * sending, so the row's absence after runs 1–3 and presence after run 4 is
 * a DB-level proof of when the send happened. The inbox landing is checked
 * separately over IMAP (test-rented-inbox-check.mjs).
 *
 * Usage: SEED_ALERT_EMAIL=leasingexhibit@highlandptrs.com node /tmp/test-rented-escalation.mjs
 */
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  checkRentedNoindexOnce,
  __resetRentedCheckForTests,
} from "../src/lib/rentedCheck";
import { logger } from "../src/lib/logger";

const COUNTER_KEY = "rentedcheck:errored-runs";
const utcDay = new Date().toISOString().slice(0, 10);
const CLAIM_KEY = `rentedcheck:${utcDay}`;

const erroredRunner = async () => ({
  exitCode: null,
  outputTail: "",
  error:
    "SYNTHETIC TEST (task 437) — forced spawn/timeout error injected via mock runner to exercise the errored-run escalation path.",
});

const healthyRunner = async () => ({
  exitCode: 0,
  outputTail: "SYNTHETIC TEST (task 437) — healthy run. MODE: http-fallback",
});

async function counterCount(): Promise<number | null> {
  const r = await db.execute(
    sql`SELECT count FROM email_throttle_counters WHERE key = ${COUNTER_KEY}`,
  );
  return r.rows.length ? Number(r.rows[0].count) : null;
}

async function claimExists(): Promise<boolean> {
  const r = await db.execute(
    sql`SELECT 1 FROM email_throttle_counters WHERE key = ${CLAIM_KEY}`,
  );
  return r.rows.length > 0;
}

async function cleanup(): Promise<void> {
  await db.execute(
    sql`DELETE FROM email_throttle_counters WHERE key IN (${COUNTER_KEY}, ${CLAIM_KEY})`,
  );
}

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    console.error(`ASSERTION FAILED: ${msg}`);
    process.exit(1);
  }
  logger.info({}, `OK: ${msg}`);
}

async function main() {
  logger.info(
    { recipient: process.env.SEED_ALERT_EMAIL, utcDay },
    "Task-437 escalation test starting; clearing any pre-existing test rows",
  );
  await cleanup();
  __resetRentedCheckForTests();

  for (let i = 1; i <= 3; i++) {
    await checkRentedNoindexOnce(logger, Date.now(), erroredRunner);
    assert((await counterCount()) === i, `run ${i}: shared counter = ${i}`);
    assert(!(await claimExists()), `run ${i}: no alert claim (warning only, no email)`);
  }

  await checkRentedNoindexOnce(logger, Date.now(), erroredRunner);
  assert((await counterCount()) === 4, "run 4: shared counter = 4");
  assert(await claimExists(), "run 4: alert claim created (escalation email sent)");

  await checkRentedNoindexOnce(logger, Date.now(), healthyRunner);
  assert(
    (await counterCount()) === null,
    "healthy run: shared errored-run counter row deleted (reset)",
  );

  logger.info({}, "Cleaning up test rows (counter + today's rentedcheck claim)");
  await cleanup();
  assert(!(await claimExists()), "cleanup: claim row removed");
  assert((await counterCount()) === null, "cleanup: counter row removed");

  logger.info({}, "Task-437 escalation test PASSED");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
