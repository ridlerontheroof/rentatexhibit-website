# URL Parity Map — woodscrossingslc.com

Every URL from `content/source/source-page-inventory.csv`, classified for the new build. Goal: nothing the old site ranked for returns a soft-404 or an unnecessary redirect chain.

## Domain-level redirect requirements (do these first)

All of the following must reach the canonical page in **one 301 hop** each (verify every variant with `curl -sI`, chasing hops):

| From | To |
|---|---|
| `http://woodscrossingslc.com/*` | `https://www.woodscrossingslc.com/*` |
| `http://www.woodscrossingslc.com/*` | `https://www.woodscrossingslc.com/*` |
| `https://woodscrossingslc.com/*` | `https://www.woodscrossingslc.com/*` |

Note (from the Exhibit build): if DNS lives on Squarespace, forwarding rules silently fail to save while Domain Connect presets hold the apex records — delete those presets first. On Replit static serving, the edge 301s `/page` → `/page/` before rewrites; keep canonicals consistent and don't fight it.

## A. Serve as-is (exact path match, canonical, indexable)

| Path | Notes |
|---|---|
| `/` | Home |
| `/apartment-search` | Canonical availability page |
| `/contact` | |
| `/floor-plans` | |
| `/frequently-asked-questions` | FAQPage JSON-LD |
| `/gallery` | |
| `/north-salt-lake-ut/amenities` | Source canonical for amenities (see §B) |
| `/north-salt-lake-ut/neighborhood` | Source canonical for neighborhood (see §B) |
| `/pet-friendly` | |
| `/reviews` | Review snippets on LocalBusiness node |
| `/schedule-a-tour` | |
| `/virtual-leasing` | |
| `/privacy-policy` | |
| `/terms-of-service` | Canonical of the terms trio (see §B) |
| `/rental-scams` | |
| `/disclosure-fees` | |
| `/apply-online` | Canonical of the apply set (see §B) |
| `/residents` | |
| `/accessibility-statement` | |

## B. 301-consolidate (single-hop redirect to a canonical page)

| From | 301 to | Rationale |
|---|---|---|
| `/terms` | `/terms-of-service` | Three near-duplicate terms URLs; pick one |
| `/termsofservice` | `/terms-of-service` | " |
| `/amenities` | `/north-salt-lake-ut/amenities` | Source already canonicalized to the geo path |
| `/neighborhood` | `/north-salt-lake-ut/neighborhood` | " |
| `/availability` | `/apartment-search` | Source canonical was /apartment-search |
| `/apply-now` | `/apply-online` | Duplicate apply entry point |
| `/apply-now/layout-a/6a` | `/apply-online` | Per-unit apply deep links (old platform's unit tokens `6a/7e/1d/8f/1g/1h/8j` won't exist in the new system) |
| `/apply-now/layout-a/7e` | `/apply-online` | " |
| `/apply-now/layout-b/1d` | `/apply-online` | " |
| `/apply-now/layout-b/8f` | `/apply-online` | " |
| `/apply-now/layout-c/1g` | `/apply-online` | " |
| `/apply-now/layout-d/1h` | `/apply-online` | " |
| `/apply-now/layout-d/8j` | `/apply-online` | " |
| `/apartments/layout-a` | `/floor-plans` (or a per-plan page if you build them) | Old per-plan availability pages. **Recommended:** build `/floor-plans/layout-a`…`/layout-d` landing pages (they earn FloorPlan JSON-LD and long-tail queries — this pattern worked well on Exhibit) and 301 there instead |
| `/apartments/layout-b` | " | " |
| `/apartments/layout-c` | " | " |
| `/apartments/layout-d` | " | " |
| `/getdirections` | `/contact` | Utility page; fold directions into contact (or keep as-is if you want a dedicated directions page — then move to §A) |
| `/virtual-tours` | `/virtual-leasing` | **Decision:** the source `/virtual-tours` route returned home-page content during scrape (broken on the old platform), so it carries no distinct content or ranking. 301 to `/virtual-leasing`. Revisit only if the new owner adds real tour embeds — then make `/virtual-tours` the canonical tours page and 301 `/virtual-leasing` to it instead (never keep both live). |

All §B redirects must be single-hop (e.g. `/terms` → `/terms-of-service` directly, never via `/termsofservice`). Keep the map in one committed redirect module; add a guard test that every entry answers 301 with the exact target.

## C. Noindex / 404

| Path | Treatment | Rationale |
|---|---|---|
| `/accessible-one-page` | 301 → `/accessibility-statement` (or 410/404) | Old platform's auto-generated single-page accessibility rendering of the whole site; duplicate content, no user value. Prefer the 301 to be safe with any inbound links. |
| Anything else not listed | Noindex 404 stub with real 404 status | Never serve homepage HTML on unknown paths (soft-404). |

## Guard discipline

- Commit this classification as data (redirect map + route list) and add a build/postpublish check: every §A path returns 200 with its own title/canonical; every §B path returns exactly one 301 to its target; unknown paths return the noindex 404 stub.
- After launch, watch Search Console's page-indexing report for the §B sources to confirm consolidation, and submit new/changed URLs to IndexNow.
