---
name: Visit-scoped lead-source attribution
description: How UTM campaign attribution flows from landing URL to AppFolio guest-card source, and the strict label convention.
---

Leads carry a visit-scoped `source` label so the leasing team can tell campaign
traffic from organic. Captured once on boot from the landing URL's UTM params
into sessionStorage, injected into lead/showing-contact requests and Apply/tour
deep links; the server re-validates before AppFolio sees it.

**Label convention (user-mandated):** exactly `Website (Token)` where Token is
alphanumerics/hyphens only — NO spaces or special characters inside the
parentheses (e.g. `Website (GoogleAds-SpringPromo)`). Anything else falls back
to the default `Website (Exhibit)`. Do not switch to prettier formats like
"Google Ads — Campaign"; that was explicitly rejected.

**Why:** the source string renders on AppFolio's lead screens and in leasing
emails; the team wants one consistent, filterable prefix.

**How to apply:** server-side `sanitizeLeadSource()` is the trust boundary
(strict regex, hard default fallback) — client sanitization is convenience
only. Any new lead pathway (e.g. hidden channel pages) should reuse the web
visit-source module and pass the label through untouched.

**Google Ads gotchas (confirmed live 2026-08-01/04):** The live ad campaigns
tag final URLs with `?source=<ready-made-token>` (e.g.
`?source=GoogleAds_IL-Chicago_Luxury-Apartments`), NOT UTM params — the web
module reads `source` first and passes a label-safe token through verbatim;
then UTMs; then click IDs (gclid/gbraid/wbraid → `Website (GoogleAds)`), since
Google auto-tagging sends no utm_source. Also, the registrar's apex→www 301
(Squarespace forwarding) STRIPS the entire query string — ad URLs must use
`https://www.`.

Gotcha: the leads route rate limiter needs `skip` in NODE_ENV=test or route
tests accumulate 429s across cases (the showings limiter already had it).
