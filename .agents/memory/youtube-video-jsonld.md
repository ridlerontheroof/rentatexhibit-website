---
name: YouTube VideoObject metadata sourcing
description: How unit-tour VideoObject JSON-LD gets truthful uploadDate/thumbnail for YouTube videos
---

Google VideoObject rich results require a truthful `uploadDate`/`thumbnailUrl`; AppFolio only stores a bare YouTube link, and YouTube's oEmbed does NOT return uploadDate.

**How:** fetch the public watch page and parse the embedded player-response JSON fields (`"uploadDate"`, `"lengthSeconds"`, `"title"`); thumbnails at `i.ytimg.com/vi/<id>/maxresdefault.jpg` (HEAD-check, fall back to `hqdefault.jpg`). Cached into a committed JSON (mirrors the Vimeo oEmbed cache pattern) so builds are deterministic; refresh script lives in the web artifact's scripts/. YouTube IS reachable from the workspace (unlike AppFolio).

**How to apply:** when a new tour video shows up in the availability snapshot, rerun the fetch script — a vitest guard fails when the snapshot references a video id missing from the cache; pages with uncached videos just omit the node (never a build break).
