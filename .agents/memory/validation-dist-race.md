---
name: Validation races the prepublish rebuild
description: Task-completion validation runs the vitest suite concurrently with the prepublish build, which wipes dist/public first — dist-dependent tests must tolerate a mid-rebuild state.
---

Rule: any test that asserts on `dist/public` contents (prerendered pages, `.br`/`.gz` siblings, 404.html) must poll/wait for the build's *last* step output (`index.html.br`, since precompress runs last) instead of asserting a point-in-time snapshot.

**Why:** completion validation executes `pnpm test` and `check:prepublish` in the same run; the rebuild deletes dist/public before rewriting it, so a snapshot check taken mid-rebuild fails spuriously (observed: `.br` sibling "missing" while the build was in flight).

**How to apply:** in dist-dependent vitest suites, gate with `describe.skipIf(!existsSync(dist/public/index.html.br))` at module load (skip, don't fail; never poll in beforeAll — see dist-based-test-guards). The prerender head guards (titles/meta-descriptions) use this pattern. A missing `dist/seo-source-hash.txt` now always skips (never fails): a validation run hit a window where the stamp was gone while an old `index.html.br` still existed, so "stamp missing + build complete = fail" was itself racy. Every current build writes the stamp, so only a *mismatched* stamp is a real staleness failure.

Related trap: the SEO source hash (`scripts/seo-source-hash.mjs`) fingerprints ALL non-test `.ts/.tsx/.json` under `src/data`. Adding any head-irrelevant data/stamp file there marks dist stale, forces the prepublish rebuild mid-validation, and triggers this race — add an explicit exclusion for files that don't affect head markup (like the availability snapshot and og-cards stamp).

- Test-created build outputs must not live under dist/ either: the concurrent prepublish rebuild recreates dist/ and deletes them mid-assertion (font base-path test now builds into node_modules/.cache).
