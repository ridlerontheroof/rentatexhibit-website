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

**How to apply:** resolve unit → listingUrl → listableUid server-side from the cached
availability snapshot (never trust a client UID), fire-and-forget after the lead is
persisted. The showing *booking* flow (/api/showings) needs a token + slot picking —
don't attempt it server-side. Unit-specific "Schedule a Tour" buttons already deep-link
to AppFolio's hosted scheduler (`/listings/showings/new?listable_uid=<uid>&source=Website`),
which captures everything natively.
