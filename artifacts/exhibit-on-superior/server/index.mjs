// Production static server for the prerendered site (SEO Phase 1).
//
// Replaces the platform static-serve edge so we control what it could not:
//   1. Compression      — serves build-time pre-compressed .br/.gz variants.
//   2. Cache headers    — immutable for hashed /assets and /images, short for HTML.
//   3. Security headers — CSP (Report-Only until CSP_ENFORCE=1), HSTS, XFO, etc.
//   4. Redirect flip    — 301 /amenities/ → /amenities (matches non-slash canonicals),
//                         killing the platform's slash-ADDING redirect chains.
//   5. Real 404s        — unknown paths get a prerendered 404 page with status 404
//                         (/knowledge/* keeps its dedicated noindex stub).
//
// Routing parity: the clean-URL rewrite table in .replit-artifact/artifact.toml
// remains the single source of truth (the prerender + unit-rewrite guards keep
// it in sync with the page data). This server parses that table at startup, so
// pages can never drift between the config and the server.

import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(here, '..', 'dist', 'public');
const tomlPath = path.resolve(here, '..', '.replit-artifact', 'artifact.toml');

if (!fs.existsSync(path.join(publicDir, 'index.html'))) {
  console.error(`Fatal: build output missing at ${publicDir} — run the build first.`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Rewrite table (exact, non-wildcard). Trailing-slash "from" entries are NOT
// loaded as rewrites — they become 301s to the non-slash form instead.
// Wildcards (/knowledge/*, /*) are handled explicitly as 404s below.
// ---------------------------------------------------------------------------
const rewriteMap = new Map();
{
  const toml = fs.readFileSync(tomlPath, 'utf8');
  const re = /\[\[services\.production\.rewrites\]\]\s*\nfrom = "([^"]+)"\nto = "([^"]+)"/g;
  let m;
  while ((m = re.exec(toml)) !== null) {
    const [, from, to] = m;
    if (from.includes('*')) continue; // wildcard fallbacks handled below
    if (from !== '/' && from.endsWith('/')) continue; // becomes a 301 instead
    rewriteMap.set(from, to);
  }
  if (rewriteMap.size === 0) {
    console.error('Fatal: no rewrites parsed from artifact.toml — routing would be broken.');
    process.exit(1);
  }
  console.log(`Loaded ${rewriteMap.size} exact rewrites from artifact.toml`);
}

// ---------------------------------------------------------------------------
// Legacy 301 redirects (SEO: RentCafe .aspx + G5 /apartments/il/chicago/*).
// The prerenderer writes a no-JS meta-refresh stub for every entry in
// src/data/legacyRedirects.ts (plus the hand-written /artist-in-residence
// stub). Those stubs remain the source of truth: scan the build output for
// them and turn each into a real single-hop 301, so legacy URLs never answer
// 200 with stub/shell content (a soft-404 signal) in production.
// ---------------------------------------------------------------------------
function collectLegacyRedirects(rootDir) {
  const map = new Map();
  const refreshRe = /<meta\s+http-equiv="refresh"\s+content="0;\s*url=([^"]+)"/i;
  const stack = [rootDir];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(p);
      } else if (entry.isFile() && entry.name === 'index.html') {
        const m = refreshRe.exec(fs.readFileSync(p, 'utf8'));
        if (m && dir !== rootDir) {
          const from = '/' + path.relative(rootDir, dir).split(path.sep).join('/');
          map.set(from, m[1]);
        }
      }
    }
  }
  return map;
}
const legacyRedirects = collectLegacyRedirects(publicDir);
console.log(`Loaded ${legacyRedirects.size} legacy 301 redirects from redirect stubs`);

