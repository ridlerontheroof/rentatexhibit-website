---
name: Stale compiled dist in workspace libs
description: Cross-package type errors after task merges may come from stale lib dist output
---

- Rule: if api-server (or another consumer) reports a missing property that clearly exists in `lib/<pkg>/src`, rebuild that lib's `dist/` (`npx tsc -p .` in the lib) before hunting further — parallel task merges can land schema/source changes without rebuilding compiled output.
  **Why:** a merge added `notifiedAt` to the leads schema source but not to `lib/db/dist`, making the consumer's typecheck fail misleadingly.
  **How to apply:** on cross-package TS2353/TS2339 errors, check the lib's `dist/*.d.ts` for the symbol first.
