---
name: vitest DOM/hook tests in exhibit-on-superior
description: How to add DOM/React-hook tests in the exhibit-on-superior web artifact whose vitest defaults to the node environment.
---

# Testing React hooks / DOM code in `artifacts/exhibit-on-superior`

The artifact's `vitest.config.ts` sets `environment: 'node'` and `include: ['src/**/*.test.ts']`. Pure-logic tests run as-is, but anything touching `window`/`document`/React rendering fails under node.

**To add a DOM or hook test:**
- Put a `// @vitest-environment jsdom` pragma as the very first line of the `.test.ts` file (per-file override; leaves the global node default intact so pure tests stay fast).
- Dev deps required (already installed): `jsdom`, `@testing-library/react`, `@testing-library/dom`. Install them scoped: `pnpm add -D --filter @workspace/exhibit-on-superior <pkg>` — a bare `pnpm add` fails with `ERR_PNPM_ADDING_TO_ROOT`.
- Vitest globals are NOT enabled, so testing-library's auto-cleanup does not run. Manually `unmount()` each `renderHook` result in `afterEach` or listeners leak across tests.

**Why:** keeps the fast node default for the bulk of tests while still allowing jsdom where a hook/component genuinely needs it.

**Testing a capture-phase click interceptor (e.g. `useUnsavedChangesWarning`):** add a bubble-phase `document` click listener that calls `preventDefault` during the test to swallow jsdom's "Not implemented: navigation" noise, and spy on the dispatched event's `stopPropagation` — the interceptor calls it only when it actually blocks navigation, so it's the precise "was intercepted" signal.
