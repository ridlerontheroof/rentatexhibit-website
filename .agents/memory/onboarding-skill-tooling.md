---
name: Property-site onboarding skill & tooling
description: Where the turnkey acquisition-onboarding skill lives and its discovery patterns (Cloudflare/archive mode).
---

The reusable acquisition workflow lives in `.agents/skills/property-site-onboarding/` (schema,
crawler, parity generator, standards linter, phase contracts with gates G1–G8). Evidence packages
go to `reports/onboarding/`.

**Bot-walled legacy sites:** siennachicago.com serves a Cloudflare managed challenge (403 +
`cf-mitigated: challenge`) on every path from this workspace; headless Chromium doesn't pass it
either. **How to apply:** use the crawler's `--mode archive` (Wayback CDX enumerate → `id_`
snapshot fetch) plus the linter's `--offline-inventory` mode; document mixed-era snapshots and
queue owner-side access (CDN allowlist / platform export) on the intake checklist. Archive
snapshots can span multiple platform generations — parity-map the union.

The standards manifest is versioned and re-cut from Exhibit's shipped guard suite; kit sites pin
`kitVersion` and never float. The de-Exhibit move-behind-config list is in
`reports/onboarding/de-exhibit-audit.md`.

Factory release acceptance must exercise the selected property's real runtime paths, not merely
retain source files, scan for markers, or validate a pre-approved kit fixture.

**Why:** A starter can compile and appear green while accepted leads, alert delivery, production
routing, or secret-link gates fail only after launch.

**How to apply:** Keep kit self-tests separate from property prepublish gates; require the selected
property config in production; fail fast on required services; and test actual persistence, mail
transport, production serving, redirects, and finite online checks through their shipped paths.
