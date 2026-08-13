---
name: Post-publish IndexNow submitter
description: How new/changed page URLs get pushed to IndexNow after each publish, and the split vs api-server's availability pings.
---

Two IndexNow lanes share ONE key (the served `public/<32-hex>.txt` file; api-server's parity test pins its constant to it):

1. **api-server (always-on, production)** — pings availability pages + changed/removed unit URLs the moment inventory changes, and the core sitemap URLs once per process start. Also has `resubmit:indexnow` for bulk sitemap resubmission.
2. **Web artifact post-publish submitter** (`scripts/submit-indexnow.mjs`, run by the postpublish watcher after each detected publish and on `--now`) — fetches the LIVE sitemap.xml, diffs url→lastmod against `reports/indexnow/state.json`, submits only new/changed URLs, appends every run to `reports/indexnow/submissions.log`.

**Rules:**
- Removed URLs are deliberately NOT submitted by the sitemap differ — rented-unit pings are the api-server's job; don't duplicate.
- `reports/indexnow/` is runtime output and gitignored (generated-data drift blocks task apply otherwise). First run records a baseline and submits nothing (api-server already pings core URLs).
- Failures never fail the publish/watcher: the submitter logs, emails ops via `pnpm --filter @workspace/api-server run send:indexnow-alert -- <json>` (goes to SEED_ALERT_EMAIL), and only exits non-zero for manual runs.
- Any api-server CLI that imports the mailer/logger must run with `NODE_ENV=production` or pino tries to load pino-pretty and crashes — keep the env prefix in the package script.

**Why:** instant Bing/Copilot indexing of new blog guides without waiting for sitemap recrawl; Google ignores IndexNow.
