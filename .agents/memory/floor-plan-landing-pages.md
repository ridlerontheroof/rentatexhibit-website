---
name: Floor-plan landing pages
description: Conventions for /floor-plans hub + per-plan pages and gotchas met while building them
---

- One page per row in the floor-plan catalog (34 layouts, 27 residence lines); slugs from beds/baths/sqft, with `-floors-<label>` suffix on ALL members of a collision group (3 pairs). Logic + JSON-LD live in the pure module `floorPlanPages.ts` (hook-free, per the pure-data-module convention).
- `/floor-plans` used to be a legacy 301 → /available-units. It is now a real hub page: entry removed from legacyRedirects, from the client `<Redirect>`, and from the production-server legacy-301 test list. Don't re-add it.
- Unknown `/floor-plans/<slug>` mirrors the knowledge pattern: prerendered noindex stub + explicit 404 branch in the production server (`server/index.mjs`), served with status 404.
- Matching-unit Apartment nodes in plan-page JSON-LD must point `accommodationFloorPlan` at the page's own `#floorplan` @id — the default group-node ref dangles and fails the prerender JSON-LD guard.
- artifact.toml gotcha: the "# Per-unit listing pages" region is managed by generate-unit-rewrites.mjs (ends at the `# Unknown /knowledge/<slug>` comment). Hand-added rewrite pairs inside it get flagged/stale-deleted — place new page families outside that region.
- WCAG link-names guard: don't give image-zoom buttons an aria-label that doesn't start with the visible caption text; omit the aria-label when visible text suffices.
- check:perf mobile-homepage LCP/TBT fails spuriously when builds/merges run concurrently; rerun on a quiet workspace before treating as a regression.
