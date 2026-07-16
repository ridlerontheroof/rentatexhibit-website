---
name: Vite build quirks in this repo
description: Env-var handling and warning sources in the web artifact's vite config/build
---

- Rule: PORT/BASE_PATH must only be required for `serve` (use `defineConfig(({ command }) => ...)`); plain `vite build` must succeed with BASE_PATH defaulting to '/'.
  **Why:** a hard env-var throw in vite.config broke standard build invocations after parallel task merges.
  **How to apply:** when touching vite.config, keep env validation gated on `command === 'serve'`.
- Rule: don't add `'use client'` directives to components — this is a Vite SPA (no RSC); Rollup strips them and emits "Error when using sourcemap" warnings on every build.
