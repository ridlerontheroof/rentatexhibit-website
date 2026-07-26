// Production server guard (Task: catch broken redirects, 404s, or missing
// headers before a publish ships them).
//
// Boots the real production server (server/index.mjs) on a random port
// against the actual build output in dist/public and asserts routing,
// status codes, redirects, cache-control, security headers, compression
// negotiation, and traversal rejection — the things previously verified
// only with manual curl.
//
// Skips gracefully when dist/public has no build output (fresh clone /
// pre-build), like the other build-output guards.

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';

const root = path.resolve(__dirname, '..', '..');
const publicDir = path.join(root, 'dist', 'public');
const serverPath = path.join(root, 'server', 'index.mjs');

const hasBuild = fs.existsSync(path.join(publicDir, 'index.html'));

/** Pick a real prerendered slug from a dist directory so tests never go stale. */
function firstPrerenderedChild(dir: string, exclude: string[] = []): string | null {
  const p = path.join(publicDir, dir);
  if (!fs.existsSync(p)) return null;
  for (const entry of fs.readdirSync(p, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (exclude.includes(entry.name)) continue;
    if (fs.existsSync(path.join(p, entry.name, 'index.html'))) return entry.name;
  }
  return null;
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address() as net.AddressInfo;
      srv.close((err) => (err ? reject(err) : resolve(port)));
    });
    srv.on('error', reject);
  });
}

let child: ChildProcess | null = null;
let base = '';

