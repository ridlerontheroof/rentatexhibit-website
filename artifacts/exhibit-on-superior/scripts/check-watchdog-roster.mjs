#!/usr/bin/env node
// check-watchdog-roster.mjs — postpublish guard
//
// Fetches /api/watchdog-roster from the live api-server and asserts that every
// expected watchdog registered itself after the publish restarted the server.
// Exits non-zero when any expected watchdog is absent, so check:postpublish
// (and the postpublish workflow) surfaces the gap immediately.
//
// Usage:
//   node scripts/check-watchdog-roster.mjs [apiBase]
//   default apiBase: https://www.rentatexhibit.com/api
//
// The POSTPUBLISH_BASE env var (set by watch-postpublish.mjs) is respected
// automatically when no explicit apiBase argument is given.

const args = process.argv.slice(2);
const rawBase = args[0] ?? process.env['POSTPUBLISH_BASE'] ?? 'https://www.rentatexhibit.com';
const API_BASE = rawBase.replace(/\/$/, '') + '/api';

const ROSTER_URL = `${API_BASE}/watchdog-roster`;

// The api-server emits the startup summary 30 s after boot. Watchdogs call
// announceWatchdogStarted() immediately at startup (not deferred), so the
// /watchdog-roster endpoint reflects the full set within seconds of the server
// coming up. The postpublish watcher already waits for the build-id to
// stabilise before running checks, so by the time this script runs the server
// has been up well past the 30 s window. No extra sleep is needed — but we
// retry a few times to ride out any transient network blip.
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5_000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchRoster(attempt) {
  try {
    const res = await fetch(`${ROSTER_URL}?nocache=${Date.now()}`, {
      headers: { 'user-agent': 'check-watchdog-roster', 'cache-control': 'no-cache' },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    if (attempt < MAX_ATTEMPTS) {
      console.warn(`  Attempt ${attempt} failed (${err.message}), retrying in ${RETRY_DELAY_MS / 1000}s…`);
      await sleep(RETRY_DELAY_MS);
      return fetchRoster(attempt + 1);
    }
    throw err;
  }
}

async function main() {
  console.log(`\nChecking watchdog roster at ${ROSTER_URL} …`);

  let roster;
  try {
    roster = await fetchRoster(1);
  } catch (err) {
    console.error(`FAIL  Could not reach ${ROSTER_URL}: ${err.message}`);
    process.exit(1);
  }

  const { expected = [], started = [], missing = [] } = roster;

  console.log(`  Expected : ${expected.join(', ') || '(none)'}`);
  console.log(`  Started  : ${started.join(', ') || '(none)'}`);

  if (missing.length === 0) {
    console.log(`  PASS  All ${expected.length} expected watchdogs are online.\n`);
    return;
  }

  console.error(
    [
      '',
      `  FAIL  ${missing.length} watchdog(s) missing from the live roster:`,
      ...missing.map((n) => `          ✗ ${n}`),
      '',
      '  A watchdog that never called announceWatchdogStarted() likely hit',
      '  an early-return gate (missing env var, non-production flag, or crash).',
      '  Check deployment logs for the missing watchdog\'s startup line and',
      '  confirm it is still registered in api-server/src/index.ts.',
      '',
    ].join('\n'),
  );
  process.exit(1);
}

main().catch((err) => {
  console.error(`check-watchdog-roster: unexpected error — ${err.message}`);
  process.exit(1);
});
