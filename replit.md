# [Project name]

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Pre-publish layout guard: the `fold` validation step (`pnpm --filter @workspace/exhibit-on-superior run check:fold`) runs `scripts/check-units-above-fold.mjs` in headless Chromium and blocks publish if the first unit card falls below the fold or the skeleton geometry drifts. It requires a Chromium binary (CHROME_BIN, PATH, ms-playwright cache, or nix store playwright-browsers) and fails loudly — never silently skips — when none is found.

- Post-publish live-site guard: the `postpublish` workflow runs `scripts/watch-postpublish.mjs`, which polls the production site's `/build-id.json` (stamped by `scripts/write-build-id.mjs` during every build) and automatically runs `check:postpublish` (knowledge pages + rented-unit noindex) as soon as a new publish goes live. On a failure it prints a loud banner and exits non-zero so the workflow shows as failed — restart it after fixing and re-publishing. Manual run: `pnpm --filter @workspace/exhibit-on-superior run check:postpublish` (or `watch:postpublish --once`).

- Knowledge Center review-date freshness: every /knowledge article's "Reviewed by" byline and JSON-LD dateModified come from `KNOWLEDGE_REVIEWED_DATE` in `artifacts/exhibit-on-superior/src/data/knowledge.ts` (per-article `updated` overrides). A suite test fails when any effective review date is older than `KNOWLEDGE_REVIEW_MAX_AGE_DAYS` (120 days), and the production knowledge watchdog (api-server) warn-logs when published pages approach/pass the threshold with no rebuild. To clear it: re-verify the article content with the leasing team, then bump `KNOWLEDGE_REVIEWED_DATE` (bulk) or the article's `updated` field (single) to today's date — full procedure is documented at the constant.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

## GitHub mirror (one-way, for Codex)

- Origin: https://github.com/ridlerontheroof/rentatexhibit-website.git — a read-only mirror so Codex can analyze current code.
- To re-sync after significant work: `bash scripts/sync-github-mirror.sh` (force-pushes local main using the GITHUB_PAT secret; remote-side commits are intentionally discarded).
- Never pull from origin back into the workspace.
