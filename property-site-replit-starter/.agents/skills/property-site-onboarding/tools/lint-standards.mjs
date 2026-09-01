#!/usr/bin/env node
/**
 * lint-standards.mjs — baseline-standards gap analysis against the manifest.
 *
 * Runs the AUTOMATABLE (automation: "linter") checks over a target site via
 * HTTP, and reports every other manifest check as KIT-GUARD (satisfied by
 * adopting the template kit and keeping its guard suite green) or MANUAL.
 *
 * Two typical targets:
 *   - a LEGACY site during discovery (expect many FAILs — that IS the gap analysis)
 *   - the NEW site before/after go-live (expect zero FAILs)
 *
 * Usage:
 *   node lint-standards.mjs --base https://www.example.com --out gap-report.md \
 *     [--paths /,/contact,/floor-plans] [--offline-inventory page-inventory.csv]
 *
 * With --offline-inventory (bot-walled or archived sites) the head checks run
 * against the inventory columns instead of live HTTP; network-only checks are
 * marked SKIPPED(offline).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(readFileSync(join(here, '..', 'standards', 'standards-manifest.json'), 'utf8'));
const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => (a.startsWith('--') ? [a.slice(2), arr[i + 1]] : null)).filter(Boolean));
const base = args.base?.replace(/\/$/, '');
const outPath = args.out ?? 'gap-report.md';
const samplePaths = (args.paths ?? '/').split(',');
const offlineInv = args['offline-inventory'];
if (!base) { console.error('need --base'); process.exit(2); }

const UA = 'HighlandStandardsLinter/1.0';
const results = []; // {id, status, detail}
const add = (id, status, detail = '') => results.push({ id, status, detail });

async function get(url, opts = {}) {
  try {
    const res = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'manual', ...opts });
    const body = opts.head ? '' : await res.text();
    return { status: res.status, headers: res.headers, body, location: res.headers.get('location') };
  } catch (e) { return { status: 0, error: e.message, headers: new Map(), body: '' }; }
}

function headChecksFromHtml(path, html) {
  const issues = [];
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  if (!title) issues.push(`${path}: no <title> in initial HTML`);
  if (!/<meta[^>]+name=["']description["']/i.test(html)) issues.push(`${path}: no meta description in initial HTML`);
  if (!/<link[^>]+rel=["']canonical["']/i.test(html)) issues.push(`${path}: no canonical in initial HTML`);
  if (!/property=["']og:title["']/i.test(html)) issues.push(`${path}: no og:title`);
  const jsonldCount = (html.match(/application\/ld\+json/gi) ?? []).length;
  if (jsonldCount === 0) issues.push(`${path}: no JSON-LD in initial HTML`);
  return { issues, title, jsonldCount, html };
}

async function main() {
  const pageData = new Map(); // path -> {issues,title,jsonldCount,html}
  let offline = false;

  if (offlineInv) {
    offline = true;
    // pull titles/canonicals from inventory instead of live fetch
    const text = readFileSync(offlineInv, 'utf8');
    const lines = text.split('\n');
    const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const iUrl = header.findIndex((h) => h === 'url' || h === 'source_url');
    const iTitle = header.indexOf('title');
    const iCanon = header.indexOf('canonical');
    const iDesc = header.findIndex((h) => h.includes('description'));
    let missingTitle = 0, missingCanon = 0, missingDesc = 0, n = 0;
    for (const line of lines.slice(1)) {
      if (!line.trim()) continue;
      // naive split is fine for counting empties on quoted CSVs? No — use presence heuristics
      const cells = line.match(/("([^"]|"")*"|[^,]*)(,|$)/g)?.map((c) => c.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"')) ?? [];
      if (!cells[iUrl]) continue;
      n++;
      if (iTitle >= 0 && !cells[iTitle]) missingTitle++;
      if (iCanon >= 0 && !cells[iCanon]) missingCanon++;
      if (iDesc >= 0 && !cells[iDesc]) missingDesc++;
    }
    add('head.per-url', missingTitle || missingDesc ? 'FAIL' : 'PASS', `${n} inventoried pages: ${missingTitle} missing title, ${missingDesc} missing description (offline inventory)`);
    add('head.canonical-self', missingCanon ? 'FAIL' : 'PASS', `${missingCanon}/${n} pages missing canonical (offline inventory)`);
  } else {
    for (const p of samplePaths) {
      const r = await get(base + p);
      if (r.status >= 300 && r.status < 400) { pageData.set(p, { issues: [`${p}: unexpected redirect to ${r.location}`], html: '' }); continue; }
      if (r.status !== 200) { pageData.set(p, { issues: [`${p}: status ${r.status}`], html: '' }); continue; }
      pageData.set(p, headChecksFromHtml(p, r.body));
    }
    const allIssues = [...pageData.values()].flatMap((d) => d.issues);
    const headIssues = allIssues.filter((i) => /title|description|og:title/.test(i));
    add('head.per-url', headIssues.length ? 'FAIL' : 'PASS', headIssues.join('; ') || `${pageData.size} sampled pages OK`);
    const canonIssues = allIssues.filter((i) => /canonical/.test(i));
    add('head.canonical-self', canonIssues.length ? 'FAIL' : 'PASS', canonIssues.join('; ') || 'canonicals present on sampled pages');
    const jsonldMissing = [...pageData.entries()].filter(([, d]) => d.jsonldCount === 0).map(([p]) => p);
    add('jsonld.valid', jsonldMissing.length ? 'FAIL' : 'PASS', jsonldMissing.length ? `no JSON-LD on: ${jsonldMissing.join(', ')}` : 'JSON-LD present on sampled pages (validity needs kit validator)');
    const home = pageData.get('/')?.html ?? '';
    add('jsonld.property-entity', /ApartmentComplex|LocalBusiness/.test(home) ? 'PASS' : 'FAIL', /ApartmentComplex|LocalBusiness/.test(home) ? 'property entity type found on /' : 'no ApartmentComplex/LocalBusiness node on /');
    // alt text sampling
    const imgs = [...home.matchAll(/<img[^>]*>/gi)].map((m) => m[0]);
    const noAlt = imgs.filter((t) => !/alt=["'][^"']+["']/i.test(t)).length;
    add('images.alt', imgs.length && noAlt ? 'FAIL' : 'PASS', `${noAlt}/${imgs.length} images on / missing alt`);
  }

  if (offline) {
    for (const id of ['index.noindex-404', 'index.robots', 'sitemap.generated', 'aeo.md-twins', 'redirects.one-hop', 'csp.enforced', 'ops.production-server', 'jsonld.valid', 'jsonld.property-entity', 'images.alt', 'images.budget']) {
      add(id, 'SKIPPED', 'offline inventory — network checks unavailable (site bot-walled or archived)');
    }
  } else {
    // 404 behavior
    const r404 = await get(base + '/definitely-not-a-real-page-' + Date.now());
    add('index.noindex-404', r404.status === 404 || r404.status === 410 ? 'PASS' : 'FAIL', `unknown path returned ${r404.status}${r404.status === 200 ? ' (soft-404: serves content on unknown paths)' : ''}`);
    const robots = await get(base + '/robots.txt');
    add('index.robots', robots.status === 200 && /sitemap/i.test(robots.body) ? 'PASS' : robots.status === 200 ? 'WARN' : 'FAIL', robots.status === 200 ? (/sitemap/i.test(robots.body) ? 'robots.txt present with sitemap ref' : 'robots.txt present but no sitemap reference') : `robots.txt: ${robots.status}`);
    const sm = await get(base + '/sitemap.xml');
    add('sitemap.generated', sm.status === 200 ? (/lastmod/.test(sm.body) ? 'PASS' : 'WARN') : 'FAIL', sm.status === 200 ? (/lastmod/.test(sm.body) ? 'sitemap present with lastmod' : 'sitemap present, no lastmod') : `sitemap.xml: ${sm.status}`);
    const llms = await get(base + '/llms.txt');
    add('aeo.md-twins', llms.status === 200 ? 'PASS' : 'FAIL', `llms.txt: ${llms.status}${llms.status !== 200 ? ' (no AEO surface)' : ''}`);
    // redirect hygiene: http + apex variants must reach canonical in one hop
    const canonicalHost = new URL(base).host;
    const apexHost = canonicalHost.replace(/^www\./, '');
    const variants = [`http://${apexHost}/`, `http://${canonicalHost}/`, `https://${apexHost}/`].filter((v) => !v.startsWith(base + '/'));
    const redirIssues = [];
    for (const v of variants) {
      const r = await get(v, { head: true });
      if (r.status === 0) { redirIssues.push(`${v}: unreachable (${r.error})`); continue; }
      if (!(r.status === 301 || r.status === 308)) { redirIssues.push(`${v}: ${r.status} (want 301)`); continue; }
      const loc = r.location ?? '';
      if (!loc.startsWith(base)) redirIssues.push(`${v}: 301 → ${loc} (not canonical origin, or multi-hop)`);
    }
    add('redirects.one-hop', redirIssues.length ? 'FAIL' : 'PASS', redirIssues.join('; ') || 'apex/http variants 301 straight to canonical');
    const home = await get(base + '/');
    const csp = home.headers.get?.('content-security-policy') || home.headers.get?.('content-security-policy-report-only');
    add('csp.enforced', csp ? 'PASS' : 'FAIL', csp ? 'CSP header present' : 'no CSP header');
    const hs = ['strict-transport-security', 'x-content-type-options'].filter((h) => !home.headers.get?.(h));
    add('ops.production-server', hs.length ? 'WARN' : 'PASS', hs.length ? `missing security headers: ${hs.join(', ')}` : 'security headers present');
    add('images.budget', 'MANUAL', 'run the kit image pipeline audit on downloaded assets');
  }

  // Everything else in the manifest → status by automation class
  const done = new Set(results.map((r) => r.id));
  for (const c of manifest.checks) {
    if (done.has(c.id)) continue;
    add(c.id, c.automation === 'manual' ? 'MANUAL' : 'KIT-GUARD', c.automation === 'manual' ? c.description : `satisfied by adopting the kit: ${c.kitGuard ?? ''}`);
  }

  // Report
  const byId = Object.fromEntries(manifest.checks.map((c) => [c.id, c]));
  const counts = {};
  for (const r of results) counts[r.status] = (counts[r.status] ?? 0) + 1;
  const lines = [
    `# Standards gap report — ${base}`,
    '',
    `Manifest: v${manifest.manifestVersion} (standard: ${manifest.standard})`,
    `Generated: ${new Date().toISOString()}`,
    '',
    `**Summary:** ${Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(' · ')}`,
    '',
    '| Check | Category | Status | Detail |',
    '|---|---|---|---|',
    ...results
      .sort((a, b) => ['FAIL', 'WARN', 'PASS', 'SKIPPED', 'MANUAL', 'KIT-GUARD'].indexOf(a.status) - ['FAIL', 'WARN', 'PASS', 'SKIPPED', 'MANUAL', 'KIT-GUARD'].indexOf(b.status))
      .map((r) => `| \`${r.id}\` | ${byId[r.id]?.category ?? ''} | **${r.status}** | ${r.detail.replace(/\|/g, '\\|')} |`),
    '',
    'Legend: **FAIL/WARN/PASS** = measured over HTTP now · **KIT-GUARD** = enforced by the template kit\'s guard suite once adopted (verify by running the kit\'s check:prepublish/check:postpublish green) · **MANUAL** = human review item · **SKIPPED** = not measurable in this mode.',
    '',
  ].join('\n');
  writeFileSync(outPath, lines);
  console.log(`gap report → ${outPath} (${Object.entries(counts).map(([k, v]) => `${k}=${v}`).join(', ')})`);
}

main().catch((e) => { console.error(e); process.exit(1); });
