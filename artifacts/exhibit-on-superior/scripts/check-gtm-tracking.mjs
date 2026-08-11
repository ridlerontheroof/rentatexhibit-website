#!/usr/bin/env node
// GTM container / GA4 tracking smoke-check.
//
// Google Analytics was silently off for weeks because the GTM container
// (GTM-MDPWH532) was published EMPTY — gtm.js loaded fine, nothing on the
// site broke, and no page view was ever sent. This check makes that failure
// mode loud: it fetches the PUBLISHED container from Google's CDN and fails
// unless the expected GA4 measurement ID is present in it.
//
// The expected measurement ID is the one verified live on 2026-08-11
// (perf/live-2026-08-11-ga4.json: /g/collect hits with tid=G-1S66YHBN91).
// If the property is ever migrated to a new GA4 stream, update
// EXPECTED_GA4_ID here alongside the container.
//
// Failure modes covered:
//   - container fetch is non-OK (unpublished/deleted container)
//   - container has NO G- measurement ID at all (republished empty — the
//     original incident)
//   - container has G- IDs but not OURS (tag repointed at the wrong property)
//
// The container ID is parsed from index.html (the loader source of truth),
// with a guard so the check cannot silently go stale if the loader changes.
//
// Usage: node scripts/check-gtm-tracking.mjs
// Exits non-zero with a clear FAIL message on any problem.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const EXPECTED_GA4_ID = 'G-1S66YHBN91';

const pkgDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fail(msg) {
  console.error(`FAIL  ${msg}`);
  process.exit(1);
}

// --- Resolve the container ID from the loader source of truth ---------------
async function loadContainerId() {
  const html = await readFile(path.join(pkgDir, 'index.html'), 'utf8');
  const ids = [...html.matchAll(/googletagmanager\.com\/(?:gtm|ns)\.[a-z]+\?id=(GTM-[A-Z0-9]+)/g)].map(
    (m) => m[1],
  );
  if (ids.length === 0) {
    throw new Error(
      'Could not find a GTM container ID in index.html — the loader moved or changed; update scripts/check-gtm-tracking.mjs.',
    );
  }
  const unique = [...new Set(ids)];
  if (unique.length > 1) {
    throw new Error(`index.html references multiple GTM containers (${unique.join(', ')}) — expected exactly one.`);
  }
  return unique[0];
}

async function main() {
  const container = await loadContainerId();
  const url = `https://www.googletagmanager.com/gtm.js?id=${container}`;
  console.log(`Checking published GTM container ${container} for GA4 measurement ID ${EXPECTED_GA4_ID}…`);

  let res;
  try {
    res = await fetch(url, { headers: { 'user-agent': 'gtm-tracking-check' } });
  } catch (err) {
    fail(`Could not fetch ${url}: ${err.message}`);
  }
  if (!res.ok) {
    fail(
      `${url} answered HTTP ${res.status} — the container looks unpublished or deleted. Visitor tracking is OFF.`,
    );
  }
  const body = await res.text();

  const found = [...new Set(body.match(/\bG-[A-Z0-9]{6,}\b/g) ?? [])];
  if (found.length === 0) {
    fail(
      `Published container ${container} contains NO GA4 measurement ID (G-…). ` +
        'It has been republished empty — the exact silent failure that turned analytics off before. ' +
        'Open Google Tag Manager, restore the GA4 tag, and publish the container.',
    );
  }
  if (!found.includes(EXPECTED_GA4_ID)) {
    fail(
      `Published container ${container} contains ${found.join(', ')} but NOT the expected ${EXPECTED_GA4_ID}. ` +
        'The GA4 tag points at the wrong property, or the property changed — fix the tag in Google Tag Manager, ' +
        'or update EXPECTED_GA4_ID in scripts/check-gtm-tracking.mjs if the stream migration was intentional.',
    );
  }

  console.log(
    `PASS  Container ${container} is live and carries ${EXPECTED_GA4_ID}` +
      (found.length > 1 ? ` (all IDs present: ${found.join(', ')})` : '') +
      ' — visitor tracking is wired up.',
  );
}

main().catch((err) => {
  fail(err.message);
});
