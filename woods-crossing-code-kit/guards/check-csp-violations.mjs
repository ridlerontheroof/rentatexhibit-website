// CSP lockout guard: catch a blocked inline script BEFORE publish.
//
// The production server (server/index.mjs) allows inline scripts by hash only
// ('unsafe-inline' removed from script-src): at startup it hashes every
// executing inline <script> found in dist/public HTML. That is self-healing
// for prerendered scripts, but a script injected client-side at runtime —
// a GTM "Custom HTML" tag, or a library that document.write's an inline
// script — would be silently blocked in production.
//
// This check serves the production build with the REAL server and the CSP
// enforced (CSP_ENFORCE=1), loads the key page types in headless Chromium,
// and fails on any `securitypolicyviolation` event or CSP console error.
//
// Pages covered (one per page type):
//   /                          home (GTM bootstrap + availability prefetch)
//   /available-units           units strip (baked snapshot + hydration query)
//   /map-directions            Google Maps JS (style/font/connect allowances)
//   /knowledge/amenity-hours   knowledge article page
//   /artist-in-residence       legacy meta-refresh redirect stub (+ its target)
//
// Zero extra dependencies: same nix-store Chromium + raw CDP-over-WebSocket
// pattern as check-units-above-fold.mjs.
//
//   node scripts/check-csp-violations.mjs   (pnpm run check:csp — requires a
//                                            prior `pnpm run build`)
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readdirSync, mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Key page types. Each entry: [path, selector that proves the page rendered].
const PAGES = [
  { url: '/', description: 'home', settleMs: 4000 },
  { url: '/available-units', description: 'available units', settleMs: 4000 },
  { url: '/map-directions', description: 'map & directions (Google Maps JS)', settleMs: 8000 },
  { url: '/knowledge/amenity-hours', description: 'knowledge article', settleMs: 3000 },
  // Meta-refresh redirect stub: the stub itself plus the page it lands on.
  { url: '/artist-in-residence', description: 'legacy redirect stub → home', settleMs: 4000 },
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
    this.listeners = new Map(); // event method -> handler(params)
    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(`CDP ${msg.error.message}`));
        else resolve(msg.result);
      } else if (msg.method && this.listeners.has(msg.method)) {
        this.listeners.get(msg.method)(msg.params);
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

  on(method, handler) {
    this.listeners.set(method, handler);
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

async function main() {
  const chrome = findChromium();
  if (!chrome) {
    throw new Error(
      'No headless Chromium found (checked CHROME_BIN, PATH, ms-playwright cache, nix store). ' +
        'Cannot run the CSP violation check.',
    );
  }

  // Sanity: this check exercises the production build via the real server.
  // Validation runs sibling workflows concurrently and a racing rebuild
  // empties dist/public mid-check (emptyOutDir) before repopulating it, so —
  // per the repo's dist-race convention — wait for the build chain's LAST
  // output (index.html.br, written by precompress) instead of failing on the
  // first missing-file snapshot.
  const required = [
    'index.html',
    'index.html.br',
    path.join('available-units', 'index.html'),
  ].map((f) => path.join(root, 'dist', 'public', f));
  const distDeadline = Date.now() + 240_000;
  let missing = required.filter((f) => !existsSync(f));
  while (missing.length > 0 && Date.now() < distDeadline) {
    console.log(
      `dist/public incomplete (missing ${missing.map((f) => path.relative(root, f)).join(', ')}) — waiting for a rebuild in flight…`,
    );
    await new Promise((r) => setTimeout(r, 5_000));
    missing = required.filter((f) => !existsSync(f));
  }
  if (missing.length > 0) {
    throw new Error(
      `dist/public is missing ${missing.map((f) => path.relative(root, f)).join(', ')} — run \`pnpm --filter @workspace/YOUR-WEB-ARTIFACT run build\` first.`,
    );
  }

  // 1. The REAL production server (server/index.mjs) with the CSP enforced,
  // exactly as it runs in the autoscale deployment.
  const appPort = await freePort();
  const server = spawn(process.execPath, [path.join(root, 'server', 'index.mjs')], {
    cwd: root,
    env: { ...process.env, PORT: String(appPort), CSP_ENFORCE: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  children.push(server);
  let serverLog = '';
  server.stdout.on('data', (d) => (serverLog += d));
  server.stderr.on('data', (d) => (serverLog += d));
  server.on('exit', (code) => {
    if (code !== null && code !== 0) {
      console.error(`production server exited with code ${code}\n${serverLog}`);
    }
  });
  await waitForHttp(`http://127.0.0.1:${appPort}/`);
  // Belt and braces: the header must actually be the enforced one.
  const headRes = await fetch(`http://127.0.0.1:${appPort}/`);
  if (!headRes.headers.get('content-security-policy')) {
    throw new Error(
      'Server did not send an enforced Content-Security-Policy header despite CSP_ENFORCE=1 — ' +
        'the check would silently pass without it.',
    );
  }
  console.log(`Production server up on :${appPort} with CSP enforced.`);

  // 2. Headless Chromium with CDP.
  const debugPort = await freePort();
  const profileDir = mkdtempSync(path.join(tmpdir(), 'csp-check-'));
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
  await cdp.send('Log.enable');

  // Two independent violation sources, so nothing slips through:
  //   a) an in-page `securitypolicyviolation` listener injected before any
  //      document script runs (survives the meta-refresh stub navigation —
  //      it re-arms on every new document), and
  //   b) the browser console: Chromium logs every CSP block as an error
  //      ("Refused to execute inline script…"), which also catches blocks
  //      that never fire the DOM event (e.g. worker-src).
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
      window.__cspViolations = [];
      document.addEventListener('securitypolicyviolation', (e) => {
        window.__cspViolations.push({
          directive: e.effectiveDirective || e.violatedDirective,
          blockedURI: e.blockedURI,
          sourceFile: e.sourceFile,
          line: e.lineNumber,
          sample: (e.sample || '').slice(0, 120),
          document: location.pathname,
        });
      });
    `,
  });
  const consoleViolations = [];
  cdp.on('Log.entryAdded', ({ entry }) => {
    if (/content security policy/i.test(entry.text ?? '')) {
      consoleViolations.push({ url: entry.url, text: entry.text });
    }
  });

  // Harness self-test: before trusting "no violations", prove the detector
  // actually sees one. Inject an inline script the way a GTM Custom HTML tag
  // would — under the enforced CSP it must be blocked, and BOTH the DOM
  // listener and the console channel must report it. If neither fires, the
  // harness is blind and every "✓" below would be meaningless.
  {
    console.log('Self-test: injecting an unhashed inline script (must be blocked & detected)…');
    consoleViolations.length = 0;
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${appPort}/` });
    await cdp.eval(`
      new Promise((resolve) => {
        if (document.readyState === 'complete') return resolve(true);
        window.addEventListener('load', () => resolve(true), { once: true });
        setTimeout(() => resolve(true), 20000);
      })`);
    await cdp.eval(`(() => {
      const s = document.createElement('script');
      s.textContent = 'window.__cspSelfTestRan = true;';
      document.head.appendChild(s);
      return true;
    })()`);
    await sleep(1000);
    const ran = await cdp.eval('window.__cspSelfTestRan === true');
    const domSaw = ((await cdp.eval('window.__cspViolations || []')) ?? []).length > 0;
    const consoleSaw = consoleViolations.length > 0;
    if (ran) {
      throw new Error(
        'Self-test FAILED: the injected inline script executed — the CSP is not actually blocking unhashed inline scripts.',
      );
    }
    if (!domSaw || !consoleSaw) {
      throw new Error(
        `Self-test FAILED: injected inline script was blocked but not detected (DOM listener: ${domSaw}, console: ${consoleSaw}) — the harness cannot be trusted.`,
      );
    }
    consoleViolations.length = 0;
    console.log('  ✓ self-test violation detected on both channels');
  }

  const failures = [];
  for (const page of PAGES) {
    const url = `http://127.0.0.1:${appPort}${page.url}`;
    console.log(`\nVisiting ${page.url} (${page.description})…`);
    consoleViolations.length = 0;
    await cdp.send('Page.navigate', { url });
    // Wait for load, hydration, GTM/Maps init, and any meta-refresh hop.
    await cdp.eval(`
      new Promise((resolve) => {
        if (document.readyState === 'complete') return resolve(true);
        window.addEventListener('load', () => resolve(true), { once: true });
        setTimeout(() => resolve(true), 20000);
      })`);
    await sleep(page.settleMs);
    const domViolations = (await cdp.eval('window.__cspViolations || []')) ?? [];
    const all = [
      ...domViolations.map(
        (v) =>
          `securitypolicyviolation on ${v.document}: ${v.directive} blocked ${v.blockedURI}` +
          (v.sourceFile ? ` (${v.sourceFile}:${v.line})` : '') +
          (v.sample ? ` sample: ${JSON.stringify(v.sample)}` : ''),
      ),
      ...consoleViolations.map((v) => `console: ${v.text}${v.url ? ` (${v.url})` : ''}`),
    ];
    if (all.length) {
      failures.push({ page: page.url, violations: all });
      for (const v of all) console.error(`  ✗ ${v}`);
    } else {
      console.log('  ✓ no CSP violations');
    }
  }

  cdp.close();

  if (failures.length) {
    console.error(
      `\nCSP CHECK FAILED: ${failures.length} page(s) had violations under the enforced production CSP.\n` +
        'A blocked script/resource here would be silently broken for real visitors after publish.\n' +
        'Fix by removing the runtime-injected inline script (keep GTM tags to external-src types) or,\n' +
        'for a legitimate new source, extend the CSP in server/index.mjs.',
    );
    process.exit(1);
  }
  console.log('\nCSP check passed: no violations on any key page type with the enforced production CSP.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(String(err?.stack ?? err));
    process.exit(1);
  });
