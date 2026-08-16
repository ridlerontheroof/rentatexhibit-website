#!/usr/bin/env node
// Floor-plan pages production smoke-check.
//
// The /floor-plans hub and every /floor-plans/<slug> landing page must serve
// their OWN prerendered HTML — their own <title>, canonical, and FloorPlan
// JSON-LD — not the SPA homepage shell. A publish (or an artifact.toml
// rewrite edit) can silently drop a slug's rewrite pair, after which crawlers
// see a blank SPA shell instead of the plan page. Unknown slugs must serve
// the noindex not-found stub with a REAL 404 status (soft-404 guard).
// Run this after each publish; it exits non-zero with a clear message on any
// failure.
//
// Usage: node scripts/check-floor-plan-pages.mjs [baseUrl] [--all]
//   default baseUrl: https://www.woodscrossing.com /* WOODS-CROSSING: replace */
//   default: the hub + a deterministic ~8-slug sample (first, last, every
//   Nth) + the not-found stub; --all checks every slug page.
//
// Slugs and expected titles come straight from the source of truth
// (src/data/floorPlanPages.ts, a pure-data TS module) via tsx's ESM import
// API — the same derivation the prerenderer uses, so the check can never
// drift from the published set.

import { tsImport } from 'tsx/esm/api';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const checkAll = args.includes('--all');
const BASE = (args.find((a) => !a.startsWith('--')) || 'https://www.woodscrossing.com') // WOODS-CROSSING: replace
  .replace(
  /\/$/,
  '',
);

// --- Load pages from the source of truth (pure-data TS module). -------------
const pkgDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let FLOOR_PLAN_PAGES, floorPlanTitle, floorPlanPagePath;
try {
  ({ FLOOR_PLAN_PAGES, floorPlanTitle, floorPlanPagePath } = await tsImport(
    pathToFileURL(path.join(pkgDir, 'src/data/floorPlanPages.ts')).href,
    import.meta.url,
  ));
} catch (err) {
  console.error(`Could not load src/data/floorPlanPages.ts: ${err.message}`);
  process.exit(1);
}
if (!Array.isArray(FLOOR_PLAN_PAGES) || FLOOR_PLAN_PAGES.length === 0) {
  console.error('FLOOR_PLAN_PAGES is empty — refusing to run a vacuous check.');
  process.exit(1);
}

// Hub-page expected <title> comes from the same source the build uses
// (src/data/seo.ts PAGE_SEO), so this check can never drift when the SEO
// title is edited.
let HUB_TITLE;
try {
  const { PAGE_SEO } = await tsImport(
    pathToFileURL(path.join(pkgDir, 'src/data/seo.ts')).href,
    import.meta.url,
  );
  HUB_TITLE = PAGE_SEO?.['/floor-plans']?.title;
} catch (err) {
  console.error(`Could not load src/data/seo.ts: ${err.message}`);
  process.exit(1);
}
if (!HUB_TITLE) {
  console.error('PAGE_SEO["/floor-plans"].title is missing — refusing to run a vacuous check.');
  process.exit(1);
}

// Deterministic sample: first, last, and evenly spaced slugs in between.
let sample = FLOOR_PLAN_PAGES;
if (!checkAll) {
  const want = 8;
  const step = Math.max(1, Math.floor(FLOOR_PLAN_PAGES.length / (want - 1)));
  const picked = new Map();
  for (let i = 0; i < FLOOR_PLAN_PAGES.length; i += step) picked.set(i, FLOOR_PLAN_PAGES[i]);
  picked.set(FLOOR_PLAN_PAGES.length - 1, FLOOR_PLAN_PAGES[FLOOR_PLAN_PAGES.length - 1]);
  sample = [...picked.values()];
}

const decode = (s) =>
  s
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

let failures = 0;
const fail = (what, msg) => {
  failures++;
  console.error(`FAIL  ${what}: ${msg}`);
};

async function fetchText(url) {
  const res = await fetch(url, {
    redirect: 'follow',
    headers: { 'user-agent': 'floor-plan-smoke-check' },
  });
  return { status: res.status, body: await res.text() };
}

const titleOf = (body) => {
  const m = body.match(/<title>([^<]*)<\/title>/);
  return m ? decode(m[1]) : '';
};

const hasCanonical = (body, canonical) =>
  body.includes(`rel="canonical" href="${canonical}"`) ||
  body.includes(`href="${canonical}" rel="canonical"`);

// --- Hub page (/floor-plans) -------------------------------------------------
{
  const url = `${BASE}/floor-plans`;
  try {
    const { status, body } = await fetchText(url);
    if (status !== 200) fail(url, `HTTP ${status}`);
    else {
      const title = titleOf(body);
      const expected = HUB_TITLE;
      if (title !== expected) {
        fail(
          url,
          title
            ? `wrong <title> — got "${title}", expected "${expected}". Likely serving the SPA fallback (broken artifact.toml rewrite).`
            : 'no <title> found in response.',
        );
      } else if (!hasCanonical(body, `${BASE}/floor-plans`)) {
        fail(url, 'canonical link missing.');
      } else if (!/"@type":\s*"ItemList"/.test(body)) {
        fail(url, 'ItemList JSON-LD missing.');
      } else {
        console.log(`ok    ${url}`);
      }
    }
  } catch (err) {
    fail(url, `fetch error: ${err.message}`);
  }
}

// --- Per-slug pages -----------------------------------------------------------
for (const page of sample) {
  const url = `${BASE}${floorPlanPagePath(page.slug)}`;
  let status, body;
  try {
    ({ status, body } = await fetchText(url));
  } catch (err) {
    fail(url, `fetch error: ${err.message}`);
    continue;
  }
  if (status !== 200) {
    fail(url, `HTTP ${status}`);
    continue;
  }
  const expectedTitle = floorPlanTitle(page);
  const title = titleOf(body);
  if (title !== expectedTitle) {
    fail(
      url,
      title
        ? `wrong <title> — got "${title}", expected "${expectedTitle}". Likely serving the SPA fallback (broken artifact.toml rewrite).`
        : 'no <title> found in response.',
    );
    continue;
  }
  const canonical = `${BASE}${floorPlanPagePath(page.slug)}`;
  if (!hasCanonical(body, canonical)) {
    fail(url, `canonical link for ${canonical} missing.`);
    continue;
  }
  if (!/"@type":\s*"FloorPlan"/.test(body)) {
    fail(url, 'FloorPlan JSON-LD missing.');
    continue;
  }
  console.log(`ok    ${url}`);
}

// --- Unknown slug → not-found stub with a REAL 404 ---------------------------
{
  const url = `${BASE}/floor-plans/this-slug-does-not-exist-check`;
  try {
    const { status, body } = await fetchText(url);
    if (status !== 404) {
      fail(
        url,
        `expected HTTP 404, got ${status} — unknown floor-plan slugs must not soft-404 (production server should serve the noindex stub with a 404 status).`,
      );
    } else if (!/name="robots"[^>]*noindex|noindex[^>]*name="robots"/.test(body)) {
      fail(url, '404 body is missing a noindex robots meta.');
    } else {
      console.log(`ok    ${url} (404 + noindex stub)`);
    }
  } catch (err) {
    fail(url, `fetch error: ${err.message}`);
  }
}

if (failures > 0) {
  console.error(`\n${failures} floor-plan page check(s) FAILED against ${BASE}`);
  process.exit(1);
}
console.log(`\nAll floor-plan page checks passed against ${BASE} (${sample.length} slug pages).`);
