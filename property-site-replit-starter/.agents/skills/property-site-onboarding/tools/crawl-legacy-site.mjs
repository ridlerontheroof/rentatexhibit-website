#!/usr/bin/env node
/**
 * crawl-legacy-site.mjs — legacy-site discovery crawler.
 * Produces a page inventory + asset inventory with provenance, matching the
 * hand-built Woods Crossing discovery format.
 *
 * Modes:
 *   live    — BFS crawl of the live site (same host only, polite delay).
 *   archive — Wayback Machine CDX fallback for bot-walled sites (Cloudflare
 *             challenges etc.): enumerates archived URLs, fetches the latest
 *             snapshot of each via the id_ raw endpoint.
 *   offline — re-derive inventories from a directory of already-saved HTML.
 *
 * Usage:
 *   node crawl-legacy-site.mjs --url https://www.example.com --out outdir [--mode live|archive|offline] \
 *     [--max-pages 200] [--delay-ms 750] [--html-dir dir (offline mode)]
 *
 * Outputs in outdir/:
 *   page-inventory.csv   url,status,title,h1,canonical,meta_description,robots,heading_count,image_count,word_count,provenance,fetched_at,notes
 *   asset-inventory.csv  asset_url,type,found_on,alt_text,provenance
 *   html/<slug>.html     raw HTML per page (provenance record)
 *   crawl-report.json    run metadata (mode, counts, skips, errors)
 *
 * Dependency-free (Node >= 20, global fetch). HTML parsing is regex-based on
 * purpose: inventories need robustness on ancient markup, not DOM fidelity.
 */
import { mkdirSync, writeFileSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).map((a, i, arr) => (a.startsWith('--') ? [a.slice(2), arr[i + 1]?.startsWith('--') || arr[i + 1] === undefined ? true : arr[i + 1]] : null)).filter(Boolean),
);
const startUrl = args.url;
const outDir = args.out;
const mode = args.mode ?? 'live';
const maxPages = Number(args['max-pages'] ?? 200);
const delayMs = Number(args['delay-ms'] ?? 750);
if (!startUrl && mode !== 'offline') { console.error('need --url'); process.exit(2); }
if (!outDir) { console.error('need --out'); process.exit(2); }
mkdirSync(join(outDir, 'html'), { recursive: true });

const UA = 'HighlandOnboardingBot/1.0 (+property acquisition discovery; contact: leasing office)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const csvEsc = (s) => { s = String(s ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

function slugFor(url) {
  const p = new URL(url).pathname.replace(/\/+$/, '') || '/index';
  return p.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 120) || 'index';
}

function decodeEntities(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, ' ');
}

