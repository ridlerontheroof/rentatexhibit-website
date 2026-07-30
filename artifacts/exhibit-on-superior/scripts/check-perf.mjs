// Repeatable page-speed (lab) suite — Task "check:perf".
//
// Measures Lighthouse performance metrics for the key leasing pages, mobile
// and desktop, against the LOCAL PRODUCTION BUILD (dist/public served via
// the production server) — the same prerendered HTML/CSS/JS visitors receive. It
// deliberately measures the local build (not the live site) so runs are
// hermetic and can gate a publish; network-level CDN effects are out of scope.
//
// Metrics per page/form factor:
//   - LCP, CLS, TBT (TBT is the lab proxy for INP)
//   - JS payload, image payload, third-party bytes (transfer sizes)
//
// Output:
//   - perf/latest.json      — full machine-readable report (timestamped)
//   - perf/SUMMARY.md       — human-readable table
//   - perf/baseline.json    — committed baseline (written only with --baseline)
//   - perf/thresholds.json  — per-page/form-factor threshold overrides,
//                             generated with --calibrate from the current run
//
// Pass/fail: each page is judged against ASPIRATIONAL_THRESHOLDS
// (LCP ≤ 2500ms, CLS ≤ 0.10, TBT ≤ 200ms) unless perf/thresholds.json holds a
// calibrated (looser) override for that page+metric. Any failure exits
// non-zero so the script can gate like the other check:* workflows.
//
// Usage:
//   node scripts/check-perf.mjs                  # compare vs thresholds
//   node scripts/check-perf.mjs --baseline       # also write perf/baseline.json
//   node scripts/check-perf.mjs --calibrate      # regenerate thresholds.json
//                                                # from this run (25% headroom,
//                                                # never looser than needed,
//                                                # never tighter than aspirational)
//   node scripts/check-perf.mjs --pages /,/amenities   # subset (debugging)
//
// Requires a prior production build:
//   pnpm --filter @workspace/exhibit-on-superior run build
//
// Related build-time guard (runs in the normal `pnpm test` vitest suite):
//   src/knowledge-chunk-isolation.test.ts — fails if any non-knowledge page
//   chunk in dist/public/assets imports the ~176 KB knowledge article bundle
//   again (the mobile-budget win this suite measures depends on that split;
//   shared components must import knowledgePath.ts / knowledgeQuestions.ts,
//   never src/data/knowledge.ts).
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readdirSync, mkdirSync, mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const perfDir = path.join(root, 'perf');

const WRITE_BASELINE = process.argv.includes('--baseline');
const CALIBRATE = process.argv.includes('--calibrate');
const pagesArgIdx = process.argv.indexOf('--pages');

// Unit-detail pages come and go as apartments rent; audit two real ones from
// the current build (first + last published unit) instead of hardcoding unit
// numbers that 404 once rented. Their thresholds use the shared
// "/available-units/<unit>" override key below.
function currentUnitPages() {
  try {
    const units = readdirSync(path.join(root, 'dist', 'public', 'available-units'), { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
    if (units.length === 0) return [];
    const picks = units.length > 1 ? [units[0], units[units.length - 1]] : [units[0]];
    return picks.map((u) => `/available-units/${u}`);
  } catch {
    return [];
  }
}

const DEFAULT_PAGES = [
  '/',
  '/available-units',
  ...currentUnitPages(),
  '/amenities',
  '/photo-gallery',
  '/virtual-tour',
  '/knowledge',
  '/knowledge/application-fee',
  '/contact-us',
];
const PAGES = pagesArgIdx > -1 ? process.argv[pagesArgIdx + 1].split(',') : DEFAULT_PAGES;

const FORM_FACTORS = ['mobile', 'desktop'];

// Aspirational Core Web Vitals lab targets (mobile-first; applied to both).
const ASPIRATIONAL_THRESHOLDS = {
  lcpMs: 2500,
  cls: 0.1,
  tbtMs: 200, // lab proxy for INP
};

/* ---------- helpers shared with check-units-above-fold.mjs pattern ---------- */

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
  } catch { /* absent */ }
  try {
    for (const entry of readdirSync('/nix/store')) {
      if (!entry.endsWith('-playwright-browsers-chromium')) continue;
      const base = path.join('/nix/store', entry);
      try {
        for (const sub of readdirSync(base)) {
          if (sub.startsWith('chromium-')) candidates.push(path.join(base, sub, 'chrome-linux', 'chrome'));
        }
      } catch { /* unreadable */ }
    }
  } catch { /* no nix store */ }
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
    } catch { /* not up yet */ }
    await sleep(300);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

