---
name: Validation races the prepublish rebuild
description: Task-completion validation runs the vitest suite concurrently with the prepublish build, which wipes dist/public first — dist-dependent tests must tolerate a mid-rebuild state.
---

Rule: any test that asserts on `dist/public` contents (prerendered pages, `.br`/`.gz` siblings, 404.html) must poll/wait for the build's *last* step output (`index.html.br`, since precompress runs last) instead of asserting a point-in-time snapshot.

**Why:** completion validation executes `pnpm test` and `check:prepublish` in the same run; the rebuild deletes dist/public before rewriting it, so a snapshot check taken mid-rebuild fails spuriously (observed: `.br` sibling "missing" while the build was in flight).

**How to apply:** in dist-dependent vitest suites, wait up to ~2 min for `dist/public/index.html.br` in `beforeAll` (non-fatal) and in any test that hard-asserts precompression; keep the hard assert so a genuinely dropped precompress step still fails.

Also applies to `dist/seo-source-hash.txt`: the titles/meta-descriptions stale-source guard must skip (not fail) when both the hash stamp and `index.html.br` are missing (rebuild in flight); a missing stamp beside a completed build is still a real failure.