function extract(html, baseUrl) {
  const pick = (re) => { const m = html.match(re); return m ? decodeEntities(m[1].trim()).replace(/\s+/g, ' ') : ''; };
  const title = pick(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const h1 = pick(/<h1[^>]*>([\s\S]*?)<\/h1>/i).replace(/<[^>]+>/g, '').trim();
  const canonical = pick(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i) || pick(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
  const metaDesc = pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) || pick(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  const robots = pick(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i);
  const headings = (html.match(/<h[1-6][^>]*>/gi) ?? []).length;
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ');
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const links = [];
  for (const m of html.matchAll(/<a[^>]+href=["']([^"'#]+)["']/gi)) {
    try { links.push(new URL(m[1], baseUrl).href); } catch { /* ignore */ }
  }
  const images = [];
  for (const m of html.matchAll(/<img[^>]*>/gi)) {
    const tag = m[0];
    const src = tag.match(/src=["']([^"']+)["']/i)?.[1];
    const alt = tag.match(/alt=["']([^"']*)["']/i)?.[1] ?? '';
    if (src) { try { images.push({ url: new URL(src, baseUrl).href, alt: decodeEntities(alt) }); } catch { /* ignore */ } }
  }
  return { title, h1, canonical, metaDesc, robots, headings, wordCount, links, images };
}

function normalizePath(u) {
  const url = new URL(u);
  url.hash = ''; url.search = '';
  return url.href.replace(/\/$/, '');
}

const skipExt = /\.(pdf|jpe?g|png|gif|webp|avif|svg|ico|css|js|mp4|mov|zip|woff2?|ttf|xml|txt)(\?|$)/i;
const junkPath = /(cdn-cgi|wp-json|wp-admin|\/feed\/?$|\?replytocom|mailto:|tel:)/i;

async function fetchWithMeta(url, provenance) {
  const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html' }, redirect: 'manual' });
  return { res, provenance };
}

async function main() {
  const pages = []; // rows
  const assets = new Map(); // url -> {type, foundOn, alt, provenance}
  const report = { mode, startUrl, startedAt: new Date().toISOString(), fetched: 0, errors: [], skipped: [] };
  const host = startUrl ? new URL(startUrl).host : null;

  let targets = []; // {url, fetchUrl, provenance}

  if (mode === 'live') {
    // BFS
    const seen = new Set();
    const queue = [normalizePath(startUrl)];
    seen.add(normalizePath(startUrl));
    while (queue.length && pages.length < maxPages) {
      const url = queue.shift();
      let row = { url, provenance: `live:${new Date().toISOString()}` };
      try {
        const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html' }, redirect: 'manual' });
        row.status = res.status;
        if (res.status >= 300 && res.status < 400) {
          row.notes = `redirects to ${res.headers.get('location') ?? '?'}`;
          pages.push(row);
        } else if (res.ok && (res.headers.get('content-type') ?? '').includes('text/html')) {
          const html = await res.text();
          const ex = extract(html, url);
          Object.assign(row, ex, { fetched: true });
          writeFileSync(join(outDir, 'html', slugFor(url) + '.html'), html);
          pages.push(row);
          report.fetched++;
          for (const img of ex.images) if (!assets.has(img.url)) assets.set(img.url, { type: 'image', foundOn: url, alt: img.alt, provenance: row.provenance });
          for (const l of ex.links) {
            try {
              const lu = new URL(l);
              if (lu.host !== host || skipExt.test(lu.pathname) || junkPath.test(l)) continue;
              const n = normalizePath(l);
              if (!seen.has(n)) { seen.add(n); queue.push(n); }
            } catch { /* ignore */ }
          }
        } else {
          row.status = res.status; row.notes = 'non-HTML or error';
          pages.push(row);
        }
      } catch (e) {
        row.status = 'ERR'; row.notes = e.message; pages.push(row); report.errors.push({ url, error: e.message });
      }
      await sleep(delayMs);
    }
  } else if (mode === 'archive') {
    const domain = new URL(startUrl).host.replace(/^www\./, '');
    const cdx = `http://web.archive.org/cdx/search/cdx?url=${domain}*&output=json&fl=original,timestamp,statuscode,mimetype&collapse=urlkey&filter=statuscode:200&filter=mimetype:text/html&limit=2000`;
    const rows = await (await fetch(cdx, { headers: { 'user-agent': UA } })).json();
    const byPath = new Map(); // normalized modern path -> {original, timestamp}
    for (const [original, timestamp] of rows.slice(1)) {
      if (skipExt.test(original) || junkPath.test(original)) continue;
      let u; try { u = new URL(original.replace(/:80\//, '/').replace(/^http:/, 'https:')); } catch { continue; }
      // Skip legacy platform machinery paths (module endpoints, session tokens, deep query junk)
      if (/\/(Apartments\/module|cdn-cgi)\//i.test(u.pathname) || u.search) { report.skipped.push(original); continue; }
      const key = u.pathname.replace(/\/+$/, '') || '/';
      const prev = byPath.get(key);
      if (!prev || timestamp > prev.timestamp) byPath.set(key, { original, timestamp });
    }
    targets = [...byPath.entries()].slice(0, maxPages).map(([path, { original, timestamp }]) => ({
      url: `https://${new URL(startUrl).host}${path === '/' ? '/' : path}`,
      fetchUrl: `https://web.archive.org/web/${timestamp}id_/${original}`,
      provenance: `wayback:${timestamp}`,
    }));
    for (const t of targets) {
      const row = { url: t.url, provenance: t.provenance };
      try {
        const res = await fetch(t.fetchUrl, { headers: { 'user-agent': UA } });
        row.status = res.status;
        if (res.ok) {
          const html = await res.text();
          const ex = extract(html, t.url);
          Object.assign(row, ex, { fetched: true });
          writeFileSync(join(outDir, 'html', slugFor(t.url) + '.html'), html);
          report.fetched++;
          for (const img of ex.images) if (!assets.has(img.url)) assets.set(img.url, { type: 'image', foundOn: t.url, alt: img.alt, provenance: t.provenance });
        } else {
          row.notes = 'snapshot fetch failed';
        }
      } catch (e) { row.status = 'ERR'; row.notes = e.message; report.errors.push({ url: t.url, error: e.message }); }
      pages.push(row);
      await sleep(delayMs);
    }
  } else if (mode === 'offline') {
    const dir = args['html-dir'];
    if (!dir) { console.error('offline mode needs --html-dir'); process.exit(2); }
    for (const f of readdirSync(dir).filter((f) => f.endsWith('.html'))) {
      const html = readFileSync(join(dir, f), 'utf8');
      const base = startUrl ?? 'https://offline.local/';
      const ex = extract(html, base);
      const row = { url: `${f}`, status: 200, ...ex, fetched: true, provenance: `offline:${f}` };
      pages.push(row);
      for (const img of ex.images) if (!assets.has(img.url)) assets.set(img.url, { type: 'image', foundOn: f, alt: img.alt, provenance: row.provenance });
    }
  } else {
    console.error(`unknown mode ${mode}`); process.exit(2);
  }

  // Write inventories
  const pageHeader = 'url,status,title,h1,canonical,meta_description,robots,heading_count,image_count,word_count,provenance,notes';
  const pageLines = pages.map((p) => [p.url, p.status, p.title, p.h1, p.canonical, p.metaDesc, p.robots, p.headings ?? '', (p.images ?? []).length, p.wordCount ?? '', p.provenance, p.notes ?? ''].map(csvEsc).join(','));
  writeFileSync(join(outDir, 'page-inventory.csv'), [pageHeader, ...pageLines].join('\n') + '\n');

  const assetHeader = 'asset_url,type,found_on,alt_text,provenance';
  const assetLines = [...assets.entries()].map(([url, a]) => [url, a.type, a.foundOn, a.alt, a.provenance].map(csvEsc).join(','));
  writeFileSync(join(outDir, 'asset-inventory.csv'), [assetHeader, ...assetLines].join('\n') + '\n');

  report.finishedAt = new Date().toISOString();
  report.pageCount = pages.length;
  report.assetCount = assets.size;
  writeFileSync(join(outDir, 'crawl-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`done: ${pages.length} pages, ${assets.size} assets, mode=${mode} → ${outDir}`);
  if (report.errors.length) console.log(`errors: ${report.errors.length} (see crawl-report.json)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
