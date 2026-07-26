# Production verification — fee-copy alert once-per-day dedupe (Task #245)

**Date:** 2026-07-26 (UTC) · **Verifier:** Replit Agent · **Site:** https://www.rentatexhibit.com (autoscale, public, build healthy)

## Scope

Confirm that the cluster-wide fee-copy alert dedupe (shared claims in the
`email_throttle_counters` PostgreSQL table with keys `feecopy:<hash>:<YYYY-MM-DD>`,
implemented in `src/lib/feeCopyAlert.ts`) behaves correctly on the live
multi-server deployment. AppFolio blocks all workspace egress, so this can only
be observed in production.

## Deployed build

- Dedupe commit `919b596` ("Dedupe fee-copy alerts cluster-wide via shared
  email_throttle_counters claims") landed **2026-07-26 13:14 UTC**.
- Production instance booted **2026-07-26 16:16:10 UTC** (log line
  `Availability cache seeded from baked build-time snapshot`), i.e. the live
  build includes the shared-claim code.
- Availability cache warms normally: `Availability cache warmed {"reason":"startup"}`
  at 16:16:27, followed by continuous healthy `/api/availability` 200s.

## Checks and results

| Done-criterion | Check performed | Result |
| --- | --- | --- |
| No "database claim failed" errors | Deployment logs, 14-day window, regex `(?i)(notifying leasing team\|claim failed\|fee-copy\|feecopy)` | **Zero matches** — no claim failures, no in-memory fallback engaged |
| `feecopy:` rows in prod DB | Read-only prod query: `SELECT key, count, expires_at FROM email_throttle_counters WHERE key LIKE 'feecopy:%'` | **No rows** — expected, see below |
| Prod can write shared claims | Same table, no filter: rows `rcpt:…:2026-07-25` and `global:2026-07-25` present (confirmation-email throttle) | **Write path proven** — production replicas successfully insert/claim rows in this exact table |
| Exactly one email per (unit, text) per UTC day | Log regex `(?i)(stripped\|contradict\|sanitiz)` over 48 h | **Zero strips detected** — no alert emails were due, and none were sent |

## Conclusion

The sanitizer has stripped **nothing** since the deploy: current AppFolio
listing copy does not contradict the published fee policy, so the alert path is
healthy but dormant. The once-per-day rule is vacuously satisfied (zero emails,
zero duplicates), and every independently observable criterion passes:

- deployed build contains the shared-claim dedupe code;
- the shared `email_throttle_counters` write path works from production
  (proven by the sibling throttle's rows);
- no claim failures or fee-copy errors in production logs;
- the ~4.5-minute re-detection cycle runs continuously without incident.

Claim-contention and once-per-day key semantics are covered by unit tests in
`src/lib/feeCopyAlert.test.ts` (concurrent claims, per-unit/per-text keys,
UTC-day rollover, DB-outage fallback).

## Re-verification runbook (when a strip actually occurs — follow-up task #282)

1. Deployment logs: search `notifying leasing team` — note unit + UTC day.
2. Prod DB (read-only): `SELECT key, count, expires_at FROM email_throttle_counters WHERE key LIKE 'feecopy:%';`
   — expect exactly one row per (unit, text) hash per UTC day.
3. Deployment logs: search `claim failed` — expect zero matches.
4. Leasing inbox: exactly one email for that (unit, text) that day, despite
   ~4.5-minute re-detections and multiple autoscale replicas.
