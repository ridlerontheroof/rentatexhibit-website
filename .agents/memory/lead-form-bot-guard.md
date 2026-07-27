---
name: Lead-form bot guard
description: How the invisible bot protection on the public forms works, and the fallback-bypass trap.
---
Rule: all public form submissions (contact, tour, showing contact) carry a honeypot `xh_note` field + optional `elapsedMs`; the api-server checks them BEFORE any email/lead/AppFolio side effect. `/leads` fake-201s detected bots; `/showings/contact` returns 400 `invalid_submission`.

**Why:** spam becomes real Gmail sends and AppFolio guest cards. Fake success stops bots adapting.

**Autofill trap (2026-07-27 production incident):** the honeypot was originally named `company` with a "Company" label — Safari profile autofill filled it from real visitors' contact cards and genuine tour requests were 400'd as bots. Honeypot fields must use a nonsense name with NO label text. The legacy `company` field is now stripped but no longer treated as a bot signal (cached bundles may still autofill it). `elapsedMs` is measured from the visitor's first keystroke (not mount) and OMITTED when the visitor never typed (pure autofill) — the server tolerates a missing value, so never reintroduce a mount-time timer or a mandatory elapsedMs.

**How to apply:** any new public form must render `HoneypotField` + `useBotGuard` (web `components/BotGuard.tsx`) and route through `inspectSubmission`/`withoutBotGuardFields` (api-server `lib/botGuard.ts`). Trap: the showing scheduler's mandatory lead-capture fallback must NOT fire on `invalid_submission` — a completion review rejected exactly that bypass (server-rejected bot re-entering via POST /leads without guard fields). Client 4xx rejections are terminal; only 5xx/409 trigger the fallback.
