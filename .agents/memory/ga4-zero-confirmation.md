---
name: Confirm implausible GA4 zeros
description: Prevent false missing-visitor alerts from isolated GA4 Data API zero readings.
---

Treat a below-floor GA4 active-user reading as provisional. Query the same property and window a
second time, and alert only when both readings remain at or below the floor. A failed confirmation is
ambiguous, not proof of zero visitors.

**Why:** A newly started autoscale API process returned zero once while adjacent production checks
reported hundreds of users and a manual identical query remained healthy. Alerting on the first
empty-row response created a false outage email.

**How to apply:** Confirm only low readings so healthy checks stay cheap. Log both counts and a
non-secret configuration fingerprint. If the second result recovers, record a healthy outcome; if it
errors, use the existing ambiguous-error path.