const children = [];
const tmpDirs = [];
function cleanup() {
  for (const child of children) {
    try { child.kill('SIGKILL'); } catch { /* gone */ }
  }
  for (const dir of tmpDirs) {
    try { rmSync(dir, { recursive: true, force: true }); } catch { /* best effort */ }
  }
}
process.on('exit', cleanup);

/* ------------------------------- extraction ------------------------------- */

function extractMetrics(lhr) {
  const a = lhr.audits;
  const num = (id) => a[id]?.numericValue ?? null;

  // Payload breakdown from the network-requests audit (transferSize).
  let jsBytes = 0;
  let imageBytes = 0;
  let thirdPartyBytes = 0;
  let totalBytes = 0;
  const finalOrigin = new URL(lhr.finalDisplayedUrl ?? lhr.requestedUrl).origin;
  for (const item of a['network-requests']?.details?.items ?? []) {
    const size = item.transferSize ?? 0;
    totalBytes += size;
    if (item.resourceType === 'Script') jsBytes += size;
    if (item.resourceType === 'Image') imageBytes += size;
    try {
      if (new URL(item.url).origin !== finalOrigin) thirdPartyBytes += size;
    } catch { /* data: etc. count as first-party */ }
  }

  return {
    performanceScore: lhr.categories.performance?.score ?? null,
    lcpMs: num('largest-contentful-paint'),
    cls: num('cumulative-layout-shift'),
    tbtMs: num('total-blocking-time'),
    fcpMs: num('first-contentful-paint'),
    speedIndexMs: num('speed-index'),
    jsBytes,
    imageBytes,
    thirdPartyBytes,
    totalBytes,
  };
}

const kb = (b) => (b == null ? '–' : `${Math.round(b / 1024)} KB`);
const ms = (v) => (v == null ? '–' : `${Math.round(v)} ms`);

/* ---------------------------------- main ---------------------------------- */

