#!/usr/bin/env node
// Knowledge Center production smoke-check.
//
// Every /knowledge/<slug> page must serve its OWN prerendered HTML — its own
// <title>, canonical, and FAQPage JSON-LD — not the SPA homepage shell. A
// publish (or an artifact.toml rewrite edit) can silently break a rewrite,
// after which crawlers see the homepage instead of the answer. Run this after
// each publish; it exits non-zero with a clear message on any failure.
//
// Usage: node scripts/check-knowledge-pages.mjs [baseUrl] [--all]
//   default baseUrl: https://www.rentatexhibit.com
//   default: a deterministic ~10-slug sample (first, last, every Nth);
//   --all checks every article slug.

import { loadKnowledgeArticles } from './lib/knowledge-slugs.mjs';

const args = process.argv.slice(2);
const checkAll = args.includes('--all');
const BASE = (args.find((a) => !a.startsWith('--')) || 'https://www.rentatexhibit.com').replace(
  /\/$/,
  '',
);
const TITLE_SUFFIX = ' | Exhibit On Superior Chicago'; // knowledgeTitle() in src/data/knowledge.ts

// --- Load slugs + questions from the source of truth (pure-data TS file). ---
// Shared parser (scripts/lib/knowledge-slugs.mjs) validates the parsed count
// exactly against the number of article literals in the data file.
let articles;
try {
  articles = await loadKnowledgeArticles();
} catch (err) {
  console.error(String(err.message || err));
  process.exit(1);
}

// Deterministic sample: first, last, and evenly spaced slugs in between.
let sample = articles;
if (!checkAll) {
  const want = 10;
  const step = Math.max(1, Math.floor(articles.length / (want - 1)));
  const picked = new Map();
  for (let i = 0; i < articles.length; i += step) picked.set(i, articles[i]);
  picked.set(articles.length - 1, articles[articles.length - 1]);
  sample = [...picked.values()];
}

const decode = (s) =>
  s
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

let failures = 0;
const fail = (what, msg) => {
  failures++;
  console.error(`FAIL  ${what}: ${msg}`);
};

async function fetchText(url) {
  const res = await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'knowledge-smoke-check' } });
  return { status: res.status, body: await res.text() };
}

// --- Per-article checks -----------------------------------------------------
for (const { slug, question } of sample) {
  const url = `${BASE}/knowledge/${slug}`;
  let status, body;
  try {
    ({ status, body } = await fetchText(url));
  } catch (err) {
    fail(url, `fetch error: ${err.message}`);
    continue;
  }
  if (status !== 200) {
    fail(url, `HTTP ${status}`);
    continue;
  }
  const expectedTitle = `${question}${TITLE_SUFFIX}`;
  const titleMatch = body.match(/<title>([^<]*)<\/title>/);
  const title = titleMatch ? decode(titleMatch[1]) : '';
  if (title !== expectedTitle) {
    fail(
      url,
      title
        ? `wrong <title> — got "${title}", expected "${expectedTitle}". Likely serving the SPA fallback (broken artifact.toml rewrite).`
        : 'no <title> found in response.',
    );
    continue;
  }
  const canonical = `https://www.rentatexhibit.com/knowledge/${slug}`;
  if (!body.includes(`rel="canonical" href="${canonical}"`) && !body.includes(`href="${canonical}" rel="canonical"`)) {
    fail(url, `canonical link for ${canonical} missing.`);
    continue;
  }
  if (!/"@type":\s*"FAQPage"/.test(body)) {
    fail(url, 'FAQPage JSON-LD missing.');
    continue;
  }
  console.log(`ok    ${url}`);
}

// --- Knowledge index --------------------------------------------------------
try {
  const { status, body } = await fetchText(`${BASE}/knowledge`);
  if (status !== 200) fail(`${BASE}/knowledge`, `HTTP ${status}`);
  else if (!/<title>[^<]*Knowledge/i.test(body))
    fail(`${BASE}/knowledge`, 'index page <title> does not mention Knowledge — SPA fallback?');
  else console.log(`ok    ${BASE}/knowledge`);
} catch (err) {
  fail(`${BASE}/knowledge`, `fetch error: ${err.message}`);
}

// --- llms-full.txt ----------------------------------------------------------
try {
  const { status, body } = await fetchText(`${BASE}/llms-full.txt`);
  if (status !== 200) fail(`${BASE}/llms-full.txt`, `HTTP ${status}`);
  else if (body.length < 1000 || !body.includes(sample[0].question))
    fail(
      `${BASE}/llms-full.txt`,
      'reachable but missing knowledge content (does not contain a sampled article question).',
    );
  else console.log(`ok    ${BASE}/llms-full.txt`);
} catch (err) {
  fail(`${BASE}/llms-full.txt`, `fetch error: ${err.message}`);
}

console.log(
  `\nChecked ${sample.length}/${articles.length} article pages + index + llms-full.txt against ${BASE}`,
);
if (failures) {
  console.error(`\n${failures} check(s) FAILED. A knowledge page is likely serving the SPA fallback — inspect the [[services.production.rewrites]] /knowledge blocks in .replit-artifact/artifact.toml and re-publish.`);
  process.exit(1);
}
console.log('All knowledge checks passed.');
