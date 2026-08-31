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
//   baseUrl example: https://www.example-property.invalid

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const BASE = args.find((a) => !a.startsWith('--')) || process.env.SITE_URL
if (!BASE) throw new Error('Provide SITE_URL or a base URL argument')
  .replace(
  /\/$/,
  '',
);

const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');

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

let redirects;
try {
  redirects = await loadLegacyRedirects();
} catch (err) {
  console.error(String(err.message || err));
  process.exit(1);
}

// --- Check each entry: single-hop 301 to the mapped target ------------------
let failures = 0;
const fail = (what, msg) => {
  failures++;
  console.error(`FAIL  ${what}: ${msg}`);
};

for (const [from, to] of Object.entries(redirects)) {
  const url = `${BASE}${from}`;
  let res;
  try {
    res = await fetch(url, {
      redirect: 'manual',
      headers: { 'user-agent': 'legacy-redirect-smoke-check' },
    });
  } catch (err) {
    fail(url, `fetch error: ${err.message}`);
    continue;
  }
  if (res.status !== 301) {
    fail(
      url,
      `HTTP ${res.status}, expected a single-hop 301. ` +
        (res.status === 200
          ? 'Likely serving the SPA shell/stub (soft 404) — the redirect stub or its artifact.toml rewrite pair is missing.'
          : 'Redirect wiring broken.'),
    );
    continue;
  }
  const location = res.headers.get('location') || '';
  // The target may be site-relative ('/available-units') or absolute
  // (APPLY_URL). Accept the exact relative path or the absolute equivalent.
  const expectedAbs = to.startsWith('http') ? to : `${BASE}${to}`;
  const ok = location === to || location === expectedAbs;
  if (!ok) {
    fail(url, `301 points to "${location}", expected "${to}" (or "${expectedAbs}").`);
    continue;
  }
  console.log(`ok    ${url} -> ${location} (301)`);
}

// --- Legacy ?plan= deep links on /available-units ---------------------------
// The production server 301s /available-units?plan=<known id> straight to the
// matching /floor-plans/<slug> page using dist/plan-redirects.json (baked at
// build time). A publish that ships without that map silently degrades to the
// client-side redirect (extra hop + JS required), so probe one known id
// (expect a single-hop 301 to the mapped landing page) and one unknown id
// (expect 200 on /available-units — unknown ids must fall through).
async function checkPlanRedirects() {
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
    fail(
      'plan-redirects.json',
      `could not read ${distMapPath} (${err.code ?? err.message}) — build the site first; without the map the server cannot 301 ?plan= deep links.`,
    );
    return;
  }
  const entries = Object.entries(planMap);
  if (entries.length === 0) {
    fail('plan-redirects.json', 'map is empty — ?plan= deep links would never 301.');
    return;
  }

  // Known id → single-hop 301 to the mapped /floor-plans/<slug> page.
  const [knownId, target] = entries[0];
  const knownUrl = `${BASE}/available-units?plan=${encodeURIComponent(knownId)}`;
  try {
    const res = await fetch(knownUrl, {
      redirect: 'manual',
      headers: { 'user-agent': 'legacy-redirect-smoke-check' },
    });
    if (res.status !== 301) {
      fail(
        knownUrl,
        `HTTP ${res.status}, expected a single-hop 301 to ${target}. ` +
          (res.status === 200
            ? 'The published server has no plan-redirects.json (or an outdated one) — visitors fall back to the slower client-side redirect.'
            : 'Plan-redirect wiring broken.'),
      );
    } else {
      const location = res.headers.get('location') || '';
      const expectedAbs = `${BASE}${target}`;
      if (location !== target && location !== expectedAbs) {
        fail(knownUrl, `301 points to "${location}", expected "${target}" (or "${expectedAbs}").`);
      } else {
        console.log(`ok    ${knownUrl} -> ${location} (301)`);
      }
    }
  } catch (err) {
    fail(knownUrl, `fetch error: ${err.message}`);
  }

  // Unknown id → 200 on /available-units (must fall through, never redirect
  // or error).
  const unknownUrl = `${BASE}/available-units?plan=smoke-check-unknown-id`;
  try {
    const res = await fetch(unknownUrl, {
      redirect: 'manual',
      headers: { 'user-agent': 'legacy-redirect-smoke-check' },
    });
    if (res.status !== 200) {
      fail(
        unknownUrl,
        `HTTP ${res.status}, expected 200 — unknown ?plan= ids must fall through to the normal /available-units page.`,
      );
    } else {
      console.log(`ok    ${unknownUrl} -> 200 (falls through)`);
    }
  } catch (err) {
    fail(unknownUrl, `fetch error: ${err.message}`);
  }
}
await checkPlanRedirects();

console.log(`\nChecked ${Object.keys(redirects).length} legacy redirects (+2 ?plan= probes) against ${BASE}`);
if (failures) {
  console.error(
    `\n${failures} redirect(s) FAILED. Legacy URLs must 301 in one hop — inspect the prerendered redirect stubs and their [[services.production.rewrites]] pairs in .replit-artifact/artifact.toml, then re-publish.`,
  );
  process.exit(1);
}
console.log('All legacy-redirect checks passed.');
