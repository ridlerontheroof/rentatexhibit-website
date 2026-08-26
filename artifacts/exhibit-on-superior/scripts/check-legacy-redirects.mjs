#!/usr/bin/env node
// Legacy-redirect production smoke-check.
//
// Every legacy URL in src/data/legacyRedirects.ts must answer a SINGLE-HOP
// 301 to its mapped target on the live site. A publish can silently break
// this (e.g. a missing artifact.toml rewrite pair drops the prerendered
// redirect stub, so the server never learns the 301) — after which
// Google-indexed legacy URLs soft-404 into the SPA shell. Run this after
// each publish; it exits non-zero with a clear message on any failure.
//
// The redirect table is parsed straight from the TS source of truth (scripts
// run plain Node, no TS loader) with an exact-count guard, mirroring
// scripts/lib/knowledge-slugs.mjs.
//
// Usage: node scripts/check-legacy-redirects.mjs [baseUrl]
//   default baseUrl: https://www.rentatexhibit.com

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const BASE = (args.find((a) => !a.startsWith('--')) || 'https://www.rentatexhibit.com').replace(
  /\/$/,
  '',
);

const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');

/** Exit code reserved for a run that could not observe one or more URLs. */
export const TRANSPORT_ONLY_EXIT_CODE = 2;
/** Keep one short-lived network blip from becoming a failed run. */
export const MAX_ATTEMPTS = 3;
export const REQUEST_TIMEOUT_MS = 5_000;
export const RETRY_DELAY_MS = 250;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch a URL with bounded retries. HTTP responses are returned immediately:
 * an observable 200/404/incorrect 301 is a definitive check result, not a
 * transient transport failure. Only fetch/reachability errors are retried.
 *
 * Exported so the retry contract can be regression-tested without contacting
 * the live site.
 */
export async function fetchWithRetries(
  url,
  fetchImpl = fetch,
  {
    maxAttempts = MAX_ATTEMPTS,
    timeoutMs = REQUEST_TIMEOUT_MS,
    retryDelayMs = RETRY_DELAY_MS,
    log = console,
  } = {},
) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetchImpl(url, {
        redirect: 'manual',
        headers: {
          'user-agent': 'legacy-redirect-smoke-check',
          'cache-control': 'no-cache',
        },
        signal: AbortSignal.timeout(timeoutMs),
      });
      return { response, attempts: attempt };
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        log.warn?.(
          `  Attempt ${attempt}/${maxAttempts} failed for ${url} (${err.message}), retrying in ${retryDelayMs}ms`,
        );
        await sleep(retryDelayMs);
      }
    }
  }
  return { error: lastError, attempts: maxAttempts };
}

