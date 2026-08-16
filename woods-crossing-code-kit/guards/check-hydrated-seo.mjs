#!/usr/bin/env node
// Hydrated-head single-SEO guard (production smoke-check).
//
// Task 724 fixed duplicate share previews: the prerendered head's SEO block
// (between the `<!-- seo:start -->` / `<!-- seo:end -->` markers) is stripped
// before the first React render (src/lib/stripPrerenderedSeo.ts, called from
// main.tsx), so a JS-executing scraper (Facebook's rendered pass, Google's
// rendered crawl) sees exactly ONE og:image / og:title / canonical /
// twitter:image set — the route's own, emitted by <Seo> via Helmet.
//
// This script makes the verification repeatable against the LIVE site after
// every publish. For each checked route it asserts BOTH head versions:
//
//   RAW (always, every route): what non-JS fetchers (iMessage, WhatsApp,
//   Slack, Facebook's first pass) consume. Exactly one <title>, canonical,
//   og:title, og:image, twitter:image — and every one of them INSIDE the seo
//   markers, so hydration will replace (not duplicate) the set.
//
//   HYDRATED (headless Chromium via CDP, same zero-dependency pattern as
//   check-rented-noindex.mjs): after React hydrates, still exactly one of
//   each tag and NO element nodes left between the markers. Each poll checks
//   location.href against the target URL, so a navigation that hasn't
//   committed yet can never be satisfied by the previous route's settled
//   head.
//
// Routes: home, /amenities, EVERY live per-unit page (from the live feed —
// AppFolio photo URLs are per-unit, so image liveness must cover them all)
// and one blog article (from the live sitemap). The hydrated Chromium pass
// stays sampled at one per-unit page; raw + image checks cover every route.
//
// Environments without a headless Chromium (e.g. the deployed api-server
// runtime) run the RAW checks plus a shipped-strip-logic probe (the JS
// bundles must still reference the seo:start marker — i.e. hydration WILL
// remove the block) and clearly mark the reduced mode (forceable with
// --http-only).
//
// Assertion helpers live in scripts/lib/hydrated-seo.mjs (unit-tested by
// scripts/lib/hydrated-seo.test.mjs).
//
// Usage: node scripts/check-hydrated-seo.mjs [baseUrl] [--http-only]
//   default baseUrl: https://www.woodscrossing.com /* WOODS-CROSSING: replace */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  PREVIEW_TAGS,
  rawHeadFailures,
  isSettled,
  extractPreviewImageUrls,
  imageResponseFailure,
} from './lib/hydrated-seo.mjs';

const args = process.argv.slice(2);
const HTTP_ONLY = args.includes('--http-only');
const BASE = (args.find((a) => !a.startsWith('--')) || 'https://www.woodscrossing.com') // WOODS-CROSSING: replace
  .replace(/\/$/, '');
const UA = 'hydrated-seo-check';

/** Locate a headless-capable Chromium/Chrome binary, or null if none exists. */
function findChromium() {
  const candidates = [];
  if (process.env.CHROME_BIN) candidates.push(process.env.CHROME_BIN);
  for (const name of ['chromium', 'chromium-browser', 'google-chrome', 'google-chrome-stable', 'chrome']) {
    const which = spawnSync('which', [name], { encoding: 'utf8' });
    if (which.status === 0 && which.stdout.trim()) candidates.push(which.stdout.trim());
  }
  const home = process.env.HOME ?? '';
  try {
    for (const entry of readdirSync(path.join(home, '.cache', 'ms-playwright'))) {
      if (entry.startsWith('chromium-')) {
        candidates.push(path.join(home, '.cache', 'ms-playwright', entry, 'chrome-linux', 'chrome'));
      }
    }
  } catch {
    /* cache dir absent */
  }
  try {
    for (const entry of readdirSync('/nix/store')) {
      if (!entry.endsWith('-playwright-browsers-chromium')) continue;
      const base = path.join('/nix/store', entry);
      try {
        for (const sub of readdirSync(base)) {
          if (sub.startsWith('chromium-')) candidates.push(path.join(base, sub, 'chrome-linux', 'chrome'));
        }
      } catch {
        /* unreadable derivation */
      }
    }
  } catch {
    /* no nix store */
  }
  for (const c of candidates) {
    if (!existsSync(c)) continue;
    const v = spawnSync(c, ['--version'], { encoding: 'utf8', timeout: 15_000 });
    if (v.status === 0) return c;
  }
  return null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Minimal Chrome DevTools Protocol client over a page WebSocket. */
class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 1;
    this.pending = new Map();
    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(`CDP ${msg.error.message}`));
        else resolve(msg.result);
      }
    });
  }

  static connect(url) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);
      ws.addEventListener('open', () => resolve(new Cdp(ws)));
      ws.addEventListener('error', () => reject(new Error(`Could not connect to CDP at ${url}`)));
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const { result, exceptionDetails } = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      throw new Error(`Page evaluation threw: ${exceptionDetails.text} ${result?.description ?? ''}`);
    }
    return result.value;
  }

  close() {
    this.ws.close();
  }
}

