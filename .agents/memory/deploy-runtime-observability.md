---
name: Deploy runtime — no Chromium, startup logs dropped
description: Observability quirks of the production deploy runtime — dropped startup stdout, no headless Chromium, and how fast watchdogs stay invisible.
---

# Deploy runtime observability

- Deployment logs drop roughly the first ~25s of app stdout after an instance starts. "Server listening" and every watchdog's "… watchdog started" line land in that window and are never visible.
- **Fast watchdogs' immediate heartbeats are also eaten.** The dailyHeartbeat "emit on first check so a fresh deploy shows liveness" design only works when the first check takes longer than the drop window. Watchdogs whose first probe resolves in seconds (anything reading the baked availability seed, e.g. apply-link and showing-scheduler probes) emit their startup heartbeat inside the dropped window. Fee-copy/rented/legacy heartbeats survive only because their first checks take ≥~18s.
- **How to verify such a watchdog is live:** (1) confirm the live build-id.json builtAt postdates the watchdog commit and the string exists in the deployed dist; (2) manually reproduce the probe from the workspace to confirm the healthy/skipped outcome; (3) wait for the next UTC-day heartbeat (first probe after 00:00 UTC) in a later log refresh — that is the first observable log line.
- Healthy watchdog runs log at debug, suppressed in production — silence between daily heartbeats is expected, not evidence of death.
- Runtime ships only module closures — no headless Chromium; Chromium-dependent checks need their HTTP fallback (rented-noindex check logs `mode: "http-fallback"`).
- **How to apply:** when confirming any new watchdog "reports in after publish", don't expect the started line; either verify per the steps above or delay the first probe past ~30s so its startup heartbeat survives (the durable fix, in scope of the make-all-watchdogs-confirm work).
