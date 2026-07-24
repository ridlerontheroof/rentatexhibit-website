---
name: Above-the-fold layout guard via dependency-free CDP
description: How the web artifact runs real-layout viewport checks without adding Playwright
---

The Available Units above-the-fold check (`check:fold` script) measures real layout by driving the nix-store headless Chromium over raw Chrome DevTools Protocol using Node's built-in WebSocket — no Playwright dependency added to the project.

**Why:** vitest runs in jsdom/node and cannot measure layout; installing Playwright just for one geometry check is heavy, and a chromium binary is already available (same lookup chain as the fact-sheet printer: CHROME_BIN → PATH → ms-playwright cache → nix store `*-playwright-browsers-chromium`).

**How to apply:** for future real-browser checks, reuse this pattern: spawn the artifact's Vite dev server on an ephemeral port (its vite.config requires a `PORT` env var even when `--port` is passed), launch chromium with `--remote-debugging-port`, fetch `/json/list`, connect to the page WebSocket, and use `Emulation.setDeviceMetricsOverride` + `Runtime.evaluate`. Skeleton rows share real card geometry, so the check works even when the baked availability snapshot is stale (>48h). `--built` (`check:fold:built`) serves dist/public via `vite preview` instead of the dev server to check the exact prerendered production pages; the `?layoutProbe` hook is intentionally kept in production builds (query-param gated) so both modes run identical assertions.
