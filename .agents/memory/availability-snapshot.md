---
name: Baked availability snapshot
description: How available-unit cards paint instantly (build snapshot + head prefetch + server warmer) and the gotchas around it.
---

- Build step fetches the LIVE site's own public `/api/availability` (workspace can't reach AppFolio directly) and writes a committed JSON snapshot; any failure is a warning, never a build failure — the previously committed snapshot keeps working.
- The snapshot is exposed as React Query `placeholderData` with a 48h max-age guard (stale snapshots are ignored → skeleton rows instead), so stale rent never outlives the live refresh; on query error, data is hidden as before.
- An inline `<script>` in the HTML head starts the availability fetch on `/available-units*` pages and stashes the promise on `window`; the hook consumes it once and falls back to a normal fetch if it failed.
- The API server runs a background cache warmer (interval just inside the 5-min TTL, `unref`ed, coalesced with the route's inflight) so a cold cache never hits a first visitor. In the workspace the warmer always fails (AppFolio egress blocked) — expected, verify only in production.
- **Gotchas:** SSR must not render eager plain `<img>` (React 19 auto-preload fails the prerender guard) — gate eager on `!import.meta.env.SSR`. `renderToString` splits adjacent text nodes with `<!-- -->` (e.g. `Apt <!-- -->0208`), so plain greps for concatenated text miss real content. Tests that mock the availability fetch must also mock `getBakedAvailability()` to null or real snapshot units race the mock.
