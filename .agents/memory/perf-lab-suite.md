---
name: Perf lab suite (check:perf)
description: How the repeatable Lighthouse suite works, its calibration model, and how to run long checks despite ShellExec limits.
---

# Perf lab suite

- `check:perf` (scripts/check-perf.mjs in the web artifact) runs Lighthouse programmatically (npm `lighthouse` dep) against the nix chromium over a debug port, measuring `dist/public` served by `vite preview` — hermetic, requires a prior build.
- 10 pages × mobile+desktop, performance category only. Metrics: LCP/CLS/TBT + JS/image/third-party transfer bytes from the `network-requests` audit.
- Committed outputs live in `perf/`: `baseline.json`, `latest.json`, `SUMMARY.md`, `thresholds.json`.
- Threshold model: aspirational CWV targets (LCP 2500 / CLS 0.10 / TBT 200) with per-page calibrated overrides in `perf/thresholds.json` (measured × 1.25). Regenerate with `--calibrate` after intentional perf work; `--baseline` rewrites baseline.json.
- Baseline reality (2026-07-26): desktop all green; mobile LCP 4.2–5.7s everywhere (throttled Slow-4G lab), TBT/CLS fine. Mobile LCP is the improvement target for the embed-deferral work.
- **Why calibrated overrides:** hard-failing at 2.5s day one would make the gate permanently red and useless; overrides make only *regressions beyond ~25% noise* fail.
- TBT is noisy run-to-run in this workspace (observed 324ms vs 73ms on the same page); don't chase single-run TBT deltas.

# Running long checks (ShellExec limits)

- ShellExec sessions are isolated: `/tmp` is not shared between calls and background (`nohup`/`setsid`) processes die when the session ends.
- **How to apply:** for anything longer than ~4 minutes, register/run it as a console workflow (`configureWorkflow` + autoStart) and poll its output files, instead of backgrounding in a shell.
