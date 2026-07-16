---
name: Floor-plan unit-number semantics (Exhibit On Superior)
description: How apartment unit numbers are derived/labeled for the floor-plans gallery, and the "Residence" mislabel.
---

# Floor-plan unit numbers

**Format decision:** an apartment unit number = `pad2(floor) + pad2(unitLine)` (strict FFUU).
E.g. unit line 6 on floor 6 → `0606`; unit line 2 on floors 30-34 → `3002, 3102, 3202, 3302, 3402`.

**Why:** the source floor-plan sheets read "UNIT 2 | FLOORS 30-34"; the real rentable unit is floor+line. The user explicitly chose to **zero-pad single-digit floors** (floor 6 → "06", giving "0606"), overriding the common real-world convention where a 2nd-floor unit is written "205" (unpadded floor). Honor the padded form.

**How to apply:** derive numbers from a plan/group's `unit` line + `floors[]` (both already in the data). Numbers are shown in the lightbox modal and are matched in `groupMatchesQuery` (a numeric token matches unit line, a floor, or a full unit-number string).

**"Residence" is a code-only mislabel.** The floor-plan card/lightbox label the number as "Residence NN", but that word appears nowhere in the source/migration bundle for floor plans — the sheets say "UNIT". The correct term is "Unit". (As of this note the visible label still says "Residence"; only the new unit-number block uses real unit numbers. Revisit if the user asks to relabel.)
