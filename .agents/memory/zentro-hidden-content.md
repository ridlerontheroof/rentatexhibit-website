---
name: Zentro internet content hidden
description: All Zentro/2-Gig internet claims are parked in comments until the bulk-internet install is live; how to restore and the parser gotcha
---

- Public-site Zentro / "up to 2 Gig" claims remain hidden behind `HIDDEN PENDING ZENTRO INSTALL` markers until the separate go-live work. Internal generated staff fact sheets use the confirmed program with explicit effective-date wording and suppress inherited "wired for 1GB" lines.
- **Why:** Staff need approved pre-launch pricing and setup details without making the public site imply that service is already active.
- **How to apply:** Keep public pages parked until go-live, but treat the canonical internet-facts module as authoritative for directory and phone-team documents.
- `/knowledge/internet-options` 301s to `/knowledge` via legacyRedirects.ts; its artifact.toml rewrite pair stays as-is (routes to the redirect stub). The prerender knowledge stale-rewrite guard exempts paths present in LEGACY_REDIRECTS.
- **Gotcha:** scripts/lib/knowledge-slugs.mjs regex-parses knowledgeArticles.ts, so articles parked in block comments must be stripped first — it now removes `/* ... */` before parsing. Don't park articles in `//` line comments containing `slug:`.
- Restore steps are listed in the block-comment header above the parked article in knowledgeArticles.ts (uncomment, re-add related links, drop the legacy redirect, restore the other commented sentences).
- The `work-from-home-spaces` article needed a replacement second inbound related link (added to `party-room-reservation`); it can stay after restore.
