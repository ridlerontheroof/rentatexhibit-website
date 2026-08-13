---
name: SightMap (Engrain) embed integration
description: Durable constraints for the interactive property map on the available-units page.
---

# SightMap embed — durable constraints

- **Lead bypass is solved by embed query param, not dashboard config:** `hide_apply_button=1` removes the in-map Apply CTA. GA4 tripwire events (apply/outbound clicks from inside the map) should never fire; if they do, Engrain-side config changed.
- `disable_structured_data=1` is mandatory — the page renders its own Apartment/Offer JSON-LD; without it Google sees duplicate structured data.
- The Engrain SDK validates postMessage origins itself; the iframe needs `enable_api=1` + an `origin=<page origin>` param and a DOM `id`. Never hand-roll a `message` listener for it.
- **SSR trap:** anything passed as EmbedFacade children is *constructed* on every render (including prerender) even though rendered only post-click — embed-src builders must be `typeof window === 'undefined'`-safe or the prerender crashes.
- CSP needs sightmap.com in BOTH `frame-src` (iframe) and `script-src` (SDK).
- In-map UI panels are removable only via the SDK, not query params: `embed.disableUI(['unitList','unitDetails'])` hides the right-side match list + unit modal; `metrics.unitMap.unit.click` still fires with both disabled, so the site's below-map panel keeps syncing. Call it immediately AND on `ready`.
- Automation caveat: the floor plate has no queryable SVG text/unit nodes — a missed synthetic click produces *no event at all*, which mimics a broken integration; verify coordinates against a full-res screenshot before concluding the API broke.
- **Failure discipline (review-enforced):** third-party embeds that gate a conversion path need a visible failure/retry state (iframe onLoad watchdog) and site-owned fallback CTAs for SDK failure and missing availability — a silent blank panel gets rejected in review.
- Map-first layout constraint: fold guard asserts map above the fold and first unit row within 2.25× viewport; a `max-h` capped by `75vh` is what keeps short laptops within budget.
