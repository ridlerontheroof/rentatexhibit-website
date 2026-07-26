#!/usr/bin/env node
// Crawler access verification: fetches key production URLs with each named
// AI/search crawler user-agent and records status codes and response sizes.
// A pass means every crawler gets HTTP 200 and full HTML/text (no challenge
// page, block, or rate-limit rejection).
//
// Usage: node scripts/verify-crawler-access.mjs [baseUrl]
//   default baseUrl: https://www.rentatexhibit.com

const BASE = (process.argv[2] || 'https://www.rentatexhibit.com').replace(/\/$/, '');

// One per-unit page (first unit in the committed availability snapshot): its
// bare clean URL must reach the unit's OWN prerendered HTML — unit number in
// <title> — not the SPA homepage shell. Production resolves these via explicit
// per-unit rewrite pairs in artifact.toml (the static host does NOT fall back
// to directory indexes), kept in sync by the prerender parity guard.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const snapshotPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'data',
  'availabilitySnapshot.json',
);
const UNITS = JSON.parse(await readFile(snapshotPath, 'utf8')).units.map((u) => u.unit);
if (UNITS.length === 0) {
  console.error('No units in availabilitySnapshot.json — cannot verify unit pages.');
  process.exit(1);
}
const [SAMPLE_UNIT, ...OTHER_UNITS] = UNITS;

// Knowledge Center article slugs from the source of truth (pure-data TS
// file), via the shared parser (scripts/lib/knowledge-slugs.mjs) which
// validates the parsed count exactly against the number of article literals.
import { loadKnowledgeSlugs } from './lib/knowledge-slugs.mjs';
let KNOWLEDGE_SLUGS;
try {
  KNOWLEDGE_SLUGS = await loadKnowledgeSlugs();
} catch (err) {
  console.error(String(err.message || err));
  process.exit(1);
}

const CRAWLERS = {
  'OAI-SearchBot':
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot',
  'ChatGPT-User':
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot',
  GPTBot:
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot',
  'Claude-SearchBot':
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-SearchBot/1.0; +claudebot@anthropic.com)',
  'Claude-User':
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-User/1.0; +claudebot@anthropic.com)',
  ClaudeBot:
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)',
  PerplexityBot:
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)',
  Googlebot:
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/125.0.0.0 Safari/537.36',
  Bingbot:
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm) Chrome/125.0.0.0 Safari/537.36',
};

// Per-unit page requirements: the unit's own prerendered <title>, a
// self-canonical link, and an Apartment JSON-LD node. The SPA homepage shell
// would fail all three.
const unitSpec = (unit) => ({
  minBytes: 20000,
  mustIncludeAll: [
    `<title>Apartment ${unit}`,
    `rel="canonical" href="${BASE}/available-units/${unit}"`,
    '"@type":"Apartment"',
  ],
});

// path -> minimum plausible full-response size in bytes (guards against
// challenge/interstitial pages, which are much smaller than the real page).
// Full crawler matrix on shared pages and the first unit; every remaining
// snapshot unit is checked with a single crawler UA to keep runtime sane —
// a missing per-unit rewrite pair fails regardless of UA.
const SINGLE_CRAWLER = { Googlebot: CRAWLERS.Googlebot };
const URLS = {
  '/': { minBytes: 20000, mustIncludeAll: ['<title>'] },
  '/available-units': { minBytes: 20000, mustIncludeAll: ['<title>'] },
  '/robots.txt': { minBytes: 60, mustIncludeAll: ['Sitemap:'] },
  '/sitemap.xml': { minBytes: 500, mustIncludeAll: ['<urlset'] },
  '/llms.txt': { minBytes: 200, mustIncludeAll: ['Exhibit'] },
  [`/available-units/${SAMPLE_UNIT}`]: unitSpec(SAMPLE_UNIT),
};
for (const unit of OTHER_UNITS) {
  URLS[`/available-units/${unit}`] = { ...unitSpec(unit), crawlers: SINGLE_CRAWLER };
}

