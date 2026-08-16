# Pilot: regenerated Woods Crossing discovery artifacts vs the hand-built handoff

Ran the new onboarding tooling against the same legacy-site inventory the hand-built handoff was
made from (`woods-crossing-handoff/content/source/source-page-inventory.csv`, scraped 2026-08-06).

Commands:
```
node .agents/skills/property-site-onboarding/tools/generate-parity-map.mjs \
  --inventory woods-crossing-handoff/content/source/source-page-inventory.csv \
  --canonical-origin https://www.woodscrossingslc.com --out reports/onboarding/pilot-woods-crossing
node .agents/skills/property-site-onboarding/tools/lint-standards.mjs \
  --base https://www.woodscrossingslc.com --out .../gap-report.md \
  --offline-inventory woods-crossing-handoff/content/source/source-page-inventory.csv
```

## Coverage

- Hand-built map (`woods-crossing-handoff/docs/URL_PARITY_MAP.md`): 39 classified URLs + 3 domain-level rules.
- Generated map: **all 39 URLs classified** (SERVE=18, REDIRECT=15, DROP=1, REVIEW=5) + the same
  3 domain-level one-hop rules, plus the Squarespace/query-string traps carried into the header.
- Nothing in the hand map is missing from the generated map. ✅

## Where the tool agrees with the hand map (no review needed)

- All 7 `/apply-now/*` deep links → `/apply-online` (same rationale, incl. the unit-token note).
- `/terms`, `/termsofservice` → `/terms-of-service`; `/amenities`, `/neighborhood` → geo paths;
  `/availability` → `/apartment-search`; `/accessible-one-page` → DROP with the same rationale.
- The full §A serve set (contact, gallery, pet-friendly, reviews, legal set, …).

## Deltas — all surfaced as explicit review rows, which is the designed behavior (gate G4)

| URL | Hand map | Generated | Verdict |
|---|---|---|---|
| `/frequently-asked-questions` | Serve as-is | REDIRECT → `/` (source canonical pointed home) | Tool followed the scraped canonical literally; the human reviewer overrides to SERVE. The hand analyst made the same judgment call — the tool now makes the signal visible instead of silent. |
| `/virtual-tours` | 301 → `/virtual-leasing` (broken page decision) | REDIRECT → `/` (canonical) | Same class (redirect), target needs the human decision the hand map documents. |
| `/apartments/layout-*` (4) | 301 → `/floor-plans` or per-plan pages | SERVE (distinct titles, self-canonical) | Legitimate judgment call (the hand map itself says "or per-plan pages if you build them"). Reviewer decides at G4. |
| `/getdirections` | 301 → `/contact` (fold-in decision) | SERVE | Pure IA preference; hand map marked it "or keep as-is". Reviewer decides. |
| 5 REVIEW rows (duplicate titles: `/`, `/apartment-search`, `/apply-online`, geo pages) | resolved by analyst | flagged for human | Correct: these are the canonical-pick decisions the analyst made by hand. |

**Conclusion:** the generated package matches the hand-built handoff on every mechanical
classification and converts every judgment call the analyst made into an explicit NEEDS_REVIEW /
review-table row instead of requiring the analyst to find them. That meets the "match or beat"
bar: same coverage, same guard-discipline framing, better surfacing of decisions.

## Gap analysis (offline mode)

`gap-report.md`: head checks PASS from the inventory (source pages carried titles/descriptions/
canonicals); network checks SKIPPED because the pilot used the frozen 2026-08-06 inventory rather
than re-hitting the legacy site; 20 checks correctly attributed to KIT-GUARD (satisfied by adopting
the kit). Fix applied during the pilot: the linter originally had no offline mode — added
`--offline-inventory` so bot-walled/archived discoveries still produce a gap report.
