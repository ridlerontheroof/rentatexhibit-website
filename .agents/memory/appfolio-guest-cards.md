---
name: AppFolio guest-card lead push
description: How website tour leads get pushed into AppFolio as guest cards, and why the endpoint choice is safe.
---

AppFolio has no public write API, but its hosted listing pages create prospects via
`POST https://<db>.appfolio.com/listings/api/guest_cards` (JSON: firstName, lastName,
emailAddress, phoneNumber, listableUid, source). No CSRF/session required — a bare
server-side POST returns 400 on bad payload, not 403.

**Why:** the leasing team wanted internal tour-form submissions to land in AppFolio's
lead queue attached to the exact unit, like AppFolio's own showing scheduler does.

**How to apply:** resolve unit → listingUrl → listableUid server-side from the cached
availability snapshot (never trust a client UID), fire-and-forget after the lead is
persisted. The showing *booking* flow (/api/showings) needs a token + slot picking —
don't attempt it server-side. Unit-specific "Schedule a Tour" buttons already deep-link
to AppFolio's hosted scheduler (`/listings/showings/new?listable_uid=<uid>&source=Website`),
which captures everything natively.
