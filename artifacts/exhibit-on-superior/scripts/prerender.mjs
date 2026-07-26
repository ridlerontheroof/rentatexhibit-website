// Build-time prerenderer: renders every indexable route to static HTML so that
// crawlers and social/link-preview bots (which don't run JS) receive per-page
// titles, descriptions, canonicals, and JSON-LD in <head>, plus visible body
// content. Also regenerates sitemap.xml from PAGE_SEO so it can never drift.
//
// Runs after `vite build` (client) and `vite build --ssr` (server bundle).
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  extractJsonLdPayloads,
  validateJsonLdPayloads,
  checkRecommendedProperties,
  SITE_RECOMMENDED_ALLOWLIST,
} from './validate-jsonld.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const publicDir = path.join(root, 'dist', 'public');
const serverEntry = path.join(root, 'dist', 'server', 'entry-server.js');

const {
  render,
  PAGE_SEO,
  SITE_URL,
  canonicalFor,
  ROUTE_PATHS,
  extractLcpPreload,
  LEGACY_REDIRECTS,
  FLOOR_PLAN_COUNT,
  BAKED_UNIT_COUNT,
  UNIT_PATHS,
  BAKED_SNAPSHOT_STATUS,
  KNOWLEDGE_PATHS,
  KNOWLEDGE_META,
} = await import(pathToFileURL(serverEntry).href);

// Snapshot freshness guard: per-unit pages, their sitemap entries, and the
// /available-units Apartment/Offer nodes are all generated from the baked
// availability snapshot. A stale (>48h) or malformed snapshot would silently
// drop ALL of them from the publish — fail loudly instead, with the fix.
if (BAKED_SNAPSHOT_STATUS !== 'fresh') {
  throw new Error(
    `Prerender aborted: baked availability snapshot is ${BAKED_SNAPSHOT_STATUS}. ` +
      'Per-unit pages and unit-level structured data would silently vanish from this build. ' +
      'Re-fetch it (scripts/fetch-availability-snapshot.mjs runs during `pnpm build`; it needs ' +
      'the production /api/availability to be reachable) and rebuild.',
  );
}

