---
name: Matterport signed asset URLs expire in CDN cache
description: player-models API responses are CDN-cached; the signed `image` URL inside can be already expired (HTTP 410 content.gone). Cache-bust to get a fresh URL.
---

Matterport's `https://my.matterport.com/api/player/models/<id>` endpoint returns an `image` (poster) URL signed with a short-lived token (`t=...-<epoch>-1`). The endpoint itself is CDN-cached (cf-cache HIT with age in the thousands), so a cached response can hand back an image URL whose token expired — fetching it yields HTTP 410 `{"code":"content.gone"}` even though the asset is fine.

**Why:** Diagnosed while adding the live poster-image guard; all tours "failed" with 410 until cache was bypassed.

**How to apply:** When you need fresh signed asset URLs from that API, append a random query param (e.g. `?_ts=...`) to bypass the CDN cache. A 410 on a Matterport CDN asset URL usually means "stale signed URL", not a missing asset.
