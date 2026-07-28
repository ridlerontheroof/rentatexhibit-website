---
name: ApartmentComplex node schema typing
description: Why the property entity is dual-typed and where floorSize/priceRange legally live in schema.org
---

- schema.org does NOT define `priceRange` on ApartmentComplex (a Residence/Place subtype) — only on LocalBusiness — nor `floorSize` (Accommodation/FloorPlan only). validator.schema.org flags both as SPORE UNKNOWN_FIELD warnings.
- Fix in place: the property entity is dual-typed `['ApartmentComplex','LocalBusiness']` (consistent with the /reviews node that re-opens the same @id as LocalBusiness), and the tower-wide sq-ft range rides on an inline summary FloorPlan (`#floorplan-range`) via `accommodationFloorPlan`.
- **How to apply:** anything finding the complex node by `n['@type'] === 'ApartmentComplex'` breaks on the array — use includes-style checks (prerender guards, fact-sheet generator, tests, validate-jsonld all handle arrays now; keep that pattern for new code). Guards counting FloorPlan nodes must exclude `#floorplan-range`.
- Validating pre-publish: POST the dist HTML to `https://validator.schema.org/validate` with form field `html` (response starts with `)]}'` line); no need to wait for a publish.