// Per-unit pages (/available-units/<unit>): dynamic routes prerendered from
// the baked availability snapshot. They intentionally live OUTSIDE PAGE_SEO /
// ROUTE_PATHS (their head model comes from buildUnitSeoModel, and the unit set
// changes with every publish), so the static parity guard below ignores them.
const unitPaths = UNIT_PATHS ?? [];
// Knowledge Center articles (/knowledge/<slug>): static content data rendered
// through a dynamic route — like unit pages they live outside PAGE_SEO, with
// their head model coming from buildKnowledgeSeoModel.
const knowledgePaths = KNOWLEDGE_PATHS ?? [];
const allPaths = [...Object.keys(PAGE_SEO), ...unitPaths, ...knowledgePaths];
const outPathFor = (routePath) =>
  routePath === '/'
    ? path.join(publicDir, 'index.html')
    : path.join(publicDir, routePath.replace(/^\//, ''), 'index.html');

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

for (const routePath of allPaths) {
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

  const outPath = outPathFor(routePath);

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, page, 'utf8');
}

// Post-build guard: re-read every written page from disk and cross-check its
// injected LCP preload against its OWN rendered body. A template/injection bug
// (e.g. a page shipping the home hero's hint, or a leftover template hint on a
// page with no eager AVIF image) fails the build loudly.
{
  const problems = [];
  for (const routePath of allPaths) {
    const page = await fs.readFile(outPathFor(routePath), 'utf8');

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
  console.log(`LCP preload verified on ${allPaths.length} pages.`);
}

// Post-build guard: structured-data validation. Re-read every written page and
// validate ALL of its JSON-LD blocks — parseable JSON, schema.org @context,
// @type on every node, and no dangling internal @id references. A malformed
// node on ANY prerendered route fails the build before Google ever sees it.
{
  const problems = [];
  for (const routePath of allPaths) {
    const page = await fs.readFile(outPathFor(routePath), 'utf8');
    const payloads = extractJsonLdPayloads(page);
    // Every indexable page must ship structured data; noindex pages skip it.
    // Unit pages (not in PAGE_SEO) are always indexable.
    if (!PAGE_SEO[routePath]?.noindex && payloads.length === 0) {
      problems.push(`${routePath}: indexable page has no JSON-LD blocks`);
    }
    for (const problem of validateJsonLdPayloads(payloads, SITE_URL)) {
      problems.push(`${routePath}: ${problem}`);
    }
  }
  if (problems.length) {
    throw new Error(
      `Prerender aborted: JSON-LD validation failed on ${problems.length} issue(s):\n` +
        problems.map((p) => `  ${p}`).join('\n'),
    );
  }
  console.log(`JSON-LD validated on ${allPaths.length} pages.`);
}

// Post-build guard: /available-units must publish machine-readable inventory —
// one FloorPlan node per residence line, and (whenever the build carried a
// fresh availability snapshot) one Apartment node with a lease Offer per
// available unit. A refactor that drops these silently would erase the site's
// unit-level structured data for AI/Bing crawlers.
{
  const page = await fs.readFile(path.join(publicDir, 'available-units', 'index.html'), 'utf8');
  const nodes = [];
  for (const raw of extractJsonLdPayloads(page)) {
    const parsed = JSON.parse(raw);
    const collect = (v) => {
      if (Array.isArray(v)) return v.forEach(collect);
      if (v && typeof v === 'object') {
        if (typeof v['@type'] === 'string') nodes.push(v);
        for (const k of Object.keys(v)) if (!k.startsWith('@')) collect(v[k]);
        if (Array.isArray(v['@graph'])) collect(v['@graph']);
      }
    };
    collect(parsed);
  }
  const count = (type) => nodes.filter((n) => n['@type'] === type).length;
  const problems = [];
  if (count('FloorPlan') !== FLOOR_PLAN_COUNT) {
    problems.push(`expected ${FLOOR_PLAN_COUNT} FloorPlan nodes, found ${count('FloorPlan')}`);
  }
  const apartmentsWithOffers = nodes.filter(
    (n) => n['@type'] === 'Apartment' && n.offers,
  ).length;
  if (apartmentsWithOffers < BAKED_UNIT_COUNT || count('Offer') < BAKED_UNIT_COUNT) {
    problems.push(
      `expected >= ${BAKED_UNIT_COUNT} Apartment nodes with Offers (snapshot units), ` +
        `found ${apartmentsWithOffers} apartments / ${count('Offer')} offers`,
    );
  }
  if (!nodes.some((n) => n['@type'] === 'ApartmentComplex' && n.numberOfAccommodationUnits === 298)) {
    problems.push('ApartmentComplex is missing numberOfAccommodationUnits: 298');
  }
  if (problems.length) {
    throw new Error(
      `Prerender aborted: /available-units unit-level structured data check failed:\n` +
        problems.map((p) => `  ${p}`).join('\n'),
    );
  }
  console.log(
    `Unit-level structured data verified: ${FLOOR_PLAN_COUNT} FloorPlans, ${BAKED_UNIT_COUNT} available units with Offers.`,
  );
}

// Post-build guard: every per-unit page must carry its own facts — the unit
// number in <title> and canonical, an Apartment node with a lease Offer, and
// the fact-first summary in the body. A regression that ships unit pages with
// home/generic meta (the exact soft-duplicate failure these pages exist to
// avoid) fails the build.
{
  const problems = [];
  for (const routePath of unitPaths) {
    const unit = routePath.split('/').pop();
    const page = await fs.readFile(outPathFor(routePath), 'utf8');
    if (!new RegExp(`<title>[^<]*${unit}`).test(page)) {
      problems.push(`${routePath}: <title> does not mention unit ${unit}`);
    }
    if (!page.includes(`rel="canonical" href="${SITE_URL}${routePath}"`)) {
      problems.push(`${routePath}: missing self-canonical`);
    }
    // renderToString splits dynamic text with <!-- --> comments, so check the
    // body via a comment-tolerant fragment of the fact summary.
    if (!page.replaceAll('<!-- -->', '').includes(`Apartment ${unit} at Exhibit On Superior is a`)) {
      problems.push(`${routePath}: fact-first summary missing from body`);
    }
    const nodes = extractJsonLdPayloads(page).flatMap((raw) => {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed['@graph']) ? parsed['@graph'] : [parsed];
    });
    const apt = nodes.find((n) => n['@type'] === 'Apartment');
    if (!apt || !apt.offers) {
      problems.push(`${routePath}: missing Apartment node with Offer`);
    }
  }
  if (problems.length) {
    throw new Error(
      `Prerender aborted: per-unit page check failed:\n` +
        problems.map((p) => `  ${p}`).join('\n'),
    );
  }
  console.log(`Per-unit pages verified: ${unitPaths.length} unit page(s).`);
}

// Soft check: recommended schema.org properties (WARNINGS ONLY — never fails
// the build). Google's rich-result eligibility improves with per-type
// recommended properties (FAQ answers, ApartmentComplex address/telephone/
// image, VideoObject uploadDate, ...). Missing ones are printed per page so
// thin listings are visible in build output; intentional omissions live in
// SITE_RECOMMENDED_ALLOWLIST (scripts/validate-jsonld.mjs). The vitest suite
// (src/prerender-jsonld-recommended.test.ts) pins these to zero beyond the
// allowlist, so this printout doubles as a diagnostic when that test fails.
{
  let warned = 0;
  for (const routePath of allPaths) {
    const page = await fs.readFile(outPathFor(routePath), 'utf8');
    const warnings = checkRecommendedProperties(extractJsonLdPayloads(page), {
      allowlist: SITE_RECOMMENDED_ALLOWLIST,
    });
    if (warnings.length) {
      warned += warnings.length;
      console.warn(`WARN ${routePath}: structured data missing recommended properties:`);
      for (const w of warnings) console.warn(`  - ${w}`);
    }
  }
  console.log(
    warned
      ? `Recommended-property check: ${warned} warning(s) — see above (build not failed).`
      : `Recommended-property check: all pages carry the properties Google rewards.`,
  );
}

// Legacy URL redirect stubs: crawlers that hit old Wix-era URLs (or the former
// /floor-plans canonical) must receive an explicit redirect signal — never the
// homepage document (which reads as duplicate/soft-404 content). Each stub is a
// no-JS meta-refresh (Google treats refresh=0 as a permanent redirect) with a
// canonical pointing at the destination. artifact.toml rewrites route the
// legacy paths to these files; the SPA's client-side <Redirect> routes remain
// as a belt-and-braces fallback for JS-enabled visitors.
// Source of truth: src/data/legacyRedirects.ts (shared with App.tsx).
const LEGACY_REDIRECT_STUBS = LEGACY_REDIRECTS;

// Parity guard: every legacy path must have BOTH rewrite forms (bare and
// trailing slash) in artifact.toml pointing at its stub, or crawlers would
// fall through to the /* -> /index.html catch-all and receive homepage
// content (the soft-duplicate failure this whole block exists to prevent).
{
  const tomlPath = path.join(root, '.replit-artifact', 'artifact.toml');
  const toml = await fs.readFile(tomlPath, 'utf8');
  const missing = [];
  for (const from of Object.keys(LEGACY_REDIRECT_STUBS)) {
    for (const form of [from, `${from}/`]) {
      const rule = `from = "${form}"\nto = "${from}/index.html"`;
      if (!toml.includes(rule)) missing.push(form);
    }
  }
  if (missing.length) {
    throw new Error(
      `Prerender aborted: artifact.toml is missing legacy redirect rewrite(s) for: ${missing.join(', ')}.\n` +
        'Add [[services.production.rewrites]] entries (bare + trailing slash) ahead of the /* catch-all.',
    );
  }
}

// Parity guard: per-unit rewrites must EXACTLY match the baked snapshot's
// unit set. The production static host does not resolve directory indexes for
// unmatched paths (verified live 2026-07-26: unit URLs fell through to the /*
// catch-all and served the homepage shell), so every unit page needs an
// explicit rewrite pair. A MISSING pair ships a unit page that serves homepage
// HTML; a STALE pair points at a file absent from the new build (hard 404
// instead of the graceful client-side "has been rented" page). Both fail here.
{
  const tomlPath = path.join(root, '.replit-artifact', 'artifact.toml');
  const toml = await fs.readFile(tomlPath, 'utf8');
  const tomlUnits = new Set(
    [...toml.matchAll(/^from = "\/available-units\/(\d+)\/?"$/gm)].map((m) => m[1]),
  );
  const snapshotUnits = unitPaths.map((p) => p.split('/').pop());
  const missing = snapshotUnits.filter((u) => {
    return (
      !toml.includes(`from = "/available-units/${u}"\nto = "/available-units/${u}/index.html"`) ||
      !toml.includes(`from = "/available-units/${u}/"\nto = "/available-units/${u}/index.html"`)
    );
  });
  const stale = [...tomlUnits].filter((u) => !snapshotUnits.includes(u));
  if (missing.length || stale.length) {
    throw new Error(
      'Prerender aborted: artifact.toml per-unit rewrites are out of sync with the baked availability snapshot.\n' +
        (missing.length ? `  Units missing rewrite pairs (bare + trailing slash): ${missing.join(', ')}\n` : '') +
        (stale.length ? `  Stale rewrites for units no longer in the snapshot: ${stale.join(', ')}\n` : '') +
        'Regenerate the [[services.production.rewrites]] unit block (ahead of the /knowledge/* and /* rules) from src/data/availabilitySnapshot.json.',
    );
  }
}

for (const [from, to] of Object.entries(LEGACY_REDIRECT_STUBS)) {
  const isExternal = /^https?:\/\//i.test(to);
  // /floor-plans deep links carry ?plan=<id>; a meta refresh cannot forward the
  // query string, so that stub also ships a tiny inline script that preserves
  // search + hash for JS-enabled agents (the meta refresh stays as fallback).
  const preserveQuery = from === '/floor-plans';
  const stub = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Exhibit On Superior</title>
    <meta name="robots" content="noindex" />${
      isExternal ? '' : `\n    <link rel="canonical" href="${canonicalFor(to)}" />`
    }
    <meta http-equiv="refresh" content="0;url=${to}" />${
      preserveQuery
        ? `\n    <script>location.replace(${JSON.stringify(to)} + location.search + location.hash);</script>`
        : ''
    }
  </head>
  <body>
    <p>This page has moved. <a href="${to}">Continue to Exhibit On Superior</a>.</p>
  </body>
</html>
`;
  // Same layout as the public/artist-in-residence stub: the file lives at the
  // legacy path itself, and artifact.toml rewrites route both the bare and
  // trailing-slash forms to it.
  const stubPath = path.join(publicDir, from.replace(/^\//, ''), 'index.html');
  await fs.mkdir(path.dirname(stubPath), { recursive: true });
  await fs.writeFile(stubPath, stub, 'utf8');
}
console.log(`Wrote ${Object.keys(LEGACY_REDIRECT_STUBS).length} legacy redirect stubs.`);

// Sitemap: indexable pages only (noindex pages excluded). Redirect routes such
// as /available-units are absent from PAGE_SEO, so they're excluded by design.
const today = new Date().toISOString().slice(0, 10);
const indexable = seoPaths.filter((p) => !PAGE_SEO[p].noindex);
const urls = indexable
  .map((p) => {
    const priority = p === '/' ? '1.0' : '0.8';
    return `  <url><loc>${canonicalFor(p)}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>${priority}</priority></url>`;
  })
  .concat(
    // Per-unit pages: refreshed on every publish, churn with inventory —
    // daily changefreq, slightly lower priority than the hub pages.
    unitPaths.map(
      (p) =>
        `  <url><loc>${SITE_URL}${p}</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.7</priority></url>`,
    ),
    // Knowledge Center articles: stable evergreen content.
    knowledgePaths.map(
      (p) =>
        `  <url><loc>${SITE_URL}${p}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`,
    ),
  )
  .join('\n');
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
await fs.writeFile(path.join(publicDir, 'sitemap.xml'), sitemap, 'utf8');

console.log(
  `Prerendered ${allPaths.length} routes; sitemap.xml written with ${
    indexable.length + unitPaths.length + knowledgePaths.length
  } indexable URLs.`,
);

// Post-build guard: every knowledge article must ship its answer-first
// structure — question in <title> and H1, self-canonical, the answer text in
// the body, and a FAQPage node whose Question matches. A refactor that ships
// article pages with generic meta or drops the FAQ schema fails the build.
{
  const problems = [];
  for (const meta of KNOWLEDGE_META ?? []) {
    const page = await fs.readFile(outPathFor(meta.path), 'utf8');
    const text = page.replaceAll('<!-- -->', '');
    if (!page.includes(`rel="canonical" href="${SITE_URL}${meta.path}"`)) {
      problems.push(`${meta.path}: missing self-canonical`);
    }
    const esc = (s) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    if (!text.includes(`<title>${esc(meta.title)}</title>`)) {
      problems.push(`${meta.path}: <title> does not match the article question`);
    }
    // Scope the question check to the rendered <body> (the <title>/OG tags
    // would otherwise satisfy it even if the H1 regressed).
    const body = text.slice(text.indexOf('<body'));
    if (!body.includes(esc(meta.question))) {
      problems.push(`${meta.path}: question missing from page body/H1`);
    }
    const nodes = extractJsonLdPayloads(page).flatMap((raw) => {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed['@graph']) ? parsed['@graph'] : [parsed];
    });
    const faq = nodes.find((n) => n['@type'] === 'FAQPage');
    const question = faq?.mainEntity?.[0];
    if (!faq || question?.name !== meta.question || !question?.acceptedAnswer?.text) {
      problems.push(`${meta.path}: FAQPage JSON-LD missing or does not carry the question/answer`);
    }
    const crumbs = nodes.find((n) => n['@type'] === 'BreadcrumbList');
    if (!crumbs || crumbs.itemListElement?.length !== 3) {
      problems.push(`${meta.path}: BreadcrumbList missing or not 3 levels`);
    }
  }
  if (problems.length) {
    throw new Error(
      `Prerender aborted: knowledge article check failed:\n` +
        problems.map((p) => `  ${p}`).join('\n'),
    );
  }
  console.log(`Knowledge articles verified: ${(KNOWLEDGE_META ?? []).length} article(s).`);
}

// Knowledge rewrite parity guard: the article slugs live in code
// (knowledgeArticles.ts) but their clean-URL rewrites are duplicated in
// artifact.toml. A slug added/renamed without its rewrite pair would serve
// catch-all homepage HTML to non-JS crawlers; a stale rewrite would point at
// a deleted page. Both directions fail the build here.
{
  const tomlPath = path.join(root, '.replit-artifact', 'artifact.toml');
  const toml = await fs.readFile(tomlPath, 'utf8');
  const expected = ['/knowledge', ...knowledgePaths];
  const missing = [];
  for (const p of expected) {
    for (const form of [p, `${p}/`]) {
      if (!toml.includes(`from = "${form}"\nto = "${p}/index.html"`)) missing.push(form);
    }
  }
  const expectedSet = new Set(expected);
  const stale = [...toml.matchAll(/from = "(\/knowledge\/[^"*]+?)\/?"/g)]
    .map((m) => m[1])
    .filter((p) => !expectedSet.has(p));
  if (!toml.includes('from = "/knowledge/*"')) missing.push('/knowledge/* (not-found fallback)');
  if (missing.length || stale.length) {
    throw new Error(
      `Prerender aborted: artifact.toml knowledge rewrites out of sync with knowledgeArticles.ts.\n` +
        (missing.length ? `  Missing rewrite(s): ${missing.join(', ')}\n` : '') +
        (stale.length ? `  Stale rewrite(s) for removed slug(s): ${[...new Set(stale)].join(', ')}\n` : '') +
        'Regenerate the knowledge rewrite block (bare + trailing-slash pair per slug, then the /knowledge/* not-found fallback, all ahead of the /* catch-all).',
    );
  }
}

// Unknown-slug fallback: /knowledge/* (after the per-slug rewrites) serves
// this noindex stub instead of homepage HTML, so retired or mistyped article
// URLs are not soft-404 duplicates of the homepage for non-JS crawlers.
// JS-enabled visitors still hydrate into the SPA's NotFound page.
{
  const stubDir = path.join(publicDir, 'knowledge', 'not-found');
  await fs.mkdir(stubDir, { recursive: true });
  const stub = template
    .replace(
      SEO_BLOCK,
      `<!-- seo:start -->\n    <title>Page Not Found | Exhibit On Superior</title>\n    <meta name="robots" content="noindex" />\n    <meta name="description" content="This Knowledge Center page does not exist. Browse all renter questions at ${SITE_URL}/knowledge." />\n    <!-- seo:end -->`,
    );
  await fs.writeFile(path.join(stubDir, 'index.html'), stub, 'utf8');
  console.log('Knowledge not-found stub written (noindex, served via /knowledge/* rewrite).');
}

// llms.txt + llms-full.txt: regenerated every build so they can never drift
// from the deployed page set. llms.txt stays a concise entry point (curated
// primary pages + the Knowledge Center hub); llms-full.txt is the rich
// catalog — every indexable page with title, one-line description, and URL,
// grouped for AI assistants that fetch one file for full site context.
{
  // Deterministic: strip any existing Knowledge Center section, then insert
  // the freshly generated one (self-healing — a stale article count or edited
  // section can never survive a build).
  const llmsPath = path.join(publicDir, 'llms.txt');
  let llms = await fs.readFile(llmsPath, 'utf8');
  llms = llms.replace(/## Knowledge Center\n[\s\S]*?(?=\n## )/, '');
  const knowledgeSection = `## Knowledge Center\n\n- [Knowledge Center](${SITE_URL}/knowledge): ${
    (KNOWLEDGE_META ?? []).length
  } single-question pages answering renter questions with verified facts — pricing, fees, floor plans, amenities, pets, parking, leasing, utilities, and the neighborhood. Full page catalog: ${SITE_URL}/llms-full.txt\n\n`;
  if (!llms.includes('\n## Contact')) {
    throw new Error('Prerender aborted: llms.txt is missing its "## Contact" section anchor.');
  }
  llms = llms.replace('## Contact', `${knowledgeSection}## Contact`);
  await fs.writeFile(llmsPath, llms, 'utf8');

  const lines = [
    '# Exhibit On Superior — Full Page Catalog',
    '',
    '> Every indexable page on rentatexhibit.com with its title and a one-line description.',
    '> Exhibit On Superior: 298-unit luxury apartment tower at 165 W Superior St, Chicago, IL 60654 (River North). Phone 312-450-0635. Email exhibit@highlandptrs.com.',
    '',
    '## Site Pages',
    '',
    ...indexable.map((p) => {
      const seo = PAGE_SEO[p];
      return `- [${seo.title}](${canonicalFor(p)}): ${seo.description}`;
    }),
    '',
    '## Available Units (live inventory, refreshed each publish)',
    '',
    ...unitPaths.map((p) => `- [Apartment ${p.split('/').pop()} at Exhibit On Superior](${SITE_URL}${p}): Current availability, rent, photos, and floor plan details for apartment ${p.split('/').pop()}.`),
    '',
    '## Knowledge Center (answer-first Q&A)',
    '',
    ...(KNOWLEDGE_META ?? []).map(
      (m) => `- [${m.question}](${SITE_URL}${m.path}): ${m.description}`,
    ),
    '',
  ];
  await fs.writeFile(path.join(publicDir, 'llms-full.txt'), lines.join('\n'), 'utf8');
  console.log(
    `llms-full.txt written with ${indexable.length + unitPaths.length + (KNOWLEDGE_META ?? []).length} pages; llms.txt Knowledge Center section ensured.`,
  );
}
