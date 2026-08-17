---
name: Stale-bundle asset retention
description: How the web artifact keeps previous builds' hashed bundles alive across publishes and recovers stale tabs.
---

Publishes replace `dist/public/assets` wholesale, so hashed bundles from the prior build 404 for stale HTML (crawler caches, 5-min HTML cache window, open tabs) — Semrush flagged every page "broken JavaScript" for this in Aug 2026.

**Rule:** the build carries forward the previous few builds' hashed assets from a **gitignored** `asset-retention/` store (manifest of bounded generations + raw file copies), run after write-build-id and BEFORE precompress so retained files get .br/.gz siblings. Identical rebuild file sets dedupe (no generation churn from repeated workspace builds).

**Why gitignored:** committing it would create generated-data drift that blocks task-branch merges (same reasoning as reports/indexnow/); deploys snapshot the workspace filesystem, so gitignored state still ships.

**Client side:** all `React.lazy` loaders wrap in `withStaleChunkRecovery` and boot installs a `vite:preloadError` listener (src/lib/staleChunkRecovery.ts) — one guarded reload per URL per minute, pending-forever promise while reloading so Suspense stays up.

**How to apply:** never remove retain-assets from the build chain or reorder it after precompress; `check:assets` (check-live-assets.mjs) in check:postpublish alarms if any live page references a 404ing /assets/* file, and accepts `--pages-file` for audit-export re-verification.
