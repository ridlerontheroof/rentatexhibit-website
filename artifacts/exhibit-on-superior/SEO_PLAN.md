# SEO Plan — Exhibit On Superior

_Audit + prioritized action plan. Site: https://www.rentatexhibit.com (React + Vite SPA, wouter routing, react-helmet-async, static sitemap/robots.)_

## Executive summary

The site already has a **strong SEO data layer**: per-page titles, meta descriptions, self-referencing canonicals, Open Graph + Twitter tags, and a rich JSON-LD `@graph` (Organization, WebSite, ApartmentComplex with NAP/geo/hours/amenities, WebPage, BreadcrumbList, FAQPage). NAP is consistent across the site and schema. `robots.txt`, `sitemap.xml`, and noindex handling for legal pages are all in place.

The **one issue that undercuts all of that**: the site is a client-rendered SPA. On every route except the home page, the initial HTML that crawlers and social scrapers receive contains the *home page's* `<title>`, an **empty** meta description, and **zero** JSON-LD. All the per-page SEO only appears after JavaScript executes. Googlebot usually renders JS eventually, but Facebook / LinkedIn / Slack / X link previews and most AI crawlers do not — so deep-page sharing and a large share of structured-data value are currently lost.

### Top priorities
1. **Prerender each route to static HTML at build time** so per-page meta + JSON-LD + content ship in the initial response. _(Critical — unlocks the entire existing SEO layer.)_
2. **Clean up the sitemap** — remove the external redirect URL, add `lastmod`, keep it auto-synced with routes. _(High)_
3. **Optimize images** (22 MB total, no WebP/AVIF) for LCP / Core Web Vitals. _(High)_
4. **Add floor-plan + reviews structured data** to win rich results. _(Medium)_

---

## Technical SEO findings

### 1. SPA renders no per-page HTML — CRITICAL
- **Issue:** Deep routes serve the home page's `<title>`, an empty `description`, and no JSON-LD in the raw HTML. Meta is injected client-side by react-helmet-async only after hydration.
- **Impact:** High. Social/rich link previews for every non-home page fall back to home content; non-JS crawlers (many AI/answer engines, some social bots) never see per-page titles, descriptions, or schema; slower/inconsistent indexing of deep pages.
- **Evidence:** `curl` of `/amenities` returns `<title>River North Chicago Apartments | Exhibit On Superior</title>`, an empty title tag, and `0` `application/ld+json` blocks. Only `index.html` (home) has hardcoded meta.
- **Fix:** Add build-time prerendering / static generation so each of the ~13 indexable routes emits its own fully-formed HTML (title, description, canonical, OG/Twitter, JSON-LD, and visible body content). Options, in order of fit for this stack:
  - A lightweight prerender step in the Vite build that renders each route in `PAGE_SEO` to a static `.html` (e.g. `vite-plugin-prerender`-style, `react-snap`, or a small custom Puppeteer/`react-dom/server` script driven by the `PAGE_SEO` keys).
  - Or migrate the app to an SSG/SSR framework — larger change, only if broader server rendering is wanted.
- **Priority:** 1 (blocking full value of existing SEO work).

### 2. Sitemap accuracy — HIGH
- **Issue:** `public/sitemap.xml` lists `/available-units`, which is a **client redirect to an external Highland domain** (not an indexable page on this site). It also has no `<lastmod>` and is maintained by hand, so it can drift from `PAGE_SEO` / routes.
- **Impact:** Medium–High. Sitemaps should contain only canonical, indexable, 200-returning URLs on this domain; a redirect entry wastes crawl signal. Missing `lastmod` weakens recrawl prioritization.
- **Evidence:** `/available-units` and `/apply` are `<Redirect>` routes in `App.tsx`; `/available-units` appears in the sitemap, `/apply` does not (inconsistent). No `lastmod` on any entry.
- **Fix:** Remove `/available-units` (and any external-redirect path) from the sitemap. Add `<lastmod>`. Generate the sitemap from `PAGE_SEO` (excluding `noindex` entries) during the build so it can never drift — this pairs naturally with the prerender step in #1.
- **Priority:** 2.

### 3. Image weight & formats — HIGH (Core Web Vitals)
- **Issue:** `public/images` is ~22 MB; `floor-plans` alone is ~11 MB, with individual JPEGs up to ~772 KB. All raster JPEG, no WebP/AVIF, no responsive `srcset`.
- **Impact:** High for LCP/INP on mobile, especially the home hero slider (9 large images) and the floor-plans gallery.
- **Evidence:** `du -sh public/images` = 22M; largest single image 772K; no `.webp`/`.avif` present.
- **Fix:** Convert gallery/hero/floor-plan images to WebP (and/or AVIF) with quality ~75–80; add `width`/`height` attributes to prevent CLS; serve responsive sizes via `srcset`/`sizes`; confirm below-the-fold images stay `loading="lazy"` and the hero's first slide stays `eager`/high priority (already done). Target hero LCP < 2.5s on mobile.
- **Priority:** 2.

