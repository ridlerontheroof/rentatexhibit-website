---
name: Static-serve trailing-slash 301s
description: Why production 301s every clean URL to its trailing-slash form despite explicit non-slash rewrites, and how to handle it.
---
The production static host applies a directory-index redirect (`/page` → 301 `/page/`) BEFORE artifact rewrites are consulted, so declaring non-slash rewrite pairs does not prevent the hop. Canonicals stay non-slash and Google consolidates fine.

**Why:** observed on every prerendered route in the July 2026 pre-ads audit; rewrites for both forms existed in artifact config yet 301s persisted (platform edge behavior, not config drift).

**How to apply:** don't burn time re-ordering rewrites to kill these 301s; if a zero-redirect URL is needed (e.g. Google Ads final URLs), use the trailing-slash form directly. Flipping the whole canonical scheme to trailing-slash is high-risk churn — avoid unless mandated.

Related audit facts (same pass): squirrelscan CLI installs via `npm i -g squirrelscan` (binary `squirrel`); platform edge serves HTML uncompressed with `cache-control: private` and no CSP — not configurable from artifact static-serve config; full report in `artifacts/exhibit-on-superior/docs/seo-audit-2026-07-26.md`.
