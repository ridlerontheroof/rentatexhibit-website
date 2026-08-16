// Above-the-fold guard for the Available Units strip (/available-units).
//
// Task 185 compacted the page hero + strip heading so the first unit card is
// visible without scrolling on short laptop viewports (~520px tall).
//
// Task 592 (user-approved mockup) made the page map-first: the SightMap
// facade now leads and the unit strip follows. The guard therefore asserts,
// per viewport:
//   1. the SightMap section (#explore-the-building) starts within the
//      initial viewport — the page's primary interactive content is visible
//      without scrolling, and
//   2. the first unit row inside #available-units starts within 2.25x the
//      viewport height — one natural scroll away, so pricing never drifts
//      down the page as sections get added.
// Nothing in the unit tests can measure real layout, so this script renders
// the page in headless Chromium at:
//   - 1024x520 (short laptop)
//   - 390x844  (phone)
//
// It fails with the exact offending offset so a future hero/heading/spacing
// change that pushes the cards below the fold is caught immediately.
//
// Zero extra dependencies: it spawns the artifact's own Vite dev server on an
// ephemeral port, finds a Chromium binary the same way the fact-sheet printer
// does (nix store playwright-browsers derivations on Replit), and speaks the
// Chrome DevTools Protocol over Node's built-in WebSocket.
//
// Two modes:
//   - Dev (default): spawns the Vite dev server, matching what you see in
//     the workspace preview.
//       node scripts/check-units-above-fold.mjs          (pnpm run check:fold)
//   - Built (--built): serves the prerendered production build in dist/ via
//     `vite preview` — the exact HTML/CSS/JS visitors receive (prerendered
//     head/body, baked availability snapshot, minified CSS) — and runs the
//     identical assertions. Requires a prior `pnpm run build`.
//       node scripts/check-units-above-fold.mjs --built  (pnpm run check:fold:built)
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readdirSync, mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// --built: measure the prerendered production build (dist/) instead of the
// dev server, so the guard checks the exact pages visitors will see.
const BUILT = process.argv.includes('--built');

