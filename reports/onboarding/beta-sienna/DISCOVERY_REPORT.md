# Legacy-site discovery report — Sienna Chicago (beta run of property-site-onboarding)

Beta of the onboarding tooling ahead of Highland's closing on the property behind
https://www.siennachicago.com. The actual Sienna site build happens in its own new project using
the workspace skill + pinned template kit; this package is the discovery-phase evidence.

## 1. Crawl summary

- **Mode: `archive` (Wayback Machine CDX)** — the live site sits behind a Cloudflare *managed
  challenge* (403 + `cf-mitigated: challenge` on every path, including robots.txt/sitemap.xml).
  Direct and headless crawls are blocked from this workspace.
- Pages inventoried: **27** (`discovery/page-inventory.csv`) · Assets: **105**
  (`discovery/asset-inventory.csv`) · Raw HTML archived in `discovery/html/` with `wayback:<ts>`
  provenance per row.
- **Limitation:** snapshots span multiple site generations (see §2); the newest snapshots are from
  ~2023–2024. Current rents/availability/photos on the live site are NOT captured. A live re-crawl
  is queued on the intake checklist (owner grants CDN allowlist or a platform export).

## 2. What the old site has

Two platform generations are visible in the archive:
1. **RentCafe era** — `/floorplans`, `/floorplans/unit-N` (5 per-unit pages, all with identical
   boilerplate RentCafe titles), `/photogallery`, `/mapsanddirections`, `/scheduletour`,
   `/contactus`, `/privacypolicy` + `/termsandconditions` (RentCafe boilerplate legal),
   `/accessibility` (RentCafe boilerplate), `/brochure` (eBrochure).
2. **Newer "Sienna" WordPress era** — `/about-us`, `/amenities`, `/gallery`, `/neighborhood`,
   `/property-details`, `/faq`, `/vacancies`, `/contact-us`, `/tenant` (+ `/tenant/pay-rent-online`,
   `/tenant/maintenance-request`), `/sitemap`.
   The homepage title brands it "Sienna Flats", Streeterville, Chicago IL.

Which generation is live today must be confirmed once access exists; the parity map covers the
union so no historically-ranked URL is missed.

## 3. What ranks / what must not break

Distinct-titled, likely-indexed pages: home, amenities, neighborhood, gallery/photogallery,
floorplans, about-us, contact pages, tenant pages. The duplicate pairs (`/contact-us` vs
`/contactus`, `/gallery` vs `/photogallery`, `/floorplans` vs `/property-details`) are prime
301-consolidation targets — flagged in the parity draft. Request the owner's GSC/analytics export
to rank-order these before approving deletions.

## 4. What's broken or thin

- 5 `/floorplans/unit-N` pages share one boilerplate title (no unique content value) — candidates
  to 301 into the new per-plan landing pages the kit builds.
- `/faq` has a lowercase placeholder title ("faq - Sienna") — thin.
- Legal/accessibility pages are RentCafe boilerplate, not property-owned copy — the new build ships
  its own legal set (legal review gate).

## 5. Gap analysis vs the baseline standard (manifest v1.0.0)

`discovery/gap-report.md`. Measured from the offline inventory:
- **FAIL:** per-URL heads (11 pages missing meta descriptions in inventoried snapshots) and
  canonicals (14/27 pages missing a canonical tag).
- **SKIPPED (11):** network checks (robots/sitemap/llms/404/redirect-hop/CSP) — bot wall; re-run
  `lint-standards.mjs --base https://www.siennachicago.com` live once access is granted.
- **KIT-GUARD (20):** satisfied by adopting the template kit (JSON-LD, twins/llms, AppFolio flows,
  bot guard/attribution, perf, post-publish watchdogs — none of which the legacy platforms have).

Headline: standard RentCafe/WordPress property site — no structured-data depth, no AEO surface, no
canonical discipline. The rebuild-on-kit path is clearly justified; nothing on the legacy site
needs to be preserved except URLs (parity map) and content facts (via the uncertainty register).

## 6. URL parity plan

`parity/URL_PARITY_MAP.draft.md` + `parity/parity-map.csv`: 27 URLs — SERVE=18, REVIEW=9 (the
duplicate-title sets above), all rows NEEDS_REVIEW pending gate G4. Domain rules (apex→www,
http→https, one hop) included. Expect the reviewer to consolidate the era-duplicates and fold
`/floorplans/unit-N` into the new floor-plans hub.

## 7. Asset & fact intake status

- 105 archived asset references (mostly RentCafe CDN + WP uploads) — usable as a *reference list*
  only; request originals from the owner (archive images are web-compressed and rights-unclear —
  gate G2).
- No facts extracted into a register yet: pet policy/fees/hours pages weren't in the archive set
  and any archived rent figures are stale by definition. All facts must come from the OM + owner
  confirmation (gate G1).
- Outstanding owner items: see `INTAKE_CHECKLIST.md` in this folder.
