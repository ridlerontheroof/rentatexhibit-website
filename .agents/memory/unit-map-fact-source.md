---
name: Unit map spreadsheet as fact source
description: How the EXHIBIT_UNIT_MAP xlsx feeds per-plan copy, its encoding quirks, and the guards that keep hand-written copy honest.
---

The user-approved unit map spreadsheet (298 units × 37 cols) is converted by
`scripts/generate-unit-map.mjs` (dependency-free xlsx parser, `generate:unit-map`
script) into committed `src/data/unitMap.json`; `src/data/planFacts.ts`
aggregates it per plan id and holds the ONLY approved direction→experience
wording (south → Loop skyline, west → evening sun, east → morning sun,
north → soft indirect light, blends for diagonals).

**Sheet encoding quirks (normalized in the generator):**
- The 4M mezzanine appears as floor "5" with units 501–504 → normalize to
  floor `4M`, units `04M01`–`04M04`; unit numbers are unpadded ("205"→"0205").
- Residence line 06 keeps a pre-v0.7 split (`unit-6-floors-17-21`); merged
  into the DB's 6–29 plan via `PLAN_ID_ALIASES` in planFacts.ts.
- All 62 Type A rows require the publication disclaimer → layout copy makes
  no accessibility claims; the ada.ts section already carries the disclaimer.

**Copy honesty guard:** hand-written per-plan copy lives in
`src/data/floorPlanCopy.ts`; `floorPlanCopy.test.ts` enforces coverage,
paragraph uniqueness, facing/balcony/sqft consistency with governed sources,
and the 48-no-balcony (02/03 stacks, floors 6–29) hard rule. Add new plan
copy there and let the test catch fact drift.

**Why:** copy facts must never silently diverge from the sheet/DB; the guard
makes hand-written prose safe to edit.
