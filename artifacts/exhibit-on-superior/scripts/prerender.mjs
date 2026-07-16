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

// Guard: every WebP AND AVIF variant listed in the image manifest must exist
// in the build output, so a stale/hand-edited manifest can't ship 404ing
// srcsets or <source type="image/avif"> entries. The manifest object literal
// is generator-emitted JSON, so parse it structurally rather than regexing
// individual fields — robust against formatting changes.
{
  const manifestSrc = await fs.readFile(path.join(root, 'src', 'data', 'imageManifest.ts'), 'utf8');
  const objectMatch = manifestSrc.match(/IMAGE_MANIFEST[^=]*=\s*(\{[\s\S]*\})\s*;/);
  if (!objectMatch) {
    throw new Error('Prerender aborted: could not locate IMAGE_MANIFEST object in imageManifest.ts');
  }
  /** @type {Record<string, {variants: Array<{src: string, avif?: string}>}>} */
  const manifest = JSON.parse(objectMatch[1]);
  const variantPaths = Object.values(manifest).flatMap((meta) =>
    meta.variants.flatMap((v) => (v.avif ? [v.src, v.avif] : [v.src])),
  );
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

  // Guard: React 19 SSR silently emits <link rel="preload" as="image"
  // href="..."> for any eager plain <img> rendered outside a <picture> —
  // exactly how a full-size PNG logo preload once shipped unnoticed. Only the
  // deliberate href-less imagesrcset AVIF LCP hints are allowed; any image
  // preload carrying a fixed href fails the build loudly.
  {
    const imagePreloads = page.match(/<link\b[^>]*rel="preload"[^>]*>/gi) ?? [];
    const offenders = imagePreloads.filter(
      (tag) => /\bas="image"/i.test(tag) && /\bhref="[^"]*"/i.test(tag),
    );
    if (offenders.length) {
      throw new Error(
        `Prerender aborted: page ${routePath} contains ${offenders.length} fixed-href image preload(s) ` +
          `(likely React 19 auto-preload from an eager plain <img>; render via SmartImg instead):\n` +
          offenders
            .map((tag) => `  ${tag} -> ${tag.match(/\bhref="([^"]*)"/i)?.[1] ?? '?'}`)
            .join('\n'),
      );
    }
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

// Post-build guard: re-read every written page from disk and cross-check its
// injected LCP preload against its OWN rendered body. A template/injection bug
// (e.g. a page shipping the home hero's hint, or a leftover template hint on a
// page with no eager AVIF image) fails the build loudly.
{
  const problems = [];
  for (const routePath of seoPaths) {
    const outPath =
      routePath === '/'
        ? path.join(publicDir, 'index.html')
        : path.join(publicDir, routePath.replace(/^\//, ''), 'index.html');
    const page = await fs.readFile(outPath, 'utf8');

    // Split head/body so we compare the head's hint to the body's markup only.
    const headEnd = page.indexOf('</head>');
    if (headEnd === -1) {
      problems.push(`${routePath}: no </head> found in output.`);
      continue;
    }
    const headHtml = page.slice(0, headEnd);
    const bodyHtml = page.slice(headEnd);

    // Expected hint: derived from this page's own body markup.
    const expected = extractLcpPreload(bodyHtml);

    // Actual hint(s): imagesrcset preloads present in the head.
    const actualLinks = (headHtml.match(/<link\b[^>]*rel="preload"[^>]*>/gi) ?? []).filter((tag) =>
      /\bimagesrcset="/i.test(tag),
    );

    if (expected) {
      if (actualLinks.length !== 1) {
        problems.push(
          `${routePath}: expected exactly 1 imagesrcset preload, found ${actualLinks.length}.`,
        );
      } else if (actualLinks[0] !== expected) {
        problems.push(
          `${routePath}: preload does not match the page's own eager <picture>.\n` +
            `    head has: ${actualLinks[0]}\n` +
            `    expected: ${expected}`,
        );
      }
    } else if (actualLinks.length) {
      problems.push(
        `${routePath}: has no eager AVIF <picture> but head carries ${actualLinks.length} ` +
          `imagesrcset preload(s) (stale/leftover template hint): ${actualLinks[0]}`,
      );
    }
  }
  if (problems.length) {
    throw new Error(
      `Prerender aborted: LCP preload verification failed on ${problems.length} page(s):\n` +
        problems.map((p) => `  ${p}`).join('\n'),
    );
  }
  console.log(`LCP preload verified on ${seoPaths.length} pages.`);
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
