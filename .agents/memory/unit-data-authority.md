---
name: Unit data authority rules
description: Floor-plan database beats AppFolio sqft; amenity feed typos normalized in both server and web layers.
---

**Rule:** When a unit's AppFolio sqft conflicts with the floor-plan database, the floor-plan value renders everywhere (single resolver in the web data layer used by unit card, detail page, meta description, JSON-LD). Known-bad AppFolio records are whitelisted so a consistency test over the baked snapshot fails on any NEW unexplained mismatch.

**Why:** AppFolio records are hand-entered and occasionally wrong (a Jr. Convertible was entered 478 vs the approved 450); two first-party numbers on one page hurt trust and AI extraction.

**How to apply:** Never read `u.sqft` directly for display — go through the sqft resolver. Amenity-feed typos (e.g. "Diswasher") are normalized in the api-server parse step AND re-applied web-side (live fetch + baked snapshot) because prod server deploys lag; committed seed/snapshot files can legitimately still contain the raw typo after a snapshot refresh.
