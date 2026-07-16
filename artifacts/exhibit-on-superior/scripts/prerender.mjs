// Build-time prerenderer: renders every indexable route to static HTML so that
// crawlers and social/link-preview bots (which don't run JS) receive per-page
// titles, descriptions, canonicals, and JSON-LD in <head>, plus visible body
// content. Also regenerates sitemap.xml from PAGE_SEO so it can never drift.
//
// Runs after `vite build` (client) and `vite build --ssr` (server bundle).
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const publicDir = path.join(root, 'dist', 'public');
const serverEntry = path.join(root, 'dist', 'server', 'entry-server.js');

const { render, PAGE_SEO, canonicalFor, ROUTE_PATHS, extractLcpPreload } = await import(
  pathToFileURL(serverEntry).href
);

// Parity guard: every indexable page must have a route to render it, and every
// content route must have SEO metadata. Fail the build on any mismatch so a new
// page can't silently ship with the wrong (home) meta or 404 content.
const seoPaths = Object.keys(PAGE_SEO);
const missingRoutes = seoPaths.filter((p) => !ROUTE_PATHS.includes(p));
const orphanRoutes = ROUTE_PATHS.filter((p) => !seoPaths.includes(p));
if (missingRoutes.length || orphanRoutes.length) {
  throw new Error(
    'Prerender aborted: routes.tsx and PAGE_SEO are out of sync.\n' +
      (missingRoutes.length ? `  PAGE_SEO paths with no route: ${missingRoutes.join(', ')}\n` : '') +
      (orphanRoutes.length ? `  Routes with no PAGE_SEO entry: ${orphanRoutes.join(', ')}\n` : ''),
  );
}

// Guard: every WebP variant listed in the image manifest must exist in the
// build output, so a stale/hand-edited manifest can't ship 404ing srcsets.
{
  const manifestSrc = await fs.readFile(path.join(root, 'src', 'data', 'imageManifest.ts'), 'utf8');
  const variantPaths = [...manifestSrc.matchAll(/"src":\s*"(\/images\/[^"]+\.webp)"/g)].map((m) => m[1]);
  const missing = [];
  for (const p of variantPaths) {
    try {
      await fs.access(path.join(publicDir, p.replace(/^\//, '')));
    } catch {
      missing.push(p);
    }
  }
  if (missing.length) {
    throw new Error(
      `Prerender aborted: ${missing.length} image manifest variant(s) missing from build output ` +
        `(run scripts/optimize-images.mjs): ${missing.slice(0, 5).join(', ')}`,
    );
  }
}

const templatePath = path.join(publicDir, 'index.html');
const template = await fs.readFile(templatePath, 'utf8');

const SEO_BLOCK = /<!--\s*seo:start\s*-->[\s\S]*?<!--\s*seo:end\s*-->/;
// Per-page LCP preload block (AVIF imagesrcset). The template carries the
// home-hero hint (guarded by hero-lcp-preload.test.ts); each prerendered page
// gets the block rewritten with a preload derived from its own rendered
// markup, so imagesrcset/imagesizes always match what <SmartImg> renders.
const LCP_BLOCK = /\s*<!--\s*lcp:start\s*-->[\s\S]*?<!--\s*lcp:end\s*-->/;
const ROOT_DIV = '<div id="root"></div>';

if (!SEO_BLOCK.test(template)) {
  throw new Error(
    'Prerender aborted: could not find <!-- seo:start --> / <!-- seo:end --> markers in index.html.',
  );
}
if (!template.includes(ROOT_DIV)) {
  throw new Error(`Prerender aborted: could not find "${ROOT_DIV}" in index.html.`);
}
if (!LCP_BLOCK.test(template)) {
  throw new Error(
    'Prerender aborted: could not find <!-- lcp:start --> / <!-- lcp:end --> markers in index.html.',
  );
}

for (const routePath of seoPaths) {
  const { html, head } = await render(routePath);

  if (!head.includes('<title>')) {
    throw new Error(`Prerender aborted: no <title> generated for ${routePath}.`);
  }

  let page = template
    .replace(SEO_BLOCK, `<!-- seo:start -->\n    ${head}\n    <!-- seo:end -->`)
    .replace(ROOT_DIV, `<div id="root">${html}</div>`);

  // Rewrite the LCP block with this page's own preload, extracted from the
  // eager high-priority <picture> SmartImg just rendered (exact-match srcset,
  // so the browser reuses the preloaded response — never a double download).
  const lcpLink = extractLcpPreload(html);
  if (lcpLink) {
    page = page.replace(
      LCP_BLOCK,
      `\n    <!-- lcp:start -->\n    ${lcpLink}\n    <!-- lcp:end -->`,
    );
    if (routePath === '/' && !page.includes(lcpLink)) {
      throw new Error('Prerender aborted: home LCP preload injection failed.');
    }
  } else {
    // Page has no eager AVIF image above the fold — drop the hint entirely.
    page = page.replace(LCP_BLOCK, '');
  }

  // Assert the head tags actually landed inside the marker block (not the body).
  const block = page.match(SEO_BLOCK);
  if (!block || !/<title>/.test(block[0]) || !/rel="canonical"/.test(block[0])) {
    throw new Error(`Prerender aborted: head injection failed for ${routePath}.`);
  }

  const outPath =
    routePath === '/'
      ? path.join(publicDir, 'index.html')
      : path.join(publicDir, routePath.replace(/^\//, ''), 'index.html');

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, page, 'utf8');
}

// Sitemap: indexable pages only (noindex pages excluded). Redirect routes such
// as /available-units are absent from PAGE_SEO, so they're excluded by design.
const today = new Date().toISOString().slice(0, 10);
const indexable = seoPaths.filter((p) => !PAGE_SEO[p].noindex);
const urls = indexable
  .map((p) => {
    const priority = p === '/' ? '1.0' : '0.8';
    return `  <url><loc>${canonicalFor(p)}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>${priority}</priority></url>`;
  })
  .join('\n');
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
await fs.writeFile(path.join(publicDir, 'sitemap.xml'), sitemap, 'utf8');

console.log(
  `Prerendered ${seoPaths.length} routes; sitemap.xml written with ${indexable.length} indexable URLs.`,
);
