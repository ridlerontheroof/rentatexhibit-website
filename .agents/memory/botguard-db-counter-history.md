---
name: Bot-guard verification via DB counters, not logs
description: Deployment log retention resets on republish; email_throttle_counters rows are the durable bot-guard accept/reject history
---

Deployment log retention is short and resets when a new publish goes live — a week-back log search can silently return nothing even though the filter query reports "no matches". Never conclude "no rejections" from `fetchDeploymentLogs` alone; probe per-day for any known log line first to confirm coverage.

The durable record is the production `email_throttle_counters` table: `botguard:rejected:<utc-day>` and `botguard:accepted:<utc-day>` rows share the same insert path, and the throttle sweep does NOT actually remove expired rows promptly — rows past their 2-day expiry stay queryable for days. So *absence of a rejected row for a day where accepted rows exist* is positive proof of zero rejections that day.

**Why:** verified 2026-08-04 for the Safari-autofill false-positive re-check — logs only reached back hours, but DB rows covered the whole week (accepted rows every day, rejected rows only pre-fix).

**How to apply:** any "did the bot guard reject anyone" / lead-volume verification — query prod read-only `SELECT key, count, expires_at FROM email_throttle_counters WHERE key LIKE 'botguard%'`; alert claim rows (`botguard-spike…`) prove whether alert emails fired.
