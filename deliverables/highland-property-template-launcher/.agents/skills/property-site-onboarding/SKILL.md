---
name: property-site-onboarding
description: Onboard a Highland property site from the standard Claude website ZIP and offering memorandum, then guide fact review, discovery, design, scaffold from a pinned production-kit release, environment setup, verification, and go-live. Use for acquisitions, property-site replacement, standards promotion, or an explicit pinned-site upgrade.
---

# Property-site onboarding

Drives a "we bought property X" session end-to-end. The **two standard inputs** are (1) the
Claude-generated website ZIP and (2) the property offering memorandum (OM). A legacy URL and other
owner assets are optional supplements. Only genuine human decisions stop the line.

**Ground rules**
- Follow the formal three-layer contract in `docs/FACTORY_CONTRACT.md`: this skill is the process,
  the released production code kit is the reusable implementation source of truth, and an optional
  Replit custom template is a launcher only. A launcher may select a kit release; it may not become
  a fork or supply reusable production code.
- The baseline standard is the released `standards/standards-manifest.json`. A live property,
  including the flagship, is evidence for a proposed change—not authority. Promote learnings through
  `docs/STANDARDS_GOVERNANCE.md`.
- New sites are generated from a pinned semantic kit release and record it in
  `property-config.json → kitVersion`. Never copy code from another property's live repo.
- **Flag, never infer.** Facts, reuse rights, design direction, deletions, secrets, DNS — all human gates (G1–G8 below). Uncertain facts go into the uncertainty register, never into copy.
- Secret values never enter chat, source, templates, manifests, reports, or evidence. Follow
  `docs/ENVIRONMENT_AND_SECRETS.md`: explicitly approve/link reusable Account Secrets; request
  property-specific secrets securely; keep non-secret settings out of Secrets.

## Artifacts of a session

All phase outputs live in the property project under `onboarding/`:
`property-config.json`, `source-inventory.json`, `candidate-facts`, `discovery/` (inventories, crawl
report, gap report), `parity/`
(parity-map.csv + URL_PARITY_MAP.draft.md), `UNCERTAINTY_REGISTER.md`, `DISCOVERY_REPORT.md`,
`INTAKE_CHECKLIST.md`, and `environment-manifest.json`. Templates and schemas are shipped with this
skill. Preserve the original ZIP and OM as read-only provenance inputs; never overwrite project files
while inspecting the ZIP.

## Human gates (enforced — the workflow stops until resolved)

| Gate | Decision | Blocks |
|---|---|---|
| G1 | Fact verification: every OM/legacy-site fact in the uncertainty register marked CONFIRMED/REJECTED by the owner | build using that fact |
| G2 | Content/image reuse rights confirmed (`brand.reuseRightsConfirmed`) | any legacy photo/copy reuse |
| G3 | Design direction pick (present ≥2 comps; owner picks; record in `brand.designDirection`) | build phase |
| G4 | Parity map review: every row APPROVED (incl. deletions/410s) | redirect module generation |
| G5 | Required Account Secrets explicitly approved/linked, property secrets securely configured, and non-secret settings configured per artifact/environment manifest | prelaunch |
| G6 | DNS / GA4+GTM / Search Console access & setup | go-live |
| G7 | AppFolio: exact property name verified via unit_directory + hidden "Tour" unit created by leasing team | leads/tours going live |
| G8 | Publish approval after prelaunch evidence package reviewed | go-live |

## Phases

Validate the config at every phase boundary:
`node tools/validate-config.mjs onboarding/property-config.json --phase <phase>`

