---
name: Gmail sending via SMTP app password (not the connector)
description: Why the api-server sends mail over Gmail SMTP with an app password, and the nodemailer raw-message envelope gotcha.
---

# Gmail SMTP sending

**Decision:** the api-server sends email via direct Gmail SMTP (nodemailer, smtp.gmail.com:465) as `leasingexhibit@highlandptrs.com` using the `GMAIL_APP_PASSWORD` secret — NOT the Replit Gmail connector.

**Why:** the Replit Gmail connector is one shared Google credential per Replit account; it was bound to the DealVault app's account and cannot hold a second account. Swapping it would have flipped DealVault's email. The app password gives this project its own property-owned credential. Do not "migrate back" to the connector.

**How to apply:**
- Sender defaults to `GMAIL_SMTP_USER` → leasingexhibit@highlandptrs.com; notifications deliver to `LEASING_INBOX_EMAIL` (exhibit@highlandptrs.com); prospect confirmations reply-to exhibit@.
- **nodemailer `raw` gotcha:** with a raw RFC 2822 message, nodemailer does NOT parse recipients from headers — you must pass an explicit SMTP envelope (`{ from, to }`) or sends fail with "No recipients defined" (EENVELOPE). Keep envelope recipients explicit at every call site.
- SMTP egress from the workspace works fine (unlike AppFolio's blocked API egress).
- Domain DNS note: highlandptrs.com nameservers are AppFolio's (ns*.apmdns.com) — SPF exists; DKIM/DMARC must be added in the AppFolio-hosted zone, not Squarespace/registrar panels.

## Branded-email samples must attach the CID logo
The email shell references `cid:exhibit-logo`; the production sender (buildMimeBody in api-server email.ts) always attaches the PNG inline via multipart/related. Any ad-hoc sample script that sends only multipart/alternative shows a broken/empty logo box in Gmail (happened twice with hand-sent [SAMPLE] alerts). When sending samples, replicate the full multipart/related structure with the Content-ID logo part from emailLogo.json, or route through the real send functions (recipient overridable via LEASING_INBOX_EMAIL/SEED_ALERT_EMAIL env). The emailImages.test.ts drift guard only checks logo BYTES stay in sync — it cannot catch a send that omits the attachment.

## Alert routing decision (owner request, 2026-07-28)
ALL website technical alert emails (apply-link, fee-copy, slot-format-drift, guest-card rejection, and the rest) go to SEED_ALERT_EMAIL (default ridler@highlandptrs.com). The leasing inbox (LEASING_INBOX_EMAIL) receives only real lead traffic: lead notifications and prospect-facing mail. Do not route new watchdog/technical alerts to the leasing inbox.
