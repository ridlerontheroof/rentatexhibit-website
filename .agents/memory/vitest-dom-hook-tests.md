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

**Rendering full components with Radix Dialog + layout-dependent math:** jsdom reports 0 for `clientWidth/Height`, so stub configurable getters on `HTMLElement.prototype` (restore in `afterEach`). Dispatch bubbling `KeyboardEvent`s from `document.body` inside `act()` so they reach both window-level listeners and Radix's document-level Escape handler; assert visual state by parsing the rendered inline `style.transform` rather than reaching into React state. The vite `@` alias must be mirrored in `vitest.config.ts` `resolve.alias` or ui/* imports fail.

**Testing a capture-phase click interceptor (e.g. `useUnsavedChangesWarning`):** add a bubble-phase `document` click listener that calls `preventDefault` during the test to swallow jsdom's "Not implemented: navigation" noise, and spy on the dispatched event's `stopPropagation` — the interceptor calls it only when it actually blocks navigation, so it's the precise "was intercepted" signal.

**Rendering full React components (`.tsx` pages) from a `.test.ts` file:** two gotchas. (1) `include` only matches `.test.ts`, and esbuild loads `.ts` with the classic JSX runtime (needs a React global) — writing JSX in the test throws `React is not defined`. Keep tests `.test.ts` and build the tree with `createElement` (including provider wrappers) instead of JSX. (2) The imported page `.tsx` sources use the automatic runtime, so add `esbuild: { jsx: 'automatic' }` to `vitest.config.ts` or they throw `React is not defined` at render. Wrap renders in the same providers `main.tsx` uses (`HelmetProvider` + `QueryClientProvider`). To probe whether the unsaved-changes guard is currently armed, dispatch a cancelable `beforeunload` event and read `defaultPrevented` — true iff enabled.

- jsdom applies `history.back()` asynchronously — tests asserting the URL after a close handler that consumes a pushed entry must `await vi.waitFor(...)` for the popstate, not assert synchronously.
- React's synthetic `timeStamp` falls back to `Date.now()` when the native event's timeStamp is falsy — tests fabricating timestamps must offset them by a nonzero base or velocity/timing math silently breaks (drag starting at t=0 gets a Date.now() start time).
