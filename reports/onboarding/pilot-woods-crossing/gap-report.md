# Standards gap report — https://www.woodscrossingslc.com

Manifest: v1.0.0 (standard: Exhibit On Superior production implementation (rentatexhibit.com))
Generated: 2026-08-16T18:05:01.475Z

**Summary:** FAIL: 2 · SKIPPED: 11 · KIT-GUARD: 20 · MANUAL: 1

| Check | Category | Status | Detail |
|---|---|---|---|
| `head.per-url` | canonicals/metadata | **FAIL** | 39 inventoried pages: 2 missing title, 2 missing description (offline inventory) |
| `head.canonical-self` | canonicals/metadata | **FAIL** | 14/39 pages missing canonical (offline inventory) |
| `index.noindex-404` | indexability | **SKIPPED** | offline inventory — network checks unavailable (site bot-walled or archived) |
| `index.robots` | indexability | **SKIPPED** | offline inventory — network checks unavailable (site bot-walled or archived) |
| `sitemap.generated` | sitemap/llms/twins | **SKIPPED** | offline inventory — network checks unavailable (site bot-walled or archived) |
| `aeo.md-twins` | sitemap/llms/twins | **SKIPPED** | offline inventory — network checks unavailable (site bot-walled or archived) |
| `redirects.one-hop` | redirects | **SKIPPED** | offline inventory — network checks unavailable (site bot-walled or archived) |
| `csp.enforced` | CSP | **SKIPPED** | offline inventory — network checks unavailable (site bot-walled or archived) |
| `ops.production-server` | post-publish | **SKIPPED** | offline inventory — network checks unavailable (site bot-walled or archived) |
| `jsonld.valid` | JSON-LD | **SKIPPED** | offline inventory — network checks unavailable (site bot-walled or archived) |
| `jsonld.property-entity` | JSON-LD | **SKIPPED** | offline inventory — network checks unavailable (site bot-walled or archived) |
| `images.alt` | alt/image budgets | **SKIPPED** | offline inventory — network checks unavailable (site bot-walled or archived) |
| `images.budget` | alt/image budgets | **SKIPPED** | offline inventory — network checks unavailable (site bot-walled or archived) |
| `redirects.trailing-slash` | redirects | **MANUAL** | Canonicals consistent with the platform's directory-index 301; zero-redirect (ads) URLs use the trailing-slash form. |
| `head.parity` | canonicals/metadata | **KIT-GUARD** | satisfied by adopting the kit: prerender.mjs parity guard |
| `jsonld.no-duplicate-ratings` | JSON-LD | **KIT-GUARD** | satisfied by adopting the kit: check:schema |
| `images.og-cards` | alt/image budgets | **KIT-GUARD** | satisfied by adopting the kit: generate-og-cards.mjs + stamp check |
| `a11y.axe` | a11y | **KIT-GUARD** | satisfied by adopting the kit: check:a11y |
| `analytics.deferred` | analytics | **KIT-GUARD** | satisfied by adopting the kit: check:gtm |
| `analytics.events` | analytics | **KIT-GUARD** | satisfied by adopting the kit: check:gtm |
| `appfolio.feed-health` | AppFolio | **KIT-GUARD** | satisfied by adopting the kit: availability route + snapshot guard + check:rented |
| `appfolio.lead-push` | AppFolio | **KIT-GUARD** | satisfied by adopting the kit: leads route + guestCardAlert |
| `appfolio.tour-fallback` | AppFolio | **KIT-GUARD** | satisfied by adopting the kit: showings route + showingFormatAlert + tourUnit |
| `leads.bot-guard` | bot guard/attribution | **KIT-GUARD** | satisfied by adopting the kit: botGuard + botGuardAlert |
| `leads.attribution` | bot guard/attribution | **KIT-GUARD** | satisfied by adopting the kit: visitSource + leadSource |
| `perf.cwv` | performance | **KIT-GUARD** | satisfied by adopting the kit: check:perf + check:fold |
| `ops.postpublish-watch` | post-publish | **KIT-GUARD** | satisfied by adopting the kit: watch-postpublish.mjs + check:postpublish |
| `ops.indexnow` | post-publish | **KIT-GUARD** | satisfied by adopting the kit: submit-indexnow.mjs |
| `ops.alert-routing` | post-publish | **KIT-GUARD** | satisfied by adopting the kit: emailThrottle + dailyClaim + alert modules |
| `content.linking` | content systems | **KIT-GUARD** | satisfied by adopting the kit: check:link-names |
| `content.faq` | content systems | **KIT-GUARD** | satisfied by adopting the kit: check:schema + check:knowledge |
| `content.knowledge` | content systems | **KIT-GUARD** | satisfied by adopting the kit: check:knowledge |
| `content.blog` | content systems | **KIT-GUARD** | satisfied by adopting the kit: generate:blog-queue:check |
| `facts.discipline` | content systems | **KIT-GUARD** | satisfied by adopting the kit: fact-discipline tests |

Legend: **FAIL/WARN/PASS** = measured over HTTP now · **KIT-GUARD** = enforced by the template kit's guard suite once adopted (verify by running the kit's check:prepublish/check:postpublish green) · **MANUAL** = human review item · **SKIPPED** = not measurable in this mode.
