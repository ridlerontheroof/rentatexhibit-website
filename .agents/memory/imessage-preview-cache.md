---
name: iMessage link-preview caching
description: Why a fixed OG head can still show a broken iMessage card — edit/cache quirks, and how to verify for real.
---

# iMessage link-preview caching

Rule: an iMessage bubble's link preview is generated once by the **sender's device** at send time and is NOT re-fetched when the message is *edited*. A bare "domain + compass" card on an edited or old bubble proves nothing about the live site — resending the same URL as a fresh message renders a fresh card.

**Why:** A shipped OG-head fix looked broken because the reporter had edited an existing bubble; every server-side signal (raw OG head, hydrated head, apex 301, scraper UAs, HEAD requests, og:image 200) was green, and a fresh send rendered correctly.

**How to apply:** When someone reports a broken share preview, verify server-side first with `pnpm --filter @workspace/exhibit-on-superior run check:hydrated-seo` (raw + hydrated head checks; part of check:postpublish). If green, have them send the link as a NEW message, not an edit. Apple's scraper UA is `facebookexternalhit/1.1 Facebot Twitterbot/1.0` and executes no JS, so the raw prerendered head is what iMessage consumes.
