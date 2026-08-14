# SEO/AEO Playbook — distilled from the Exhibit On Superior build

Two months of production SEO/AEO lessons from a comparable leasing site (Vite SPA + prerender on Replit), generalized so the Woods Crossing build can start from them instead of rediscovering them. This complements `HANDOFF.md` and `SEO_AEO_CHECKLIST.md` (what exists in this bundle); this doc is *how to keep it correct as the site evolves*.

## 1. Per-URL prerendered heads (the single highest-leverage item)

- Every indexable route must ship its own **static HTML** with unique `<title>`, meta description, canonical, OG/Twitter tags, and JSON-LD in the initial response. Googlebot renders JS eventually; Facebook/LinkedIn/Slack/iMessage link scrapers and most AI/answer-engine crawlers **never** do.
- Keep SEO metadata as a **plain data model** (one `PAGE_SEO`-style map: path → title/description/canonical/jsonLd), consumed by both the client head component and the build-time renderer. Never let head tags live only inside components.
  - If you use React 19 SSR: `react-helmet-async` is broken there (children leak into the body, context comes back empty). Serialize head tags from the shared model with a plain string serializer instead.
- Verify with `curl` (not a browser): fetch a deep route and check the raw `<title>` and the count of `application/ld+json` blocks.
- **Parity guard (build-time, hard fail):** routes ⇄ SEO-map keys must match exactly. A new page missing its SEO entry, or an SEO entry with no route, fails the build. Without this, a new page silently ships with home meta.
- On Replit static/artifact serving, clean URLs need **explicit rewrite pairs** (`/page` and `/page/` → `/page/index.html`) before the SPA catch-all — extensionless paths do NOT auto-resolve to directory indexes. Add a build guard that fails when prerendered paths and rewrites drift (both directions).
- Unknown paths must serve a **noindex 404 stub**, never the homepage HTML (soft-404s poison the index).

## 2. JSON-LD patterns for an apartment site