// --- Load the redirect map from the source of truth -------------------------
async function loadLegacyRedirects() {
  const src = await readFile(path.join(dataDir, 'legacyRedirects.ts'), 'utf8');

  // APPLY_URL is imported from ./seo — resolve it so the '/apply' entry has a
  // concrete absolute target.
  const seoSrc = await readFile(path.join(dataDir, 'seo.ts'), 'utf8');
  const applyMatch = seoSrc.match(/export const APPLY_URL = '([^']+)'/);
  if (!applyMatch) throw new Error('Could not resolve APPLY_URL from src/data/seo.ts');
  const APPLY_URL = applyMatch[1];

  const body = src.match(/LEGACY_REDIRECTS[^{]*\{([\s\S]*?)\n\};/);
  if (!body) throw new Error('Could not locate LEGACY_REDIRECTS map in legacyRedirects.ts');

  const map = {};
  const entryRe = /'([^']+)':\s*(?:'([^']+)'|APPLY_URL)/g;
  for (let m; (m = entryRe.exec(body[1])); ) map[m[1]] = m[2] ?? APPLY_URL;

  // Exact-count guard: every entry line contains exactly one `':` key
  // delimiter, so counting them counts entries. Fails loudly if the authoring
  // format ever drifts and the regex silently under-parses.
  const expected = (body[1].match(/':\s/g) || []).length;
  const parsed = Object.keys(map).length;
  if (parsed !== expected || parsed === 0) {
    throw new Error(
      `Parsed ${parsed} legacy redirects but legacyRedirects.ts contains ${expected} entries — the parser in scripts/check-legacy-redirects.mjs needs updating.`,
    );
  }
  return map;
}

/**
 * Probe one expected redirect. Transport errors are returned separately from
 * definitive HTTP/Location failures so callers can classify the whole run.
 */
async function checkExpectedResponse(
  url,
  expectedStatus,
  expectedLocation,
  {
    fetchImpl = fetch,
    log = console,
    base = BASE,
  } = {},
) {
  const result = await fetchWithRetries(url, fetchImpl, { log });
  if (result.error) {
    return {
      kind: 'transport',
      url,
      message: `fetch error after ${result.attempts} attempts: ${result.error.message}`,
    };
  }

  const res = result.response;
  if (res.status !== expectedStatus) {
    return {
      kind: 'definitive',
      url,
      message:
        `HTTP ${res.status}, expected a single-hop ${expectedStatus}` +
        (expectedLocation ? ` to ${expectedLocation}` : '') +
        `. ` +
        (res.status === 200
          ? 'Likely serving the SPA shell/stub (soft 404) — the redirect stub or its artifact.toml rewrite pair is missing.'
          : 'Redirect wiring broken.'),
    };
  }

  if (expectedLocation !== undefined) {
    const location = res.headers.get('location') || '';
    const expectedAbs = expectedLocation.startsWith('http')
      ? expectedLocation
      : `${base}${expectedLocation}`;
    if (location !== expectedLocation && location !== expectedAbs) {
      return {
        kind: 'definitive',
        url,
        message: `301 points to "${location}", expected "${expectedLocation}" (or "${expectedAbs}").`,
      };
    }
    return { kind: 'ok', url, location, status: res.status };
  }

  return { kind: 'ok', url, status: res.status };
}

// --- Legacy ?plan= deep links on /available-units ---------------------------
// The production server 301s /available-units?plan=<known id> straight to the
// matching /floor-plans/<slug> page using dist/plan-redirects.json (baked at
// build time). A publish that ships without that map silently degrades to the
// client-side redirect (extra hop + JS required), so probe one known id
// (expect a single-hop 301 to the mapped landing page) and one unknown id
// (expect 200 on /available-units — unknown ids must fall through).
async function checkPlanRedirects({
  base = BASE,
  fetchImpl = fetch,
  log = console,
} = {}) {
  const distMapPath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    'dist',
    'plan-redirects.json',
  );
  let planMap;
  try {
    planMap = JSON.parse(await readFile(distMapPath, 'utf8'));
  } catch (err) {
    return [{
      kind: 'definitive',
      url: 'plan-redirects.json',
      message: `could not read ${distMapPath} (${err.code ?? err.message}) — build the site first; without the map the server cannot 301 ?plan= deep links.`,
    }];
  }
  const entries = Object.entries(planMap);
  if (entries.length === 0) {
    return [{
      kind: 'definitive',
      url: 'plan-redirects.json',
      message: 'map is empty — ?plan= deep links would never 301.',
    }];
  }

  // Known id → single-hop 301 to the mapped /floor-plans/<slug> page.
  const [knownId, target] = entries[0];
  const knownUrl = `${base}/available-units?plan=${encodeURIComponent(knownId)}`;
  const knownCheck = checkExpectedResponse(knownUrl, 301, target, {
    fetchImpl,
    log,
    base,
  });

  // Unknown id → 200 on /available-units (must fall through, never redirect
  // or error).
  const unknownUrl = `${base}/available-units?plan=smoke-check-unknown-id`;
  const unknownCheck = checkExpectedResponse(unknownUrl, 200, undefined, {
    fetchImpl,
    log,
    base,
  });
  return Promise.all([knownCheck, unknownCheck]);
}

export async function runLegacyRedirectCheck({
  redirects,
  base = BASE,
  fetchImpl = fetch,
  log = console,
} = {}) {
  let definitiveFailures = 0;
  let transportFailures = 0;
  const diagnostics = [];
  const fail = (result) => {
    diagnostics.push(result);
    if (result.kind === 'transport') transportFailures++;
    else definitiveFailures++;
  };

  const checks = Object.entries(redirects).map(([from, to]) => {
    const url = `${base}${from}`;
    return checkExpectedResponse(url, 301, to, { fetchImpl, log, base });
  });
  const results = await Promise.all(checks);
  for (const result of results) {
    if (result.kind === 'ok') {
      log.log(`ok    ${result.url} -> ${result.location} (301)`);
    } else {
      fail(result);
      log.error(`${result.kind === 'transport' ? 'UNREACHABLE' : 'FAIL'}  ${result.url}: ${result.message}`);
    }
  }

  const planResults = await checkPlanRedirects({ base, fetchImpl, log });
  for (const result of planResults) {
    if (result.kind === 'ok') {
      log.log(
        result.location
          ? `ok    ${result.url} -> ${result.location} (301)`
          : `ok    ${result.url} -> 200 (falls through)`,
      );
    } else {
      fail(result);
      log.error(`${result.kind === 'transport' ? 'UNREACHABLE' : 'FAIL'}  ${result.url}: ${result.message}`);
    }
  }

  log.log(
    `\nChecked ${Object.keys(redirects).length} legacy redirects (+2 ?plan= probes) against ${base}`,
  );
  log.log(
    `Definitive failures: ${definitiveFailures}; unreachable probes: ${transportFailures}`,
  );

  if (definitiveFailures) {
    log.error(
      `\n${definitiveFailures} redirect(s) FAILED. Legacy URLs must 301 in one hop — inspect the prerendered redirect stubs and their [[services.production.rewrites]] pairs in .replit-artifact/artifact.toml, then re-publish.`,
    );
    return { exitCode: 1, definitiveFailures, transportFailures };
  }
  if (transportFailures) {
    log.error(
      `\n${transportFailures} probe(s) were unreachable after ${MAX_ATTEMPTS} attempts. This run is ambiguous; the always-on watchdog will use its consecutive-run escalation before alerting.`,
    );
    return { exitCode: TRANSPORT_ONLY_EXIT_CODE, definitiveFailures, transportFailures };
  }
  log.log('All legacy-redirect checks passed.');
  return { exitCode: 0, definitiveFailures, transportFailures };
}

async function main() {
  let redirects;
  try {
    redirects = await loadLegacyRedirects();
  } catch (err) {
    console.error(String(err.message || err));
    return 1;
  }
  return (await runLegacyRedirectCheck({ redirects })).exitCode;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await main();
}
