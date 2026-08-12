# SightMap (Engrain) integration — /available-units

Added 2026-08-11 (task: restore SightMap on Available Units, map-first layout
approved via canvas mockup).

## What's on the page

- `src/components/floor-plans/SightMapSection.tsx` — "Explore the Building"
  section at the top of `/available-units` (map-first, above the unit list).
  Click-to-load facade (local poster, `data-embed-url`); the Engrain iframe +
  IFrame API SDK load only on click.
- `src/lib/sightmap.ts` — embed URL builder, SDK loader, Metrics API event
  helpers. Embed ID: `r5v516ejwny` ("Exhibit on Superior - SightMap").

## Lead-flow protection (no bypass of the site's funnels)

- The embed URL sets `hide_apply_button=1`, so the map's own unit modal shows
  **no Apply CTA** — verified live. Applications and tours run exclusively
  through the Exhibit CTA bar under the map, which uses the same routes as the
  unit list rows: `/available-units/<unit>`, `/schedule-showing?unit=<unit>`
  (fallback `/schedule-a-tour?unit=<unit>`), `/start-application?unit=<unit>`.
- GA4 events `sightmap_apply_click` / `sightmap_outbound_click` are wired as
  tripwires: they should never fire; if they appear in GA4, the map is
  exposing a CTA again (e.g. an Engrain-side config change).

## Open requests for Engrain / leasing (email support@engrain.com or the
   SightMap Integration Specialist; leasing owns the account)

1. **Confirm** no other in-map outbound CTAs (tour booking, "contact us"
   links) are configured for this SightMap besides the hidden Apply button.
   If any exist, point them at `https://www.rentatexhibit.com` routes above or
   disable them.
2. **Nice-to-have:** ask whether the in-map "Search apts" box can be moved
   below the filter dropdowns on desktop (user request; presumed
   non-configurable).

**Status:** request emailed 2026-08-11 from leasingexhibit@highlandptrs.com to
support@engrain.com (cc + reply-to exhibit@highlandptrs.com), covering both
items above. **Awaiting Engrain's reply — record their answer here when it
arrives.**

## GA4 events (via the deferred analytics module, `trackSightMap`)

`sightmap_impression`, `sightmap_unit_selected` (params: unit_number, matched,
floor_plan), `sightmap_filter_change` (filters summary),
`sightmap_apply_click`, `sightmap_outbound_click`.

**GA4 routing:** production uses the GTM container (GTM-MDPWH532) which owns
the GA4 Google tag (stream `G-1S66YHBN91`). `VITE_GA_MEASUREMENT_ID` is
**not** set. Two facts verified against the live site on 2026-08-12:

1. GTM does **not** install `window.gtag`, and gtag() commands queued into
   the dataLayer (via the index.html stub) are **not** processed by GTM —
   not even `config`. Relying on the stub alone silently dropped every
   custom event.
2. With gtag.js loaded + configured on a GTM page, `gtag('event', …)` only
   routes to GA4 with an explicit `send_to`.

So `analytics.ts` loads gtag.js itself (deferred), configures
`G-1S66YHBN91` with `send_page_view: false` (GTM's Google tag owns the
initial page_view — no duplicates, verified), tags every event with
`send_to`, and skips the initial page_view while still reporting SPA
navigations (which GTM was never catching).

**DebugView verification:** open the live site with `?gtm_debug=x` or GA4
DebugView (activate debug mode for your browser via the GA Debugger Chrome
extension or by appending `&gtm_debug=x`). Click a unit and change a filter
and confirm `sightmap_unit_selected` and `sightmap_filter_change` appear in
DebugView / the GTM preview pane.

## Post-publish verification (first publish with the map)

On the live site (www.rentatexhibit.com/available-units):
1. Open the map and click a unit — confirm the Metrics API works with the
   **production origin** (the embed's `origin` param is built at runtime, so
   dev worked ≠ prod works if Engrain restricts origins) and the CTA bar
   updates.
2. Open a unit's modal inside the map — confirm the in-map Apply button is
   still hidden (`hide_apply_button=1` remains effective).
3. GA4 DebugView: see the follow-up task about confirming map clicks in GA.

## Failure behavior (by design)

- Iframe doesn't load within 15s → visible message with Try Again + "View
  available residences"; never a blank panel.
- SDK fails → map still works; CTA bar stays pinned to the first available
  unit with a note that in-map selection won't sync.
- Availability feed missing → generic fallback CTA row (residence list /
  tour / apply). Covered by `SightMapSection.test.tsx`.

## Guards touched

- `scripts/check-units-above-fold.mjs` now asserts the SightMap section is
  above the fold and the first unit row is within 2.25x viewport height.
- CSP (`server/index.mjs`): `https://sightmap.com` added to `frame-src` and
  `script-src`.