const children = [];
const tmpDirs = [];
function cleanup() {
  for (const child of children) {
    try {
      child.kill('SIGKILL');
    } catch {
      /* already gone */
    }
  }
  for (const dir of tmpDirs) {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      /* best effort */
    }
  }
}
process.on('exit', cleanup);

// Serialized into the page: the document's current URL (so the caller can
// tell a committed navigation from the previous route's leftover document),
// counts of every share-preview tag, and whether any ELEMENT nodes survive
// between the seo markers (Helmet's route tags live OUTSIDE the markers; the
// prerendered block lives inside).
const SNAPSHOT_EXPR = `(() => {
  if (!document.head) return null; // mid-navigation; caller re-polls
  const count = (sel) => document.head.querySelectorAll(sel).length;
  const attr = (sel, name) =>
    [...document.head.querySelectorAll(sel)].map((el) => el.getAttribute(name) ?? '');
  let inBlock = false;
  let leftoverInBlock = 0;
  let sawMarkers = false;
  for (const node of document.head.childNodes) {
    if (node.nodeType === Node.COMMENT_NODE) {
      const marker = (node.textContent ?? '').trim();
      if (marker === 'seo:start') { inBlock = true; sawMarkers = true; }
      else if (marker === 'seo:end') inBlock = false;
      continue;
    }
    if (inBlock && node.nodeType === Node.ELEMENT_NODE) leftoverInBlock++;
  }
  return {
    href: location.href,
    title: count('title'),
    canonical: count('link[rel="canonical"]'),
    ogTitle: count('meta[property="og:title"]'),
    ogImage: count('meta[property="og:image"]'),
    twitterImage: count('meta[name="twitter:image"]'),
    sawMarkers,
    leftoverInBlock,
    canonicalHref: attr('link[rel="canonical"]', 'href'),
    ogImageContent: attr('meta[property="og:image"]', 'content'),
    twitterImageContent: attr('meta[name="twitter:image"]', 'content'),
  };
})()`;

/** Poll the head snapshot until it settles for `expectedUrl` or times out. */
async function settledSnapshot(cdp, expectedUrl, timeoutMs = 45_000) {
  const deadline = Date.now() + timeoutMs;
  let snap = await cdp.eval(SNAPSHOT_EXPR);
  while (!isSettled(snap, expectedUrl) && Date.now() < deadline) {
    await sleep(750);
    snap = await cdp.eval(SNAPSHOT_EXPR);
  }
  return snap;
}

// --- Route discovery ---------------------------------------------------------
// Returns { routes, hydratedRoutes }: raw checks cover EVERY route (a raw
// fetch is cheap, and AppFolio photo URLs are per-unit — a stale CDN photo on
// ANY listed apartment would ship an empty share card), while the Chromium
// hydrated pass stays sampled at one per-unit page (the strip logic is the
// same bundle on every unit route).
async function pickRoutes() {
  const routes = ['/', '/amenities'];
  const hydratedRoutes = ['/', '/amenities'];
  // EVERY live per-unit page from the availability feed (raw + image checks);
  // only the first one joins the hydrated sample.
  try {
    const feed = await (await fetch(`${BASE}/api/availability`, { headers: { 'user-agent': UA } })).json();
    const units = (feed?.units ?? []).map((u) => u?.unit).filter(Boolean);
    if (units.length) {
      for (const unit of units) routes.push(`/available-units/${unit}`);
      hydratedRoutes.push(`/available-units/${units[0]}`);
    } else console.warn('warn  live feed returned no units — skipping the per-unit routes.');
  } catch (err) {
    console.warn(`warn  could not read ${BASE}/api/availability (${err.message}) — skipping the per-unit routes.`);
  }
  // One blog article from the live sitemap.
  try {
    const xml = await (await fetch(`${BASE}/sitemap.xml`, { headers: { 'user-agent': UA } })).text();
    const m = xml.match(/<loc>\s*https?:\/\/[^<]*\/blog\/([^<\s/]+)\/?\s*<\/loc>/);
    if (m) {
      routes.push(`/blog/${m[1]}`);
      hydratedRoutes.push(`/blog/${m[1]}`);
    } else console.warn('warn  no /blog/<slug> URL in the live sitemap — skipping the blog route.');
  } catch (err) {
    console.warn(`warn  could not read ${BASE}/sitemap.xml (${err.message}) — skipping the blog route.`);
  }
  return { routes, hydratedRoutes };
}

