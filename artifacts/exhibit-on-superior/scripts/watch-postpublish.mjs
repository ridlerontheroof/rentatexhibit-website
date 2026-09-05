#!/usr/bin/env node
// Post-publish watcher: runs the live-site checks automatically after every
// publish.
//
// The pre-publish checks (check:prepublish) run inside the deploy build, but
// nothing used to verify the LIVE site afterwards — check:postpublish
// (knowledge pages + rented-unit noindex) relied on someone remembering to
// run it. This watcher closes that gap:
//
//   1. Polls <base>/build-id.json (stamped into every build by
//      scripts/write-build-id.mjs) on the production site.
//   2. It compares the live id with the last successfully processed id stored
//      under the workspace's gitignored .cache directory. An unprocessed id
//      (including one already live when this workflow starts) is settled
//      across two polls, checked, submitted to IndexNow, and mirror-synced.
//   3. On success it keeps watching for the next publish. On either check or
//      mirror-sync FAILURE it prints a loud banner and EXITS NON-ZERO so the
//      `postpublish` workflow shows as failed — the clearest signal in the
//      workspace that the live site or mirror needs attention. Restart the
//      workflow after fixing.
//
// Until the first stamped publish goes live, build-id.json 404s (the SPA
// fallback serves HTML instead). The watcher treats "no stamp yet" as the
// baseline and runs the checks as soon as the stamp first appears — that IS
// the first publish it can observe.
//
// Coverage note: this watcher only runs while the workspace is open. The
// production api-server carries always-on twins for both halves of
// check:postpublish — knowledgeCheck.ts (knowledge pages) and rentedCheck.ts
// (rented-unit noindex, spawning this repo's check-rented-noindex.mjs) run on
// startup after every publish and every 6h, emailing the ops inbox (once/day)
// on failure. This watcher remains the richer in-workspace signal.
//
// Usage: node scripts/watch-postpublish.mjs [baseUrl] [--now] [--once] [--interval SECONDS]
//   default baseUrl : https://www.rentatexhibit.com
//   --now           : also run the checks immediately on startup
//   --once          : run the checks once and exit (no watching) — implies --now
//   --interval      : poll interval in seconds (default 60)

import { spawn } from 'node:child_process';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const RUN_NOW = args.includes('--now') || args.includes('--once');
const ONCE = args.includes('--once');
const intervalFlag = args.indexOf('--interval');
const INTERVAL_MS =
  (intervalFlag >= 0 ? Number(args[intervalFlag + 1]) || 60 : 60) * 1000;
const BASE = (
  args.find((a, i) => !a.startsWith('--') && i !== intervalFlag + 1) ||
  'https://www.rentatexhibit.com'
).replace(/\/$/, '');

const pkgDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mirrorSyncScript = path.resolve(pkgDir, '../../scripts/sync-github-mirror.sh');
export const DEFAULT_STATE_FILE = path.resolve(
  pkgDir,
  '../../.cache/postpublish/last-successful-build-id',
);
const STATE_FILE = process.env.POSTPUBLISH_STATE_FILE || DEFAULT_STATE_FILE;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ts = () => new Date().toISOString().slice(11, 19);
const log = (msg) => console.log(`[${ts()}] ${msg}`);

