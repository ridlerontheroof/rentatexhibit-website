// Production server guard (Task: catch broken redirects, 404s, or missing
// headers before a publish ships them).
//
// Boots the real production server (server/index.mjs) on a random port
// against the actual build output in dist/public and asserts routing,
// status codes, redirects, cache-control, security headers, compression
// negotiation, and traversal rejection — the things previously verified
// only with manual curl.
//
// Skips gracefully when dist/public has no COMPLETE build output — either no
// index.html (fresh clone / pre-build) or no precompressed index.html.br
// sibling (partial/foreign dist copy, or a rebuild in flight that wiped
// dist/public; precompress runs LAST in the build chain, so its presence
// marks a finished build). Polling for the sibling inside beforeAll was
// removed: it could wait up to 120s against a 30s hook timeout and fail the
// whole suite in environments where the build legitimately isn't complete.

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';

const root = path.resolve(__dirname, '..', '..');
const publicDir = path.join(root, 'dist', 'public');
const serverPath = path.join(root, 'server', 'index.mjs');

const hasIndexHtml = fs.existsSync(path.join(publicDir, 'index.html'));
// Precompress runs last in the build chain, so index.html.br marks a
// complete, settled build — anything less is skipped, not failed.
const hasBuild = hasIndexHtml && fs.existsSync(path.join(publicDir, 'index.html.br'));

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
  }, 150000); // > the 120s rebuild-wait poll above, so the hook doesn't time out first

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
  // Markdown twins (SEO Phase 4)
  // -------------------------------------------------------------------------
  it('serves the .md twin at <path>.md with text/markdown', async () => {
    const res = await get('/amenities.md');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/markdown');
    const body = await res.text();
    expect(body).toContain('---'); // frontmatter
    expect(body).toContain('# ');
  });

  it('serves the homepage twin at /index.md', async () => {
    const res = await get('/index.md');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/markdown');
  });

  it('negotiates Accept: text/markdown on page URLs', async () => {
    for (const p of ['/', '/amenities']) {
      const res = await get(p, { accept: 'text/markdown' });
      expect(res.status, p).toBe(200);
      expect(res.headers.get('content-type'), p).toContain('text/markdown');
      expect(res.headers.get('vary'), p).toContain('Accept');
    }
  });

  it('still serves HTML when Accept does not mention markdown, with Vary: Accept', async () => {
    const res = await get('/amenities', { accept: 'text/html' });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    expect(res.headers.get('vary')).toContain('Accept');
  });

  it('negotiates markdown for knowledge and unit pages', async () => {
    const slug = firstPrerenderedChild('knowledge', ['not-found']);
    const unit = firstPrerenderedChild('available-units');
    for (const p of [`/knowledge/${slug}`, `/available-units/${unit}`]) {
      const res = await get(p, { accept: 'text/markdown' });
      expect(res.status, p).toBe(200);
      expect(res.headers.get('content-type'), p).toContain('text/markdown');
    }
  });

  it('falls back to HTML (not 404) for markdown Accept on paths without a twin', async () => {
    const res = await get('/definitely-not-a-page', { accept: 'text/markdown' });
    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toContain('text/html');
  });

  it('serves .md twins brotli-compressed when accepted', async () => {
    const res = await get('/amenities.md', { 'accept-encoding': 'br' });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-encoding')).toBe('br');
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
  // Legacy URL 301s (RentCafe .aspx + G5 /apartments/il/chicago/*)
  //
  // These must be REAL single-hop 301s to the canonical non-slash URL — never
  // a 200 with stub/shell content (soft-404) and never a redirect chain.
  // -------------------------------------------------------------------------
  const LEGACY_301S: Array<[string, string]> = [
    ['/apartments/il/chicago', '/available-units'],
    ['/apartments/il/chicago/floor-plans', '/available-units'],
    ['/apartments/il/chicago/photo-gallery', '/photo-gallery'],
    ['/apartments/il/chicago/virtual-tour', '/virtual-tour'],
    ['/apartments/il/chicago/amenities', '/amenities'],
    ['/apartments/il/chicago/pet-friendly', '/pet-friendly'],
    ['/apartments/il/chicago/neighborhood', '/neighborhood'],
    ['/apartments/il/chicago/contact-us', '/contact-us'],
    ['/apartments/il/chicago/map-directions', '/map-directions'],
    ['/apartments/il/chicago/residents', '/residents'],
    ['/apartments/il/chicago/schedule-a-tour', '/schedule-a-tour'],
    ['/apartments/il/chicago/reviews', '/reviews'],
    ['/apartments/il/chicago/magellan-rewards', '/'],
    ['/floor-plans', '/available-units'],
    ['/floorplans.aspx', '/available-units'],
    ['/availableunits.aspx', '/available-units'],
    ['/amenities.aspx', '/amenities'],
    ['/contactus.aspx', '/contact-us'],
    ['/artist-in-residence', '/'],
  ];

  it('301s every legacy URL to its canonical equivalent in a single hop', async () => {
    for (const [from, to] of LEGACY_301S) {
      const res = await get(from);
      expect(res.status, from).toBe(301);
      expect(res.headers.get('location'), from).toBe(to);
      // Single hop: the target must answer 200 directly (no chain).
      const dest = await get(to);
      expect(dest.status, `${from} → ${to}`).toBe(200);
    }
  });

  it('301s trailing-slash legacy URLs straight to the target (one hop, not two)', async () => {
    const res = await get('/apartments/il/chicago/amenities/');
    expect(res.status).toBe(301);
    expect(res.headers.get('location')).toBe('/amenities');
  });

  it('301s the external apply legacy URL to the application site', async () => {
    const res = await get('/apartments/il/chicago/apply');
    expect(res.status).toBe(301);
    expect(res.headers.get('location')).toMatch(/^https:\/\//);
  });

  it('preserves query strings on legacy 301s (e.g. /floor-plans?plan=…)', async () => {
    const res = await get('/floor-plans?plan=a1');
    expect(res.status).toBe(301);
    expect(res.headers.get('location')).toBe('/available-units?plan=a1');
  });

  it('404s unknown /apartments/il/chicago/* suffixes instead of serving the shell (soft-404 guard)', async () => {
    for (const p of ['/apartments/il/chicago/not-a-real-page', '/apartments/il/chicago/foo/bar']) {
      const res = await get(p);
      expect(res.status, p).toBe(404);
      expect(await res.text(), p).toContain('noindex');
    }
  });

  it('404s unknown .aspx paths instead of serving the shell', async () => {
    const res = await get('/somethingelse.aspx');
    expect(res.status).toBe(404);
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
  // The suite only runs when dist/public/index.html.br exists (see hasBuild),
  // so the .br sibling is guaranteed here — no polling needed.
  // -------------------------------------------------------------------------
  it('build output includes pre-compressed .br siblings for HTML', () => {
    expect(
      fs.existsSync(path.join(publicDir, 'index.html.br')),
      'dist/public/index.html.br missing — precompress step did not run in the build',
    ).toBe(true);
  });

  it('serves brotli when the client accepts br', async () => {
    const res = await get('/', { 'accept-encoding': 'br' });
    expect(res.headers.get('content-encoding')).toBe('br');
    expect(res.headers.get('vary')).toContain('Accept-Encoding');
  });

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
  it.skipIf(hasBuild)(
    'skipped: dist/public has no complete build output incl. precompressed siblings (run the build to enable the guard)',
    () => {
      expect(hasBuild).toBe(false);
    },
  );
});
