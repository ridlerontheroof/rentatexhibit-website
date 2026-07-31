---
name: Dedicated "Tour" unit for general tour bookings
description: How no-apartment tour requests book real showings against a hidden AppFolio unit, and its gotchas.
---

# Dedicated "Tour" unit

- AppFolio has a real unit named **"Tour"** at Exhibit (formerly "General Tour") used to book showings for prospects with no specific apartment. Its `rentable_uid` works as a listable UID for the availabilities/booking endpoints even though the unit is NOT posted/rentable and never appears in unit_vacancy or public listings.
- The web page sends the reserved client token `TOUR` (never a unit number); the api-server resolves it via the unit_directory report, config-driven by `TOUR_UNIT_NAMES` (env-overridable). The unit is filtered out of the public availability feed at the single api-server choke point.
- **Why:** the general tour path must never expose the internal unit as an apartment — general-path fallbacks send a plain lead with `hostedUrl: null` because the hosted AppFolio page would show "Tour" as a unit.
- **How to apply:** any new surface consuming availability data automatically excludes it; showings endpoints keep resolving it. If the unit is renamed in AppFolio, update `TOUR_UNIT_NAMES`.

## AppFolio prospect auto-emails are company-branded — site sends its own
- AppFolio's automatic prospect emails (inquiry "Thank You" AND the showing confirmation/reminder) use the generic company-level "Online Portal" template with the Highland corporate logo — verified live 2026-07-30 for the Tour unit **and even for a posted Exhibit listing**. No guest-card/booking API field switches the template; `skip_cta_for_new_inquiries: true` does not suppress the inquiry email. Branding is an AppFolio dashboard Communication-settings matter.
- Therefore `/showings/book` sends the site's own Exhibit-branded confirmation (`sendGeneralTourConfirmation`) for the general (TOUR) path only, fed by optional prospect fields the page re-sends at booking (autoscale replicas make a server-side stash by guestCardId unsafe). Unit bookings stay AppFolio-owned by design.
- Guest-card API quirk: last names containing digits 422 — keep marked test names alphabetic; put markers in the email alias instead.

## pick() fuzzy-needle trap (unit_directory)
`unit_directory` rows list `unit_address` ("165 W Superior St - Tour …") BEFORE `unit_name`. The shared `pick(row, needles)` helper matches by substring in key order, so a `"unit"` needle returns the address, not the name. Use exact needles (`"=unitname"`, `"=rentableuid"`) when reading unit_directory rows. Unit tests must mirror real field order or they'll pass while production fails.