let failures = 0;
const rows = [];
for (const [pathName, spec] of Object.entries(URLS)) {
  for (const [bot, ua] of Object.entries(spec.crawlers ?? CRAWLERS)) {
    const url = BASE + pathName;
    let status = 'ERR';
    let bytes = 0;
    let ok = false;
    let note = '';
    try {
      // Follow redirects (the host adds a permanent trailing-slash redirect,
      // e.g. /available-units -> /available-units/), but flag any redirect
      // that leaves the canonical host.
      const res = await fetch(url, { headers: { 'User-Agent': ua }, redirect: 'follow' });
      status = res.status;
      if (res.redirected) {
        if (new URL(res.url).origin !== new URL(BASE).origin) {
          note = `redirected off-host to ${res.url}; `;
        } else {
          note = `via redirect -> ${new URL(res.url).pathname}; `;
        }
      }
      const body = await res.text();
      bytes = Buffer.byteLength(body);
      const missing = spec.mustIncludeAll.filter((needle) => !body.includes(needle));
      ok = res.status === 200 && bytes >= spec.minBytes && missing.length === 0;
      if (res.status !== 200) note = 'non-200';
      else if (bytes < spec.minBytes) note = `too small (<${spec.minBytes})`;
      else if (missing.length > 0) note = `missing "${missing[0]}"`;
    } catch (err) {
      note = String(err.message || err);
    }
    if (!ok) failures++;
    rows.push({ path: pathName, bot, status, bytes, ok: ok ? 'PASS' : 'FAIL', note });
  }
}

// Sitemap ↔ data-source cross-checks, both directions:
//   - unit-cross-check: every snapshot unit must have a
//     /available-units/<unit> entry in /sitemap.xml, and the sitemap must not
//     list unit pages that are no longer in the snapshot (stale rented units —
//     Google would keep crawling a page that's about to 404 or go stale).
//   - knowledge-cross-check: same for /knowledge/<slug> entries vs the
//     article slugs in knowledgeArticles.ts (a dropped article would get
//     quietly deindexed; a stale entry points at a deleted page).
const CROSS_CHECKS = [
  {
    bot: 'unit-cross-check',
    pattern: /^\/available-units\/([^/]+)\/?$/,
    expected: UNITS,
    label: 'unit(s)',
  },
  {
    bot: 'knowledge-cross-check',
    pattern: /^\/knowledge\/([^/]+)\/?$/,
    expected: KNOWLEDGE_SLUGS,
    label: 'article(s)',
  },
];
try {
  const res = await fetch(`${BASE}/sitemap.xml`, {
    headers: { 'User-Agent': CRAWLERS.Googlebot },
    redirect: 'follow',
  });
  const xml = await res.text();
  if (res.status !== 200) {
    for (const { bot } of CROSS_CHECKS) {
      failures++;
      rows.push({ path: '/sitemap.xml', bot, status: res.status, bytes: Buffer.byteLength(xml), ok: 'FAIL', note: 'non-200 fetching sitemap for cross-check' });
    }
  } else {
    const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
    for (const { bot, pattern, expected, label } of CROSS_CHECKS) {
      const inSitemap = new Set(
        locs
          .map((loc) => {
            try {
              const m = new URL(loc).pathname.match(pattern);
              return m ? m[1] : null;
            } catch {
              return null;
            }
          })
          .filter(Boolean),
      );
      const missing = expected.filter((u) => !inSitemap.has(u));
      const stale = [...inSitemap].filter((u) => !expected.includes(u));
      const ok = missing.length === 0 && stale.length === 0;
      if (!ok) failures++;
      const note = ok
        ? `${expected.length} ${label} all listed`
        : [
            missing.length ? `missing from sitemap: ${missing.join(', ')}` : '',
            stale.length ? `stale in sitemap (not in data source): ${stale.join(', ')}` : '',
          ]
            .filter(Boolean)
            .join('; ');
      rows.push({ path: '/sitemap.xml', bot, status: res.status, bytes: Buffer.byteLength(xml), ok: ok ? 'PASS' : 'FAIL', note });
    }
  }
} catch (err) {
  for (const { bot } of CROSS_CHECKS) {
    failures++;
    rows.push({ path: '/sitemap.xml', bot, status: 'ERR', bytes: 0, ok: 'FAIL', note: String(err.message || err) });
  }
}

console.table(rows);
console.log(failures === 0 ? `ALL PASS (${rows.length} checks) against ${BASE}` : `${failures} FAILURES against ${BASE}`);
process.exit(failures === 0 ? 0 : 1);
