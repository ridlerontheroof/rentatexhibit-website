---
name: Lead-form bot guard
description: How the invisible bot protection on the public forms works, and the fallback-bypass trap.
---
Rule: all public form submissions (contact, tour, showing contact) carry a honeypot `company` field + `elapsedMs`; the api-server checks them BEFORE any email/lead/AppFolio side effect. `/leads` fake-201s detected bots; `/showings/contact` returns 400 `invalid_submission`.

**Why:** spam becomes real Gmail sends and AppFolio guest cards. Fake success stops bots adapting.

**How to apply:** any new public form must render `HoneypotField` + `useBotGuard` (web `components/BotGuard.tsx`) and route through `inspectSubmission`/`withoutBotGuardFields` (api-server `lib/botGuard.ts`). Trap: the showing scheduler's mandatory lead-capture fallback must NOT fire on `invalid_submission` — a completion review rejected exactly that bypass (server-rejected bot re-entering via POST /leads without guard fields). Client 4xx rejections are terminal; only 5xx/409 trigger the fallback.