- **Dual-type the property entity** `["ApartmentComplex","LocalBusiness"]` — ApartmentComplex alone can't carry `priceRange`, review snippets, etc. Any code that finds nodes by `@type` must handle arrays.
- **Review/aggregateRating nodes belong on the LocalBusiness** identity (Google's review-snippet eligibility), not on ApartmentComplex. Include review **dates**. Never emit the same aggregateRating twice (e.g. prerendered + client-injected — strip one before hydration).
- **FloorPlan nodes** per plan; a building-wide summary FloorPlan can carry the sq-ft range. Per-unit inventory = one `Apartment` node + a standalone `Offer` linked via `itemOffered` `@id` (schema.org core has no `offers` on Apartment).
- **Organization referenced by `@id`**, everywhere: nested `Organization` nodes (author, parentOrganization) should be `{"@id": ".../#organization"}` refs, or they trigger "missing logo/telephone" recommended-property warnings.
- Ship a build-time **JSON-LD validator**: parseable JSON, `@context`, `@type` on every node, no dangling internal `@id` refs, and a recommended-properties check pinned to zero warnings. Fail the build, not the Search Console report.
- FAQPage, BreadcrumbList (visible breadcrumbs must mirror the JSON-LD crumbs exactly), WebSite/WebPage per page.

## 3. AEO: markdown twins + llms.txt

- Generate a `.md` twin for each page **from the rendered `<main>` HTML** during prerender (never hand-maintained), plus `llms.txt` (index) and `llms-full.txt` (full corpus), regenerated deterministically every build. The bundle ships initial versions in `public/` — wire regeneration into the build or they will rot.
- Answer-first content: a direct-answer block (< ~100 words) at the top of each Q&A/guide page; the question in title + H1; self-canonical. AI assistants quote these verbatim — **never invent facts**; flag uncertain facts (this bundle's `MISSING_AND_UNCERTAIN_FACTS.md` discipline) and defer to the leasing office.

## 4. Sitemap + freshness signals

- Generate `sitemap.xml` **from the same SEO map** in the prerender step so it can never drift.
- `lastmod` must come from a **content hash → date map** committed to the repo (page content changed ⇒ new date), never the build date — build-date lastmods teach Google to ignore your lastmods.
- **IndexNow post-publish pings:** after each publish, diff the live sitemap lastmods against saved state and submit only new/changed URLs to IndexNow (Bing et al.). Keep the state file gitignored.

## 5. Redirect & canonical-domain hygiene

- Pick ONE canonical origin (`https://www.woodscrossingslc.com`) and 301 everything else in **one hop**: apex→www, http→https. Verify with `curl -sI`, chasing each hop; multi-hop chains bleed crawl budget and signals.
  - If DNS is on Squarespace: forwarding rules won't save while Domain Connect presets hold the apex records — delete the presets first.
- **Legacy/renamed URLs:** single-hop 301s at the serving layer, driven from one committed redirect map. If your static layer can only do meta-refresh stubs, have the production server upgrade them to real 301s.
- **Trailing slashes:** Replit's static edge 301s `/page` → `/page/` before your rewrites run; don't fight it. Keep canonicals consistent, and use the trailing-slash form anywhere a zero-redirect URL matters (ads final URLs).
- 404s: noindex stubs, correct status where the serving layer allows it.

## 6. Guard-test discipline (what keeps all of the above true)

The pattern that mattered most: **every SEO invariant gets a build-time guard that fails loudly.** Specific disciplines:

- Head parity (routes ⇄ SEO map), rewrite parity (prerendered paths ⇄ serving rewrites), sitemap generated not hand-edited.
- Structured-data validation + recommended-properties pinned to zero warnings.
- **Fact-discipline scans:** guard tests that grep source for numeric facts (sq ft, prices, unit counts) and check them against the single source-of-truth data file. Gotchas: decode `\uXXXX` escapes before scanning, and exclude phone numbers / CSS color shades from 3-digit regexes.
- **Snapshot freshness with a stamp-refresh rule:** if pages are baked from a data snapshot (availability), the prerender must hard-fail when the snapshot is stale (e.g. >48h) — otherwise unit pages silently vanish from a publish. BUT: refresh the timestamp once it passes half the max age even when the data is unchanged, so a quiet period with zero changes can't fail builds.
- Guards that read build output must gate on the build's **last-written** file (e.g. the precompressed `index.html.br`), or they race a concurrent rebuild and fail spuriously.

## 7. Performance traps that show up as SEO problems (CWV)

- **Prerender + lazy routes CLS trap:** boot must preload the current route's chunk before first render, or the prerendered page collapses to the Suspense fallback and CLS explodes site-wide (we measured 0.31).
- Client-only UI that mounts **after hydration above visible content** (filter rows, controls) blows CLS — render an inert `aria-hidden` placeholder twin in the prerendered HTML to reserve the space (aria-hidden also keeps it out of the markdown twins).
- One LCP preload per page, derived from that page's own eager hero (`imagesrcset` AVIF hint, exact-match srcset). Guard that the injected hint matches the page body.
- React 19 SSR silently emits `<link rel="preload" as="image">` for eager plain `<img>`s — audit for fixed-href image preloads in prerendered heads.
- Images: fit a per-image byte budget by lowering quality at full width (`target-size`), never by shrinking pixel width below the display size.

## 8. Analytics without wrecking performance

- **Defer GTM/GA4:** load `gtm.js`/`gtag.js` on the first real user gesture (never `scroll`) or shortly after `load` — never eagerly. gtag alone adds a fixed ~150ms TBT floor on mobile.
- Under GTM, page-level `gtag()` stubs are ignored — self-load gtag.js + config, and put `send_to` on every event. Let the GA4 stream own `page_view`s (manual ones double-count SPA navigations).
- Third-party embeds (maps, 3D tours, video): click-to-load facades behind poster buttons; maps may defer on viewport proximity. Keep the real URL in a `data-` attribute so prerender-content tests still see it.
- If you enforce a hashed CSP, GTM Custom-HTML-injected inline scripts need their hashes added explicitly.

## 9. Content engine rules (blog / knowledge / guides)

- Articles are **pure content data rendered through a dynamic route** (like unit pages): new slugs need only data + a rewrite pair; heads come from a shared model builder; llms.txt regenerates automatically.
- `draft: true` gates publishing; draft content is exempt from published-set guards, but prove publishability by simulating the published set **including inbound related links** before flipping the flag.
- Cadence: about one guide per week beats bursts. Draft from a **fact pack** (approved facts only) — constrained drafting prevents invented claims on AI-quotable pages.
- Citations: model external references as `CreativeWork` nodes.

## 10. Operational lessons

- **Post-publish verification:** there is no deploy webhook on Replit — stamp a build id into the output and run a workspace watcher that detects the new publish going live, then runs live-site checks (heads, redirects, sitemap, IndexNow) and alarms on failure.
- The deploy runtime has **no Chromium** and drops the first ~25s of stdout — live checks must be HTTP-based and watchdogs must not rely on startup heartbeats.
- Link previews (iMessage especially) cache per-message; after fixing OG tags, verify with a hydrated-head check and send a **new** message.
- OG share cards: script-generate from a page → photo/tagline map; never hand-edit outputs.
- Trust-proxy on Replit: multiple internal hops behind the edge — trust private/loopback CIDRs, never a numeric hop count, or every visitor rate-limits as 127.0.0.1.
- Lead forms: honeypot (nonsense field name — Safari autofills "company") + fill-time check, validated **server-side before any side effect**; omit elapsed time when the visitor never typed.
