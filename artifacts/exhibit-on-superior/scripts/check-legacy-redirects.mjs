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

console.log(`\nChecked ${Object.keys(redirects).length} legacy redirects against ${BASE}`);
if (failures) {
  console.error(
    `\n${failures} redirect(s) FAILED. Legacy URLs must 301 in one hop — inspect the prerendered redirect stubs and their [[services.production.rewrites]] pairs in .replit-artifact/artifact.toml, then re-publish.`,
  );
  process.exit(1);
}
console.log('All legacy-redirect checks passed.');
