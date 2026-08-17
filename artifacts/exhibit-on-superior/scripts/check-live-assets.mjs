#!/usr/bin/env node
// Post-publish live-asset check (Semrush 17 Aug 2026 "page has broken
// JavaScript": every crawled page referenced /assets/index-CZHs_vuu.js, a
// previous build's bundle that 404ed after the next publish).
//
// Fetches the live site's pages, extracts every referenced /assets/* script
// and stylesheet (script src, link href — stylesheet + modulepreload), and
// verifies each one answers 200 with a non-HTML content type (the SPA
// fallback answering 200 text/html for a missing bundle would be exactly the
// broken state this check exists to catch — though the production server
// 404s unknown paths, defense in depth).
//
// Page list: <base>/sitemap.xml by default, or --pages-file <path> with one
// URL/path per line (used to re-verify the exact URLs from an audit export).
//
// Wired into check:postpublish, so the postpublish watcher alarms when a
// publish leaves any live page referencing a vanished asset.
//
// Usage: node scripts/check-live-assets.mjs [baseUrl] [--pages-file FILE]
//   base URL resolution: positional arg → POSTPUBLISH_BASE → production.

import fs from 'node:fs';

const args = process.argv.slice(2);
const pagesFlag = args.indexOf('--pages-file');
const pagesFile = pagesFlag >= 0 ? args[pagesFlag + 1] : null;
const BASE = (
  args.find((a, i) => !a.startsWith('--') && i !== pagesFlag + 1) ??
  process.env.POSTPUBLISH_BASE ??
  'https://www.rentatexhibit.com'
).replace(/\/$/, '');

const UA = 'exhibit-live-asset-check';
const CONCURRENCY = 8;

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function mapLimit(items, limit, fn) {
  const out = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]);
      }
    }),
  );
  return out;
}

async function pageUrls() {
  if (pagesFile) {
    return fs
      .readFileSync(pagesFile, 'utf8')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((u) => (u.startsWith('http') ? u : `${BASE}${u.startsWith('/') ? '' : '/'}${u}`));
  }
  const xml = await fetchText(`${BASE}/sitemap.xml`);
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  if (urls.length === 0) throw new Error('sitemap.xml yielded no URLs');
  return urls;
}

/** Extract /assets/* scripts and stylesheets referenced by a page's HTML. */
function extractAssets(html) {
  const found = new Set();
  const re = /<(?:script|link)\b[^>]*?(?:src|href)=["']([^"']*\/assets\/[^"']+\.(?:m?js|css))["'][^>]*>/gi;
  let m;
  while ((m = re.exec(html)) !== null) found.add(m[1]);
  return [...found];
}

async function main() {
  const pages = await pageUrls();
  console.log(`Checking assets referenced by ${pages.length} live page(s) on ${BASE}…`);

  const assetToPages = new Map(); // asset URL -> [page URLs]
  const pageFailures = [];
  await mapLimit(pages, CONCURRENCY, async (page) => {
    let html;
    try {
      html = await fetchText(page);
    } catch (err) {
      pageFailures.push(`PAGE UNREADABLE ${page} — ${err.message}`);
      return;
    }
    for (const asset of extractAssets(html)) {
      const abs = asset.startsWith('http') ? asset : `${BASE}${asset}`;
      if (!assetToPages.has(abs)) assetToPages.set(abs, []);
      assetToPages.get(abs).push(page);
    }
  });

  const assets = [...assetToPages.keys()].sort();
  if (assets.length === 0) {
    console.error('FAIL: no /assets/* scripts or stylesheets found on any page — extraction broken?');
    process.exit(1);
  }
  console.log(`${assets.length} distinct /assets/* reference(s) found — verifying each resolves…`);

  const failures = [...pageFailures];
  await mapLimit(assets, CONCURRENCY, async (url) => {
    let res;
    try {
      res = await fetch(url, { method: 'HEAD', headers: { 'user-agent': UA } });
      if (res.status === 405) res = await fetch(url, { headers: { 'user-agent': UA } });
    } catch (err) {
      failures.push(`ASSET UNREACHABLE ${url} — ${err.message} (referenced by ${assetToPages.get(url)[0]}${assetToPages.get(url).length > 1 ? ` +${assetToPages.get(url).length - 1} more` : ''})`);
      return;
    }
    const type = res.headers.get('content-type') ?? '';
    const refs = assetToPages.get(url);
    const refNote = `referenced by ${refs[0]}${refs.length > 1 ? ` +${refs.length - 1} more page(s)` : ''}`;
    if (res.status !== 200) {
      failures.push(`ASSET ${res.status} ${url} — ${refNote}`);
    } else if (/text\/html/i.test(type)) {
      failures.push(`ASSET SOFT-404 (200 text/html) ${url} — ${refNote}`);
    }
  });

  if (failures.length > 0) {
    console.error(`\nFAIL: ${failures.length} problem(s):`);
    for (const f of failures) console.error(`  FAIL ${f}`);
    console.error(
      '\nA live page references a vanished bundle — visitors/crawlers on that page get broken JavaScript.',
    );
    process.exit(1);
  }
  console.log(`OK: all ${assets.length} referenced asset(s) answer 200 with a non-HTML type.`);
}

main().catch((err) => {
  console.error(`check-live-assets errored: ${err.message}`);
  process.exit(1);
});
