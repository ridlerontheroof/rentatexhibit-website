// Production static server for the prerendered property site.
//
// Provides what platform static-serve cannot:
//   1. Compression      — serves build-time pre-compressed .br/.gz variants.
//   2. Cache headers    — immutable for hashed /assets and /images, short for HTML.
//   3. Security headers — CSP (Report-Only until CSP_ENFORCE=1), HSTS, XFO, etc.
//   4. Redirect flip    — 301 /amenities/ → /amenities (non-slash canonicals).
//   5. Real 404s        — unknown paths get a prerendered 404 page with status 404.
//
// Routing parity: the clean-URL rewrite table in artifact.toml is the single
// source of truth. This server parses that table at startup.
//
// WOODS-CROSSING: all property-specific CSP values live in csp-property.mjs.
// Edit that file — do not add property literals here.

import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GTM_INJECTED_SCRIPT_HASHES,
  EXTRA_SCRIPT_SRC_HOSTS,
  EXTRA_CONNECT_SRC_HOSTS,
  EXTRA_FRAME_SRC_HOSTS,
} from './csp-property.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(here, '..', 'dist', 'public');
const tomlPath = path.resolve(here, '..', '.replit-artifact', 'artifact.toml');

if (!fs.existsSync(path.join(publicDir, 'index.html'))) {
  console.error(`Fatal: build output missing at ${publicDir} — run the build first.`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Rewrite table (exact, non-wildcard). Trailing-slash "from" entries become
// 301s to the non-slash form. Wildcards handled explicitly below.
// ---------------------------------------------------------------------------
const rewriteMap = new Map();
{
  const toml = fs.readFileSync(tomlPath, 'utf8');
  const re = /\[\[services\.production\.rewrites\]\]\s*\nfrom = "([^"]+)"\nto = "([^"]+)"/g;
  let m;
  while ((m = re.exec(toml)) !== null) {
    const [, from, to] = m;
    if (from.includes('*')) continue;
    if (from !== '/' && from.endsWith('/')) continue;
    rewriteMap.set(from, to);
  }
  if (rewriteMap.size === 0) {
    console.error('Fatal: no rewrites parsed from artifact.toml — routing would be broken.');
    process.exit(1);
  }
  console.log(`Loaded ${rewriteMap.size} exact rewrites from artifact.toml`);
}

// ---------------------------------------------------------------------------
// Legacy 301 redirects — scan build output for meta-refresh stubs and turn
// each into a real single-hop 301.
// ---------------------------------------------------------------------------
function collectLegacyRedirects(rootDir) {
  const map = new Map();
  const refreshRe = /<meta\s+http-equiv="refresh"\s+content="0;\s*url=([^"]+)"/i;
  const stack = [rootDir];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) { stack.push(p); }
      else if (entry.isFile() && entry.name === 'index.html') {
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
// Legacy ?plan=<group id> deep links — prerenderer writes dist/plan-redirects.json.
// ---------------------------------------------------------------------------
const planRedirectsPath = path.resolve(publicDir, '..', 'plan-redirects.json');
let planRedirects = new Map();
try {
  planRedirects = new Map(Object.entries(JSON.parse(fs.readFileSync(planRedirectsPath, 'utf8'))));
  console.log(`Loaded ${planRedirects.size} legacy ?plan= deep-link redirects`);
} catch (err) {
  console.error(`Warning: no plan-redirects.json (${err.code ?? err.message})`);
}

const knowledgeStub = path.join(publicDir, 'knowledge', 'not-found', 'index.html');
const floorPlanStub = path.join(publicDir, 'floor-plans', 'not-found', 'index.html');
const notFoundPage = fs.existsSync(path.join(publicDir, '404.html'))
  ? path.join(publicDir, '404.html')
  : path.join(publicDir, 'index.html');

// ---------------------------------------------------------------------------
// Inline-script hashes (CSP without 'unsafe-inline'). Walk the build output
// once at startup, hash every executing inline script, and allow exactly those
// hashes in script-src.
// ---------------------------------------------------------------------------
function collectInlineScriptHashes(rootDir) {
  const hashes = new Set();
  const scriptRe = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi;
  const stack = [rootDir];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) { stack.push(p); }
      else if (entry.isFile() && entry.name.endsWith('.html')) {
        const html = fs.readFileSync(p, 'utf8');
        let m;
        while ((m = scriptRe.exec(html)) !== null) {
          const attrs = m[1] ?? '';
          const body = m[2];
          if (/\bsrc\s*=/i.test(attrs)) continue;
          const type = /\btype\s*=\s*["']?([^"'\s>]+)/i.exec(attrs)?.[1]?.toLowerCase();
          if (type && type !== 'module' && type !== 'text/javascript' && type !== 'application/javascript') continue;
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
// CSP directives — property-specific additions come from csp-property.mjs.
// The Google tag entries below are common to every GTM-managed GA4 property.
// connect-src includes https://*.analytics.google.com to cover regional
// collect endpoints (e.g. region1.analytics.google.com) that Google routes
// EU/consent-mode visitors through — the bare apex entry alone does not
// match subdomains.
// ---------------------------------------------------------------------------
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  [
    "script-src 'self'",
    ...inlineScriptHashes,
    ...GTM_INJECTED_SCRIPT_HASHES,
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
    'https://googleads.g.doubleclick.net',
    'https://www.googleadservices.com',
    'https://maps.googleapis.com',
    ...EXTRA_SCRIPT_SRC_HOSTS,
  ].join(' '),
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "media-src 'self' https:",
  [
    "connect-src 'self'",
    'https://www.google-analytics.com',
    'https://*.google-analytics.com',
    'https://www.googletagmanager.com',
    'https://www.google.com',
    'https://analytics.google.com',
    'https://*.analytics.google.com',
    'https://stats.g.doubleclick.net',
    'https://ad.doubleclick.net',
    'https://googleads.g.doubleclick.net',
    'https://maps.googleapis.com',
    'https://mapsresources-pa.googleapis.com',
    ...EXTRA_CONNECT_SRC_HOSTS,
  ].join(' '),
  [
    'frame-src',
    'https://www.youtube.com',
    'https://www.youtube-nocookie.com',
    'https://player.vimeo.com',
    'https://www.google.com',
    'https://maps.google.com',
    'https://www.googletagmanager.com',
    ...EXTRA_FRAME_SRC_HOSTS,
  ].join(' '),
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join('; ');
const cspHeader =
  process.env.CSP_ENFORCE === '1' ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only';

const IMMUTABLE = 'public, max-age=31536000, immutable';
const SHORT = 'public, max-age=300, must-revalidate';

function cacheControlFor(urlPath) {
  if (urlPath.startsWith('/assets/') || urlPath.startsWith('/images/')) return IMMUTABLE;
  const ext = path.extname(urlPath).toLowerCase();
  if (['.avif', '.webp', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.woff', '.woff2'].includes(ext)) return IMMUTABLE;
  if (ext === '.pdf') return 'public, max-age=3600';
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
  urlPath = path.posix.normalize(urlPath);
  if (urlPath.includes('..') || urlPath.includes('\0')) {
    return serveFile(req, res, notFoundPage, 404);
  }

  // Content negotiation: Accept: text/markdown → serve .md twin
  if (/\btext\/markdown\b/i.test(String(req.headers.accept ?? '')) && !path.posix.extname(urlPath)) {
    const mdFile = path.join(publicDir, urlPath === '/' ? 'index.md' : `${urlPath.replace(/\/+$/, '')}.md`);
    if (mdFile.startsWith(publicDir) && fs.existsSync(mdFile)) {
      return serveFile(req, res, mdFile, 200, mdFile);
    }
  }
  if (!path.posix.extname(urlPath)) res.set('Vary', 'Accept');

  if (urlPath === '/' || urlPath === '/index.html') {
    return serveFile(req, res, path.join(publicDir, 'index.html'), 200, '/x.html');
  }

  const direct = path.join(publicDir, urlPath);
  if (direct.startsWith(publicDir) && fs.existsSync(direct) && fs.statSync(direct).isFile()) {
    return serveFile(req, res, direct, 200, urlPath);
  }

  // Legacy ?plan=<known id> deep links on /available-units
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

  // Legacy URL → single-hop 301
  {
    const bare = urlPath !== '/' && urlPath.endsWith('/') ? urlPath.replace(/\/+$/, '') : urlPath;
    const target = legacyRedirects.get(bare);
    if (target) {
      const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
      res.set('Cache-Control', 'public, max-age=3600');
      if (/^https?:\/\//i.test(target)) return res.redirect(301, target);
      let joined = target + qs;
      if (qs && target.includes('?')) {
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

  // Trailing slash → 301 to non-slash canonical
  if (urlPath.endsWith('/')) {
    const target = urlPath.replace(/\/+$/, '') || '/';
    const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    res.set('Cache-Control', 'public, max-age=3600');
    return res.redirect(301, target + qs);
  }

  // Exact rewrite from artifact.toml
  const rewritten = rewriteMap.get(urlPath);
  if (rewritten) {
    const file = path.join(publicDir, rewritten);
    if (fs.existsSync(file)) return serveFile(req, res, file, 200, rewritten);
  }

  // Prerendered directory page (defensive)
  const indexFile = path.join(publicDir, urlPath, 'index.html');
  if (indexFile.startsWith(publicDir) && fs.existsSync(indexFile)) {
    return serveFile(req, res, indexFile, 200, indexFile);
  }

  // Unknown /knowledge/* slug → noindex stub
  if (urlPath.startsWith('/knowledge/') && fs.existsSync(knowledgeStub)) {
    return serveFile(req, res, knowledgeStub, 404);
  }

  // Unknown /floor-plans/* slug → noindex stub
  if (urlPath.startsWith('/floor-plans/') && fs.existsSync(floorPlanStub)) {
    return serveFile(req, res, floorPlanStub, 404);
  }

  return serveFile(req, res, notFoundPage, 404);
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, '0.0.0.0', () => {
  console.log(`Property site static server listening on :${port} (CSP ${cspHeader === 'Content-Security-Policy' ? 'ENFORCED' : 'report-only'})`);
});