// ---------------------------------------------------------------------------
// Legacy `?plan=<group id>` deep links to /available-units → single-hop 301
// to the matching /floor-plans/<slug> landing page. The prerenderer writes
// the id → path map (dist/plan-redirects.json) from the same data module the
// client fallback redirect uses (src/pages/FloorPlans.tsx), so the two can
// never disagree. Unknown ids fall through to the normal page. Missing map
// (pre-regeneration dist) is non-fatal: the client fallback still redirects.
// ---------------------------------------------------------------------------
const planRedirectsPath = path.resolve(publicDir, '..', 'plan-redirects.json');
let planRedirects = new Map();
try {
  planRedirects = new Map(Object.entries(JSON.parse(fs.readFileSync(planRedirectsPath, 'utf8'))));
  console.log(`Loaded ${planRedirects.size} legacy ?plan= deep-link redirects from plan-redirects.json`);
} catch (err) {
  console.error(
    `Warning: no plan-redirects.json at ${planRedirectsPath} (${err.code ?? err.message}) — ` +
      'legacy /available-units?plan= links fall back to the client-side redirect.',
  );
}

const knowledgeStub = path.join(publicDir, 'knowledge', 'not-found', 'index.html');
const floorPlanStub = path.join(publicDir, 'floor-plans', 'not-found', 'index.html');
const notFoundPage = fs.existsSync(path.join(publicDir, '404.html'))
  ? path.join(publicDir, '404.html')
  : path.join(publicDir, 'index.html'); // pre-regeneration fallback, still status 404

// ---------------------------------------------------------------------------
// Inline-script hashes (CSP without 'unsafe-inline').
// The prerendered pages carry a small, fixed set of inline scripts (host
// redirect, GTM bootstrap, availability prefetch, legacy-redirect stubs).
// Walk the build output once at startup, hash every executing inline script,
// and allow exactly those hashes in script-src. Non-executing scripts
// (application/ld+json) are ignored by script-src and skipped here.
// ---------------------------------------------------------------------------
function collectInlineScriptHashes(rootDir) {
  const hashes = new Set();
  const scriptRe = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi;
  const stack = [rootDir];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(p);
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        const html = fs.readFileSync(p, 'utf8');
        let m;
        while ((m = scriptRe.exec(html)) !== null) {
          const attrs = m[1] ?? '';
          const body = m[2];
          if (/\bsrc\s*=/i.test(attrs)) continue; // external — covered by host allowlist
          const type = /\btype\s*=\s*["']?([^"'\s>]+)/i.exec(attrs)?.[1]?.toLowerCase();
          if (type && type !== 'module' && type !== 'text/javascript' && type !== 'application/javascript')
            continue; // e.g. application/ld+json — not executed, not hashed
          if (!body) continue;
          hashes.add(`'sha256-${crypto.createHash('sha256').update(body, 'utf8').digest('base64')}'`);
        }
      }
    }
  }
  return [...hashes].sort();
}
const inlineScriptHashes = collectInlineScriptHashes(publicDir);
if (inlineScriptHashes.length === 0) {
  console.error('Fatal: no inline-script hashes found — CSP would block the GTM bootstrap.');
  process.exit(1);
}
console.log(`Allowing ${inlineScriptHashes.length} inline-script hashes in script-src`);

// ---------------------------------------------------------------------------
// GTM-injected inline scripts (runtime, so startup hashing can't see them).
// The GTM container (GTM-MDPWH532) serves a Custom HTML tag that injects the
// Ahrefs Analytics loader as an inline <script>. Its content is fixed by the
// container config, so it is allowed by hash. If the tag is ever edited in
// GTM, check:csp fails at prepublish with the new required hash — update it
// here.
// ---------------------------------------------------------------------------
const gtmInjectedScriptHashes = [
  // Ahrefs Analytics loader (GTM Custom HTML tag)
  "'sha256-4QVZ8pB20FlguyBJHonvohn/Z1AzVSRh5oBkVcjkySY='",
];

