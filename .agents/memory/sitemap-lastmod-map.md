---
name: Sitemap lastmod content-hash map
description: How sitemap <lastmod> dates stay content-derived (not build-dated) across rebuilds
---

Sitemap `<lastmod>` is driven by a committed map `src/data/sitemapLastmod.json` (path → {hash, lastmod}), rewritten by the prerenderer after the markdown twins are generated.

**Rule:** the per-page hash is sha256 over the page's markdown twin (`dist/public/<path>.md`) — twins contain no build-stamped chunk names, so they're deterministic across rebuilds (verified: two full builds produced byte-identical maps). A page's date only moves to today when its twin hash changes.

**Why:** the SEO handoff requires lastmod derived from content changes, not deployment time; a build-dated sitemap made all 99 URLs look freshly changed every publish.

**How to apply:**
- The map must stay committed; deleting it resets every date to the next build day.
- It is excluded from `scripts/seo-source-hash.mjs` (like availabilitySnapshot.json) — hashing a file the build rewrites would make every build self-stale.
- Guard suite: `src/sitemap-lastmod.test.ts` (map↔sitemap↔twin consistency; a hash mismatch there means a stale dist or a timestamp leaking into page content).
- Sitemap generation now lives AFTER the markdown-twin block in `scripts/prerender.mjs`; don't move it back above the twins.
