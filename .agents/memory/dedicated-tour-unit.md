---
name: Dedicated "Tour" unit for general tour bookings
description: How no-apartment tour requests book real showings against a hidden AppFolio unit, and its gotchas.
---

# Dedicated "Tour" unit

- AppFolio has a real unit named **"Tour"** at Exhibit (formerly "General Tour") used to book showings for prospects with no specific apartment. Its `rentable_uid` works as a listable UID for the availabilities/booking endpoints even though the unit is NOT posted/rentable and never appears in unit_vacancy or public listings.
- The web page sends the reserved client token `TOUR` (never a unit number); the api-server resolves it via the unit_directory report, config-driven by `TOUR_UNIT_NAMES` (env-overridable). The unit is filtered out of the public availability feed at the single api-server choke point.
- **Why:** the general tour path must never expose the internal unit as an apartment — general-path fallbacks send a plain lead with `hostedUrl: null` because the hosted AppFolio page would show "Tour" as a unit.
- **How to apply:** any new surface consuming availability data automatically excludes it; showings endpoints keep resolving it. If the unit is renamed in AppFolio, update `TOUR_UNIT_NAMES`.

## pick() fuzzy-needle trap (unit_directory)
`unit_directory` rows list `unit_address` ("165 W Superior St - Tour …") BEFORE `unit_name`. The shared `pick(row, needles)` helper matches by substring in key order, so a `"unit"` needle returns the address, not the name. Use exact needles (`"=unitname"`, `"=rentableuid"`) when reading unit_directory rows. Unit tests must mirror real field order or they'll pass while production fails.
