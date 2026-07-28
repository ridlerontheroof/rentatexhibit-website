---
name: Zentro internet content hidden
description: All Zentro/2-Gig internet claims are parked in comments until the bulk-internet install is live; how to restore and the parser gotcha
---

- All Zentro / "up to 2 Gig" claims are hidden site-wide (2026-07) behind `HIDDEN PENDING ZENTRO INSTALL` markers: knowledgeArticles.ts (incl. the whole parked `internet-options` article in a block comment), Fees.tsx, seo.ts FAQ. "Wired for 1GB" statements stayed (pre-existing fact).
- `/knowledge/internet-options` 301s to `/knowledge` via legacyRedirects.ts; its artifact.toml rewrite pair stays as-is (routes to the redirect stub). The prerender knowledge stale-rewrite guard exempts paths present in LEGACY_REDIRECTS.
- **Gotcha:** scripts/lib/knowledge-slugs.mjs regex-parses knowledgeArticles.ts, so articles parked in block comments must be stripped first — it now removes `/* ... */` before parsing. Don't park articles in `//` line comments containing `slug:`.
- Restore steps are listed in the block-comment header above the parked article in knowledgeArticles.ts (uncomment, re-add related links, drop the legacy redirect, restore the other commented sentences).
- The `work-from-home-spaces` article needed a replacement second inbound related link (added to `party-room-reservation`); it can stay after restore.
