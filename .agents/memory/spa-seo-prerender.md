---
name: exhibit-on-superior SPA has no per-page HTML for crawlers
description: Why deep-route SEO/social meta silently fails and what fixes it.
---

# SPA serves home meta on every deep route

`exhibit-on-superior` is a client-rendered Vite + wouter SPA using react-helmet-async. Only `index.html` (home) has hardcoded meta. Every other route's **initial HTML** contains the home `<title>`, an empty meta description, and **zero** JSON-LD — the per-page tags in `src/data/seo.ts` are injected only after JS hydration.

**Why it matters:** Googlebot renders JS eventually, but Facebook/LinkedIn/Slack/X link-preview scrapers and most AI/answer-engine crawlers do NOT execute JS. So deep-page link previews fall back to home content and all per-page JSON-LD is invisible to them. The strong SEO data layer (titles, descriptions, canonicals, ApartmentComplex/FAQ/Breadcrumb schema) never reaches non-JS clients.

**How to verify:** `curl` a deep route (e.g. `/amenities`) and check the raw `<title>` and count of `application/ld+json` blocks — you'll get the home title and 0 schema blocks.

**Fix (the highest-leverage SEO item):** add build-time prerendering / SSG so each indexable route in `PAGE_SEO` emits its own fully-formed static HTML (title, description, canonical, OG/Twitter, JSON-LD, visible content). Generate `sitemap.xml` from `PAGE_SEO` in the same step so it can't drift (and exclude external-redirect routes like `/available-units`). Full audit lives in `artifacts/exhibit-on-superior/SEO_PLAN.md`.

## Phase 1 implemented — browserless SSG (Vite SSR build + Node prerender)

Approach (no Playwright/Chromium — must build in Replit's pure-Node deploy pipeline): `vite build` (client) → `vite build --ssr entry-server.tsx` → `node scripts/prerender.mjs` imports the built SSR bundle, renders each `PAGE_SEO` route, injects head + body into `index.html`, writes per-route `dist/public/<route>/index.html` + `sitemap.xml`. Client uses `createRoot().render` (CSR replace, not hydrate) so prerendered HTML is crawler-only — no hydration-mismatch risk.

**Critical gotcha — react-helmet-async does NOT work with React 19 SSR.** Under React 19, `<Helmet>` children leak into the body during `renderToString` and `helmetContext.helmet` comes back EMPTY, so a Helmet-based head-extraction yields a blank `<head>`. **Fix pattern:** define the SEO tags as a plain data *model* once (in `seo.ts`: `buildSeoModel(path, opts)` → `{title, canonical, metas[], jsonLd[]}`), consumed by BOTH (a) the client `<Seo>` via Helmet AND (b) a string serializer `renderHeadTags(model)` used by the prerenderer. Make `<Seo>` return `null` when `typeof window === 'undefined'` so nothing leaks into the SSR body; the head is emitted deterministically from `renderHeadTags`. On the server no component uses Helmet, so `HelmetProvider` isn't needed in `entry-server`.

**Why clean URLs need explicit rewrites on Replit static serve:** with only the catch-all `/* → /index.html`, a crawler hitting `/amenities` gets home meta (extensionless paths are NOT auto-resolved to a directory `index.html`). Add one rewrite per indexable route (and its trailing-slash variant) `from="/x" to="/x/index.html"` in `artifact.toml`, BEFORE the catch-all (which must stay last). Rewrites are ignored when the path matches a real asset, so hashed js/css/images are unaffected.

**Build-time guards to keep it from silently rotting:** prerender.mjs hard-fails if (a) `ROUTE_PATHS` (from `routes.tsx`) ≠ `Object.keys(PAGE_SEO)`, or (b) any generated head lacks `<title>`/`rel="canonical"`. Page-specific extra JSON-LD (e.g. floor-plans ItemList) lives in a shared exported builder used by both the page's `<Seo extraJsonLd>` and an `EXTRA_JSONLD` map in `entry-server`.

**Note:** true production serving of the per-route rewrites is only fully verifiable after deploy; validated here at config + build level only.

## Phase 2 (images) notes
- `pnpm run build` requires `BASE_PATH=/ PORT=<n>` env vars (vite.config.ts hard-fails without them).
- Images: `scripts/optimize-images.mjs` (ImageMagick) generates WebP rungs 800/1280/2000 + `src/data/imageManifest.ts`; `<SmartImg>` consumes it. Re-run the script whenever a new image lands in `public/images`. Original JPEGs are kept so og:image URLs stay valid; prerender.mjs fails the build if manifest variants are missing on disk.
