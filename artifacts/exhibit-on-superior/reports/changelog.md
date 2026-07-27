# Change log — SEO/QA programme, July 2026

Final QA evidence package, item 6. Summarises what changed across the merged
work, what is still open, and what needs owner/business action.

## Routes changed / added

- **Per-page prerendered HTML for every route** — the SPA now ships full
  static HTML (title, description, canonical, OG/Twitter, JSON-LD, body
  content) per route at build time; previously every deep route served the
  homepage head and no structured data.
- **Per-unit pages** — `/available-units/<unit>` prerendered per available
  apartment, driven by the availability snapshot; rented units go noindex.
- **Knowledge Center** — `/knowledge` hub + Q&A article pages (`/knowledge/<slug>`),
  each with FAQPage JSON-LD and markdown twins for AI/answer engines
  (`llms.txt` / `llms-full.txt` regenerate on every build).
- **Floor-plan hub** — `/floor-plans` is now a real indexable hub (was a
  redirect) with one landing page per distinct plan layout
  (`/floor-plans/<slug>`).
- **Static content pages** added: fees, apartment guide, parking &
  transportation, application guide, FAQ, about, reviews, and more — 134 URLs
  in the sitemap.
- **Markdown twins (AEO)** — every indexable page has a `.md` variant
  generated from the rendered HTML for AI crawlers.

## Redirects added

- **21 legacy URL 301s** (Wix/WordPress `/apartments/il/chicago/*` paths and
  RentCafe-era `.aspx` URLs) — all answer single-hop 301s to their canonical
  targets (see `url-crawl.csv`); source of truth is
  `src/data/legacyRedirects.ts`, guarded by a build-time parity check and the
  post-publish `check-legacy-redirects` watchdog.
- **Trailing-slash 301s** (e.g. `/amenities/` → `/amenities`).
- **Apex → www** — `rentatexhibit.com` 301s to `https://www.rentatexhibit.com`
  via Squarespace domain forwarding (owner-side DNS; verified live, see
  `headers.md`).

## Structured data added

- Sitewide `@graph`: Organization, WebSite, ApartmentComplex (NAP, geo,
  hours, amenities), WebPage, BreadcrumbList.
- Per-unit pages: Apartment/Accommodation offer data.
- Knowledge articles: FAQPage; hub: CollectionPage.
- Reviews: LocalBusiness aggregate rating (validator-clean; prerendered
  JSON-LD stripped pre-hydration to avoid duplicate ratings).
- Videos: VideoObject with real `uploadDate` (YouTube/Vimeo metadata cached
  at build time).
- All pages validate clean — see `structured-data.md`; `check:postpublish`
  re-submits live pages to validator.schema.org after every publish.

## Serving-layer changes

- Production serves through an Express layer (`server/index.mjs`): brotli
  compression, `max-age=31536000, immutable` on hashed assets, weak ETags +
  Last-Modified on HTML, HSTS, X-Frame-Options/nosniff/Referrer-Policy/
  Permissions-Policy, CSP (enforced via `CSP_ENFORCE=1`), real 404s instead
  of SPA soft-404s, and single-hop 301s for the legacy URLs.

## Remaining known issues (each has its own follow-up task)

- Bing ping on unit rent/re-price — confirmation pending.
- Stale prerendered head override on next rent event — verification pending.
- Temporary square-footage override for unit 0610 (awaiting AppFolio fix).
- Homepage starting-price accuracy after next publish — verification pending.
- Lead-volume alert thresholds need tuning once real traffic exists.
- Remaining server watchdogs (beyond floor-plan and legacy-redirect) should
  confirm their runs in deployment logs.
- Stale "478 sq ft" search snippet for apartment 2705 — verify it drops out
  of results.
- Social share cards to be regenerated to mention convertibles.
- Floor-plan card floor-range consistency guard (vs plan sheet).
- Review dates in structured data (rich-result trust improvement).
- Knowledge Center answers to be re-verified before review dates expire in
  late November 2026.

## Items requiring business/owner confirmation (owner-side accounts)

- **Google Search Console**: verify property, submit sitemap, request
  indexing of the new floor-plan pages (task exists).
- **Bing Webmaster Tools**: same submission on the owner's account.
- **Squarespace apex-domain forwarding**: fixed and verified live
  (apex 301 → www); keep the Domain Connect presets deleted or the
  forwarding rule silently stops saving.
- **Third-party directory updates** (Apartments.com, Google Business Profile,
  etc.): update any legacy deep links to the new canonical URLs.
- **Google Business Profile duplicate listing**: the old 4.2/136 rating lives
  on a duplicate profile awaiting a Google merge — owner to follow up with
  Google support.
- **Walk/Transit/Bike Scores**: re-verify quarterly (next: January 2027).