const VIEWPORTS = [
  { name: 'short laptop', width: 1024, height: 520 },
  { name: 'phone', width: 390, height: 844 },
];

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

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForHttp(url, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await sleep(300);
  }
  throw new Error(`Timed out waiting for ${url} to respond`);
}

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

  /** Evaluate an expression in the page; returns the JSON value.
   *  Retries when the page's execution context is torn down mid-eval (a Vite
   *  dev-server reload can destroy the context under concurrent validation
   *  runs) — every expression this script evaluates is an idempotent read or
   *  poll, so re-running it against the fresh context is safe. */
  async eval(expression, attempts = 3) {
    for (let attempt = 1; ; attempt++) {
      try {
        const { result, exceptionDetails } = await this.send('Runtime.evaluate', {
          expression,
          returnByValue: true,
          awaitPromise: true,
        });
        if (exceptionDetails) {
          throw new Error(`Page evaluation threw: ${exceptionDetails.text} ${result?.description ?? ''}`);
        }
        return result.value;
      } catch (err) {
        const msg = String(err?.message ?? err);
        const contextGone =
          msg.includes('Execution context was destroyed') || msg.includes('Cannot find context');
        if (!contextGone || attempt >= attempts) throw err;
        console.log(`  (page context reloaded mid-eval; retrying ${attempt}/${attempts - 1})`);
        await sleep(1000);
      }
    }
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

async function main() {
  const chrome = findChromium();
  if (!chrome) {
    throw new Error(
      'No headless Chromium found (checked CHROME_BIN, PATH, ms-playwright cache, nix store). ' +
        'Cannot run the above-the-fold check.',
    );
  }

  // 1. Throwaway app server for this artifact: the Vite dev server by
  // default, or `vite preview` over the prerendered production build when
  // --built is passed.
  if (BUILT) {
    const missing = ['index.html', path.join('available-units', 'index.html')].filter(
      (f) => !existsSync(path.join(root, 'dist', 'public', f)),
    );
    if (missing.length) {
      throw new Error(
        `--built requires a production build, but dist/public is missing ${missing.join(', ')}. ` +
          'Run `pnpm --filter @workspace/exhibit-on-superior run build` first.',
      );
    }
  }
  const appPort = await freePort();
  const viteArgs = BUILT
    ? ['preview', '--config', 'vite.config.ts', '--host', '127.0.0.1', '--port', String(appPort), '--strictPort']
    : ['--config', 'vite.config.ts', '--host', '127.0.0.1', '--port', String(appPort), '--strictPort'];
  const vite = spawn(path.join(root, 'node_modules', '.bin', 'vite'), viteArgs, {
    cwd: root,
    // vite.config.ts requires PORT; --port/--strictPort above still win.
    env: { ...process.env, PORT: String(appPort) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  children.push(vite);
  vite.on('exit', (code) => {
    if (code !== null && code !== 0) {
      console.error(`vite ${BUILT ? 'preview' : 'dev'} server exited with code ${code}`);
    }
  });
  console.log(
    BUILT
      ? 'Checking the prerendered production build (dist/public via vite preview).'
      : 'Checking the Vite dev server (run with --built to check the production build).',
  );
  const pageUrl = `http://127.0.0.1:${appPort}/available-units`;
  await waitForHttp(`http://127.0.0.1:${appPort}/`);

  // 2. Headless Chromium with CDP.
  const debugPort = await freePort();
  const profileDir = mkdtempSync(path.join(tmpdir(), 'fold-check-'));
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

  // Wait for the DevTools endpoint, then grab the page target.
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

  /**
   * Navigate to `url`, wait for the first row matching `selector`, and return
   * its bounding box plus the row count in the strip's list.
   */
  async function measureFirstRow(url, selector, description) {
    await cdp.send('Page.navigate', { url });
    await cdp.eval(`
      new Promise((resolve, reject) => {
        const started = Date.now();
        (function poll() {
          if (document.querySelector(${JSON.stringify(selector)})) return resolve(true);
          if (Date.now() - started > 30000) {
            return reject(new Error(${JSON.stringify(`Timed out waiting for ${description} (${selector})`)}));
          }
          setTimeout(poll, 100);
        })();
      })`);
    await sleep(500); // let fonts/layout settle
    // The readiness poll above can race navigation (it may resolve against
    // the pre-navigation document), so the measurement itself also polls
    // until a row exists instead of assuming rows[0] is present.
    return cdp.eval(`
      new Promise((resolve, reject) => {
        const started = Date.now();
        (function poll() {
          const rows = document.querySelectorAll(${JSON.stringify(selector)});
          if (rows.length > 0) {
            const rect = rows[0].getBoundingClientRect();
            return resolve({
              top: Math.round(rect.top),
              height: Math.round(rect.height),
              width: Math.round(rect.width),
              count: rows.length,
            });
          }
          if (Date.now() - started > 30000) {
            return reject(new Error(${JSON.stringify(`Timed out measuring ${description} (${selector})`)}));
          }
          setTimeout(poll, 100);
        })();
      })`);
  }

  // Phase 1: skeleton rows must share the real rows' geometry, so the fold
  // measurement below is honest whichever variant it lands on, and the
  // skeleton→live swap doesn't visibly jump. Renders both variants through
  // the dev-only ?layoutProbe hook in AvailableUnits and compares the first
  // row's bounding box.
  const GEOMETRY_TOLERANCE_PX = 6;
  for (const vp of VIEWPORTS) {
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.width < 768,
    });
    const real = await measureFirstRow(
      `${pageUrl}?layoutProbe=mock`,
      '#available-units ul:not([data-testid="units-skeleton"]) li',
      'a mock real unit row',
    );
    const skeleton = await measureFirstRow(
      `${pageUrl}?layoutProbe=skeleton`,
      '#available-units ul[data-testid="units-skeleton"] li',
      'a skeleton unit row',
    );
    const diffs = [];
    if (Math.abs(real.top - skeleton.top) > GEOMETRY_TOLERANCE_PX) {
      diffs.push(`first-row top: real ${real.top}px vs skeleton ${skeleton.top}px`);
    }
    if (Math.abs(real.height - skeleton.height) > GEOMETRY_TOLERANCE_PX) {
      diffs.push(`row height: real ${real.height}px vs skeleton ${skeleton.height}px`);
    }
    if (diffs.length) {
      failures.push(
        `[${vp.name} ${vp.width}x${vp.height}] UnitRowsSkeleton no longer matches real unit-row geometry — ` +
          `${diffs.join('; ')} (tolerance ${GEOMETRY_TOLERANCE_PX}px). ` +
          `Update UnitRowsSkeleton in AvailableUnits.tsx to mirror the redesigned row (or vice versa).`,
      );
    } else {
      console.log(
        `✓ [${vp.name} ${vp.width}x${vp.height}] skeleton row geometry matches real row ` +
          `(top ${skeleton.top}px vs ${real.top}px, height ${skeleton.height}px vs ${real.height}px).`,
      );
    }
  }

  // Phase 2: the original above-the-fold measurement.
  for (const vp of VIEWPORTS) {
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.width < 768,
    });
    await cdp.send('Page.navigate', { url: pageUrl });

    // Wait for the first unit row (real card or skeleton row — both share the
    // same geometry) to exist. The strip renders from the baked snapshot /
    // skeleton immediately, so this is fast; 30s covers first-visit dev
    // transforms.
    const waitExpr = `
      new Promise((resolve, reject) => {
        const started = Date.now();
        (function poll() {
          const row = document.querySelector('#available-units ul li');
          if (row) return resolve(true);
          if (Date.now() - started > 30000) {
            return reject(new Error(document.querySelector('#available-units')
              ? 'The #available-units section rendered but contains no unit rows (real or skeleton).'
              : 'No #available-units section rendered on /available-units — did the strip move or get renamed?'));
          }
          setTimeout(poll, 100);
        })();
      })`;
    await cdp.eval(waitExpr);
    // Let layout settle (fonts/images can shift the row slightly).
    await sleep(500);

    const m = await cdp.eval(`(() => {
      const row = document.querySelector('#available-units ul li');
      const map = document.querySelector('#explore-the-building');
      return {
        top: Math.round(row.getBoundingClientRect().top),
        mapTop: map ? Math.round(map.getBoundingClientRect().top) : null,
        scrollY: Math.round(window.scrollY),
        innerHeight: window.innerHeight,
      };
    })()`);

    if (m.scrollY !== 0) {
      failures.push(`[${vp.name} ${vp.width}x${vp.height}] page loaded pre-scrolled (scrollY=${m.scrollY}); measurement invalid.`);
      continue;
    }
    // Map-first (task 592): the SightMap section must start above the fold.
    if (m.mapTop === null) {
      failures.push(
        `[${vp.name} ${vp.width}x${vp.height}] no #explore-the-building section rendered on /available-units — ` +
          `did the SightMap section move or get renamed?`,
      );
    } else if (m.mapTop >= vp.height) {
      failures.push(
        `[${vp.name} ${vp.width}x${vp.height}] the SightMap section starts at ${m.mapTop}px — ` +
          `${m.mapTop - vp.height + 1}px below the ${vp.height}px fold. ` +
          `A hero/heading/spacing change pushed the map out of the initial viewport.`,
      );
    } else {
      console.log(
        `✓ [${vp.name} ${vp.width}x${vp.height}] SightMap section top at ${m.mapTop}px — above the ${vp.height}px fold.`,
      );
    }
    // The unit strip follows the map; it must stay within one natural scroll.
    const UNITS_MAX_FACTOR = 2.25;
    const unitsLimit = Math.round(vp.height * UNITS_MAX_FACTOR);
    if (m.top >= unitsLimit) {
      failures.push(
        `[${vp.name} ${vp.width}x${vp.height}] first unit card in #available-units starts at ` +
          `${m.top}px from the top — beyond the ${unitsLimit}px (${UNITS_MAX_FACTOR}x viewport) budget. ` +
          `Content added above the unit strip pushed pricing too far down the page.`,
      );
    } else {
      console.log(
        `✓ [${vp.name} ${vp.width}x${vp.height}] first unit card top at ${m.top}px — within the ${unitsLimit}px budget.`,
      );
    }
  }

  cdp.close();

  if (failures.length) {
    console.error('\nAbove-the-fold check FAILED:\n' + failures.map((f) => `  ✗ ${f}`).join('\n'));
    process.exitCode = 1;
  } else {
    console.log('Above-the-fold check passed for all viewports.');
  }
}

main()
  .catch((err) => {
    console.error(`Above-the-fold check errored: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(cleanup);
