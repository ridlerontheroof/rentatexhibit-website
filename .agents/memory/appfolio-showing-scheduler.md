---
name: AppFolio showing scheduler replication
description: How the Exhibit-branded /schedule-showing page books real AppFolio showings via api-server proxies, and the quirks of AppFolio's unofficial listings API.
---

The on-site scheduler replicates AppFolio's hosted "Schedule a Showing" page server-side (api-server `/api/showings/*`), so bookings land in AppFolio's scheduler unchanged.

Key facts about AppFolio's public listings API (unofficial, may change):
- `POST /listings/api/guest_cards` takes **snake_case** JSON (contract changed ~2026-07: camelCase now gets a bare 400 with an empty body — the hosted client snake_cases every request body before sending). It no longer returns an X-JWT header; `POST /listings/api/showings` authorizes via `guest_card_id` alone (keep forwarding a Bearer JWT only if one ever reappears). No CSRF.
- `GET /listings/api/listings/<uid>/availabilities` takes **snake_case** query params (camelCase → 422); slot times are property-local (America/Chicago) wall time `YYYY/MM/DD HH:mm`.
- `POST /listings/api/showings` takes a snake_case body; `end_at = start_at + prospect_scheduled_showing_duration`.
- Identity-verification gate: `GET /listings/api/showings_identity_verifications/status` — if ever `enabled:true`, we cannot proxy Persona checks; routes return 409 `idv_required` + hosted URL.

**Why:** it's an unofficial replication — any AppFolio change must fail loudly, and the page's mandatory fallback (standard lead via POST /leads + hosted showings URL) keeps prospects unblocked.

**How to apply:** never call AppFolio or resolve listable UIDs in the browser; keep every error path returning the hosted URL; watch the showings daily heartbeat for sustained failures.

Note (2026-07-26): AppFolio is **reachable from the workspace** — the old "blocks all workspace egress" finding is stale; slots were fetched live in dev.
