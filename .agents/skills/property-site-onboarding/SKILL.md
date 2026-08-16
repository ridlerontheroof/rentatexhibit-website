---
name: property-site-onboarding
description: Turnkey onboarding of a newly acquired Highland property's website — legacy-site discovery, gap analysis vs the flagship-derived baseline standard, owner-asset intake, scaffold from the pinned template kit, prelaunch checks, and go-live. Use when Highland acquires a property, when asked to migrate/replace a legacy property site, or to run discovery/parity/gap analysis on a property website.
---

# Property-site onboarding

Drives a "we bought property X" session end-to-end. Everything property-specific lives in ONE
property config; the template kit carries all machinery. Only genuine human decisions stop the line.

**Ground rules**
- The baseline standard is the current release of the standards manifest (`standards/standards-manifest.json`, shipped with this skill and re-cut from the flagship property site whenever it improves). When manifest and flagship disagree, shipped flagship behavior wins.
- The template kit lives in the dedicated template project (pinned releases, e.g. `kit-v1.0.0`). New sites are generated from a pinned release and record it in `property-config.json → kitVersion`. Never copy code from another property's live repo.
- **Flag, never infer.** Facts, reuse rights, design direction, deletions, secrets, DNS — all human gates (G1–G8 below). Uncertain facts go into the uncertainty register, never into copy.
- Secrets: env-var NAMES in the config only. Values are set by the operator in Replit Secrets.

## Artifacts of a session

All phase outputs live in the property project under `onboarding/`:
`property-config.json`, `discovery/` (inventories, crawl report, gap report), `parity/`
(parity-map.csv + URL_PARITY_MAP.draft.md), `UNCERTAINTY_REGISTER.md`, `DISCOVERY_REPORT.md`,
`INTAKE_CHECKLIST.md`. Templates for each are in `templates/`.

## Human gates (enforced — the workflow stops until resolved)

| Gate | Decision | Blocks |
|---|---|---|
| G1 | Fact verification: every OM/legacy-site fact in the uncertainty register marked CONFIRMED/REJECTED by the owner | build using that fact |
| G2 | Content/image reuse rights confirmed (`brand.reuseRightsConfirmed`) | any legacy photo/copy reuse |
| G3 | Design direction pick (present ≥2 comps; owner picks; record in `brand.designDirection`) | build phase |
| G4 | Parity map review: every row APPROVED (incl. deletions/410s) | redirect module generation |
| G5 | Secrets set by operator (names from `secrets.required`) | prelaunch |
| G6 | DNS / GA4+GTM / Search Console access & setup | go-live |
| G7 | AppFolio: exact property name verified via unit_directory + hidden "Tour" unit created by leasing team | leads/tours going live |
| G8 | Publish approval after prelaunch evidence package reviewed | go-live |

## Phases

Validate the config at every phase boundary:
`node tools/validate-config.mjs onboarding/property-config.json --phase <phase>`

### Phase 1 — Intake
**In:** acquisition announcement; owner uploads (offering memorandum, high-res photos, logos/brand
assets, fact sheets); legacy URL(s).
**Do:** start `property-config.json` (property, identity, legacySite). Extract candidate facts from
the OM into `leasing.facts` AND the uncertainty register — every extracted fact starts UNCONFIRMED
(G1). Route photos into the kit's image pipeline intake folder (originals dir; the kit's
optimize-images script builds rungs; queue alt-text prompts; add entries to the OG-card map).
Produce `INTAKE_CHECKLIST.md` from the template listing everything still owed by the owner.
**Out:** config valid for `--phase intake`; uncertainty register started; intake checklist.
**Gate:** none (G1/G2 opened here, resolved later).

### Phase 2 — Legacy-site discovery
**In:** config with `legacySite`.
**Do:**
```
node tools/crawl-legacy-site.mjs --url <legacy start URL> --out onboarding/discovery [--mode live|archive|offline]
node tools/generate-parity-map.mjs --inventory onboarding/discovery/page-inventory.csv --canonical-origin <identity.canonicalOrigin> --out onboarding/parity
node tools/lint-standards.mjs --base <legacy origin> --out onboarding/discovery/gap-report.md [--offline-inventory ...]
```
Bot-walled site (Cloudflare challenge etc.)? Use `--mode archive` (Wayback CDX) and
`--offline-inventory`; note the limitation in the discovery report and request owner-side access
(CDN allowlist or platform export) via the intake checklist.
Fill `DISCOVERY_REPORT.md` from the template: what the old site has, what ranks, what's broken,
gap analysis vs the manifest, asset provenance.
**Out:** inventories + crawl report + draft parity map + gap report + discovery report.
**Gate:** G4 — a human reviews `parity-map.csv`, flips every row to APPROVED (editing
classifications/targets), especially DROP rows.

