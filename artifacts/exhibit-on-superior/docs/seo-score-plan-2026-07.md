# SEO/AEO Score Plan — get every category near 100

Written July 26, 2026, from the post-publish squirrelscan audit (58/F overall,
108 pages, `-C full`; see `seo-audit-2026-07-26.md`). This plan turns the
deferred items into an executable roadmap and adds everything else needed to
push each category toward 100.

Current category scores and the ceiling holding each one down:

| Category | Score | Root cause |
| --- | --- | --- |
| Performance | 40 | No gzip/Brotli, no `cache-control: max-age`, 322 KB main JS, ~13 MB total weight |
| Content | 41 | Thin/short answers on secondary pages, no About page, no author attribution |
| Security | 44–46 | No CSP / HSTS / X-Frame-Options / Permissions-Policy; cookie flags |
| Crawlability | 48 | Trailing-slash 301 chains on every internal link, soft 404s, `/sitemaps.xml` probe |
| Agent Experience | 50 | No Markdown variant, visible text <15% of HTML |
| Video | 51 | No VideoObject schema on unit-tour embeds (ticketed #337) |
| Images | 76 | 24 images >200 KB; heroes eager but without `fetchpriority`/preload on secondary pages |
| E-E-A-T | 77 | No About page, no author bylines |
| Core SEO | 79 | 52 knowledge titles 80–90 chars (ticketed #331); param-variant duplicate titles |
| Links | 80 | Redirect-chain internal links (same trailing-slash cause), 4 weak knowledge pages (#339) |
| Accessibility | 83 | Fixed in repo (slider `aria-valuenow`, search labels) — clears next publish; contrast warnings remain |
| Structured Data | 88 | VideoObject missing; review dates (ticketed #170) |

## Phase 1 — Serve the site from a small server (unblocks 4 categories at once)

> **Status (2026-07-26): implemented, awaiting publish.** `server/index.mjs`
> (Express) now serves `dist/public` in production (autoscale run in
> `artifact.toml`, `/healthz` startup probe). Build pre-compresses all text
> assets to `.br`/`.gz` (`scripts/precompress.mjs`, ~3.8 MB → ~0.76 MB brotli);
> hashed assets/images ship `max-age=31536000, immutable`, HTML
> `max-age=300, must-revalidate`. Security headers live (HSTS, XFO DENY,
> nosniff, Referrer-Policy, Permissions-Policy); CSP ships **Report-Only**
> (set `CSP_ENFORCE=1` to enforce after verifying GTM/YouTube/Maps/AppFolio
> load clean in production). Trailing-slash URLs 301 to the non-slash
> canonicals; unknown paths get a prerendered noindex 404 page with status
> 404 (`/knowledge/*` keeps its stub; `/sitemaps.xml` now 404s). The server
> parses the artifact.toml rewrite table at startup so routing cannot drift
> from the guarded config.
>
> **Update (2026-07-26, post-publish): verified live.** Overall 58→69;
> Crawlability 48→94, Core SEO 79→95, Links 80→85, Performance 40→52,
> Security 46→48 (details in `seo-audit-2026-07-26.md`). The scanner ignores
> Report-Only CSP, so the CSP allowlist was verified in-browser (only Google
> Maps needed additions: Google fonts + mapsresources-pa endpoint),
> `CSP_ENFORCE=1` is set in the production deployment env, and the server now
> sends ETag/Last-Modified + 304s (was the last `perf/bad-caching` failure).
> Both land with the next publish. Remaining Performance ceiling is Phase 2
> (bundle size, image weight, LCP hints).

Every "platform-served, not configurable" deferral — compression, caching,
security headers, soft 404s, trailing-slash redirect direction — has a single
structural fix: stop using the platform static-serve edge and serve
`dist/public` from a tiny Express (or Hono) server deployed as autoscale.
The prerendered HTML, sitemap, and build pipeline stay exactly as they are;
only the serving layer changes.

The server must:

1. **Compression**: Brotli/gzip for HTML/CSS/JS/SVG/XML/TXT (`shrink-ray` or
   `compression` + pre-compressed `.br`/`.gz` assets at build time).
   → Performance: clears `perf/compression` and `perf/bad-caching` on all 108
   pages (the two biggest hit counts in the whole report).
2. **Cache headers**: `public, max-age=31536000, immutable` for hashed
   `/assets/*` and `/images/*`; `public, max-age=300, must-revalidate` for
   HTML. → clears `perf/cache-headers`.
3. **Security headers**: CSP (allowlist self + GTM + YouTube + AppFolio CDN +
   Google Maps), `Strict-Transport-Security`, `X-Frame-Options: DENY` (or CSP
   `frame-ancestors`), `X-Content-Type-Options`, `Referrer-Policy`,
   `Permissions-Policy`. Start CSP in `Report-Only` for one publish, then
   enforce. → Security to ~90+.
4. **Redirects done right**: 301 `/*/` → non-slash (matching the existing
   non-slash canonicals) instead of the platform's slash-adding redirect.
   → kills all 98 `links/redirect-chains` + `crawl/canonical-chain` warnings
   with zero changes to canonicals, sitemap, guards, or tests.
5. **Real 404s**: unknown paths return a prerendered 404 page with status 404
   (keep the `/knowledge/*` noindex stub behavior). → clears soft-404s and the
   `/sitemaps.xml` "unknown sitemap format" error (probe gets 404, not HTML).

Risks/notes: autoscale cold starts (mitigate with min-instances 1), and the
publish pipeline moves from "static publish" to "deploy" — the postpublish
checks (`check:knowledge`, `check:rented`) still run against the live URL
unchanged. This is the highest-leverage single change on the board; estimate
Performance 40→~75, Security 46→~90, Crawlability 48→~90, Links 80→~95.

## Phase 2 — Performance polish (after Phase 1)

> **Status (2026-07-26): implemented, awaiting publish.** Main bundle split via
> manual vendor chunks (`vendor-react` 184 KB, `vendor-radix`, entry 144 KB —
> largest emitted JS is now well under the 250 KB budget; route lazy-chunks and
> the boot preload guard untouched). `scripts/optimize-images.mjs` now enforces
> a hard ~195 KB per-file ceiling (quality step-down, then `webp:target-size`
> so full-width rungs still fit; AVIF twins re-checked every run) — no shipped
> image over 200 KB. OG cards get `jpeg:extent=190kb`. Above-the-fold lazy
> fixes: first 3 floor-plan cards and first 4 gallery grid images now eager
> (client-only where React 19 would emit fixed-href preloads). Per-page LCP
> preloads already covered all 99 prerendered pages. Re-audit after publish.

1. **Code-split the 322 KB main bundle**: manual chunks for `react-dom`,
   Radix, and the floor-plan viewer; keep per-route lazy chunks (the boot
   preload guard already handles CLS). Target <250 KB per file.
2. **Recompress the 24 images >200 KB** (AVIF/WebP, quality ~70, cap at
   2000w — sources live in `images-src/`, pipeline already exists). Target
   ~13 MB → <6 MB tracked weight.
3. **`fetchpriority="high"` + preload for the hero image on every page**, not
   just the money pages (21 pages flagged); knowledge pages share one hero —
   one component fix covers 52 pages.
4. **Fix remaining `lazy-above-fold`**: first AppFolio collage photo on unit
   pages is already eager; the flagged gallery/available-units first cards
   need the same treatment.

## Phase 3 — Content & E-E-A-T (Content 41 → 85+, E-E-A-T 77 → 100)

> **Status (2026-07-26): implemented, awaiting publish.** `/about` is live in
> the build (property story, on-site management section, building
> facts, NAP + hours) with `AboutPage` JSON-LD (`mainEntity` → Organization),
> a footer link, sitemap/prerender/rewrite entries. The Organization node now
> carries address/sameAs. **Note:** all mentions of the management company by
> name were removed site-wide on 2026-07-26 pending legal clearance — do not
> reintroduce them (incl. `parentOrganization` JSON-LD) until the owner
> confirms. Every knowledge
> article shows a "Reviewed by the … leasing team · Updated <date>" byline
> wired into its JSON-LD (`author`/`publisher`/`dateModified`/`lastReviewed`,
> date from `KNOWLEDGE_REVIEWED_DATE` in `src/data/knowledge.ts` — bump on
> bulk re-review, override per article via `updated`). The five thin pages
> (/contact-us, /photo-gallery, /residents, /reviews, /virtual-tour) now open
> with stat-rich quick answers, carry concrete numbers per section, and all
> clear the 300-word floor (448–712 words measured on prerendered HTML;
> /about 712). JSON-LD validator passes with zero recommended-property
> warnings. Re-run the full squirrel audit after the next publish and record
> Content / E-E-A-T scores here.

1. **About page** (`/about`): the property's story, management company
   (Highland Real Estate Partners), team, address/NAP, building facts and
   dates. Add `AboutPage` + `Organization` JSON-LD, link site-wide footer.
2. **Author/publisher attribution** on knowledge articles: byline block
   ("Reviewed by the Exhibit On Superior leasing team, updated <date>") +
   `author`/`dateModified` in the existing Article JSON-LD. Freshness dates
   double as AEO signals.
3. **Deepen the thinnest pages** flagged by the content scorer (word count +
   answer-first blocks): every page opens with a 40–60-word direct answer to
   its core query, one concrete stat per section (rent ranges, sq ft, floor
   counts, walk scores), and a short FAQ where intent supports it. This is
   the KDD-2024 GEO playbook: statistics and quotable, self-contained
   sentences are the highest-visibility signals for AI engines.
4. Existing tickets already cover: knowledge title lengths (#331), unit-page
   snippets (#344), FAQ↔Knowledge alignment (#342), review dates in
   structured data (#170), weakly linked knowledge pages (#339).

## Phase 4 — Agent Experience / AEO (50 → 85+)

1. **Markdown variants**: the build already produces `llms.txt` /
   `llms-full.txt`; add per-page `.md` twins (e.g. `/knowledge/pet-policy.md`)
   generated in the prerender step from the same page data, and serve
   `Accept: text/markdown` content negotiation from the Phase 1 server.
   → clears `ax/markdown-response` and gives agents ~90%+ text-to-markup.
2. **Token weight**: the `.md` variants are the practical answer; also stop
   inlining the availability snapshot JSON into pages that don't use it
   (available-units HTML is ~41K tokens, 4% visible text).
3. Keep robots.txt AI-crawler allowances and llms.txt fresh (already done).

## Phase 5 — Remaining structured data & duplicates

1. **VideoObject** on unit tours — ticketed (#337).
2. **Param-variant duplicate titles** (`?ada=1`, `?unit=`): canonicals already
   point to base pages; optionally add `robots: noindex,follow` on
   parameterized variants or set a dynamic title suffix client-side. Low
   priority — warning-level noise.
3. **Schedule-a-tour "view details" links** — ticketed (#338).
4. **Color-contrast warnings** (muted-foreground text on 33 elements): bump
   the muted token to a 4.5:1-compliant value once, site-wide.

## Sequencing & expected scores

| Phase | Effort | Expected movement |
| --- | --- | --- |
| 1. Serving layer | 1 task, medium | Overall 58 → ~78; Perf 40→75, Sec 46→90, Crawl 48→90, Links 80→95 |
| 2. Perf polish | 1–2 tasks, medium | Perf 75→90+, Images 76→95 |
| 3. Content/E-E-A-T | 2 tasks, medium | Content 41→85, E-E-A-T 77→100, Core SEO →95 (with #331) |
| 4. AEO markdown | 1 task, small–medium | Agent Experience 50→85+ |
| 5. Cleanup | small | Video →100, Structured Data →95+, A11y →95+ |

Verification for every phase: `squirrel audit https://www.rentatexhibit.com
-C full --refresh --format llm` after publish, plus the repo's own guards
(tests, JSON-LD validator, fold checks, prerender guards). Target: 95+ (A)
overall on full coverage, per the audit skill's completion bar.