// ---------------------------------------------------------------------------
// Headers
// ---------------------------------------------------------------------------
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  // Inline scripts (GTM bootstrap, availability prefetch, host redirect,
  // legacy-redirect stubs) are allowed by hash — collected from the build
  // output at startup — so 'unsafe-inline' is not needed.
  `script-src 'self' ${inlineScriptHashes.join(' ')} ${gtmInjectedScriptHashes.join(' ')} https://www.googletagmanager.com https://www.google-analytics.com https://googleads.g.doubleclick.net https://www.googleadservices.com https://maps.googleapis.com https://analytics.ahrefs.com https://www.clarity.ms https://scripts.clarity.ms https://sightmap.com`,
  // Google Maps JS injects its own stylesheet + font loads at runtime.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  // Photography is served from the AppFolio CDN, tour thumbnails from
  // Matterport/Vimeo CDNs, map tiles from gstatic — https: keeps this robust.
  "img-src 'self' data: https:",
  "media-src 'self' https:",
  // Google tag (GA4 + ads) beacon endpoints: the re-activated GTM container
  // sends measurement hits to www.google.com (/g/collect, /ccm/collect),
  // analytics.google.com, and the doubleclick collect hosts. Ahrefs Analytics
  // (GTM tag) beacons to analytics.ahrefs.com.
  "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com https://www.google.com https://analytics.google.com https://stats.g.doubleclick.net https://ad.doubleclick.net https://googleads.g.doubleclick.net https://analytics.ahrefs.com https://maps.googleapis.com https://mapsresources-pa.googleapis.com https://my.matterport.com https://*.clarity.ms https://c.bing.com",
  // sightmap.com: the Engrain interactive property map on /available-units
  // (iframe) and its IFrame API SDK (script-src) — see src/lib/sightmap.ts.
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://my.matterport.com https://www.google.com https://maps.google.com https://www.googletagmanager.com https://sightmap.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  // Real-visitor violation reporting: the prepublish check:csp run can only
  // exercise the pages as built — a GTM container change published later
  // (e.g. a new Custom HTML tag) breaks only in production. Browsers POST
  // violation reports to the api-server (same-origin /api routing), which
  // logs them and emails the operational inbox with dedupe (see
  // artifacts/api-server/src/routes/cspReports.ts). `report-uri` is the
  // legacy channel (still what most browsers send), `report-to` names the
  // Reporting-Endpoints group set alongside the CSP header below.
  'report-uri /api/csp-reports',
  'report-to csp-endpoint',
].join('; ');

// Reporting API endpoint group referenced by the CSP `report-to` directive.
const REPORTING_ENDPOINTS = 'csp-endpoint="/api/csp-reports"';
const cspHeader =
  process.env.CSP_ENFORCE === '1' ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only';

const IMMUTABLE = 'public, max-age=31536000, immutable';
const SHORT = 'public, max-age=300, must-revalidate';

