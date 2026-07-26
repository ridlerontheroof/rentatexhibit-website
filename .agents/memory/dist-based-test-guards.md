---
name: dist-based test guards must skip on incomplete dist
description: vitest guards that read dist/public must skip (not poll/fail) when the build output is incomplete
---
The dist/ directory is fully gitignored, and the task-validation environment can hold a partial dist (e.g. index.html present but no precompressed .br siblings) plus stale prerendered pages.

**Rule:** any vitest guard that asserts against dist/public must gate itself on a *complete* build marker — the precompress step runs LAST, so `dist/public/index.html.br` marks a finished build — and `describe.skipIf` when it's absent. Never poll for build output inside `beforeAll`: a poll window longer than the hook timeout fails the whole suite.

**Why:** a merged guard once polled 120s for index.html.br under a 30s beforeAll timeout; in the validation env (.br absent) the hook timed out and blocked completion of unrelated tasks.

**How to apply:** when adding/reviewing dist-reading tests, check the skip condition covers partial dist; expect prerender-content guards to fail against stale local dist until a rebuild.
