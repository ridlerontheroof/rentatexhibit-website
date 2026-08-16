# Legacy-site discovery report — <Property Name>

Generated in the discovery phase. Inputs: crawl of `<legacy origin>` (mode: live/archive/offline),
gap analysis vs standards manifest v<X>, draft parity map.

## 1. Crawl summary
- Mode & provenance: (live crawl date / Wayback snapshots / operator-provided export)
- Pages inventoried: N (page-inventory.csv) · Assets: N (asset-inventory.csv)
- Access limitations: (e.g. Cloudflare challenge → archive mode; JS-only content not captured)

## 2. What the old site has
- Page types and counts (home, floor plans, amenities, gallery, legal set, blog…)
- Platform fingerprints (CMS, listing platform, iframes/embeds)
- Notable content worth carrying (with reuse-rights status — gate G2)

## 3. What ranks / what must not break
- Pages with distinct titles/descriptions (likely indexed)
- Known inbound-link targets if available (GSC/Semrush export from owner)

## 4. What's broken or thin
- Broken routes, duplicate/near-duplicate URLs, soft-404 behavior, thin pages (from inventory flags)

## 5. Gap analysis vs the baseline standard
Summary of gap-report.md: FAIL/WARN counts by category; the headline gaps in prose.
(A legacy site failing most checks is expected — this section sizes the rebuild, it doesn't shame the old site.)

## 6. URL parity plan
Pointer to URL_PARITY_MAP.draft.md + parity-map.csv. Counts: SERVE / REDIRECT / DROP / REVIEW.
Open review decisions for gate G4.

## 7. Asset & fact intake status
- Photos: count, resolution assessment, what's missing (hero-quality shots?)
- Facts routed to the uncertainty register: N (all UNCONFIRMED until G1)
- Outstanding owner items: see INTAKE_CHECKLIST.md
