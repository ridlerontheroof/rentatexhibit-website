---
name: GTM deferred loading
description: How the site loads Google Tag Manager without hurting mobile scores, and the guardrails around changing it.
---

# GTM deferred loading

- gtm.js (~112KB + ~180ms mobile eval) is NOT loaded eagerly. The inline snippet in the web artifact's `index.html` initializes `dataLayer` immediately (so pre-load pushes queue and deliver), then loads gtm.js on first interaction (pointerdown/touchstart/keydown/scroll), post-`load` idle, or a 5s fallback timer — whichever fires first.
- **Why:** eager GTM was a top mobile-Lighthouse cost (score ~61 live); deferral moved local mobile scores to ~80–93 with GTM still recording (Lighthouse still sees the gtm.js fetch, so bounces are covered by the 5s fallback).
- **How to apply:** don't reintroduce the stock GTM snippet; editing the inline script is CSP-safe because the prod server collects inline-script hashes from the build output at startup.
- Related: mobile ≤800w image rungs have a tighter ~60KB byte cap in optimize-images.mjs (rung *widths* never shrink — sharpness guard).
- check:perf TBT failures while other builds/tests run concurrently are contention noise — re-run solo before believing them.
- Live verification (2026-07-27): container GTM-MDPWH532 is published EMPTY — gtm.js loads and gtm.load fires, but no GA4 tag exists, so no collect hit can ever fire until one is added in the GTM account (account-side, not a site bug). Live mobile Lighthouse on /: 84/98/99, CLS ~0 (recorded in perf/live-2026-07-27.json).

**Update (2026-07-30):** the fallback is now anchored shortly after the `load` event (plus an absolute cap), and trigger events exclude `scroll` (scroll anchoring fires it synthetically when deferred content mounts). The same deferral applies to `initAnalytics()`'s gtag.js injection in analytics.ts — its `gtag()` stub queues events, so deferring the script loses nothing. GTM is no longer an empty container: it chains gtag.js (~250ms mobile main-thread total).
