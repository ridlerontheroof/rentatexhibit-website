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
const SAMPLE_UNIT = JSON.parse(await readFile(snapshotPath, 'utf8')).units[0]?.unit;
if (!SAMPLE_UNIT) {
  console.error('No units in availabilitySnapshot.json — cannot verify a unit page.');
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

// path -> minimum plausible full-response size in bytes (guards against
// challenge/interstitial pages, which are much smaller than the real page).
const URLS = {
  '/': { minBytes: 20000, mustInclude: '<title>' },
  '/available-units': { minBytes: 20000, mustInclude: '<title>' },
  '/robots.txt': { minBytes: 60, mustInclude: 'Sitemap:' },
  '/sitemap.xml': { minBytes: 500, mustInclude: '<urlset' },
  '/llms.txt': { minBytes: 200, mustInclude: 'Exhibit' },
  [`/available-units/${SAMPLE_UNIT}`]: {
    minBytes: 20000,
    // The unit's own prerendered <title> — the SPA homepage shell would fail this.
    mustInclude: `<title>Apartment ${SAMPLE_UNIT}`,
  },
};

let failures = 0;
const rows = [];
for (const [pathName, spec] of Object.entries(URLS)) {
  for (const [bot, ua] of Object.entries(CRAWLERS)) {
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
      ok = res.status === 200 && bytes >= spec.minBytes && body.includes(spec.mustInclude);
      if (res.status !== 200) note = 'non-200';
      else if (bytes < spec.minBytes) note = `too small (<${spec.minBytes})`;
      else if (!body.includes(spec.mustInclude)) note = `missing "${spec.mustInclude}"`;
    } catch (err) {
      note = String(err.message || err);
    }
    if (!ok) failures++;
    rows.push({ path: pathName, bot, status, bytes, ok: ok ? 'PASS' : 'FAIL', note });
  }
}

console.table(rows);
console.log(failures === 0 ? `ALL PASS (${rows.length} checks) against ${BASE}` : `${failures} FAILURES against ${BASE}`);
process.exit(failures === 0 ? 0 : 1);
