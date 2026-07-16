---
name: Floor-plan unit-number semantics (Exhibit On Superior)
description: How apartment unit numbers are derived/labeled for the floor-plans gallery, and the "Residence" mislabel.
---

# Floor-plan unit numbers

**Format decision:** an apartment unit number = `pad2(floor) + pad2(unitLine)` (strict FFUU).
E.g. unit line 6 on floor 6 → `0606`; unit line 2 on floors 30-34 → `3002, 3102, 3202, 3302, 3402`.

**Why:** the source floor-plan sheets read "UNIT 2 | FLOORS 30-34"; the real rentable unit is floor+line. The user explicitly chose to **zero-pad single-digit floors** (floor 6 → "06", giving "0606"), overriding the common real-world convention where a 2nd-floor unit is written "205" (unpadded floor). Honor the padded form.

**How to apply:** derive numbers from a plan/group's `unit` line + `floors[]` (both already in the data). Numbers are shown in the lightbox modal and are matched in `groupMatchesQuery` (a numeric token matches unit line, a floor, or a full unit-number string).

**Mezzanine = its own numbered level.** The building has no "floor 5" sheet — level 5 IS the "4M" mezzanine (podium band runs 2–5). `parseFloors` counts a trailing-M label as max+1 ("4M" → [5], "4-4M" → [4,5], "3-4M" → [3,4,5]), which is what makes real unit numbers like 0502 exist and searchable. Do not revert to treating "4M" as floor 4.

**Per-unit label is "Unit", not "Residence".** The source/migration floor-plan sheets say "UNIT"; the per-unit number label (card badge, lightbox detail, `alt`/`aria`, and the floor-plans ItemList JSON-LD `name`) and the search helper copy all use "Unit NN". This was relabeled from a prior "Residence NN" mislabel — do not revert.

**Exception — keep the marketing H1.** The Floor Plans hero H1 "Smartly Designed Residences Studio, 1, 2 & 3 Bedroom Apartments" is genuine source marketing copy (confirmed in the migration `page-inventory.csv` H1/seo_title). Leave the word "Residences" there; only per-unit labels became "Unit". A future agent should not "fix" this H1.
