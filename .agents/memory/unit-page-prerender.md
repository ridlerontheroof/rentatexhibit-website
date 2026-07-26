---
name: Per-unit prerendered pages
description: How dynamic /available-units/<unit> pages are prerendered outside the PAGE_SEO parity system.
---

Per-unit pages (`/available-units/<unit>`) are prerendered from the baked availability snapshot but deliberately live OUTSIDE `PAGE_SEO`/`ROUTE_PATHS` (the parity guard only covers static routes; the unit set changes every publish).

**Why:** adding dynamic paths to PAGE_SEO would either break the parity guard or force per-publish edits; instead entry-server exports `UNIT_PATHS` and a render() branch that wraps UnitDetail in a wouter `<Route>` (plain ssrPath rendering never populates `useParams`).

**How to apply:**
- Head model comes from one shared builder (`data/unitPageSeo.ts`) used by both the client `<Seo model>` and the prerenderer — never let them drift.
- Unit-page JSON-LD re-emits the full WebSite/Organization/ApartmentComplex nodes (exported from seo.ts) so each page's graph is self-contained and merged-by-@id recommended-prop checks pass.
- All unit photos are external AppFolio URLs: every collage `<img>` must be `loading="lazy"` or React 19 SSR auto-emits a fixed-href image preload that fails the prerender guard.
- Clean URLs rely on static-host directory resolution (bare path 301s to trailing slash); no artifact.toml rewrites per unit — verify in production after publish.
- Route-chunk preload (routes.tsx) has a regex branch for unit paths keyed on `UNIT_DETAIL_ROUTE` — required to avoid the prerender-collapses-to-Suspense CLS trap.
