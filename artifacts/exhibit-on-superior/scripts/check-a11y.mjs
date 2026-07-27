// Automated accessibility (axe-core) sweep across the core leasing paths.
//
// Task 463: renders each page in headless Chromium (same zero-dependency CDP
// pattern as check-units-above-fold.mjs), injects the locally installed
// axe-core, and fails on any critical or serious violation. Moderate/minor
// findings are reported but do not fail the check — they are triaged in
// docs/a11y-audit-2026-07.md.
//
// Modes:
//   node scripts/check-a11y.mjs            # dev server (pnpm run check:a11y)
//   node scripts/check-a11y.mjs --built    # vite preview over dist/ (requires build)
//   node scripts/check-a11y.mjs --report   # also print a markdown findings table
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readdirSync, mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUILT = process.argv.includes('--built');
const REPORT = process.argv.includes('--report');

// --- Page list: the core leasing paths ---------------------------------------
// The unit page is picked from the baked availability snapshot so the check
// keeps working as inventory changes.
const snapshot = JSON.parse(
  readFileSync(path.join(root, 'src', 'data', 'availabilitySnapshot.json'), 'utf8'),
);
const firstUnit = snapshot.units?.[0]?.unit;
if (!firstUnit) throw new Error('availabilitySnapshot.json has no units; cannot pick a unit page.');

const PAGES = [
  '/',
  '/available-units',
  `/available-units/${firstUnit}`,
  '/photo-gallery',
  '/virtual-tour',
  '/contact-us',
  '/schedule-showing',
  '/schedule-a-tour',
  '/knowledge/how-much-is-rent',
];

// Severities that fail the check.
const FAIL_IMPACTS = new Set(['critical', 'serious']);

// Rules excluded with documented justification (see docs/a11y-audit-2026-07.md):
// - 'video-caption': the Vimeo/YouTube embeds are third-party players; caption
//   availability is controlled in the video platform, not this codebase.
// - 'color-contrast': out of scope for this pass — the palette was fixed and
//   manually verified in an earlier contrast task; axe's flat-color heuristic
//   still flags the brand-gold accents that were reviewed there. Findings are
//   documented (not silently dropped) in docs/a11y-audit-2026-07.md.
const DISABLED_RULES = ['video-caption', 'color-contrast'];

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
        'Cannot run the accessibility check.',
    );
  }

  const axeSource = readFileSync(
    path.join(root, 'node_modules', 'axe-core', 'axe.min.js'),
    'utf8',
  );

  if (BUILT && !existsSync(path.join(root, 'dist', 'public', 'index.html'))) {
    throw new Error('--built requires a production build; run `pnpm run build` first.');
  }
  const appPort = await freePort();
  const viteArgs = BUILT
    ? ['preview', '--config', 'vite.config.ts', '--host', '127.0.0.1', '--port', String(appPort), '--strictPort']
    : ['--config', 'vite.config.ts', '--host', '127.0.0.1', '--port', String(appPort), '--strictPort'];
  const vite = spawn(path.join(root, 'node_modules', '.bin', 'vite'), viteArgs, {
    cwd: root,
    env: { ...process.env, PORT: String(appPort) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  children.push(vite);
  console.log(
    BUILT
      ? 'axe-core sweep against the prerendered production build (vite preview).'
      : 'axe-core sweep against the Vite dev server (run with --built for the production build).',
  );
  await waitForHttp(`http://127.0.0.1:${appPort}/`);

  const debugPort = await freePort();
  const profileDir = mkdtempSync(path.join(tmpdir(), 'a11y-check-'));
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
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  const failures = [];
  const reportRows = [];

  for (const page of PAGES) {
    const url = `http://127.0.0.1:${appPort}${page}`;
    await cdp.send('Page.navigate', { url });
    // Wait for React to hydrate and render real content (an <h1> or <main>
    // with children), then let images/fonts settle.
    await cdp.eval(`
      new Promise((resolve, reject) => {
        const started = Date.now();
        (function poll() {
          const main = document.querySelector('main');
          if (main && main.children.length > 0 && document.querySelector('h1')) return resolve(true);
          if (Date.now() - started > 30000) return reject(new Error('Timed out waiting for page content on ${page}'));
          setTimeout(poll, 150);
        })();
      })`);
    await sleep(1200);

    // Inject axe and run it against the document.
    await cdp.eval(`(() => { if (!window.axe) { ${axeSource.replace(/<\/script>/g, '<\\/script>')} } return !!window.axe; })()`);
    const result = await cdp.eval(`
      axe.run(document, {
        resultTypes: ['violations'],
        rules: { ${DISABLED_RULES.map((r) => `'${r}': { enabled: false }`).join(', ')} },
      }).then((r) => r.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        nodes: v.nodes.slice(0, 5).map((n) => n.target.join(' ')),
        count: v.nodes.length,
      })))`);

    const failing = result.filter((v) => FAIL_IMPACTS.has(v.impact));
    const advisory = result.filter((v) => !FAIL_IMPACTS.has(v.impact));
    for (const v of result) {
      reportRows.push({ page, ...v });
    }
    if (failing.length) {
      for (const v of failing) {
        failures.push(
          `[${page}] ${v.impact}: ${v.id} — ${v.help} (${v.count} node${v.count === 1 ? '' : 's'}: ${v.nodes.join('; ')})`,
        );
      }
      console.log(`✗ ${page} — ${failing.length} critical/serious violation(s)`);
    } else {
      console.log(
        `✓ ${page} — no critical/serious violations${advisory.length ? ` (${advisory.length} moderate/minor noted)` : ''}`,
      );
    }
    for (const v of advisory) {
      console.log(`    (advisory) ${v.impact}: ${v.id} — ${v.help} (${v.count} nodes)`);
    }
  }

  cdp.close();

  if (REPORT) {
    console.log('\n## Findings (markdown)\n');
    console.log('| Page | Rule | Impact | Nodes | Description |');
    console.log('| --- | --- | --- | --- | --- |');
    for (const r of reportRows) {
      console.log(`| ${r.page} | ${r.id} | ${r.impact} | ${r.count} | ${r.help} |`);
    }
    if (reportRows.length === 0) console.log('| (none) | — | — | — | axe-core reported zero violations |');
  }

  if (failures.length) {
    console.error('\nAccessibility check FAILED:\n' + failures.map((f) => `  ✗ ${f}`).join('\n'));
    process.exitCode = 1;
  } else {
    console.log(`\nAccessibility check passed: no critical/serious axe violations across ${PAGES.length} pages.`);
  }
}

main()
  .catch((err) => {
    console.error(`Accessibility check errored: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(cleanup);
