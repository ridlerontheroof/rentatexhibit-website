# Baseline SEO/AEO Audit — Exhibit On Superior (www.rentatexhibit.com)

Task: Highland SEO/AEO Task 01 (read-only). Date: 2026-07-30.
Evidence sources: repository (`artifacts/exhibit-on-superior/`, root configs) and a live read-only crawl of all 136 sitemap URLs plus targeted probes. Companion inventories:
- `reports/audits/url-inventory.csv` (150 rows)
- `reports/audits/metadata-inventory.csv` (title/description/canonical/robots/OG/H1 per sitemap URL)
- `reports/audits/schema-inventory.csv` (JSON-LD block count and @types per sitemap URL)

## 1. Platform & rendering

| Area | Observed | Evidence |
|---|---|---|
| Package manager | pnpm workspaces (preinstall guard rejects npm/yarn) | root `package.json` `preinstall` script |
| Framework | React 19 SPA, Vite, Wouter router | `artifacts/exhibit-on-superior/package.json`, `src/routes.tsx` |
| Rendering | Build-time prerender of every indexable route to static HTML (`scripts/prerender.mjs` + `src/entry-server.tsx`); react-helmet-free client `<Seo>` handles SPA navigation | `package.json` `build` script; `seo_strategy.md` |
| Production serving | Express server `server/index.mjs` (autoscale) serving `dist/public`, applying `artifact.toml` rewrite pairs, legacy 301s, markdown twins, CSP | `artifacts/exhibit-on-superior/server/`, `.agents/memory/production-express-serving.md` |
| Content sources | Typed data modules in `src/data/` (seo.ts, floorPlans.ts, floorPlanPages.ts, knowledge.ts, fees.ts, propertyFacts.ts, reviews.ts, etc.); availability from AppFolio via api-server, baked snapshot `src/data/availabilitySnapshot.json` at build | `src/data/` listing |
| Note | Workspace `dist/` is stale (only 2 prerendered pages present — no full build has run in this workspace copy). Live production output was used as the audit surface. | `dist/public` listing vs live crawl |

## 2. Crawl results (all 136 sitemap URLs, live)

Confirmed healthy (no defects found):
- **Status:** 136/136 return HTTP 200. Unknown routes 404 (`/no-such-page-xyz` → 404).
- **Titles:** unique across all 136 pages; no duplicates.
- **Meta descriptions:** present on all pages (see metadata inventory for lengths).
- **Canonicals:** present on all 136 pages, absolute `https://www.rentatexhibit.com/...` self-referencing.
- **Robots meta:** all sitemap pages `index, follow, max-image-preview:large`; zero noindex leaks into the sitemap.
- **H1:** exactly one H1 per page on all 136 pages.
- **Open Graph:** og:title and og:image present on all 136 pages; page-specific OG share cards (generated, stamped by `og-cards-stamp.json`).
- **JSON-LD:** every page carries a site-wide graph (WebSite, Organization, ApartmentComplex+LocalBusiness, BreadcrumbList) plus page-type nodes; all blocks parse as valid JSON (0 parse errors). Types observed: FloorPlan (52), Apartment/Offer (33 each, on `/available-units` and unit pages), Article+WebPage (70 knowledge pages), FAQPage (89), VideoObject (7), ImageGallery, ItemList, OfferCatalog, AboutPage.
- **Redirects:** apex `rentatexhibit.com` → 301 → `www.` (single hop). Legacy URLs 301 single-hop: `/artist-in-residence` → `/`, `/apartments/il/chicago/photo-gallery` → `/photo-gallery`, `/video.aspx` → `/virtual-tour` (map in `src/data/legacyRedirects.ts`, mirrored in artifact.toml rewrites with a prerender parity guard).
- **robots.txt:** allows all crawlers, explicitly welcomes AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Applebot-Extended, etc.); references sitemap.
- **Sitemap:** 136 URLs; lastmod computed from content-hash of each page's markdown twin (`.agents/memory/sitemap-lastmod-map.md`), so lastmod only advances on real content change.
- **Intentional noindex (correct):** `/schedule-showing`, `/start-application`, `/accessibility-statement` serve `noindex, follow` and are excluded from the sitemap (`src/data/seo.ts` lines 713–750).
- **AEO surface:** `/llms.txt` (200) with entity summary + curated links; `/llms-full.txt` (200) full catalog; every page has a Markdown twin (`/amenities.md` → 200) and honors `Accept: text/markdown`.
- **Images:** homepage: 19/19 `<img>` tags carry alt attributes; responsive srcset rungs with a ~200KB budget guard (`image-size-vs-sharpness` guard tests).
- **Accessibility:** dedicated `check:a11y` (axe-core) script, reduced-motion guards, link-name tests, focus-trap fixes in repo; accessibility statement page exists.
- **Performance guards:** `check:perf` Lighthouse lab suite, above-fold guard (`check:fold`), CLS-hardening patterns (inert SSR placeholders, route-chunk preload) are in place per repo scripts and tests.

## 3. Findings (classified)

### Confirmed defects

- **P1 — Google Analytics container is empty; no visit data is being recorded.** GTM container `GTM-MDPWH532` loads (deferred, on gesture/load — evidence: homepage HTML) but the container has no GA4 tag configured, so no analytics hits fire. Known issue, already tracked as project task #519 ("Turn Google Analytics back on"). Impact: zero organic-traffic measurement; any SEO work cannot be measured until fixed. Evidence: homepage HTML contains only the GTM ID; project task list.
- **P3 — Root `replit.md` is partially templated.** Heading is still `# [Project name]` with placeholder sections, while operational "Gotchas" content below is real. Cosmetic/documentation only. Evidence: `/replit.md` lines 1–3.

