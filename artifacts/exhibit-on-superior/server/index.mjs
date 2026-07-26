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

const knowledgeStub = path.join(publicDir, 'knowledge', 'not-found', 'index.html');
const notFoundPage = fs.existsSync(path.join(publicDir, '404.html'))
  ? path.join(publicDir, '404.html')
  : path.join(publicDir, 'index.html'); // pre-regeneration fallback, still status 404

// ---------------------------------------------------------------------------
// Headers
// ---------------------------------------------------------------------------
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  // 'unsafe-inline' is required by the GTM bootstrap + availability-prefetch
  // inline scripts in the prerendered head.
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://maps.googleapis.com",
  // Google Maps JS injects its own stylesheet + font loads at runtime.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  // Photography is served from the AppFolio CDN, tour thumbnails from
  // Matterport/Vimeo CDNs, map tiles from gstatic — https: keeps this robust.
  "img-src 'self' data: https:",
  "media-src 'self' https:",
  "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com https://maps.googleapis.com https://mapsresources-pa.googleapis.com https://my.matterport.com",
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://my.matterport.com https://www.google.com https://maps.google.com https://www.googletagmanager.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join('; ');
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
const COMPRESSIBLE = new Set(['.html', '.js', '.mjs', '.css', '.svg', '.xml', '.txt', '.json', '.webmanifest']);

/** Serve a file, preferring the build-time pre-compressed .br/.gz variant. */
function serveFile(req, res, filePath, status = 200, urlPathForCache = null) {
  const ext = path.extname(filePath).toLowerCase();
  res.status(status);
  res.set('Content-Type', TYPES[ext] ?? 'application/octet-stream');
  res.set('Cache-Control', status === 200 ? cacheControlFor(urlPathForCache ?? filePath) : 'no-store');

  let finalPath = filePath;
  if (COMPRESSIBLE.has(ext)) {
    res.set('Vary', 'Accept-Encoding');
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

  // 1. Root page.
  if (urlPath === '/' || urlPath === '/index.html') {
    return serveFile(req, res, path.join(publicDir, 'index.html'), 200, '/x.html');
  }

  // 2. Real static file (hashed assets, images, sitemap.xml, robots.txt, …).
  const direct = path.join(publicDir, urlPath);
  if (direct.startsWith(publicDir) && fs.existsSync(direct) && fs.statSync(direct).isFile()) {
    return serveFile(req, res, direct, 200, urlPath);
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

  // 7. Everything else: real 404.
  return serveFile(req, res, notFoundPage, 404);
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, '0.0.0.0', () => {
  console.log(`exhibit-on-superior static server listening on :${port} (CSP ${cspHeader === 'Content-Security-Policy' ? 'ENFORCED' : 'report-only'})`);
});
