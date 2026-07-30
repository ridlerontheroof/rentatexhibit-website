// One-off TBT profiler: runs Lighthouse (mobile) on given pages and dumps
// bootup-time, mainthread-work-breakdown, long-tasks and third-party-summary.
// Usage: node scripts/profile-page.mjs / /available-units
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import lighthouse from 'lighthouse';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGES = process.argv.slice(2).length ? process.argv.slice(2) : ['/'];

function findChromium() {
  const candidates = [];
  if (process.env.CHROME_BIN) candidates.push(process.env.CHROME_BIN);
  for (const name of ['chromium', 'chromium-browser', 'google-chrome', 'chrome']) {
    const which = spawnSync('which', [name], { encoding: 'utf8' });
    if (which.status === 0 && which.stdout.trim()) candidates.push(which.stdout.trim());
  }
  try {
    for (const entry of readdirSync('/nix/store')) {
      if (!entry.endsWith('-playwright-browsers-chromium')) continue;
      const base = path.join('/nix/store', entry);
      for (const sub of readdirSync(base)) {
        if (sub.startsWith('chromium-')) candidates.push(path.join(base, sub, 'chrome-linux', 'chrome'));
      }
    }
  } catch {}
  for (const c of candidates) if (existsSync(c)) return c;
  return null;
}
function freePort() {
  return new Promise((res) => {
    const s = createServer();
    s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => res(port)); });
  });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const appPort = await freePort();
// Serve through the real production server (same as scripts/check-perf.mjs)
// so profiles match what the perf suite and production visitors see.
const vite = spawn(process.execPath, [path.join(root, 'server', 'index.mjs')],
  { cwd: root, env: { ...process.env, PORT: String(appPort) }, stdio: 'ignore' });
const debugPort = await freePort();
const profileDir = mkdtempSync(path.join(tmpdir(), 'profile-'));
const chrome = spawn(findChromium(), ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profileDir}`, 'about:blank'], { stdio: 'ignore' });
for (let i = 0; i < 100; i++) {
  try { await (await fetch(`http://127.0.0.1:${debugPort}/json/version`)).json(); break; } catch { await sleep(250); }
}
for (let i = 0; i < 100; i++) {
  try { const r = await fetch(`http://127.0.0.1:${appPort}/`); if (r.ok) break; } catch {} await sleep(250);
}

for (const page of PAGES) {
  const { lhr } = await lighthouse(`http://127.0.0.1:${appPort}${page}`, { port: debugPort, output: 'json', logLevel: 'silent', onlyCategories: ['performance'] });
  console.log(`\n===== ${page} (mobile) TBT ${Math.round(lhr.audits['total-blocking-time'].numericValue)}ms LCP ${Math.round(lhr.audits['largest-contentful-paint'].numericValue)}ms =====`);
  const lcpAudit = lhr.audits['largest-contentful-paint-element']?.details;
  console.log('LCP element:', JSON.stringify(lhr.audits['largest-contentful-paint-element'] ?? 'MISSING').slice(0,1200));
  for (const id of ['lcp-lazy-loaded', 'prioritize-lcp-image']) {
    const au = lhr.audits[id];
    if (au && au.score !== null && au.score < 1) console.log(`${id}: score ${au.score}`, JSON.stringify(au.details?.items ?? []).slice(0, 300));
  }
  console.log('-- bootup-time (top 8):');
  for (const it of (lhr.audits['bootup-time']?.details?.items ?? []).slice(0, 8))
    console.log(`  ${Math.round(it.total)}ms total, ${Math.round(it.scripting)}ms script — ${it.url}`);
  console.log('-- mainthread-work-breakdown:');
  for (const it of lhr.audits['mainthread-work-breakdown']?.details?.items ?? [])
    console.log(`  ${Math.round(it.duration)}ms ${it.groupLabel}`);
  console.log('-- long-tasks:');
  for (const it of (lhr.audits['long-tasks']?.details?.items ?? []).slice(0, 10))
    console.log(`  ${Math.round(it.duration)}ms @${Math.round(it.startTime)}ms — ${it.url}`);
  console.log('-- third-party-summary:');
  for (const it of (lhr.audits['third-party-summary']?.details?.items ?? []).slice(0, 6))
    console.log(`  ${it.entity} — ${Math.round(it.blockingTime)}ms blocking, ${Math.round(it.transferSize / 1024)}KB`);
  for (const r of (lhr.audits['network-requests']?.details?.items ?? [])) if (/gtm-trigger|googletagmanager/.test(r.url)) console.log('NETREQ', Math.round(r.networkRequestTime), r.url.slice(0,90));
  writeFileSync(path.join(tmpdir(), `lhr-${page.replace(/\W+/g, '_')}.json`), JSON.stringify(lhr));
}
vite.kill('SIGKILL'); chrome.kill('SIGKILL'); rmSync(profileDir, { recursive: true, force: true });
process.exit(0);
