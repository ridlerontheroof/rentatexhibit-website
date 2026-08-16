# Operator guide — how a future acquisition session flows

## The 10-minute version

1. Create a NEW Replit project for the property (never build inside another property's project).
2. Promote/confirm this skill at the workspace level (Workspace Settings → Customization → Skills)
   so the new project inherits it. Open a session: "We bought <Property X>; legacy site is <URL>.
   Run property-site onboarding."
3. The skill walks phases 1–6 (intake → discovery → design/IA → scaffold from kit → prelaunch →
   go-live). You only get stopped at the human gates (G1–G8): confirming facts, picking a design,
   approving the parity map, setting secrets, DNS/GA/GSC, AppFolio property + Tour unit, publish
   approval.
4. Evidence packages accumulate in `onboarding/` — that's the audit trail.

## Where the template kit lives

- Dedicated template project (operator-created): **Highland property-site template kit** — upload
  the kit contents (produced from the flagship property's export kit) plus
  `schema/property-config.schema.json`. Tag releases (`kit-v1.0.0`, `kit-v1.1.0`, …); never edit a
  tagged release in place.
- Each property site records the release it was generated from in `property-config.json →
  kitVersion` and stays pinned. Upgrades are explicit tasks (diff releases → apply → guard suite
  green), never automatic.

## How the standard stays current

- The flagship production property site IS the standard. When it ships an improvement worth
  propagating, re-cut: (1) export kit refreshed from the flagship, (2) new kit release tag,
  (3) `standards-manifest.json` bumped (`manifestVersion`) with any new checks.
- Gap reports embed the manifest version they measured against, so old evidence stays interpretable.

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

`property-config.json → secrets.required` lists env-var NAMES (typical set: APPFOLIO_CLIENT_ID,
APPFOLIO_CLIENT_SECRET, GMAIL_APP_PASSWORD, SESSION_SECRET, GA4_PROPERTY_ID,
GA4_SERVICE_ACCOUNT_JSON, GOOGLE_MAPS_BROWSER_API_KEY). The config validator hard-fails if anything
value-shaped appears in the config. Values go into Replit Secrets (dev) and the deployment's
secrets (prod) by the operator at gate G5.
