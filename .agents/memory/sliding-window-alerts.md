---
name: Exact sliding-window alert counters
description: How to count "N failures in M minutes" cluster-wide without bucket-rounding false positives.
---

Windowed escalation alarms (e.g. the slots-outage alert) must count an **exact** trailing window, not bucket approximations.

**Rule:** persist one row per event in `email_throttle_counters` with a unique key (`<prefix>:<eventMs>:<uuid>`, count=1) and `expires_at = eventTime + window`. Then "inside the trailing window" is exactly `expires_at >= now`; the check is DELETE-expired (same prefix) → INSERT → COUNT. Sweep on every bump so the table never accumulates.

**Why:** completion review rejected both a whole-window two-bucket sum (up to 2× window false positives) and one-minute sub-buckets (up to 59s of stale events counted). Only per-event rows survived review. Also add boundary tests with second/millisecond offsets on either side of the cutoff, including cross-replica (fresh in-memory state, shared table) cases.

**How to apply:** any future "X failures in Y minutes" alert — reuse this row-per-event pattern plus a `createDailyClaim` for the once-per-day email throttle; keep an in-memory timestamp array as the DB-down fallback and take `Math.max` of the two counts.
