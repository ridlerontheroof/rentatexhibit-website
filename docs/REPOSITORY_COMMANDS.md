# Repository Commands

These commands were identified from the existing repository guidance. Codex must verify them against the current package files before relying on them.

| Purpose | Command | Status |
|---|---|---|
| Install | `pnpm install` | Verify in workspace |
| API development server | `pnpm --filter @workspace/api-server run dev` | Existing guidance |
| Full typecheck | `pnpm run typecheck` | Existing root script |
| Full build | `pnpm run build` | Existing root script |
| API code generation | `pnpm --filter @workspace/api-spec run codegen` | Existing guidance |
| Development DB schema push | `pnpm --filter @workspace/db run push` | Dev only |
| Above-fold validation | `pnpm --filter @workspace/exhibit-on-superior run check:fold` | Existing safeguard |
| Post-publish validation | `pnpm --filter @workspace/exhibit-on-superior run check:postpublish` | Existing safeguard |
| Post-publish watch, one pass | `pnpm --filter @workspace/exhibit-on-superior run watch:postpublish --once` | Verify script syntax |

## Required Environment Variables

- `DATABASE_URL`

Record any further variable names found during the baseline audit. Never record secret values.

## Rules

- Use pnpm only.
- Do not add npm or Yarn lockfiles.
- Do not run DB schema pushes against production.
- Do not bypass Chromium-dependent validation.
- Verify package names and scripts before execution.
