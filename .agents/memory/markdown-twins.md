---
name: Markdown page twins (AEO)
description: How per-page .md variants are generated and served, and the converter's constraints.
---

Every prerendered route gets a `.md` twin at `<path>.md` (homepage `/index.md`), written by the prerender step from the page's rendered `<main>` via a purpose-built HTML→Markdown converter (`scripts/html-to-markdown.mjs`).

**Why:** Agent Experience audits require a markdown response variant; page HTML is <15% visible text.

**How to apply:**
- The converter only handles renderToString's well-formed markup — don't feed it arbitrary HTML. It drops scripts/SVGs/images/forms, absolutizes internal links, and needs the "space at element boundaries, verbatim at text boundaries" join rule (React splits text runs mid-sentence with exact whitespace; adjacent spans must NOT fuse).
- Prerender guards fail the build on heading-less/thin twins and delete stale twins for removed routes (rented units).
- The production server serves `.md` as text/markdown (added to COMPRESSIBLE in both server and precompress) and negotiates `Accept: text/markdown` on extensionless page URLs; extensionless responses send `Vary: Accept` (serveFile must APPEND `Accept-Encoding` to Vary, not overwrite).
- llms.txt/llms-full.txt advertise the twins; llms-full lines carry per-page Markdown links.
- Prerender cannot be re-run standalone against an already-prerendered dist (template's root div is gone) — iterate converter changes by feeding built HTML into the module directly, then do one full build.
- Related token trim: the baked availability snapshot JSON must stay in a single manualChunks chunk (`availability-snapshot`) or Rollup inlines a full copy into every lazy chunk that imports it.
