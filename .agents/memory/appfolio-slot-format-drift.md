---
name: AppFolio slot-format drift
description: Availabilities feed format changed 2026-07 (ISO offset times, dash dates); how the parser and the all-dropped alarm handle it.
---

## The rule
The showings normalizer must accept BOTH AppFolio availability formats and normalize to the legacy canonical shape ("YYYY/MM/DD" dates, "YYYY/MM/DD HH:mm" property-local wall times):
- legacy: dates `2026/07/30`, times `2026/07/30 10:30` (wall time, America/Chicago)
- since 2026-07: dates `2026-07-30`, times ISO-with-offset `2026-07-30T10:30:00-05:00`, `first_available_date` also dash format

Downstream (route slot revalidation regex, web client grouping/labels, booking POST) is canonical-only; the booking body has always sent ISO instants (`start_at`/`end_at`) and did NOT change with the feed format — a real test booking round-tripped on 2026-07-27.

**Why:** the old regex-only filter silently dropped every slot for weeks when the format flipped — the page showed "no online showing times" while dozens of openings existed; only the lead-capture fallback masked the outage.

**How to apply:** if slots ever go empty while `future_availabilities_exist` is true, suspect format drift first. `normalizeAvailabilities` returns `rawTimeslotCount`/`acceptedSlotCount`; the all-dropped condition (raw>0, accepted==0) must stay loud: error log, `slots_degraded` heartbeat outcome in the slots route, once-a-day email to the leasing inbox (`slot_format_drift` reason in the showing-scheduler alert, routed to LEASING_INBOX_EMAIL unlike the other reasons), and the hourly watchdog probe fails on both all-dropped and "future exists but zero slots after jump-ahead".