async function main() {
  // Prod build must exist — this suite measures dist/public.
  if (!existsSync(path.join(root, 'dist', 'public', 'index.html'))) {
    throw new Error(
      'dist/public/index.html missing — run `pnpm --filter @workspace/exhibit-on-superior run build` first.',
    );
  }

  const chrome = findChromium();
  if (!chrome) throw new Error('No headless Chromium found (CHROME_BIN, PATH, ms-playwright cache, nix store).');

  // Serve the production build through the real production server
  // (server/index.mjs), NOT `vite preview`: preview ignores the artifact's
  // clean-URL rewrites and answers every route (/available-units, /amenities,
  // …) with the HOME page's prerendered HTML, so Lighthouse was measuring an
  // SPA-boot render (LCP gated on hydration, wrong hero preload) instead of
  // the per-page prerendered HTML real visitors receive.
  const appPort = await freePort();
  const vite = spawn(
    process.execPath,
    [path.join(root, 'server', 'index.mjs')],
    { cwd: root, env: { ...process.env, PORT: String(appPort) }, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  children.push(vite);
  await waitForHttp(`http://127.0.0.1:${appPort}/`);

  // Headless Chromium with a debugging port; Lighthouse attaches to it.
  const debugPort = await freePort();
  const profileDir = mkdtempSync(path.join(tmpdir(), 'perf-check-'));
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
  {
    const deadline = Date.now() + 30_000;
    let up = false;
    while (Date.now() < deadline && !up) {
      try {
        await (await fetch(`http://127.0.0.1:${debugPort}/json/version`)).json();
        up = true;
      } catch { await sleep(250); }
    }
    if (!up) throw new Error('Chromium did not expose its CDP endpoint within 30s');
  }

  // Load calibrated per-page threshold overrides, if committed.
  let overrides = {};
  const thresholdsPath = path.join(perfDir, 'thresholds.json');
  if (!CALIBRATE && existsSync(thresholdsPath)) {
    overrides = JSON.parse(readFileSync(thresholdsPath, 'utf8')).overrides ?? {};
  }

  // Let the machine settle before the first audit. The suite is usually
  // launched right after a build or a workflow restart, and that startup
  // churn (vite dev servers, watchers, sibling workflows) reliably inflates
  // TBT/LCP for the first few audits only. Waiting for the 1-minute load
  // average to drop keeps those first pages honest without touching any
  // thresholds.
  const settleDeadline = Date.now() + 4 * 60 * 1000;
  for (;;) {
    let load1 = 0;
    try { load1 = parseFloat(readFileSync('/proc/loadavg', 'utf8').split(' ')[0]); } catch { break; }
    if (load1 < 1.5 || Date.now() > settleDeadline) {
      if (load1 >= 1.5) console.log(`Warning: starting audits with 1-min load average still at ${load1} after 4 min.`);
      else console.log(`System load settled (1-min load average ${load1}); starting audits.`);
      break;
    }
    console.log(`Waiting for system load to settle before auditing (1-min load average ${load1})...`);
    await sleep(15000);
  }

  const results = [];
  const failures = [];

  // Throwaway warm-up audit. The very first audit of a session reliably
  // absorbs one-time costs (Chrome profile creation, server JIT/page cache,
  // font/disk cache warm-up) that inflate its TBT/LCP; its numbers are not
  // representative, so run one audit of the first page and discard it.
  {
    process.stdout.write('Warm-up audit (discarded) ... ');
    const flags = { port: debugPort, output: 'json', logLevel: 'silent', onlyCategories: ['performance'] };
    await lighthouse(`http://127.0.0.1:${appPort}${PAGES[0]}`, flags);
    console.log('done');
  }

  for (const formFactor of FORM_FACTORS) {
    for (const page of PAGES) {
      const url = `http://127.0.0.1:${appPort}${page}`;
      process.stdout.write(`Auditing [${formFactor}] ${page} ... `);
      const flags = { port: debugPort, output: 'json', logLevel: 'silent', onlyCategories: ['performance'] };
      const runnerResult = await lighthouse(url, flags, formFactor === 'desktop' ? desktopConfig : undefined);
      const lhr = runnerResult.lhr;
      if (lhr.runtimeError) throw new Error(`Lighthouse runtime error on ${page}: ${lhr.runtimeError.message}`);
      const metrics = extractMetrics(lhr);
      const key = `${formFactor} ${page}`;
      // Unit-detail pages share one calibrated limit set (unit numbers churn).
      const genericKey = /^\/available-units\/\d+$/.test(page)
        ? `${formFactor} /available-units/<unit>`
        : null;
      const limits = {
        ...ASPIRATIONAL_THRESHOLDS,
        ...((genericKey && overrides[genericKey]) ?? {}),
        ...(overrides[key] ?? {}),
      };
      const pageFailures = [];
      for (const metric of ['lcpMs', 'cls', 'tbtMs']) {
        if (metrics[metric] != null && metrics[metric] > limits[metric]) {
          pageFailures.push(
            `${metric} ${metric === 'cls' ? metrics[metric].toFixed(3) : Math.round(metrics[metric])} > limit ${limits[metric]}`,
          );
        }
      }
      results.push({ page, formFactor, metrics, limits, pass: pageFailures.length === 0, failures: pageFailures });
      if (pageFailures.length && !CALIBRATE) failures.push(`[${key}] ${pageFailures.join('; ')}`);
      console.log(
        `${pageFailures.length && !CALIBRATE ? 'FAIL' : 'ok'} ` +
          `(score ${metrics.performanceScore != null ? Math.round(metrics.performanceScore * 100) : '–'}, ` +
          `LCP ${ms(metrics.lcpMs)}, CLS ${metrics.cls?.toFixed(3)}, TBT ${ms(metrics.tbtMs)}, ` +
          `JS ${kb(metrics.jsBytes)}, img ${kb(metrics.imageBytes)}, 3p ${kb(metrics.thirdPartyBytes)})`,
      );
    }
  }

  mkdirSync(perfDir, { recursive: true });
  const report = {
    generatedAt: new Date().toISOString(),
    target: 'local production build (dist/public via the production server, server/index.mjs)',
    lighthouseVersion: results.length ? undefined : undefined,
    note:
      'Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). ' +
      'TBT is the lab proxy for INP. Byte figures are transfer sizes.',
    aspirationalThresholds: ASPIRATIONAL_THRESHOLDS,
    results,
  };
  writeFileSync(path.join(perfDir, 'latest.json'), JSON.stringify(report, null, 2) + '\n');

  // Markdown summary.
  const rows = results.map((r) => {
    const m = r.metrics;
    return (
      `| ${r.formFactor} | ${r.page} | ${m.performanceScore != null ? Math.round(m.performanceScore * 100) : '–'} ` +
      `| ${ms(m.lcpMs)} | ${m.cls?.toFixed(3) ?? '–'} | ${ms(m.tbtMs)} | ${kb(m.jsBytes)} | ${kb(m.imageBytes)} ` +
      `| ${kb(m.thirdPartyBytes)} | ${r.pass ? '✅' : '❌ ' + r.failures.join('; ')} |`
    );
  });
  writeFileSync(
    path.join(perfDir, 'SUMMARY.md'),
    `# Page-speed lab report\n\n` +
      `Generated: ${report.generatedAt}\n\n` +
      `Target: ${report.target}\n\n${report.note}\n\n` +
      `| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |\n` +
      `|---|---|---|---|---|---|---|---|---|---|\n` +
      rows.join('\n') +
      '\n',
  );

  if (WRITE_BASELINE) {
    writeFileSync(path.join(perfDir, 'baseline.json'), JSON.stringify(report, null, 2) + '\n');
    console.log('Baseline written to perf/baseline.json');
  }

  if (CALIBRATE) {
    // For each page+metric that exceeds the aspirational target, store a
    // calibrated limit = measured * 1.25 headroom (rounded up), so day-one lab
    // reality doesn't hard-fail while regressions beyond noise still do.
    const newOverrides = {};
    for (const r of results) {
      const o = {};
      const m = r.metrics;
      if (m.lcpMs > ASPIRATIONAL_THRESHOLDS.lcpMs) o.lcpMs = Math.ceil((m.lcpMs * 1.25) / 100) * 100;
      if (m.cls > ASPIRATIONAL_THRESHOLDS.cls) o.cls = Math.ceil(m.cls * 1.25 * 100) / 100;
      if (m.tbtMs > ASPIRATIONAL_THRESHOLDS.tbtMs) o.tbtMs = Math.ceil((m.tbtMs * 1.25) / 50) * 50;
      if (Object.keys(o).length) newOverrides[`${r.formFactor} ${r.page}`] = o;
    }
    writeFileSync(
      thresholdsPath,
      JSON.stringify(
        {
          note:
            'Calibrated per-page limits (measured * 1.25 headroom) for pages that currently exceed the ' +
            'aspirational Core Web Vitals targets. Tighten/remove entries as pages improve. Regenerate with ' +
            '`node scripts/check-perf.mjs --calibrate`.',
          calibratedAt: report.generatedAt,
          aspirational: ASPIRATIONAL_THRESHOLDS,
          overrides: newOverrides,
        },
        null,
        2,
      ) + '\n',
    );
    console.log(`Calibrated thresholds written to perf/thresholds.json (${Object.keys(newOverrides).length} overrides).`);
  }

  if (failures.length) {
    console.error('\nPerf check FAILED:\n' + failures.map((f) => `  ✗ ${f}`).join('\n'));
    process.exitCode = 1;
  } else {
    console.log(`\nPerf check passed for all ${results.length} page/form-factor combinations.`);
  }
}

main()
  .catch((err) => {
    console.error(`Perf check errored: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(cleanup);
