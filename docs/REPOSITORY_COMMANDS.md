# Repository Commands (verified 2026-07-30, Task 01 baseline audit)

Every command below was verified against the actual `package.json` scripts in this repository (root and `artifacts/exhibit-on-superior`). Statuses: **verified** = script exists exactly as written.

## Root workspace (`/package.json`)

| Purpose | Command | Status |
|---|---|---|
| Install | `pnpm install` | verified (preinstall guard rejects npm/yarn and deletes their lockfiles) |
| Full typecheck | `pnpm run typecheck` | verified (`typecheck:libs` + per-artifact typechecks) |
| Full build | `pnpm run build` | verified (typecheck + `pnpm -r --if-present run build`) |

## Web artifact (`artifacts/exhibit-on-superior`, package `@workspace/exhibit-on-superior`)

Prefix all with `pnpm --filter @workspace/exhibit-on-superior run …`

| Purpose | Script | Status |
|---|---|---|
| Dev server | `dev` | verified |
| Production build (snapshot fetch → client+SSR build → prerender → fact sheet → build-id → precompress) | `build` | verified — **rewrites generated data files** (`src/data/availabilitySnapshot.json`, build-id); do not run during read-only tasks |
| Serve built preview | `serve` | verified (note: vite preview serves wrong HTML per route; use `start` for prod-faithful serving) |
| Production server | `start` (`node server/index.mjs`) | verified |
| Unit/suite tests | `test` (vitest) | verified |
| Above-fold guard | `check:fold` / `check:fold:built` | verified (needs Chromium; fails loudly if none) |
| Accessibility | `check:a11y` / `check:a11y:built` | verified |
| Knowledge pages | `check:knowledge` | verified |
| Rented-unit noindex | `check:rented` | verified |
| Schema validator | `check:schema` | verified |
| Legacy redirects | `check:redirects` | verified |
| Floor-plan pages | `check:floorplans` | verified |
| Post-publish bundle | `check:postpublish` (knowledge+rented+schema+redirects+floorplans) | verified |
| Post-publish watcher | `watch:postpublish` (add `-- --once` for a single pass) | verified — script name is `watch:postpublish`, flag passing needs `--` separator |
| Link names | `check:link-names` | verified |
| Built server tests | `check:server:built` | verified |
| CSP violations | `check:csp` | verified |
| Pre-publish bundle | `check:prepublish` (build + fold:built + link-names + server:built + csp) | verified |
| Performance lab | `check:perf` | verified (long-running; run as workflow) |
| Unit rewrite pairs | `generate:unit-rewrites` / `generate:unit-rewrites:check` | verified |

## Other packages

| Purpose | Command | Status |
|---|---|---|
| API dev server (port 5000) | `pnpm --filter @workspace/api-server run dev` | verified (per replit.md; workflow exists) |
| API codegen from OpenAPI | `pnpm --filter @workspace/api-spec run codegen` | listed in replit.md — after codegen, restore `zod.string().email()` if drifted (see `.agents/memory/orval-zod-codegen.md`) |
| DB schema push (dev only) | `pnpm --filter @workspace/db run push` | listed in replit.md; never against production |

## Required environment variables

- `DATABASE_URL` (Postgres) — per replit.md.
- Secrets present in the environment (names only, values never recorded): `APPFOLIO_CLIENT_ID`, `APPFOLIO_CLIENT_SECRET`, `GMAIL_APP_PASSWORD`, `GOOGLE_MAPS_BROWSER_API_KEY`, `GOOGLE_PLACES_API_KEY`, `SESSION_SECRET`, `GITHUB_PAT`.

## Rules (unchanged from package guidance)

- pnpm only; no npm/yarn lockfiles.
- No DB pushes against production.
- Never bypass Chromium-dependent validation (fold/a11y/perf).
- The `build` script mutates generated data (availability snapshot, build id, perf outputs) — revert that drift before completing any task branch or merges fail.
