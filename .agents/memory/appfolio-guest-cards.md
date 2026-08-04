---
name: AppFolio guest-card lead push
description: How website tour leads get pushed into AppFolio as guest cards, and why the endpoint choice is safe.
---

AppFolio has no public write API, but its hosted listing pages create prospects via
`POST https://<db>.appfolio.com/listings/api/guest_cards` (JSON, **snake_case** keys:
first_name, last_name, email_address, phone_number, listable_uid, source — camelCase
started returning a bare 400 with empty body ~2026-07; the hosted client snake_cases
every request). No CSRF/session required — a bare server-side POST returns 400 on bad
payload, not 403.

**Why:** the leasing team wanted internal tour-form submissions to land in AppFolio's
lead queue attached to the exact unit, like AppFolio's own showing scheduler does.

Verified live 2026-07-28 with a real mailbox (leasingexhibit@highlandptrs.com): server path
logs "Pushed prospect guest card", AppFolio returned `{"guest_card_id":…}`. Gotchas learned:
- 422 (empty JSON body) is creation-time validation. A parenthesized last name
  ("Test (please disregard)") 422'd on first creation; plain names succeed. Synthetic
  email domains also 422.
- AppFolio DEDUPES: repeat posts for the same prospect (same phone/email, even +aliases)
  return 201 with the SAME guest_card_id — a 201 doesn't always mean a new card.
- Multi-word FIRST names 422 (empty body) at creation — "TEST UTM" fails, "Testutm" works;
  multi-word LAST names are fine (verified live 2026-07-28). 555 phones and +alias emails
  on a real domain are accepted. HANDLED: both guest-card push paths (lead + showing) now
  normalize by moving extra first-name words to the front of the last name ("Mary Jane"
  Watson → "Mary" / "Jane Watson"); live-verified accepted 2026-07-28.
- Sources verified live 2026-07-28: guest_cards Reports API report (POST
  /api/v2/reports/guest_cards.json, Basic auth) exposes each card's `source` — both
  "Website (GoogleAds-Brand)" (UTM path) and default "Website (Exhibit)" landed correctly.

- **Spam throttle (verified live 2026-08-04):** after a burst of NEW guest-card
  creations (rapid test submissions), AppFolio 422s (empty body) ALL new-prospect
  creations account-wide — regardless of name/email/phone/source, across listings —
  while posts matching an existing card (same email OR phone) keep returning 201
  (merge). X-Forwarded-For is ignored; the block persisted 35+ min. Do NOT read a
  422-empty streak as contract drift or field validation — and never diagnose it by
  firing more creation probes (each may extend the block). A campaign source label
  like "Website (GoogleAds_IL-Chicago_Luxury-Apartments)" was proven ACCEPTED —
  underscores and unregistered sources are fine.

**How to apply:** resolve unit → listingUrl → listableUid server-side from the cached
availability snapshot (never trust a client UID), fire-and-forget after the lead is
persisted. The showing *booking* flow (/api/showings) needs a token + slot picking —
don't attempt it server-side. Unit-specific "Schedule a Tour" buttons already deep-link
to AppFolio's hosted scheduler (`/listings/showings/new?listable_uid=<uid>&source=Website`),
which captures everything natively.
