---
name: GA4 event routing under GTM
description: Why custom gtag events silently vanish on a GTM-managed page and the verified fix (self-loaded gtag.js + send_to; stream owns page_views)
---

Verified live against production (2026-08-12; re-verified post-publish 2026-08-13 — all custom events, no doubled page_views) with headless-chromium tests capturing `/g/collect`:

- **GTM never installs `window.gtag`** and never processes gtag() commands queued into the dataLayer via a page stub — not even `gtag('config', …)`. A stub-only setup silently drops every custom event while GTM's own events (page_view, form_start, user_engagement) still flow, which makes the breakage easy to miss.
- **Fix:** the page must load real `gtag.js` itself and call `gtag('config', <GA4 id>, { send_page_view: false })`. The GA4 stream ID owned by the GTM container is public — extract it from `https://www.googletagmanager.com/gtm.js?id=GTM-…` (grep `G-[A-Z0-9]+`).
- **Every event needs an explicit `send_to`** when GTM is also on the page; default fan-out drops the event even after config.
- **page_views are stream-owned in GTM mode:** GTM's Google tag sends the initial one, and enhanced measurement history tracking (`_ee=1` hits) covers SPA navigations once gtag.js is present. Sending manual page_views doubles every SPA navigation — suppress them entirely in GTM mode (but keep updating SPA path history for lead attribution).

**How to verify:** drive nix-store chromium via the playwright skill against the live/dev site, parse `en=` from `/g/collect` request bodies (batched events are newline-separated in POST bodies). Contact-form `generate_lead` can be tested without creating a real lead by route-mocking `**/api/leads` with a 201. The playwright skill's downloaded chromium lacks system libs — pass `executablePath` pointing at the nix-store playwright-browsers chromium. SightMap units render in canvas (no DOM labels): select a floor via its "1 APT" button text, then click the highlighted unit's screen coordinates (take a screenshot first).

Implementation lives in the web artifact's analytics lib + index.html GTM loader comment; tests lock the contract (send_to on all events, no page_view in GTM mode).