function cacheControlFor(urlPath) {
  // Hashed bundles + versioned site imagery: cache forever.
  if (urlPath.startsWith('/assets/') || urlPath.startsWith('/images/')) return IMMUTABLE;
  const ext = path.extname(urlPath).toLowerCase();
  if (['.avif', '.webp', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.woff', '.woff2'].includes(ext))
    return IMMUTABLE;
  if (ext === '.pdf') return 'public, max-age=3600';
  // HTML, sitemap.xml, robots.txt, llms.txt, JSON: short and revalidatable.
  return SHORT;
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};
const COMPRESSIBLE = new Set(['.html', '.js', '.mjs', '.css', '.svg', '.xml', '.txt', '.json', '.webmanifest', '.md']);

/** Serve a file, preferring the build-time pre-compressed .br/.gz variant. */
function serveFile(req, res, filePath, status = 200, urlPathForCache = null) {
  const ext = path.extname(filePath).toLowerCase();
  res.status(status);
  res.set('Content-Type', TYPES[ext] ?? 'application/octet-stream');
  res.set('Cache-Control', status === 200 ? cacheControlFor(urlPathForCache ?? filePath) : 'no-store');

  let finalPath = filePath;
  if (COMPRESSIBLE.has(ext)) {
    res.append('Vary', 'Accept-Encoding');
    const accepts = String(req.headers['accept-encoding'] ?? '');
    if (/\bbr\b/.test(accepts) && fs.existsSync(`${filePath}.br`)) {
      finalPath = `${filePath}.br`;
      res.set('Content-Encoding', 'br');
    } else if (/\bgzip\b/.test(accepts) && fs.existsSync(`${filePath}.gz`)) {
      finalPath = `${filePath}.gz`;
      res.set('Content-Encoding', 'gzip');
    }
  }
  const stat = fs.statSync(finalPath);
  // Conditional-request validators (perf/bad-caching): weak ETag from
  // size+mtime plus Last-Modified, honouring If-None-Match / If-Modified-Since.
  const etag = `W/"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}"`;
  res.set('ETag', etag);
  res.set('Last-Modified', stat.mtime.toUTCString());
  if (status === 200) {
    const inm = req.headers['if-none-match'];
    const ims = req.headers['if-modified-since'];
    const etagMatch = inm && inm.split(',').map((s) => s.trim()).includes(etag);
    const timeMatch = !inm && ims && Math.floor(stat.mtimeMs / 1000) <= Math.floor(Date.parse(ims) / 1000);
    if (etagMatch || timeMatch) {
      res.removeHeader('Content-Encoding');
      res.removeHeader('Content-Length');
      return res.status(304).end();
    }
  }
  res.set('Content-Length', String(stat.size));
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(finalPath).pipe(res);
}

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);

// Security headers on every response.
app.use((req, res, next) => {
  res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.set('Reporting-Endpoints', REPORTING_ENDPOINTS);
  res.set(cspHeader, CSP);
  next();
});

app.get('/healthz', (_req, res) => res.type('text/plain').send('ok'));

app.use((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.set('Allow', 'GET, HEAD');
    return res.status(405).type('text/plain').send('Method Not Allowed');
  }

  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  } catch {
    return serveFile(req, res, notFoundPage, 404);
  }
  // Normalize; reject traversal or NUL.
  urlPath = path.posix.normalize(urlPath);
  if (urlPath.includes('..') || urlPath.includes('\0')) {
    return serveFile(req, res, notFoundPage, 404);
  }

  // 0. Content negotiation (SEO Phase 4): a client that explicitly asks for
  //    `Accept: text/markdown` on a page URL gets the page's prerendered .md
  //    twin (generated by scripts/prerender.mjs next to each page). Extension
  //    -less page paths only — direct file requests keep their own type.
  if (/\btext\/markdown\b/i.test(String(req.headers.accept ?? '')) && !path.posix.extname(urlPath)) {
    const mdFile = path.join(publicDir, urlPath === '/' ? 'index.md' : `${urlPath.replace(/\/+$/, '')}.md`);
    if (mdFile.startsWith(publicDir) && fs.existsSync(mdFile)) {
      return serveFile(req, res, mdFile, 200, mdFile);
    }
  }
  // Any extensionless page URL is negotiable between HTML and Markdown, so
  // caches must key on Accept (serveFile appends Accept-Encoding).
  if (!path.posix.extname(urlPath)) res.set('Vary', 'Accept');

  // 1. Root page.
  if (urlPath === '/' || urlPath === '/index.html') {
    return serveFile(req, res, path.join(publicDir, 'index.html'), 200, '/x.html');
  }

  // 2. Real static file (hashed assets, images, sitemap.xml, robots.txt, …).
  const direct = path.join(publicDir, urlPath);
  if (direct.startsWith(publicDir) && fs.existsSync(direct) && fs.statSync(direct).isFile()) {
    return serveFile(req, res, direct, 200, urlPath);
  }

  // 2.4 Legacy `?plan=<known group id>` deep link on /available-units →
  //     single-hop 301 to the matching /floor-plans/<slug> landing page
  //     (checked before the trailing-slash redirect so the slash variant is
  //     also one hop). The `plan` parameter is consumed; any other query
  //     parameters (e.g. ?ada=1) ride along. Unknown ids fall through.
  {
    const bare = urlPath !== '/' && urlPath.endsWith('/') ? urlPath.replace(/\/+$/, '') : urlPath;
    if (bare === '/available-units' && req.url.includes('?')) {
      const params = new URLSearchParams(req.url.slice(req.url.indexOf('?') + 1));
      const target = planRedirects.get(params.get('plan') ?? '');
      if (target) {
        params.delete('plan');
        const rest = params.toString();
        res.set('Cache-Control', 'public, max-age=3600');
        return res.redirect(301, rest ? `${target}?${rest}` : target);
      }
    }
  }

  // 2.5 Legacy URL → single-hop 301 to the canonical destination. Checked
  //     before the trailing-slash redirect so /apartments/il/chicago/amenities/
  //     goes straight to /amenities in ONE hop. Query strings are preserved on
  //     internal targets (e.g. /floor-plans?plan=… deep links).
  {
    const bare = urlPath !== '/' && urlPath.endsWith('/') ? urlPath.replace(/\/+$/, '') : urlPath;
    const target = legacyRedirects.get(bare);
    if (target) {
      const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
      res.set('Cache-Control', 'public, max-age=3600');
      if (/^https?:\/\//i.test(target)) return res.redirect(301, target);
      let joined = target + qs;
      if (qs && target.includes('?')) {
        // Channel short-URL targets carry a baked `?source=` tag. Merge the
        // incoming query properly (never a second '?'), and when the incoming
        // query ALREADY carries campaign attribution (?source=, UTM tags, or
        // a Google click-ID) drop the baked tag — explicit campaign
        // attribution must always outrank the channel fallback, and
        // visitSourceFromUrl resolves ?source= first.
        const [targetPath, targetQuery] = target.split('?');
        const merged = new URLSearchParams(targetQuery);
        const incoming = new URLSearchParams(qs.slice(1));
        const attribution = ['source', 'utm_source', 'gclid', 'gbraid', 'wbraid'];
        if (attribution.some((p) => incoming.get(p)?.trim())) merged.delete('source');
        for (const [k, v] of incoming.entries()) merged.append(k, v);
        joined = `${targetPath}?${merged.toString()}`;
      }
      return res.redirect(301, joined);
    }
  }

  // 3. Trailing slash → 301 to the non-slash canonical form (query preserved).
  if (urlPath.endsWith('/')) {
    const target = urlPath.replace(/\/+$/, '') || '/';
    const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    res.set('Cache-Control', 'public, max-age=3600');
    return res.redirect(301, target + qs);
  }

  // 4. Exact rewrite from artifact.toml (clean page URLs, legacy redirect
  //    stubs, sitemap alias probes).
  const rewritten = rewriteMap.get(urlPath);
  if (rewritten) {
    const file = path.join(publicDir, rewritten);
    if (fs.existsSync(file)) return serveFile(req, res, file, 200, rewritten);
  }

  // 5. Prerendered directory page not in the rewrite table (defensive).
  const indexFile = path.join(publicDir, urlPath, 'index.html');
  if (indexFile.startsWith(publicDir) && fs.existsSync(indexFile)) {
    return serveFile(req, res, indexFile, 200, indexFile);
  }

  // 6. Unknown /knowledge/* slug → dedicated noindex stub, real 404 status.
  if (urlPath.startsWith('/knowledge/') && fs.existsSync(knowledgeStub)) {
    return serveFile(req, res, knowledgeStub, 404);
  }

  // 6b. Unknown /floor-plans/* slug → dedicated noindex stub, real 404 status.
  if (urlPath.startsWith('/floor-plans/') && fs.existsSync(floorPlanStub)) {
    return serveFile(req, res, floorPlanStub, 404);
  }

  // 7. Everything else: real 404.
  return serveFile(req, res, notFoundPage, 404);
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, '0.0.0.0', () => {
  console.log(`exhibit-on-superior static server listening on :${port} (CSP ${cspHeader === 'Content-Security-Policy' ? 'ENFORCED' : 'report-only'})`);
});
