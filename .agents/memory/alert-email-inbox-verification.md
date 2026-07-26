---
name: Alert-email inbox verification via IMAP
description: How to prove watchdog alert emails actually landed, and MIME gotchas when grepping bodies
---

The site's alert sender account (leasingexhibit@, Gmail SMTP app password) is also IMAP-readable with the same `GMAIL_APP_PASSWORD` — connect to imap.gmail.com:993 with raw TLS + IMAP commands (LOGIN / SELECT INBOX / UID SEARCH / UID FETCH); no IMAP library is installed or needed.

**Gotchas:**
- Alert email bodies are multipart MIME with **base64-encoded** text parts — grepping the fetched body for wording fails; base64-decode the part first.
- A cheap DB-level proxy for "did this run send the email": the alert path claims `rentedcheck:<utc-day>` (etc.) in `email_throttle_counters` right before sending, so row absence/presence after each run proves send timing without inbox polling.
- One-off harness scripts under `artifacts/api-server/scripts/` bundle via esbuild (`--bundle --platform=node --format=esm`) and must run with `NODE_ENV=production`, or pino tries to load the pino-pretty transport and crashes.

**How to apply:** any future "confirm alert X actually gets sent/lands" task — inject a mock runner, watch the throttle/claim rows, then IMAP-check the sender inbox.