/** Current live build id, or null when the stamp is not (yet) served. */
async function liveBuildId() {
  try {
    const res = await fetch(`${BASE}/build-id.json?nocache=${Date.now()}`, {
      headers: { 'user-agent': 'postpublish-watch', 'cache-control': 'no-cache' },
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (text.trimStart().startsWith('<')) return null; // SPA fallback — no stamp yet
    const { buildId } = JSON.parse(text);
    return typeof buildId === 'string' && buildId ? buildId : null;
  } catch {
    return null; // network blip — treat as unknown, retry next poll
  }
}

export function shouldProcessBuild(liveBuild, lastProcessedBuild) {
  return liveBuild !== null && liveBuild !== lastProcessedBuild;
}

export async function readLastProcessedBuild(stateFile = STATE_FILE) {
  try {
    const buildId = (await readFile(stateFile, 'utf8')).trim();
    return buildId || null;
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
}

export async function writeLastProcessedBuild(buildId, stateFile = STATE_FILE) {
  await mkdir(path.dirname(stateFile), { recursive: true });
  const temporary = `${stateFile}.${process.pid}.tmp`;
  await writeFile(temporary, `${buildId}\n`, 'utf8');
  await rename(temporary, stateFile);
}

/** Run `pnpm run check:postpublish`, streaming output. Resolves exit code.
 *  Passes POSTPUBLISH_BASE so per-check scripts that accept it (e.g.
 *  check-starting-price.mjs) target the same host the watcher polls. */
function runChecks() {
  return new Promise((resolve) => {
    const child = spawn('pnpm', ['run', 'check:postpublish'], {
      cwd: pkgDir,
      stdio: 'inherit',
      env: { ...process.env, POSTPUBLISH_BASE: BASE },
    });
    child.on('close', (code) => resolve(code ?? 1));
    child.on('error', (err) => {
      console.error(`could not spawn pnpm: ${err.message}`);
      resolve(1);
    });
  });
}

/** Sync local main to the one-way GitHub mirror. Unlike IndexNow, this is a
 * required post-publish step: any failure must fail the watcher visibly. */
function runMirrorSync() {
  return new Promise((resolve) => {
    log('Syncing local main to the Codex GitHub mirror…');
    const child = spawn('bash', [mirrorSyncScript], {
      cwd: pkgDir,
      stdio: 'inherit',
      env: process.env,
    });
    child.on('close', (code) => resolve(code ?? 1));
    child.on('error', (err) => {
      console.error(`could not start GitHub mirror sync: ${err.message}`);
      resolve(1);
    });
  });
}

/**
 * Submit new/content-changed URLs to IndexNow (scripts/submit-indexnow.mjs).
 * Best-effort by design: a failed submission logs + emails inside the script
 * itself and must NEVER fail the publish or this watcher, so the exit code
 * is reported but otherwise ignored.
 */
function runIndexNowSubmission() {
  return new Promise((resolve) => {
    log('Submitting new/changed URLs to IndexNow…');
    const child = spawn('node', ['scripts/submit-indexnow.mjs', BASE], {
      cwd: pkgDir,
      stdio: 'inherit',
    });
    child.on('close', (code) => {
      if (code !== 0) {
        log('IndexNow submission FAILED (non-fatal — see alert email / reports/indexnow/submissions.log).');
      }
      resolve();
    });
    child.on('error', (err) => {
      console.error(`could not spawn IndexNow submitter: ${err.message}`);
      resolve();
    });
  });
}

async function checkAndReport(reason) {
  console.log('\n' + '='.repeat(72));
  log(`Running post-publish checks against ${BASE} (${reason})`);
  console.log('='.repeat(72));
  const code = await runChecks();
  console.log('='.repeat(72));
  if (code === 0) {
    log('POST-PUBLISH CHECKS PASSED — live site looks healthy.');
    console.log('='.repeat(72) + '\n');
    return true;
  }
  console.error(
    [
      '',
      '!'.repeat(72),
      `!!  POST-PUBLISH CHECKS FAILED against ${BASE}`,
      '!!  A live page is broken — see the FAIL lines above for what and why.',
      '!!  Fix the issue, re-publish, then restart the postpublish workflow.',
      '!'.repeat(72),
      '',
    ].join('\n'),
  );
  return false;
}

async function syncMirrorAndReport() {
  const code = await runMirrorSync();
  if (code === 0) {
    log('CODEX MIRROR SYNC PASSED — GitHub mirror is current.');
    return true;
  }
  console.error(
    [
      '',
      '!'.repeat(72),
      '!!  CODEX MIRROR SYNC FAILED',
      '!!  The published site was checked, but GitHub may not have the current code.',
      '!!  See the git error above, fix it, then restart the postpublish workflow.',
      '!'.repeat(72),
      '',
    ].join('\n'),
  );
  return false;
}

async function settleBuild(candidate) {
  log(`Live build id detected: ${candidate}. Confirming it settled…`);
  let settled = candidate;
  for (;;) {
    await sleep(Math.min(INTERVAL_MS, 30_000));
    const again = await liveBuildId();
    if (again === settled) return settled;
    if (again !== null) settled = again;
    log(`Live build id still changing (${again ?? 'unreadable'}) — waiting…`);
  }
}

async function processBuild(buildId, reason) {
  const passed = await checkAndReport(reason);
  // Ping IndexNow even when a check failed — the new content is live either
  // way, and the submitter never fails the watcher.
  await runIndexNowSubmission();
  const mirrorSynced = await syncMirrorAndReport();
  if (!passed || !mirrorSynced) return false;
  await writeLastProcessedBuild(buildId);
  log(`Recorded build ${buildId} as successfully processed.`);
  return true;
}

async function main() {
  log(`Post-publish watcher started — polling ${BASE}/build-id.json every ${INTERVAL_MS / 1000}s.`);

  if (RUN_NOW) {
    const startupBuild = await liveBuildId();
    const passed = await checkAndReport('requested on startup');
    await runIndexNowSubmission();
    const mirrorSynced = await syncMirrorAndReport();
    if (!passed || !mirrorSynced) process.exit(1);
    if (startupBuild !== null) {
      await writeLastProcessedBuild(startupBuild);
      log(`Recorded build ${startupBuild} as successfully processed.`);
    }
    if (ONCE) return;
  }

  let baseline = await readLastProcessedBuild();
  let current = await liveBuildId();
  log(
    baseline
      ? `Last successfully processed build id: ${baseline}.`
      : 'No successfully processed build is recorded yet.',
  );

  for (;;) {
    if (!shouldProcessBuild(current, baseline)) {
      if (current === null && baseline === null) {
        log('Live site serves no build-id.json yet (pre-stamp publish). Checks will run as soon as a stamped publish goes live.');
      } else {
        log(`Build ${baseline} was already processed. Watching for the next publish…`);
      }
      await sleep(INTERVAL_MS);
      current = await liveBuildId();
      continue;
    }

    // Unprocessed id seen — wait until it is stable across one more poll so we do not
    // test mid-rollout (autoscale can briefly serve both builds).
    const settled = await settleBuild(current);
    const processed = await processBuild(
      settled,
      `${baseline === null ? 'unprocessed publish found at startup' : 'new publish went live'}: build ${settled}`,
    );
    if (!processed) process.exit(1);
    baseline = settled;
    log(`Watching for the next publish (current build: ${baseline})…`);
    await sleep(INTERVAL_MS);
    current = await liveBuildId();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(`Post-publish watcher errored: ${err.message}`);
    process.exit(1);
  });
}
