// Above-the-fold guard for the Available Units strip (/available-units).
//
// Task 185 compacted the page hero + strip heading so the first unit card is
// visible without scrolling on short laptop viewports (~520px tall). Nothing
// in the unit tests can measure real layout, so this script renders the page
// in headless Chromium and asserts the top of the first unit row inside
// #available-units sits within the initial viewport at:
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
// Run: node scripts/check-units-above-fold.mjs
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readdirSync, mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

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

  /** Evaluate an expression in the page; returns the JSON value. */
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

async function main() {
  const chrome = findChromium();
  if (!chrome) {
    throw new Error(
      'No headless Chromium found (checked CHROME_BIN, PATH, ms-playwright cache, nix store). ' +
        'Cannot run the above-the-fold check.',
    );
  }

  // 1. Throwaway Vite dev server for this artifact.
  const appPort = await freePort();
  const vite = spawn(
    path.join(root, 'node_modules', '.bin', 'vite'),
    ['--config', 'vite.config.ts', '--host', '127.0.0.1', '--port', String(appPort), '--strictPort'],
    {
      cwd: root,
      // vite.config.ts requires PORT; --port/--strictPort above still win.
      env: { ...process.env, PORT: String(appPort) },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  children.push(vite);
  vite.on('exit', (code) => {
    if (code !== null && code !== 0) console.error(`vite dev server exited with code ${code}`);
  });
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
      const rect = row.getBoundingClientRect();
      return { top: Math.round(rect.top), scrollY: Math.round(window.scrollY), innerHeight: window.innerHeight };
    })()`);

    if (m.scrollY !== 0) {
      failures.push(`[${vp.name} ${vp.width}x${vp.height}] page loaded pre-scrolled (scrollY=${m.scrollY}); measurement invalid.`);
      continue;
    }
    if (m.top >= vp.height) {
      failures.push(
        `[${vp.name} ${vp.width}x${vp.height}] first unit card in #available-units starts at ` +
          `${m.top}px from the top — ${m.top - vp.height + 1}px below the ${vp.height}px fold. ` +
          `A hero/heading/spacing change pushed the cards out of the initial viewport.`,
      );
    } else {
      console.log(
        `✓ [${vp.name} ${vp.width}x${vp.height}] first unit card top at ${m.top}px — above the ${vp.height}px fold.`,
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
