---
name: AppFolio availability integration
description: How live unit availability is fed from AppFolio and why it cannot be verified from the dev workspace
---

- Live units come from the AppFolio Reports API `unit_vacancy.json` (POST, HTTP Basic with APPFOLIO_CLIENT_ID/SECRET secrets), proxied by the api-server `/availability` route with a 5-min cache.
- **The AppFolio database is `highlandrealestatepartners`.appfolio.com** (from the Duda CMS "AppFolio Database" field), NOT `highlandptrs`. Overridable via APPFOLIO_DATABASE env var.
- The Duda `appfolio-listings` collection field list (marketing_title/description, market_rent, rent_or_starting_at, available_date, bedrooms, bathrooms, square_feet, cats/dogs, fees, youtube_video_id, posted_to_website…) is data-only — listing photos are not in the field set.
- **AppFolio's edge blocks this workspace's egress IPs entirely** — every request (any path, any host under appfolio.com, curl or node) gets a 302 to the marketing 404 or a bare 503. A real and a fake database name behave identically, so credential validity CANNOT be tested from dev. Verify only from the published deployment; if that is also blocked, ask AppFolio support to allowlist.
- **Why:** discovered while probing; wasted time is avoidable — don't re-probe from the workspace.
- Report column names are AppFolio-controlled and unobserved so far; the normalizer in api-server matches keys tolerantly. After first successful production fetch, check the real columns and tighten if needed.
- The highlandptrs.com Duda site syncs the same data via Duda "External Collections" polling an endpoint with an auth header — Duda-only plumbing, not reusable.
- Frontend maps AppFolio apartment numbers (FFUU) to floor-plan groups via the last-2-digit unit line (see floor-plan-unit-numbers.md); the Available Residences strip on /floor-plans hides itself on error/empty.
