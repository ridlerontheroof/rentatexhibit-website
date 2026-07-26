---
name: Adding a static content page
description: Every registration point a new top-level page (like /about) needs, plus JSON-LD validator gotchas.
---

A new top-level content page needs, in lockstep (guards fail the build otherwise):
1. `PAGE_SEO` entry in `src/data/seo.ts` AND a route in `src/routes.tsx` (parity guard).
2. An artifact.toml rewrite pair (bare + trailing slash → `/<path>/index.html`) via `verifyAndReplaceArtifactToml` — without it production serves catch-all homepage HTML to crawlers.
3. Sitemap, prerender, and llms.txt entries come free from PAGE_SEO.

JSON-LD gotchas:
- The recommended-properties test pins warnings to zero. Any *nested* `@type: Organization` node (author, parentOrganization) must carry logo/telephone/email or be referenced by `@id` to the main Organization node instead. Prefer `{ '@id': ...#organization }`.
- A new WebPage subtype (e.g. `AboutPage`) needs its own entry in `RECOMMENDED_PROPERTIES` in `scripts/validate-jsonld.mjs` or the checklist-coverage test fails.
- Building rewrites the `updatedAt` in `src/data/availabilitySnapshot.json`; revert that timestamp-only drift before completing a task.

**Why:** learned building the /about page — the 720-warning build and checklist test failure were both from these.
