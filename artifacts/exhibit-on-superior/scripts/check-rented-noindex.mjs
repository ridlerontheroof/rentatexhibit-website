#!/usr/bin/env node
// Rented-unit indexability guard (production smoke-check).
//
// Task 246 verified once, by hand, that a rented unit's URL renders with
// exactly one noindex robots meta, the "Residence Not Available" title, and
// no Offer JSON-LD — and that /available-units' rendered Apartment/Offer
// JSON-LD lists only currently available units. A future refactor of
// main.tsx's pre-hydration stripping, the Seo component, or the sold-out
// branch in UnitDetail.tsx could silently regress this, and Google would
// re-index rented apartments with stale prices. This script makes that
// verification repeatable: run it after each publish.
//
// What it does (all against production — the availability feed is only
// reachable from the workspace via production, AppFolio blocks direct
// workspace egress):
//   1. Fetches <base>/api/availability for the live unit list.
//   2. Renders a known-ABSENT unit URL in headless Chromium (CDP, same
//      zero-dependency pattern as check-units-above-fold.mjs) and asserts:
//        - exactly ONE meta[name=robots] in the rendered DOM, containing
//          "noindex"
//        - the rendered <title> is the sold-out title
//        - ZERO Offer/OfferForLease nodes in any rendered JSON-LD
//   3. Renders /available-units and asserts:
//        - the rendered Apartment nodes (with Offers) exactly match the live
//          feed's unit set — no rented stragglers, no missing units
//        - exactly one robots meta, and it does NOT say noindex
//
// Usage: node scripts/check-rented-noindex.mjs [baseUrl] [--unit NNNN]
//   default baseUrl: https://www.rentatexhibit.com
//   --unit: force a specific absent unit number (default: derived from the
//           live feed — a well-formed unit number not currently listed).
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const unitFlag = args.indexOf('--unit');
const FORCED_UNIT = unitFlag >= 0 ? args[unitFlag + 1] : null;
const BASE = (
  args.find((a, i) => !a.startsWith('--') && i !== unitFlag + 1) ||
  'https://www.rentatexhibit.com'
).replace(/\/$/, '');

const SOLD_OUT_TITLE = 'Residence Not Available | Exhibit On Superior';

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

// Serialized into the page: a snapshot of the fully-hydrated head state we
// assert on — robots metas, title, and every JSON-LD blob (with a flag for
// leftover prerendered [data-ssr-jsonld] scripts that main.tsx should have
// stripped before hydration).
const SNAPSHOT_EXPR = `(() => {
  const robots = [...document.querySelectorAll('meta[name="robots"]')].map((m) => m.getAttribute('content') ?? '');
  const jsonLd = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => ({
    ssrLeftover: s.hasAttribute('data-ssr-jsonld'),
    text: s.textContent ?? '',
  }));
  return { title: document.title, robots, jsonLd };
})()`;

/** Poll SNAPSHOT_EXPR until `done(snapshot)` is true or the timeout passes;
 *  returns the last snapshot either way (assertions produce the real error). */
async function settledSnapshot(cdp, done, timeoutMs = 45_000) {
  const deadline = Date.now() + timeoutMs;
  let snap = await cdp.eval(SNAPSHOT_EXPR);
  while (!done(snap) && Date.now() < deadline) {
    await sleep(750);
    snap = await cdp.eval(SNAPSHOT_EXPR);
  }
  return snap;
}

/** Every node (recursively) in all parsed JSON-LD blobs of a snapshot. */
function allJsonLdNodes(snapshot) {
  const nodes = [];
  const walk = (v) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') {
      nodes.push(v);
      Object.values(v).forEach(walk);
    }
  };
  for (const { text } of snapshot.jsonLd) {
    try {
      walk(JSON.parse(text));
    } catch {
      nodes.push({ '@type': '__UNPARSEABLE__', raw: text.slice(0, 120) });
    }
  }
  return nodes;
}

const isType = (node, type) => {
  const t = node['@type'];
  return Array.isArray(t) ? t.includes(type) : t === type;
};