### 4. Canonical / host consistency — LOW (verify)
- **Issue:** Canonicals and schema use `https://www.rentatexhibit.com`. Ensure the live host 301-redirects non-www→www (and http→https) so signals consolidate on the canonical host.
- **Impact:** Medium if misconfigured (duplicate host indexing), otherwise none.
- **Fix:** Confirm DNS/redirect config at the domain/host level once deployed to the production domain. No code change if already correct.
- **Priority:** 4.

---

## On-page & content findings

### 5. Titles & descriptions — GOOD, minor tuning
- Titles are unique, keyword-led, and mostly within 50–60 chars; descriptions are unique and compelling. No action required beyond keeping them within range as pages change. **Priority: 5.**

### 6. Thin content risk on secondary pages — MEDIUM
- **Issue:** Pages like `/artist-in-residence`, `/pet-friendly`, `/map-directions`, `/residents` risk being thin (short body + FAQ). Depth drives rankings and helpful-content signals.
- **Fix:** Ensure each indexable page has genuinely useful, unique body copy (neighborhood detail, pet policy specifics, resident resources) beyond the Quick Answer + FAQ. Lean on real content from the migration bundle rather than padding.
- **Priority:** 3.

### 7. Floor-plan structured data — MEDIUM (rich-result opportunity)
- **Issue:** `ApartmentComplex` schema exists site-wide, but individual floor plans have no `Accommodation`/`Apartment` (+ `numberOfRooms`, `floorSize`, `Offer`/price) structured data. Availability/pricing is also off-site (Highland/AppFolio).
- **Fix:** When per-plan availability/pricing is surfaced (see related task on live availability), emit per-plan `Accommodation` schema and, where a price is known, an `Offer`. Pairs with the floor-plans gallery `ItemList` already supported via `extraJsonLd`.
- **Priority:** 3.

### 8. Reviews schema — MEDIUM (ties to Reviews work)
- **Issue:** The Reviews page links out to review sources but exposes no on-page `Review`/`AggregateRating` schema.
- **Fix:** Once real, verifiable resident reviews are shown on the page (see the in-progress reviews task), add `Review` + `AggregateRating` under the `ApartmentComplex` node — but **only for genuinely displayed, verifiable reviews** (Google requires the rating be visible on the page; never fabricate).
- **Priority:** 3.

---

## Off-site / operational (no code)
- **Google Business Profile:** Claim/optimize the GBP for 165 W Superior St — categories, photos, hours matching the site, and posts. Biggest local-SEO lever for an apartment community. **Priority: 2 (business action).**
- **Search Console + Bing Webmaster Tools:** Verify the production domain, submit `sitemap.xml`, monitor Coverage and Core Web Vitals. **Priority: 1 (business action, do at launch).**
- **Analytics:** Confirm GA4 (or equivalent) is installed to baseline organic traffic and conversions (tour requests). **Priority: 2.**

---

## Prioritized action plan

**Phase 1 — Make existing SEO actually visible (do first)**
1. Prerender all indexable routes to static HTML at build time (per-page title, description, canonical, OG/Twitter, JSON-LD, visible content). _(Finding 1)_
2. Generate `sitemap.xml` from `PAGE_SEO` during build; drop `/available-units`; add `lastmod`. _(Finding 2)_
3. At launch: verify domain in Search Console + Bing, submit sitemap, confirm www/https redirects. _(Findings 4, off-site)_

**Phase 2 — Performance & Core Web Vitals**
4. Convert and compress images to WebP/AVIF, add dimensions + responsive `srcset`, verify hero LCP. _(Finding 3)_

**Phase 3 — Depth & rich results**
5. Strengthen thin secondary-page content. _(Finding 6)_
6. Add per-floor-plan `Accommodation`/`Offer` schema alongside live availability. _(Finding 7)_
7. Add `Review`/`AggregateRating` schema once real reviews are displayed. _(Finding 8)_

**Phase 4 — Ongoing**
8. Optimize Google Business Profile; monitor GSC Coverage + Core Web Vitals monthly; keep titles/descriptions within range as content changes.

---

_Quick wins (low effort, immediate): remove `/available-units` from the sitemap, add `lastmod`, and compress the handful of largest JPEGs. The highest-leverage item overall is Phase 1 prerendering — without it, most of the work already in `seo.ts` never reaches non-JS crawlers._
