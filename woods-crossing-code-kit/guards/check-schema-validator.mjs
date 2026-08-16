#!/usr/bin/env node
// Structured-data regression guard (production smoke-check).
//
// The live site validates clean (0 errors, 0 warnings) at
// validator.schema.org for the homepage and unit pages. This script protects
// that baseline after every publish: it submits the live homepage and one
// live unit page to the validator and exits non-zero if the validator
// reports ANY new error or warning.
//
// Important distinction:
//   - Validator findings about OUR pages  -> hard failure (exit 1).
//   - The validator service itself being unreachable/broken (network error,
//     non-200, unparseable response) -> "check skipped" (exit 0). A Google
//     outage is not a site regression.
//
// Unit-page selection: the live sitemap.xml (regenerated from UNIT_PATHS on
// every publish) is the source of truth for which per-unit pages exist; we
// pick the first /available-units/<unit> entry. If none are published
// (fully rented building), only the homepage is checked.
//
// Knowledge-page selection: /knowledge/<slug> pages carry FAQPage JSON-LD.
// The validator renders each URL (~10-20s), so we submit a small
// deterministic sample — first, middle, and last slugs from the committed
// article data (same source of truth check-knowledge-pages.mjs uses) — not
// every slug.
//
// Usage: node scripts/check-schema-validator.mjs [baseUrl]
//   default baseUrl: https://www.woodscrossing.com /* WOODS-CROSSING: replace */

import { loadKnowledgeSlugs } from './lib/knowledge-slugs.mjs';

const BASE = (process.argv.slice(2).find((a) => !a.startsWith('--')) ||
  'https://www.rentatexhibit.com').replace(/\/$/, '');

const VALIDATOR = 'https://validator.schema.org/validate';
const TIMEOUT_MS = 60_000;

/** Exit 0 with a loud "skipped" marker — validator-side problem, not ours. */
function skip(reason) {
  console.log(`SKIPPED structured-data check: ${reason}`);
  console.log('(validator.schema.org problem, not a site failure — re-run later)');
  process.exit(0);
}

/**
 * Submit a URL to validator.schema.org and return the parsed JSON result.
 * The response body is JSON after a 4-byte anti-XSSI prefix ()]}').
 * Throws { skip: true } style errors via the `skip()` helper for
 * validator-side failures.
 */
async function validate(url) {
  let res;
  try {
    res = await fetch(VALIDATOR, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ url }).toString(),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    skip(`network error reaching validator for ${url}: ${err?.cause?.code || err.message || err}`);
  }
  if (!res.ok) skip(`validator returned HTTP ${res.status} for ${url}`);
  const text = await res.text();
  // Strip the anti-XSSI prefix (documented as 4 bytes: )]}' — locate the
  // first '{' defensively in case the prefix ever changes length).
  const start = text.indexOf('{');
  if (start < 0) skip(`validator response for ${url} contained no JSON object`);
  let data;
  try {
    data = JSON.parse(text.slice(start));
  } catch (err) {
    skip(`validator response for ${url} was not parseable JSON: ${err.message}`);
  }
  if (typeof data.totalNumErrors !== 'number' || typeof data.totalNumWarnings !== 'number') {
    skip(`validator response for ${url} lacked totalNumErrors/totalNumWarnings fields`);
  }
  return data;
}

/** Pick one live unit page from the production sitemap (or null). */
async function pickUnitPage() {
  let xml;
  try {
    const res = await fetch(`${BASE}/sitemap.xml`, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    xml = await res.text();
  } catch (err) {
    // The sitemap is OUR page — if it's down, that IS a site problem.
    console.error(`FAIL: could not fetch ${BASE}/sitemap.xml: ${err.message || err}`);
    process.exit(1);
  }
  const m = xml.match(/<loc>\s*([^<]*\/available-units\/\d+)\s*<\/loc>/);
  return m ? m[1].trim() : null;
}

/**
 * Deterministic sample of live /knowledge/<slug> URLs: first, middle, last.
 * The slug list is parsed from the committed article data file — if that
 * parse fails it's OUR repo drifting, so it's a hard failure, not a skip.
 */
async function pickKnowledgePages() {
  let slugs;
  try {
    slugs = await loadKnowledgeSlugs();
  } catch (err) {
    console.error(`FAIL: could not load knowledge slugs: ${err.message || err}`);
    process.exit(1);
  }
  const idx = [...new Set([0, Math.floor((slugs.length - 1) / 2), slugs.length - 1])];
  return idx.map((i) => `${BASE}/knowledge/${slugs[i]}`);
}

const unitUrl = await pickUnitPage();
const targets = [`${BASE}/`];
if (unitUrl) targets.push(unitUrl);
else console.log('note: no /available-units/<unit> pages in the live sitemap — homepage only.');
targets.push(...(await pickKnowledgePages()));

let failures = 0;
for (const url of targets) {
  const data = await validate(url);
  const errs = data.totalNumErrors;
  const warns = data.totalNumWarnings;
  const label = `${url} — ${errs} error(s), ${warns} warning(s), ${data.numObjects ?? '?'} object(s)`;
  if (errs > 0 || warns > 0) {
    failures++;
    console.error(`FAIL  ${label}`);
    // Surface the specific findings so the failure is actionable from logs.
    for (const group of data.tripleGroups ?? []) {
      for (const node of group.nodes ?? []) {
        for (const err of node.errors ?? []) {
          console.error(
            `      [${err.errorType || err.severity || 'issue'}] ${node.typeGroup || ''}: ${
              err.errorID || ''
            } ${err.args ? JSON.stringify(err.args) : ''}`.trim(),
          );
        }
      }
    }
    for (const err of data.errors ?? []) {
      console.error(`      [top-level] ${JSON.stringify(err)}`);
    }
  } else {
    console.log(`ok    ${label}`);
  }
}

if (failures > 0) {
  console.error(`\n${failures} page(s) regressed at validator.schema.org — fix before this spreads to search results.`);
  process.exit(1);
}
console.log('\nStructured data is clean at validator.schema.org.');
