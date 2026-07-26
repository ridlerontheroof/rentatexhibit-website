---
name: Post-publish live-site checks
description: How publishes are detected and post-publish checks run automatically
---

Replit has no post-deploy hook, so post-publish verification is done from the workspace: every build stamps `dist/public/build-id.json` (write-build-id.mjs, before precompress so index.html.br stays the last build output), and the always-on `postpublish` workflow (watch-postpublish.mjs) polls the live site's build-id, waits for it to settle across polls (autoscale can serve two builds mid-rollout), then runs `check:postpublish`.

**Why:** pre-publish checks run in the deploy build, but live-site checks (knowledge rewrites, rented-unit noindex) can only run against production after rollout.

**How to apply:** on failure the watcher exits non-zero so the workflow shows failed — restart it after fixing. The watcher only observes publishes while the workspace is open; the first stamped publish is detected as "stamp appears" (previously build-id.json 404s to the SPA fallback).