### Phase 3 — Design & IA
**In:** brand assets, discovery report.
**Do:** propose IA from the approved parity map (§A pages + kit-standard pages: floor-plans hub,
knowledge, blog, reviews, legal set). Produce ≥2 design comps from brand tokens; owner picks (G3).
Record `brand` in config.
**Out:** config valid for `--phase design`; approved IA page list.
**Gate:** G3; G2 before reusing any legacy imagery in comps.

### Phase 4 — Scaffold & build (from the kit)
**In:** pinned kit release, config valid for `--phase build`.
**Do:** generate the new project from the kit release; set `kitVersion`. Apply the config: identity,
NAP/JSON-LD, brand tokens, AppFolio (database/propertyName/tourUnitName — G7), analytics IDs, email
routing, redirects module generated from the APPROVED parity map. Wire ALL FOUR content systems live
with empty property slots (see `docs/CONTENT_SYSTEM_WIRING.md` — the per-system instantiation
contract): interpage linking + link-name guard, FAQ machinery, Knowledge Center, blog engine.
Only CONFIRMED facts (G1) enter copy; unresolved facts render nothing and stay in the register.
**Out:** building site with the kit's full guard suite green locally (`check:prepublish` equivalent).
**Gate:** G1 for every fact used; G7 for AppFolio wiring.

### Phase 5 — Prelaunch verification
**In:** built site, secrets set (G5).
**Do:** run the kit's prepublish chain (build + guards: hydrated-seo, schema, a11y, fold, link-names,
csp, server, perf) and `node tools/lint-standards.mjs --base <preview origin>` — target zero FAIL.
Verify AppFolio live paths against the real database (availability feed, guest card to a test
prospect, showing slots), lead emails to the right inboxes, analytics events reaching /g/collect.
Assemble the evidence package (gap report, guard outputs, parity verification) for G8.
**Out:** evidence package; all guards green.
**Gate:** G5 before; G8 after.

### Phase 6 — Go-live
**In:** G8 approval, DNS/GA/GSC access (G6).
**Do:** publish on Replit (autoscale, the kit's production Express server, `/healthz`). Secrets
checklist re-check in production. Custom domain: canonical host = www; apex→www 301 at the
registrar — Squarespace trap: delete Domain Connect presets first or forwarding silently fails to
save; registrar forwarding strips query strings, so all ad final URLs must use `https://www.`
directly. Verify every domain variant reaches canonical in ONE 301 hop via `curl -sI`.
Then: start the post-publish watcher workflow (build-stamp detection → live checks), confirm
IndexNow submission, re-run `lint-standards.mjs --base <live origin>` (zero FAIL), verify legacy
parity live (sample §A 200s, §B single-hop 301s, unknown path = noindex 404), send a test lead and
a test tour booking end-to-end, confirm alert-vs-leasing email routing.
**Out:** live site; live gap report; go-live evidence appended to the package; GSC/GA4 verified.

## Kit-version pinning

Each generated site records `kitVersion` and never floats. Kit improvements are released as new
tags with re-cut manifest versions; upgrading a property site is an explicit task: diff kit
releases, apply, re-run the guard suite. The manifest's `manifestVersion` in a gap report records
which standard the site was measured against.

## Tool reference

| Tool | Purpose |
|---|---|
| `tools/validate-config.mjs` | Validate property config (schema + per-phase requireds + secret-value tripwire) |
| `tools/crawl-legacy-site.mjs` | Legacy-site crawler → page/asset inventories with provenance (live/archive/offline) |
| `tools/generate-parity-map.mjs` | Inventory → draft URL-parity/301 map + human review CSV |
| `tools/lint-standards.mjs` | Gap analysis of any site vs the standards manifest |

Supporting docs: `docs/OPERATOR_GUIDE.md` (session flow, kit location, versioning),
`docs/CONTENT_SYSTEM_WIRING.md` (content-system instantiation contract),
`templates/` (discovery report, uncertainty register, intake checklist).