async function main() {
  // --- 1. Live availability feed (source of truth). -------------------------
  const feedUrl = `${BASE}/api/availability`;
  const res = await fetch(feedUrl, { headers: { 'user-agent': 'rented-noindex-check' } });
  if (!res.ok) throw new Error(`${feedUrl} responded HTTP ${res.status} — cannot establish the live unit set.`);
  const feed = await res.json();
  const liveUnits = new Set((feed.units ?? []).map((u) => u.unit));
  if (liveUnits.size === 0) {
    throw new Error(`${feedUrl} returned zero units — refusing to run (a broken feed would make every assertion vacuous).`);
  }
  console.log(`Live feed: ${liveUnits.size} available units (updated ${feed.updatedAt ?? 'unknown'}).`);

  // --- 2. Pick a known-absent unit URL. --------------------------------------
  // Any well-formed unit number not in the feed exercises the sold-out branch.
  // Derive one from a live unit's line on a different floor (realistic URL a
  // stale bookmark/search result would carry), falling back to a fixed number.
  let absentUnit = FORCED_UNIT;
  if (absentUnit && liveUnits.has(absentUnit)) {
    throw new Error(`--unit ${absentUnit} is currently AVAILABLE per the live feed — pick a rented/absent unit.`);
  }
  if (!absentUnit) {
    outer: for (const unit of liveUnits) {
      const line = unit.slice(2);
      for (let floor = 2; floor <= 25; floor++) {
        const candidate = String(floor).padStart(2, '0') + line;
        if (!liveUnits.has(candidate)) {
          absentUnit = candidate;
          break outer;
        }
      }
    }
    absentUnit ??= '9901';
  }
  console.log(`Absent-unit page under test: /available-units/${absentUnit}`);

  // --- 3. Headless Chromium. -------------------------------------------------
  const chrome = findChromium();
  if (!chrome) {
    throw new Error('No headless Chromium found (checked CHROME_BIN, PATH, ms-playwright cache, nix store).');
  }
  const debugPort = 9222 + Math.floor(Math.random() * 20000);
  const profileDir = mkdtempSync(path.join(tmpdir(), 'rented-check-'));
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
  const fail = (what, msg) => {
    failures.push(`${what}: ${msg}`);
    console.error(`FAIL  ${what}: ${msg}`);
  };
  const ok = (what, msg) => console.log(`ok    ${what}: ${msg}`);

  // --- 4. Rented/absent unit page. -------------------------------------------
  const rentedUrl = `${BASE}/available-units/${absentUnit}`;
  {
    await cdp.send('Page.navigate', { url: rentedUrl });
    // Settled = hydration reached the sold-out branch: sold-out title AND a
    // noindex robots meta present (prerendered stale head may show first).
    const snap = await settledSnapshot(
      cdp,
      (s) => s.title === SOLD_OUT_TITLE && s.robots.some((r) => /noindex/i.test(r)),
    );

    if (snap.title !== SOLD_OUT_TITLE) {
      fail(rentedUrl, `rendered <title> is "${snap.title}" — expected the sold-out title "${SOLD_OUT_TITLE}". The UnitDetail sold-out branch or Seo component regressed.`);
    } else ok(rentedUrl, 'sold-out title rendered.');

    if (snap.robots.length !== 1) {
      fail(
        rentedUrl,
        `${snap.robots.length} robots metas in rendered DOM [${snap.robots.join(' | ')}] — expected exactly 1. main.tsx's pre-hydration robots-meta stripping likely regressed.`,
      );
    } else if (!/noindex/i.test(snap.robots[0])) {
      fail(rentedUrl, `single robots meta says "${snap.robots[0]}" — expected a noindex directive. Google could re-index this rented apartment.`);
    } else ok(rentedUrl, `exactly one robots meta, noindex ("${snap.robots[0]}").`);

    const leftovers = snap.jsonLd.filter((s) => s.ssrLeftover).length;
    if (leftovers > 0) {
      fail(rentedUrl, `${leftovers} prerendered [data-ssr-jsonld] script(s) survived hydration — main.tsx's pre-hydration JSON-LD stripping regressed.`);
    }
    const offers = allJsonLdNodes(snap).filter((n) => isType(n, 'Offer') || isType(n, 'OfferForLease'));
    if (offers.length > 0) {
      fail(rentedUrl, `${offers.length} Offer node(s) present in rendered JSON-LD — a rented unit must emit no Offer (stale price ${offers[0]?.price ?? '?'}).`);
    } else ok(rentedUrl, 'zero Offer JSON-LD nodes.');
  }

  // --- 5. /available-units rendered Apartment/Offer graph vs the live feed. --
  const listUrl = `${BASE}/available-units`;
  {
    const unitsInSnapshot = (s) => {
      const set = new Set();
      for (const node of allJsonLdNodes(s)) {
        if (isType(node, 'Apartment')) {
          const m = /Apartment (\d{4})/.exec(String(node.name ?? ''));
          if (m) set.add(m[1]);
        }
      }
      return set;
    };
    const sameSets = (a, b) => a.size === b.size && [...a].every((x) => b.has(x));

    await cdp.send('Page.navigate', { url: listUrl });
    // Settled = SSR scripts stripped, live-feed graph matches the feed. If the
    // baked snapshot is stale, the match only appears after the client query
    // resolves — hence the polling.
    const snap = await settledSnapshot(
      cdp,
      (s) => s.jsonLd.every((j) => !j.ssrLeftover) && sameSets(unitsInSnapshot(s), liveUnits),
    );

    const rendered = unitsInSnapshot(snap);
    const stragglers = [...rendered].filter((u) => !liveUnits.has(u));
    const missing = [...liveUnits].filter((u) => !rendered.has(u));
    if (stragglers.length || missing.length) {
      const parts = [];
      if (stragglers.length) parts.push(`rented unit(s) still advertised with Offers: ${stragglers.join(', ')}`);
      if (missing.length) parts.push(`live unit(s) missing from the graph: ${missing.join(', ')}`);
      fail(listUrl, `rendered Apartment JSON-LD does not match the live feed — ${parts.join('; ')}.`);
    } else ok(listUrl, `rendered Apartment JSON-LD exactly matches the live feed (${rendered.size} units).`);

    if (snap.robots.length !== 1) {
      fail(listUrl, `${snap.robots.length} robots metas [${snap.robots.join(' | ')}] — expected exactly 1.`);
    } else if (/noindex/i.test(snap.robots[0])) {
      fail(listUrl, `robots meta says "${snap.robots[0]}" — the availability page must stay indexable.`);
    } else ok(listUrl, `exactly one robots meta, indexable ("${snap.robots[0]}").`);
  }

  cdp.close();

  if (failures.length) {
    console.error(`\n${failures.length} check(s) FAILED against ${BASE}. A rented apartment page may be indexable with stale pricing — inspect main.tsx (pre-hydration stripping), the Seo component, and UnitDetail.tsx's sold-out branch, then re-publish.`);
    process.exitCode = 1;
  } else {
    console.log(`\nAll rented-unit indexability checks passed against ${BASE}.`);
  }
}

main()
  .catch((err) => {
    console.error(`Rented-unit indexability check errored: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(cleanup);