async function waitForServer(url: string, timeoutMs = 15000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastErr: unknown;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${url}/healthz`);
      if (res.ok) return;
    } catch (err) {
      lastErr = err;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`Production server did not come up at ${url}: ${lastErr}`);
}

// Plain fetch with redirects NOT followed, so 301s are observable.
function get(pathname: string, headers: Record<string, string> = {}) {
  return fetch(`${base}${pathname}`, { redirect: 'manual', headers });
}

describe.skipIf(!hasBuild)('production server (server/index.mjs) against dist/public', () => {
  beforeAll(async () => {
    // If a rebuild is in flight (CI runs this suite concurrently with the
    // prepublish build, which wipes dist/public first), wait for the final
    // build step's output so routes/siblings aren't asserted mid-rebuild.
    // Non-fatal: the dedicated .br test still fails if precompress vanished.
    const deadline = Date.now() + 120000;
    while (!fs.existsSync(path.join(publicDir, 'index.html.br')) && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 1000));
    }
    const port = await freePort();
    base = `http://127.0.0.1:${port}`;
    child = spawn(process.execPath, [serverPath], {
      env: { ...process.env, PORT: String(port) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stderr = '';
    child.stderr?.on('data', (d) => (stderr += d));
    const exited = new Promise<never>((_, reject) => {
      child?.on('exit', (code) =>
        reject(new Error(`server exited early (code ${code}): ${stderr}`)),
      );
    });
    await Promise.race([waitForServer(base), exited]);
    child.removeAllListeners('exit');
  }, 30000);

  afterAll(() => {
    child?.kill('SIGTERM');
  });

  // -------------------------------------------------------------------------
  // Page 200s
  // -------------------------------------------------------------------------
  it('serves the homepage with 200 and HTML', async () => {
    const res = await get('/');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    expect(await res.text()).toContain('<!');
  });

  it('serves clean-URL pages (e.g. /amenities) with 200', async () => {
    const res = await get('/amenities');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
  });

  it('serves a real /knowledge/<slug> page with 200', async () => {
    const slug = firstPrerenderedChild('knowledge', ['not-found']);
    expect(slug, 'no prerendered knowledge article found in dist/public').toBeTruthy();
    const res = await get(`/knowledge/${slug}`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    expect(await res.text()).not.toContain('noindex');
  });

  it('serves a real /available-units/<unit> page with 200', async () => {
    const unit = firstPrerenderedChild('available-units');
    expect(unit, 'no prerendered unit page found in dist/public').toBeTruthy();
    const res = await get(`/available-units/${unit}`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
  });

  // -------------------------------------------------------------------------
  // Redirects
  // -------------------------------------------------------------------------
  it('301s trailing-slash URLs to the non-slash canonical (/amenities/ → /amenities)', async () => {
    const res = await get('/amenities/');
    expect(res.status).toBe(301);
    expect(res.headers.get('location')).toBe('/amenities');
  });

  it('preserves the query string on trailing-slash 301s', async () => {
    const res = await get('/amenities/?utm_source=x');
    expect(res.status).toBe(301);
    expect(res.headers.get('location')).toBe('/amenities?utm_source=x');
  });

  // -------------------------------------------------------------------------
  // 404s
  // -------------------------------------------------------------------------
  it('returns a real 404 with a noindex page for unknown paths', async () => {
    const res = await get('/definitely-not-a-page');
    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toContain('text/html');
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(await res.text()).toContain('noindex');
  });

  it('returns the dedicated noindex stub with 404 for unknown /knowledge/<slug>', async () => {
    const res = await get('/knowledge/this-article-does-not-exist');
    expect(res.status).toBe(404);
    const body = await res.text();
    expect(body).toContain('noindex');
  });

  it('404s /sitemaps.xml (not a sitemap alias)', async () => {
    const res = await get('/sitemaps.xml');
    expect(res.status).toBe(404);
  });

  // -------------------------------------------------------------------------
  // Sitemap aliases
  // -------------------------------------------------------------------------
  it('serves the real sitemap for legacy sitemap aliases', async () => {
    for (const alias of ['/sitemap_index.xml', '/sitemap-index.xml', '/page-sitemap.xml', '/sitemap1.xml']) {
      const res = await get(alias);
      expect(res.status, alias).toBe(200);
      expect(res.headers.get('content-type'), alias).toContain('xml');
      expect(await res.text(), alias).toContain('<urlset');
    }
  });

  it('serves /sitemap.xml itself as XML', async () => {
    const res = await get('/sitemap.xml');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('xml');
  });

  // -------------------------------------------------------------------------
  // Cache-Control
  // -------------------------------------------------------------------------
  it('serves hashed /assets bundles with immutable cache-control', async () => {
    const asset = fs.readdirSync(path.join(publicDir, 'assets')).find((f) => f.endsWith('.js'));
    expect(asset, 'no JS bundle found in dist/public/assets').toBeTruthy();
    const res = await get(`/assets/${asset}`);
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
  });

  it('serves HTML pages with short, revalidatable cache-control', async () => {
    for (const p of ['/', '/amenities']) {
      const res = await get(p);
      expect(res.headers.get('cache-control'), p).toBe('public, max-age=300, must-revalidate');
    }
  });

  it('caches trailing-slash 301s for an hour', async () => {
    const res = await get('/amenities/');
    expect(res.headers.get('cache-control')).toBe('public, max-age=3600');
  });

  // -------------------------------------------------------------------------
  // Security headers
  // -------------------------------------------------------------------------
  it('sets security headers on every response (200, 301, 404)', async () => {
    for (const p of ['/', '/amenities/', '/definitely-not-a-page']) {
      const res = await get(p);
      expect(res.headers.get('strict-transport-security'), p).toBe(
        'max-age=31536000; includeSubDomains',
      );
      expect(res.headers.get('x-content-type-options'), p).toBe('nosniff');
      expect(res.headers.get('x-frame-options'), p).toBe('DENY');
      expect(res.headers.get('referrer-policy'), p).toBe('strict-origin-when-cross-origin');
      expect(res.headers.get('permissions-policy'), p).toContain('camera=()');
      const csp =
        res.headers.get('content-security-policy') ??
        res.headers.get('content-security-policy-report-only');
      expect(csp, p).toContain("default-src 'self'");
      expect(res.headers.get('x-powered-by'), p).toBeNull();
    }
  });

  // -------------------------------------------------------------------------
  // Compression negotiation
  //
  // The precompress step runs LAST in the build chain, and CI may run this
  // suite concurrently with a rebuild (which wipes dist/public first). Poll
  // for the sibling instead of asserting a point-in-time snapshot so a
  // mid-rebuild race doesn't produce a false failure — a build that truly
  // dropped the precompress step still fails after the polling window.
  // -------------------------------------------------------------------------
  const brSibling = path.join(publicDir, 'index.html.br');
  async function waitForBrotliSibling(timeoutMs = 120000): Promise<boolean> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (fs.existsSync(brSibling)) return true;
      await new Promise((r) => setTimeout(r, 1000));
    }
    return false;
  }

  it('build output includes pre-compressed .br siblings for HTML', async () => {
    expect(
      await waitForBrotliSibling(),
      'dist/public/index.html.br missing — precompress step did not run in the build',
    ).toBe(true);
  }, 130000);

  it('serves brotli when the client accepts br', async (ctx) => {
    if (!(await waitForBrotliSibling())) return ctx.skip();
    const res = await get('/', { 'accept-encoding': 'br' });
    expect(res.headers.get('content-encoding')).toBe('br');
    expect(res.headers.get('vary')).toContain('Accept-Encoding');
  }, 130000);

  it('serves gzip when the client accepts only gzip', async (ctx) => {
    if (!fs.existsSync(path.join(publicDir, 'index.html.gz'))) return ctx.skip();
    const res = await get('/', { 'accept-encoding': 'gzip' });
    expect(res.headers.get('content-encoding')).toBe('gzip');
  });

  it('serves identity when the client accepts no encodings', async () => {
    const res = await get('/', { 'accept-encoding': 'identity' });
    expect(res.headers.get('content-encoding')).toBeNull();
    expect((await res.text()).length).toBeGreaterThan(0);
  });

  it('does not compress already-compressed binaries (images)', async () => {
    const res = await get('/favicon.png', { 'accept-encoding': 'br, gzip' });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-encoding')).toBeNull();
  });

  // -------------------------------------------------------------------------
  // Traversal / malformed requests
  // -------------------------------------------------------------------------
  it('rejects path traversal attempts with 404', async () => {
    for (const p of ['/../package.json', '/assets/../../server/index.mjs', '/%2e%2e/%2e%2e/etc/passwd']) {
      const res = await get(p);
      expect([301, 404]).toContain(res.status);
      if (res.status === 301) {
        // Normalization may redirect, but never to a path escaping the root.
        expect(res.headers.get('location')).not.toContain('..');
      } else {
        expect(res.status, p).toBe(404);
      }
    }
  });

  it('404s malformed percent-encoding instead of crashing', async () => {
    const res = await get('/%zz');
    expect(res.status).toBe(404);
  });

  it('rejects non-GET/HEAD methods with 405', async () => {
    const res = await fetch(`${base}/`, { method: 'POST' });
    expect(res.status).toBe(405);
    expect(res.headers.get('allow')).toBe('GET, HEAD');
  });

  it('answers HEAD with headers and no body', async () => {
    const res = await fetch(`${base}/`, { method: 'HEAD' });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-length')).toBeTruthy();
    expect(await res.text()).toBe('');
  });
});

// Always-on sanity so the suite is never silently empty.
describe('production server guard preconditions', () => {
  it('server entrypoint exists', () => {
    expect(fs.existsSync(serverPath)).toBe(true);
  });
  it.skipIf(hasBuild)('skipped: dist/public has no build output (run the build to enable the guard)', () => {
    expect(hasBuild).toBe(false);
  });
});
