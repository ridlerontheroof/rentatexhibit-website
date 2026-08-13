#!/usr/bin/env node
// Post-publish IndexNow submitter: tells Bing/Copilot (and other
// IndexNow-participating engines) about new or content-changed pages the
// moment a publish goes live, instead of waiting for a sitemap recrawl.
//
// How it works:
//   1. Fetches the LIVE sitemap.xml (whose <lastmod> values come from the
//      committed src/data/sitemapLastmod.json content-hash map).
//   2. Diffs it against the last-submitted snapshot persisted in
//      reports/indexnow/state.json (runtime output, not committed).
//   3. Submits new/changed URLs to api.indexnow.org using the site key
//      served from public/<KEY>.txt (the same key api-server uses for
//      availability pings — a parity test keeps them in sync).
//   4. Appends every run to reports/indexnow/submissions.log so the leasing
//      team can confirm it ran.
//
// Failure policy: a failed submission NEVER fails the publish. The script
// logs the failure, emails the operational recipient via the existing
// api-server mail path (send:indexnow-alert), and exits non-zero only so a
// manual run is loud — the watcher ignores the exit code.
//
// First run (no state yet): records the current sitemap as the baseline and
// submits nothing — the api-server already submits the core sitemap URLs on
// every production start, so a cold-start bulk ping would be a duplicate.
//
// Usage: node scripts/submit-indexnow.mjs [baseUrl] [--dry-run]
//   default baseUrl : https://www.rentatexhibit.com
//   --dry-run       : diff + log what would be submitted, but do not POST
//                     and do not advance the baseline.

import { readFileSync, readdirSync, mkdirSync, writeFileSync, appendFileSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { parseSitemap, changedUrls } from './lib/indexnow-sitemap.mjs';

const pkgDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const BASE = (args.find((a) => !a.startsWith('--')) || 'https://www.rentatexhibit.com').replace(/\/$/, '');

const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
// Guard against diffing a truncated/broken sitemap (live site has 140+ URLs).
const MIN_EXPECTED_URLS = 50;

const stateDir = path.join(pkgDir, 'reports', 'indexnow');
const stateFile = path.join(stateDir, 'state.json');
const logFile = path.join(stateDir, 'submissions.log');

const ts = () => new Date().toISOString();
function logLine(line) {
  mkdirSync(stateDir, { recursive: true });
  appendFileSync(logFile, `[${ts()}] ${line}\n`);
  console.log(line);
}

/** The IndexNow key is the served key file's name (public/<KEY>.txt). */
function readKey() {
  const file = readdirSync(path.join(pkgDir, 'public')).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
  if (!file) throw new Error('No IndexNow key file (<32-hex>.txt) found in public/');
  const key = file.replace(/\.txt$/, '');
  const body = readFileSync(path.join(pkgDir, 'public', file), 'utf8').trim();
  if (body !== key) throw new Error(`Key file public/${file} body does not match its filename`);
  return key;
}

/** Email the operational recipient via the existing api-server mail path. */
function sendFailureAlert(reason, details) {
  return new Promise((resolve) => {
    const payload = {
      subject: 'IndexNow post-publish submission FAILED',
      lines: [
        'The post-publish IndexNow submission did not go through.',
        '',
        `When:   ${ts()}`,
        `Site:   ${BASE}`,
        `Reason: ${reason}`,
        ...(details ? ['', ...details] : []),
        '',
        'The publish itself is unaffected — search engines will still pick up',
        'changes from the sitemap, just more slowly. To retry manually:',
        '  pnpm --filter @workspace/exhibit-on-superior run submit:indexnow',
        `Run log: artifacts/exhibit-on-superior/reports/indexnow/submissions.log`,
      ],
    };
    const tmp = path.join(os.tmpdir(), `indexnow-alert-${Date.now()}.json`);
    writeFileSync(tmp, JSON.stringify(payload));
    const child = spawn('pnpm', ['--filter', '@workspace/api-server', 'run', 'send:indexnow-alert', '--', tmp], {
      stdio: 'inherit',
    });
    child.on('close', (code) => {
      if (code !== 0) console.error('IndexNow failure alert email could NOT be sent (see above).');
      resolve(code === 0);
    });
    child.on('error', (err) => {
      console.error(`Could not spawn alert sender: ${err.message}`);
      resolve(false);
    });
  });
}

async function main() {
  const key = readKey();

  const res = await fetch(`${BASE}/sitemap.xml?nocache=${Date.now()}`, {
    headers: { 'user-agent': 'postpublish-indexnow', 'cache-control': 'no-cache' },
  });
  if (!res.ok) throw new Error(`Fetching ${BASE}/sitemap.xml failed: HTTP ${res.status}`);
  const next = parseSitemap(await res.text());
  const nextCount = Object.keys(next).length;
  if (nextCount < MIN_EXPECTED_URLS) {
    throw new Error(`Live sitemap yielded only ${nextCount} URLs (< ${MIN_EXPECTED_URLS}) — refusing to diff a suspicious sitemap`);
  }
  const foreign = Object.keys(next).find((u) => !u.startsWith(`${BASE}/`) && u !== BASE);
  if (foreign) throw new Error(`Sitemap contains a URL outside ${BASE}: ${foreign}`);

  if (!existsSync(stateFile)) {
    mkdirSync(stateDir, { recursive: true });
    writeFileSync(stateFile, JSON.stringify({ updatedAt: ts(), urls: next }, null, 2));
    logLine(`BASELINE recorded: ${nextCount} sitemap URLs. Nothing submitted (first run — future publishes submit only new/changed pages).`);
    return 0;
  }

  const prev = JSON.parse(readFileSync(stateFile, 'utf8')).urls ?? {};
  const changed = changedUrls(prev, next);
  if (changed.length === 0) {
    logLine(`OK: no new or content-changed URLs since last submission (${nextCount} sitemap URLs checked).`);
    return 0;
  }

  if (DRY_RUN) {
    logLine(`DRY-RUN: would submit ${changed.length} URL(s): ${changed.join(', ')}`);
    return 0;
  }

  const post = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: new URL(BASE).host,
      key,
      keyLocation: `${BASE}/${key}.txt`,
      urlList: changed,
    }),
  });
  // IndexNow returns 200 or 202 on acceptance.
  if (!post.ok && post.status !== 202) {
    throw new Error(`IndexNow endpoint rejected the submission: HTTP ${post.status} — URLs: ${changed.join(', ')}`);
  }

  writeFileSync(stateFile, JSON.stringify({ updatedAt: ts(), urls: next }, null, 2));
  logLine(`SUBMITTED ${changed.length} URL(s) to IndexNow (HTTP ${post.status}): ${changed.join(', ')}`);
  return 0;
}

try {
  process.exit(await main());
} catch (err) {
  const reason = err?.message ?? String(err);
  try {
    logLine(`FAILED: ${reason}`);
  } catch {
    console.error(`FAILED: ${reason}`);
  }
  await sendFailureAlert(reason);
  process.exit(1);
}
