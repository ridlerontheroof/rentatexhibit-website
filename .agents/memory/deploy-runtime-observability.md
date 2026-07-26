---
name: Deploy runtime — no Chromium, and startup logs are dropped
description: What the deployed autoscale runtime actually ships and why early stdout never reaches deployment logs.
---

- **Deployment log ingestion drops the first ~25s of a fresh container's stdout.** On the 2026-07-26 publish, every api-server log line before 19:24:25Z was lost ("Server listening", all "watchdog started" lines, fast first-check heartbeats). **How to apply:** never conclude a startup-time feature didn't run just because its log line is absent; delay important startup log output ~60s (see rentedCheck's STARTUP_DELAY_MS) or corroborate via DB side effects (e.g. `email_throttle_counters`).
- **The deployed runtime ships only the `.replit` module closures** (nodejs-24, python-base, postgresql-16) — no playwright/chromium nix paths, even though the workspace /nix/store has them. **How to apply:** anything needing headless Chromium in production must have a browserless fallback; `check-rented-noindex.mjs` auto-degrades to an HTTP-level subset (`--http-only` to force) and prints `MODE: http-fallback`, which rentedCheck.ts surfaces in its per-run info line.
- Watchdog daily heartbeats alone are too sparse to confirm a publish; passing rented-check runs now log info per run with the mode.
