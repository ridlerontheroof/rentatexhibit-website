---
name: orval → api-zod codegen quirk (Zod v3 vs v4 email)
description: Regenerating the api-zod schema from openapi.yaml drifts the email field to Zod v4 syntax that won't compile against the installed Zod v3.
---

# Orval api-zod codegen: email format drift

Source of truth for the generated zod schema is `lib/api-spec/openapi.yaml`.
Regenerate with `pnpm --filter @workspace/api-spec run codegen` (runs orval +
`typecheck:libs`). Outputs land in `lib/api-zod/src/generated/` and
`lib/api-client-react/src/generated/`.

**Quirk:** for a `format: email` field, orval 8.21.0 now emits Zod v4 syntax
`zod.email()` in the generated `api.ts`, but the workspace has Zod v3
installed, which only has `zod.string().email()`. So a fresh `codegen` breaks
the build with `TS2339: Property 'email' does not exist on type ... zod`.

**How to apply:** after running codegen, if `typecheck:libs` fails on the email
line, restore that one line in `lib/api-zod/src/generated/api.ts` back to
`"email": zod.string().email(),`. All other constraints (`.min`, `.max`) emit
correct v3 syntax and are fine. Also note: adding `maxLength` to the email field
triggers `zod.email().max(...)` — avoid it unless Zod is upgraded to v4.
