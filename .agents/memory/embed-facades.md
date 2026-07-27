---
name: Click-to-load embed facades
description: Matterport/Vimeo/YouTube iframes render behind poster-button facades; maps defer on viewport proximity. What downstream checks rely on.
---

Heavy third-party embeds no longer render iframes at prerender/first paint — a shared facade component shows a committed optimized poster with a real button; the iframe mounts on click (with autoplay/play param since the user asked). The Google Maps JS API loads only when the map container scrolls within ~600px (IntersectionObserver; environments without it load immediately, which is what jsdom tests hit).

Rules that keep the guards green:
- The facade button carries `data-embed-url` with the deferred embed URL — the prerender media/JSON-LD mirror tests grep for the URL in the prerendered HTML and pass because of this attribute. Don't remove it.
- Matterport posters were fetched once from the player-models API (cache-busted, see matterport-signed-urls.md) into `images-src/`; Vimeo poster is the committed oEmbed thumbnail. Per-unit YouTube posters can't be committed (feed-driven) — they use `i.ytimg.com` thumbnails, allowed by `img-src https:`.
- Any new dynamic-src SmartImg call site (like the facade poster) must have a literal `sizes` and a data-driven rung check registered in the smartimg-sizes completeness guard, or tests fail.

**Why:** Baseline perf showed /virtual-tour shipping ~2.2MB third-party bytes; facades cut it to ~112KB with all site checks (fold, CSP, link-names, prerender) unchanged.