### Recommendations (no defect observed)

- **P2 — FAQPage schema breadth.** FAQPage JSON-LD appears on 89/136 pages (including the homepage). Homepage does render a visible FAQ section (evidence: "Frequently Asked" text in prerendered HTML), and knowledge pages are inherently Q&A, so no violation was confirmed — but per current Google guidance FAQ rich results are restricted to well-known authoritative sites, and broad FAQPage markup yields little. Recommend a page-by-page verification that every FAQPage node mirrors visible on-page Q&A (spot-checked pages passed), and consider whether FAQPage on every marketing page is worth the markup weight.
- **P2 — `/floor-plans/three-bedroom` style category deep links:** keyword strategy targets per-bedroom-type queries; `/floor-plans` hub exists but probed sub-path returned 404 (the hub uses filter URLs instead). Consider whether the existing floor-plan landing pages already cover each bedroom cluster (repo has `floorPlanPages.ts`) — map keyword clusters to those pages before creating anything new (anti-doorway rule applies).
- **P3 — `/floorplans` (no hyphen) 404s.** Not a known legacy URL, so acceptable; only add a 301 if Search Console/logs show real traffic to it.
- **P3 — knowledge review-date freshness window:** `KNOWLEDGE_REVIEWED_DATE` articles hit the 120-day staleness gate in late November 2026 (already tracked as task #497).

### Uncertain facts (labeled, not inferred)

- Current rent, availability, concessions, and per-unit fees were NOT audited for correctness — they come from the live AppFolio feed (`/api/availability`, observed responding with units/rents) and are time-sensitive by governance rank 4. No claim is made here about their accuracy.
- Fee amounts published on `/fees` ($60 application, $500 admin, $95–$195 utility tiers, $335 parking, $25 storage, pet fees) are live public claims; `config/property_context.yaml` marks its fee examples as historical/unverified. Logged in `reports/fact_conflicts.md`.

## 4. Risks to analytics & leasing integrations

- **Analytics:** the empty GA container (P1 above) means any change made now has no measurable baseline. Do not add or modify tags as part of SEO work — GTM loading is deliberately deferred and CSP-hashed (`.agents/memory/gtm-deferred-loading.md`, `gtm-injected-inline-csp.md`); naive tag changes can break CSP checks (`check:csp`).
- **Leasing integrations:** lead forms post through api-server to Gmail SMTP + AppFolio guest cards, with a server-side bot guard (honeypot + fill-time) and visit-scoped UTM→source attribution requiring the exact `Website (Token)` label format. Availability and showing scheduling proxy AppFolio with strict snake_case bodies and slot-format normalization. **Any SEO change touching forms, URLs with UTM handling, or the availability/unit pages risks these flows** — they are protected by suite tests and post-publish watchdogs; run the full validation set before any future (non-read-only) task.
- **Structured data:** aggregate-rating/review JSON-LD has strict placement rules (LocalBusiness node, prerendered node stripped pre-hydration) — do not touch without reading `.agents/memory/reviews-jsonld-gsc.md`.

## 5. AEO / entity consistency

- Entity is consistently "Exhibit On Superior", 165 W Superior St, Chicago (River North), managed by Highland Management — consistent across llms.txt, Organization/ApartmentComplex JSON-LD, and page copy (spot-checked).
- llms.txt states "298-unit" community; `config/property_context.yaml` unit-mix should be reconciled against this during Task 02+ (not verified here; labeled uncertain).
- Markdown twins + Accept negotiation + explicit AI-crawler robots allowances make the AEO surface unusually complete; no AEO defects found.

## 6. Deliverable-format wrap-up (per AGENTS.md)

### Summary
Read-only baseline audit executed. The site is in strong technical SEO health: 136/136 sitemap URLs return 200 with unique titles, present descriptions, correct canonicals, single H1s, full OG and valid JSON-LD; redirects are single-hop 301s; robots/sitemap/llms.txt are correct. The one confirmed high-impact defect is the empty GA container (P1, pre-existing, tracked). Inventories and this report were produced; no production files were modified.

### Files Changed
- `reports/audits/baseline-audit.md` (new)
- `reports/audits/url-inventory.csv` (new)
- `reports/audits/schema-inventory.csv` (new)
- `reports/audits/metadata-inventory.csv` (new)
- `docs/REPOSITORY_COMMANDS.md` (new — verified command list)
- `reports/fact_conflicts.md` (new — one logged conflict)

### Validation
- Live crawl of 136 sitemap URLs (read-only GETs): 0 non-200, 0 duplicate titles, 0 missing canonicals, 0 H1 anomalies, 0 JSON-LD parse errors.
- Targeted probes: apex redirect, legacy 301 samples, noindex utility pages, llms/markdown twins, 404 behavior — all as designed.
- No build/test commands were run (read-only task; running the web build would rewrite generated data files). Commands verified textually against `package.json` files in `docs/REPOSITORY_COMMANDS.md`.

### Fact Conflicts
One recorded (fee schedule: property_context historical values vs live /fees page) — see `reports/fact_conflicts.md`. Unresolved; requires management verification per governance.

### Risks
See §4. Nothing in this task changed runtime behavior; risk register is forward-looking for Task 02+.

### Next Recommended Task
Restore GA4 measurement by configuring the tag inside the existing GTM container (project task #519) — every subsequent SEO task is unmeasurable until analytics records visits.