// --- Raw-head checks (always run, every route) ---------------------------------
// Non-JS fetchers consume the raw prerendered head; it must already be a
// clean single set, entirely inside the seo markers. Returns the fetched
// HTML per route so the shipped-strip probe can reuse it.
async function rawChecks(routes) {
  const failures = [];
  const htmlByRoute = new Map();
  const imageUrlsByRoute = new Map();
  for (const route of routes) {
    const url = `${BASE}${route}`;
    let html;
    try {
      const res = await fetch(url, { headers: { 'user-agent': UA } });
      if (!res.ok) {
        failures.push(`${route}: raw fetch answered HTTP ${res.status}`);
        continue;
      }
      html = await res.text();
    } catch (err) {
      failures.push(`${route}: raw fetch failed (${err.message})`);
      continue;
    }
    htmlByRoute.set(route, html);
    imageUrlsByRoute.set(route, extractPreviewImageUrls(html));
    const routeFailures = rawHeadFailures(html, route);
    failures.push(...routeFailures);
    console.log(routeFailures.length ? `FAIL  raw ${route}` : `ok    raw ${route}: single preview set, all inside seo markers`);
  }
  return { failures, htmlByRoute, imageUrlsByRoute };
}

// --- Share-preview image liveness (both modes) ---------------------------------
// A rename, a drifted ?v= cache-buster, or a stale AppFolio photo URL leaves
// the head pointing at a dead image — scrapers then show an EMPTY preview
// card and nothing else alarms. Every og:image / twitter:image URL found
// (raw heads always; hydrated heads too in Chromium mode) must answer
// HTTP 200 with an image/* content type.
async function imageChecks(urlsByRoute) {
  const failures = [];
  const checked = new Map(); // absolute URL -> failure message | null
  for (const [route, urls] of urlsByRoute) {
    for (const raw of urls) {
      let abs;
      try {
        abs = new URL(raw, BASE).href;
      } catch {
        failures.push(`${route}: share-preview image URL is unparsable (${JSON.stringify(raw)})`);
        continue;
      }
      if (!checked.has(abs)) {
        let failure;
        try {
          const res = await fetch(abs, { headers: { 'user-agent': UA }, redirect: 'follow' });
          failure = imageResponseFailure(abs, res.status, res.headers.get('content-type'));
          // Drain the body so keep-alive sockets are reusable.
          await res.arrayBuffer().catch(() => {});
        } catch (err) {
          failure = `share-preview image ${abs} could not be fetched (${err.message})`;
        }
        checked.set(abs, failure);
        console.log(failure ? `FAIL  image ${abs}` : `ok    image ${abs}: 200 image/*`);
      }
      const failure = checked.get(abs);
      if (failure) failures.push(`${route}: ${failure}`);
    }
  }
  return failures;
}

/** No-Chromium probe: some shipped JS bundle must reference the seo:start
 *  marker, proving the hydration strip is deployed. */
async function stripLogicShipped(htmlByRoute) {
  for (const [, html] of htmlByRoute) {
    for (const m of html.matchAll(/src="([^"]+\.js)"/g)) {
      try {
        const js = await (await fetch(new URL(m[1], BASE), { headers: { 'user-agent': UA } })).text();
        if (js.includes('seo:start')) return true;
      } catch {
        /* bundle unreachable; keep looking */
      }
    }
  }
  return false;
}