### Phase 1 — Intake
**In (standard):** Claude website ZIP + property OM. **Optional:** Replit launcher/template, legacy
URL, additional photos, logos, fact sheets, and analytics exports. Missing optional inputs do not
change which artifacts are authoritative.
**Do:** inventory the ZIP without executing it. Treat its code as design/content/legacy-parity
evidence only; identify placeholder integrations, credentials, unsupported claims, generated assets,
and reuse-rights questions. Start `property-config.json` (property, identity, optional legacySite).
Extract OM statements into the candidate-fact register and uncertainty register—every statement
starts UNCONFIRMED (G1), and no candidate fact enters `leasing.facts` until confirmed. Route approved
photos into the kit's image pipeline intake folder (originals dir; the kit's
optimize-images script builds rungs; queue alt-text prompts; add entries to the OG-card map).
Produce `INTAKE_CHECKLIST.md` from the template listing everything still owed by the owner.
**Out:** source inventory, candidate-fact register with page/provenance, integration/placeholder gap
report, config valid for `--phase intake`, uncertainty register, and next-step intake checklist.
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
**Do:** obtain the reviewed release from the production code-kit registry and verify its tag/digest;
generate the new project and set `kitVersion` to that exact release. If a Replit custom template was
used, discard/replace any bundled implementation and use it only to launch this step. Apply the
config: identity, NAP/JSON-LD, brand tokens, AppFolio
(database/propertyName/tourUnitName — G7), analytics IDs, email routing, redirects module generated
from the APPROVED parity map. Wire ALL FOUR content systems live with empty property slots (see
`docs/CONTENT_SYSTEM_WIRING.md` — the per-system instantiation contract): interpage linking +
link-name guard, FAQ machinery, Knowledge Center, blog engine.
Only CONFIRMED facts (G1) enter copy; unresolved facts render nothing and stay in the register.

**Environment setup:** create `onboarding/environment-manifest.json` from the supplied example and
validate it with the phase command below (it resolves `environmentManifestPath` relative to
`property-config.json` and applies `schema/environment-manifest.schema.json`):
`node tools/validate-config.mjs onboarding/property-config.json --phase build`.
Every entry identifies artifact,
environment, classification (`account-secret-link`, `property-secret`, or `non-secret`), owner,
approval, and link/configuration status—names and metadata only, never values. Follow
`docs/ENVIRONMENT_AND_SECRETS.md`; G5 is not satisfied by a name merely existing.

*CSP property file — `web/server/csp-property.mjs`:*
Fill all four exports (`GTM_INJECTED_SCRIPT_HASHES`, `EXTRA_SCRIPT_SRC_HOSTS`,
`EXTRA_CONNECT_SRC_HOSTS`, `EXTRA_FRAME_SRC_HOSTS`) before first deploy:
1. Start the server with `CSP_ENFORCE=0` (default — report-only mode).
2. Run `pnpm run check:csp` — it prints the sha256 hash(es) for any GTM Custom HTML tags your container injects at runtime.
3. Paste those hashes into `GTM_INJECTED_SCRIPT_HASHES`; add property-specific third-party origins to the `EXTRA_*` arrays (analytics hosts, embed origins, map SDKs, etc.).
4. Set `CSP_ENFORCE=1` only after `check:csp` passes cleanly.

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
semantic tags. Standards and kit versions move independently but trace one another in reviewed
release metadata. Upgrading a property site requires a reviewed plan generated from
`templates/PROPERTY_UPGRADE_PLAN.md`; it is never automatic. See
`docs/STANDARDS_GOVERNANCE.md`. The manifest version in a gap report records which standard was used.

## Fresh-session bootstrap

1. Read this skill plus `docs/FACTORY_CONTRACT.md`; create a clean property project.
2. Locate the Claude ZIP and OM; inventory both read-only. Label any other input optional.
3. Create `onboarding/`, copy the report templates, and record input hashes/provenance.
4. Stop for unresolved gates; do not ask for or print secret values.
5. Pin and verify a released kit only after intake/design gates permit scaffold. A Replit template
   may open the project but is never an implementation or facts source.

## Tool reference

| Tool | Purpose |
|---|---|
| `tools/validate-config.mjs` | Validate property config (schema + per-phase requireds + secret-value tripwire) |
| `tools/crawl-legacy-site.mjs` | Legacy-site crawler → page/asset inventories with provenance (live/archive/offline) |
| `tools/generate-parity-map.mjs` | Inventory → draft URL-parity/301 map + human review CSV |
| `tools/lint-standards.mjs` | Gap analysis of any site vs the standards manifest |

Supporting docs: `docs/OPERATOR_GUIDE.md` (session flow, kit location, versioning),
`docs/CONTENT_SYSTEM_WIRING.md` (content-system instantiation contract),
`docs/FACTORY_CONTRACT.md`, `docs/STANDARDS_GOVERNANCE.md`,
`docs/ENVIRONMENT_AND_SECRETS.md`,
`templates/` (discovery report, uncertainty register, intake checklist).
