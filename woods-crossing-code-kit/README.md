# Highland Property Site Kit

Pinned release **kit-v2.0.0** is a property-neutral production starter for a
property website and API. A generated project owns its property configuration,
content, assets, environment settings, and launch decisions; it never floats on
the kit's main branch.

## Start a new property in Replit

The factory repository includes `property-site-replit-starter/`, a code-free custom-template
launcher pinned to this release's exact tag and implementation digest. On first run it requests the
Claude-generated website ZIP and offering memorandum, then hands control to the
`property-site-onboarding` skill for inventory and gated onboarding. The launcher is not an
alternative kit source and carries no property facts, credentials, or pre-linked Account Secrets.

Future upgrades must use a property-specific copy of the skill's
`templates/PROPERTY_UPGRADE_PLAN.md`; never change a generated site's pin automatically.

## Run from a clean checkout

```sh
corepack pnpm install
pnpm validate
pnpm typecheck
pnpm --filter @highland/property-api start
pnpm --filter @highland/property-web dev
```

Run those two commands in separate terminals. Development web requests under
`/api` are proxied to `DEV_API_ORIGIN` (default `http://127.0.0.1:3001`).
IndexNow is disabled when `INDEXNOW_KEY` is absent outside production; production
startup still fails closed until the property's approved key is configured.
Production uses `VITE_API_URL` when the API is on another origin, or relative
requests only when an explicit platform reverse proxy provides `/api`. This kit's
production static server does not proxy `/api`, so separate-artifact deployments
must set `VITE_API_URL`. `pnpm smoke` starts both
processes on isolated ports and verifies the web root, proxied health/config/
content endpoints, and the retained lead route's bot-guard response.
`pnpm smoke:production` builds with an isolated API origin, starts the real
production static server and API, verifies the origin in the built bundle,
asserts static `/api` returns 404 rather than SPA HTML, and probes API endpoints.

## Database and outbound mail

`DATABASE_URL` is a required property secret for prelaunch. Apply
`packages/db/migrations/0001_leads.sql` to the property's PostgreSQL database
before accepting traffic. The runtime uses a real `pg` pool through Drizzle;
an accepted non-bot lead fails explicitly with a 500 if the database is absent
or unavailable. `pnpm test:accepted-lead` uses a pg-compatible in-memory pool to
exercise the real route, persisted row, and asynchronous notification routing.

SMTP uses the dedicated `GMAIL_SMTP_USER` / `GMAIL_APP_PASSWORD`, with
`LEASING_INBOX_EMAIL` and `SEED_ALERT_EMAIL` as approved destinations. Every
watchdog sender builds and sends a MIME message through the common transport.
`pnpm test:alerts` injects a non-network transport and verifies representative
redirect, GTM, rented-unit, showing, bot, and SEO alert recipient/subject pairs.

## Selected-property content and web build

Each property config links `contentManifestPath`. Bootstrap creates a DRAFT,
empty `content-manifest.json`; it is suitable for intake/build validation but
cannot pass prelaunch. Operators must replace it with sourced content, record
provenance and reuse rights, populate home, gallery, floor plans and supported
content systems, then obtain APPROVED review metadata. Placeholder and
unsupported claims are rejected.

`PROPERTY_CONFIG_PATH=/absolute/path/property-config.json pnpm build` generates
the selected-property module, injects selected NAP/brand/analytics/content,
builds client and SSR bundles, prerenders every static and article route, and
writes the 404, robots, sitemap, LLM files, and legacy redirect map. Generated
selected-property files are intentionally excluded from the immutable factory
digest. `check:acceptance` starts the shipped static server and behaviorally
checks the selected route, metadata, structured-data, asset, redirect,
analytics, floor-plan, article, and contact contracts.
Acceptance also starts the real production API runtime with a temporary,
strictly normalized availability fixture and proves `/api/availability`
returns the exact payload consumed by the web contract. The fixture path is
fail-closed and available only when both `KIT_ACCEPTANCE_MODE=1` and
`AVAILABILITY_FIXTURE_PATH` are explicitly set; it bypasses AppFolio, caches,
alerts, IndexNow, and every other live side effect and is never a runtime
fallback.

The API serves `/api/healthz`, `/api/config/public`, and the four content
registries under `/api/content/:system`. These registries are loaded from the
same selected `contentManifestPath` used by web generation; production rejects
missing, mismatched, DRAFT, unreviewed, or rights-unconfirmed content and never
falls back to the generic kit registry. The web surface reads only the public
configuration endpoint. Production API startup requires
`PROPERTY_CONFIG_PATH`; local startup uses the explicitly fictional example
configuration.

For kit-v2 production, G5 is an exact reviewed roster rather than a loose list
derived from `secrets.required`: nine `api-server` rows and three `web` rows
must have their prescribed artifact, production environment, classification,
approval metadata, and terminal state. Account-secret links additionally
require an exact account secret name and verified scope. Production startup
also rejects missing runtime values for this roster.

## Create and validate property configuration

```sh
pnpm bootstrap:config ./property-config.json
pnpm validate:config ./property-config.json
PROPERTY_CONFIG_PATH=./property-config.json pnpm --filter @highland/property-api start
```

Configuration contains public property facts and **environment-variable names
only**, never secret values. The checked-in schema is
`config/property-config.schema.json`. Keep `kitVersion` pinned until an operator
reviews and applies a documented upgrade.

## Empty-but-live content systems

`content/content-systems.json` wires four registries from day one:

- FAQs
- Knowledge center
- Blog
- Neighborhood guides

Empty arrays are valid. This makes routing and validation testable without
inventing property claims. Add entries only after fact and editorial review.

## Validation and release contract

- `pnpm validate:config` checks version pinning, required sections, identifiers,
  origins, attribution format, and secret-name discipline.
- `pnpm validate:guards` checks all four content registries and the machine-readable
  baseline in `standards/baseline-guards.json`.
- `pnpm validate:neutral` checks the runnable release surface for source-property
  literals.
- `pnpm validate` runs all three focused checks.
- `PROPERTY_CONFIG_PATH=/absolute/path/property-config.json pnpm check:prepublish`
  validates the exact property candidate at prelaunch/G5 before all offline
  release guards. The path is mandatory; the fictional fixture is never an
  implicit property-release fallback.
- `pnpm check:kit-release` is the separate pristine-kit self-test using the
  fictional terminal fixture and is what `release:prepare` runs.
- `pnpm prepublish:online` requires `SITE_URL` and runs every live adapter.
- `pnpm check:postpublish` remains separately executable for watcher evidence.

`release.json` and `CHANGELOG.md` identify the semantic release. The retained
AppFolio, lead/tour, SEO/prerender, analytics, CSP, IndexNow, image, and
post-publish modules are included in source validation; the full retained API
source is typechecked and its routes are mounted by the runtime. External calls
remain gated by property configuration and credentials.

## Release-owner process

The implementation digest hashes sorted relative paths and raw bytes from the
candidate tree while excluding `release.json`, vendor/build output, Git
metadata, and generated property onboarding output. This removes digest
circularity without letting a newly bootstrapped property config invalidate the
pinned kit: calculate and record the digest,
then create one candidate commit containing both implementation and metadata.
From that clean candidate commit,
the release owner runs `pnpm release:prepare`; it runs the full prepublish and
build gates, verifies the digest, and confirms the exact candidate `HEAD`, but
deliberately does **not** mutate Git. Only after it passes does the release owner
run `git tag -a kit-v2.0.0 HEAD` in the kit repository and publish that tag,
then record the commit/tag with verification evidence. This workspace task
never creates a release tag.