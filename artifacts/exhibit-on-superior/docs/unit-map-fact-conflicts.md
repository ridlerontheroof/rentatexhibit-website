# Unit map (v1.2) vs floor-plan DB — fact reconciliation

Date: 2026-08-04. Source: `EXHIBIT_UNIT_MAP_v1.2_ACCESSIBILITY` (user-provided,
approved fact source), converted to `src/data/unitMap.json` by
`scripts/generate-unit-map.mjs`. Compared against `src/data/floorPlans.ts`
(the sqft authority) for all 298 units / 35 sheet plan ids.

## Conflicts requiring user resolution

None. Beds, baths, den, and square footage agree with the floor-plan DB for
every plan (unit-6-floors-6-29's sheet figure of 776 sq ft falls inside the
DB's printed 769–776 range).

## Normalizations applied (not conflicts)

1. **Mezzanine renumbering** — the spreadsheet numbers the 4M mezzanine as
   floor 5 (units "501"–"504"). The building has no floor 5 (AppFolio and the
   plan sheets both use "4M"/"04M"). The generator normalizes these to
   `04M01`–`04M04` / floor `4M`; their plan_ids already pointed at the 4-4M
   plans, confirming the mapping.
2. **Unpadded unit numbers** — "205" → "0205" etc., matching the site-wide
   FFUU convention.
3. **Line 06 packet split** — the sheet keeps the pre-v0.7 split of residence
   line 06 into 6–16 and 17–21 packets (`unit-6-floors-17-21`); the DB's
   consolidated 6–29 plan absorbs both via `PLAN_ID_ALIASES` in
   `src/data/planFacts.ts`.

## Confirmations

- **Balcony hard rule** — exactly 48 no-balcony units, all in the 02/03
  stacks on floors 6–29; matches the standing verified building fact
  (guarded by `floorPlanCopy.test.ts`).
- **Accessibility** — all 62 Type A rows carry
  `accessibility_disclaimer_required = Yes` ("Verify current installed
  features before publication"). Per the usage rule, the new layout copy
  makes **no** accessible/adaptable claims; the existing ADA section on the
  plan pages (from the as-built matrix in `data/ada.ts`) already ships with
  its required disclaimer and is unchanged.
