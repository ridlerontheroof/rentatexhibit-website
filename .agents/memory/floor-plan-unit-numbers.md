---
name: Floor-plan unit-number semantics (Exhibit On Superior)
description: How apartment unit numbers are derived/labeled for the floor-plans gallery, the 4M mezzanine format, and the "Residence" mislabel.
---

# Floor-plan unit numbers

**Format decision:** an apartment unit number = `pad2(floor) + pad2(unitLine)` (strict FFUU) on regular floors.
E.g. unit line 6 on floor 6 → `0606`; unit line 2 on floors 30-34 → `3002, 3102, 3202, 3302, 3402`.

**Why:** the source floor-plan sheets read "UNIT 2 | FLOORS 30-34"; the real rentable unit is floor+line. The user explicitly chose to **zero-pad single-digit floors** (floor 6 → "06", giving "0606"), overriding the common real-world convention where a 2nd-floor unit is written "205" (unpadded floor). Honor the padded form.

**How to apply:** derive numbers from a plan/group's `unit` line + `floors[]` via `floorToken()`/`unitNumbersForGroup()` — never `String(floor).padStart` directly. Numbers are shown in the lightbox modal and are matched in `groupMatchesQuery` (a numeric token matches unit line, a floor, or a full unit-number string; mezzanine tokens like "4m"/"04m02" are handled separately).

**The mezzanine is "4M", NOT floor 5 (owner-confirmed, matches AppFolio).** The building has no floor 5 anywhere. The sheets and AppFolio both name the level "4M", and AppFolio writes its apartments as `04M` + two-digit line — e.g. **`04M02`** (5 characters). Internally the site models it as the fractional floor `MEZZANINE_FLOOR = 4.5` (sorts between 4 and 6; podium band 2–4M includes it) and formats it via `floorToken()` → "04M" / `floorDisplayLabel()` → "4M". A prior implementation renumbered the mezzanine to "level 5" (unit numbers like 0502) — that was WRONG and broke matching against AppFolio's live feed. Never resurrect the "mezzanine = floor 5 / 05XX" assumption; parse unit numbers with `parseUnitNumber()` which accepts both FFUU and `04Mxx`.

**Per-unit label is "Unit", not "Residence".** The source/migration floor-plan sheets say "UNIT"; the per-unit number label (card badge, lightbox detail, `alt`/`aria`, and the floor-plans ItemList JSON-LD `name`) and the search helper copy all use "Unit NN". This was relabeled from a prior "Residence NN" mislabel — do not revert.

**Exception — keep the marketing H1.** The Floor Plans hero H1 "Smartly Designed Residences Studio, 1, 2 & 3 Bedroom Apartments" is genuine source marketing copy (confirmed in the migration `page-inventory.csv` H1/seo_title). Leave the word "Residences" there; only per-unit labels became "Unit". A future agent should not "fix" this H1.
