# Operator guide — how a future acquisition session flows

## Fresh session: the 10-minute version

1. Create a **new, empty property project**. Never start from or copy a live property repository.
2. Make this workspace skill available and upload the **two standard inputs**:
   - Claude-generated website ZIP
   - property offering memorandum (OM)
3. Start: “Onboard `<Property>` from `<ZIP path>` and `<OM path>`. Inventory only; do not publish.”
4. The agent reads the factory contract, inventories both inputs without executing or trusting the
   ZIP, creates `onboarding/`, and records provenance, candidate facts, placeholders/integration
   gaps, uncertainties, and next steps.
5. Continue through intake → discovery → design/IA → scaffold from a verified pinned kit release →
   prelaunch → go-live. The agent stops at gates G1–G8. `onboarding/` is the audit trail.

A legacy URL, extra owner assets, or a Replit custom template may be supplied, but they are optional.
The custom template is only a launcher. It is never the source of reusable code, standards, property
facts, or release history.

The factory repository's `property-site-replit-starter/` is the pin-ready custom-template payload.
Before pinning or repinning it in Replit, run `npm test` in that directory. Its release lock must
match the reviewed kit tag and digest; its Agent instructions request the ZIP and OM and then hand
control to this skill.

## Source and release rules

- The versioned **production code kit registry/repository** is the sole reusable implementation
  source of truth. Releases use immutable semantic tags (`kit-vMAJOR.MINOR.PATCH`) and a digest.
- This workspace skill owns process and schemas. `standards/standards-manifest.json` owns the
  normative capability baseline.
- An optional Replit custom template can create/open a project and invoke onboarding. It must fetch
  or select a reviewed kit release; bundled template code must not be treated as authoritative.
- Each property records its exact kit release and stays pinned. Never edit a released tag in place,
  copy from a live site, or automatically upgrade a property.
- Full ownership and acceptance rules are in `FACTORY_CONTRACT.md`.

## Promote a learning or upgrade a site

- A live-site improvement is evidence, not automatically a standard. Open a change manifest from
  `templates/STANDARDS_CHANGE_MANIFEST.json`; document evidence, scope, migration, checks, semantic
  bump, and owner/security/technical approvals.
- After approval, change the manifest and kit, run the kit guard suite, issue immutable releases, and
  record their linkage. Never claim promotion before all required reviews are APPROVED.
- For each pinned property that may adopt it, create a separate
  `templates/PROPERTY_UPGRADE_PLAN.md`, assess property conflicts and rollback, obtain owner/publish
  approval, then apply and verify. Deferral is valid and does not alter the site's pin.
- See `STANDARDS_GOVERNANCE.md` for the complete state machine and semantic rules.

## Known traps (read before your first session)

- **Bot-walled legacy sites** (Cloudflare managed challenge): the crawler's `--mode archive` uses
  the Wayback Machine; inventories carry `wayback:` provenance and may lag reality. Ask the owner
  for a CDN allowlist or platform export via the intake checklist; re-crawl live if granted.
- **Squarespace DNS:** forwarding rules silently fail to save while Domain Connect presets hold the
  apex records — delete presets first. Registrar forwarding strips query strings: ad final URLs
  must be `https://www.` directly.
- **AppFolio host:** the database host is the management company's, not the property brand's. A
  wrong host looks like an egress block (302/503). Verify the exact property name via the
  unit_directory report before wiring filters.
- **Deploy runtime:** no Chromium, first ~25s of stdout dropped — live checks are HTTP-based; the
  post-publish watcher runs in the workspace, not the deployment.
- **Email routing:** technical alerts and leads never share an inbox (owner-mandated).

## Secrets model

Create `onboarding/environment-manifest.json` by artifact and environment. It contains names and
status metadata only:

- `account-secret-link`: an existing Replit Account Secret that an operator explicitly approves and
  links to this app/environment. Existence is not consent; never assume its scope fits a property.
- `property-secret`: a new property-scoped credential requested through the secure Secrets flow.
- `non-secret`: ordinary configuration set as environment settings, never stored as a Secret.

Check existence/link status only; never read, print, paste, or record secret values. Development and
production are separate approvals. Gate G5 closes only when every required manifest row is linked or
configured in its declared artifact/environment and an operator records reviewer/date. Follow
`ENVIRONMENT_AND_SECRETS.md`; validate structure with `schema/environment-manifest.schema.json`.
