---
name: Weekly/daily claim slots must be released on failed sends
description: Reviewer-enforced rule for claim-gated watchdog emails (SEO digest etc.)
---

Any watchdog that claims a shared once-per-period slot (email_throttle_counters) *before* sending an email must release the claim (DELETE row + clear in-memory mirror) in EVERY send-failure catch — including secondary/escalation alert paths — or a transient SMTP failure suppresses the email for the whole period.

**Why:** completion review rejected the weekly SEO digest twice for exactly this: digest claim held after failed send, then again for the repeated-error escalation alert's claim.

**How to apply:** check mailerConfigured() before claiming; wrap only the send in try/catch and call the release helper there; add a regression test: fail the send once, verify a later same-period run retries and then dedupes. Pattern lives in the api-server SEO digest module.