// --- Hydrated checks (headless Chromium over CDP) ------------------------------
async function hydratedChecks(routes, chrome) {
  const debugPort = 9222 + Math.floor(Math.random() * 20_000);
  const profileDir = mkdtempSync(path.join(tmpdir(), 'hydrated-seo-'));
  tmpDirs.push(profileDir);
  const browser = spawn(
    chrome,
    [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${profileDir}`,
      'about:blank',
    ],
    { stdio: ['ignore', 'ignore', 'pipe'] },
  );
  children.push(browser);

  let pageWsUrl = null;
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline && !pageWsUrl) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json();
      pageWsUrl = targets.find((t) => t.type === 'page')?.webSocketDebuggerUrl ?? null;
    } catch {
      /* browser still starting */
    }
    if (!pageWsUrl) await sleep(250);
  }
  if (!pageWsUrl) throw new Error('Chromium started but no CDP page target appeared within 30s');

  const cdp = await Cdp.connect(pageWsUrl);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  const failures = [];
  const imageUrlsByRoute = new Map();
  for (const route of routes) {
    const url = `${BASE}${route}`;
    await cdp.send('Page.navigate', { url });
    const snap = await settledSnapshot(cdp, url);
    if (!isSettled(snap, url)) {
      const detail =
        snap == null
          ? 'no readable <head> within the timeout'
          : `href=${snap.href} ` +
            PREVIEW_TAGS.map((t) => `${t}=${snap[t]}`).join(' ') +
            ` leftoverInBlock=${snap.leftoverInBlock}` +
            ` og:image=${JSON.stringify(snap.ogImageContent)} canonical=${JSON.stringify(snap.canonicalHref)}`;
      failures.push(`${route}: hydrated head never settled to exactly one of each share-preview tag (${detail})`);
      console.error(`FAIL  hydrated ${route}: ${detail}`);
      continue;
    }
    if (!snap.sawMarkers) {
      // Not fatal on its own (the block was stripped either way), but a
      // missing marker pair means prerender tooling changed — say so loudly.
      console.warn(`warn  ${route}: seo:start/seo:end markers not found in the hydrated head.`);
    }
    imageUrlsByRoute.set(`${route} (hydrated)`, [...snap.ogImageContent, ...snap.twitterImageContent]);
    console.log(
      `ok    hydrated ${route}: ${PREVIEW_TAGS.map((t) => `${t}=${snap[t]}`).join(' ')} leftoverInBlock=${snap.leftoverInBlock} (og:image → ${snap.ogImageContent[0]})`,
    );
  }
  cdp.close();
  return { failures, imageUrlsByRoute };
}

// --- Main ---------------------------------------------------------------------
async function main() {
  const { routes, hydratedRoutes } = await pickRoutes();
  console.log(`Checking share-preview heads on ${BASE} for routes: ${routes.join(', ')}`);

  // Raw heads first — every route, every mode.
  const { failures, htmlByRoute, imageUrlsByRoute } = await rawChecks(routes);

  const chrome = HTTP_ONLY ? null : findChromium();
  if (chrome) {
    const hydrated = await hydratedChecks(hydratedRoutes, chrome);
    failures.push(...hydrated.failures);
    for (const [route, urls] of hydrated.imageUrlsByRoute) imageUrlsByRoute.set(route, urls);
  } else {
    console.log(
      HTTP_ONLY
        ? 'MODE  http-only — skipping the hydrated (Chromium) pass; probing shipped strip logic instead.'
        : 'warn  no headless Chromium found — skipping the hydrated pass; probing shipped strip logic instead.',
    );
    if (await stripLogicShipped(htmlByRoute)) {
      console.log('ok    shipped JS contains the seo:start strip logic.');
    } else {
      failures.push('no shipped JS bundle references the seo:start marker — the hydration strip may not be deployed');
    }
  }

  // Every share-preview image URL found (raw always; hydrated too when
  // Chromium ran) must be alive, or shared links show an empty card.
  failures.push(...(await imageChecks(imageUrlsByRoute)));
  return failures;
}

main()
  .then((failures) => {
    if (failures.length) {
      console.error(
        `\n${failures.length} check(s) FAILED against ${BASE}. A shared link may show a duplicate, broken, or EMPTY preview card — inspect src/lib/stripPrerenderedSeo.ts, its call in src/main.tsx, the <Seo> component, and (for dead image URLs) the share-card assets under public/images/og, then re-publish.`,
      );
      process.exit(1);
    }
    console.log(`\nPASS  every checked route serves a single share-preview tag set (raw${HTTP_ONLY ? '' : ' + hydrated'}) on ${BASE}.`);
    process.exit(0);
  })
  .catch((err) => {
    console.error(`ERROR ${err.message}`);
    process.exit(1);
  });
