# Woods Crossing Code Export Kit

Reusable production code extracted from **Exhibit on Superior** — a live
leasing website built on the same Replit monorepo stack. This kit ships the
proven machinery so Woods Crossing can reuse the availability feed, lead/tour
routing, SEO build pipeline, and operational guard systems instead of
rebuilding them from prose.

**What ships:** server infrastructure + build tooling + guard scripts + config
templates.  
**What does NOT ship:** Exhibit copy, unit data, photos, floor-plan facts,
blog articles, knowledge-center articles, design comps, or any secret values.

---

## Integration Order

Work through these layers in sequence. Each layer depends on the one before.

1. **Serve layer** — Express bootstrap, trust-proxy, CORS, logger (`api-server/src/app.ts`).
2. **Availability feed** — AppFolio client + normalizer + availability route + seed (`api-server/src/lib/appfolio.ts`, `api-server/src/routes/availability.ts`).
3. **Leads & tours** — Bot guard, lead-source sanitizer, email system, lead + showings routes.
4. **SEO build** — Prerender pipeline, production static server, image/OG scripts.
5. **Analytics** — GTM-deferred analytics, visit-source attribution.
6. **Guards** — Prepublish check suite, post-publish watcher, IndexNow pinger.

---

## Portability Classes

| Class | Meaning |
|---|---|
| ✅ **Portable as-is** | Drop in and run. No property-specific values. |
| ⚙️ **Needs Woods config** | Works immediately after updating the labelled constants/env vars. |
| 🔧 **Pattern-only** | Structure is reusable; Exhibit-specific facts must be replaced with Woods data. |

---

## File Manifest

### `api-server/src/` — Express API Server

#### `app.ts`
**Purpose:** Express application bootstrap — CORS origin validation, trust-proxy
(Replit's internal hops), pino-http logging, JSON body parser, route mounting.  
**Class:** ⚙️ Needs Woods config  
**Change:** Set `ALLOWED_ORIGIN` env var to your web app's deployed HTTPS origin.
Update `DEFAULT_ALLOWED_ORIGIN` constant as a sensible fallback.

---

#### `lib/appfolio.ts`
**Purpose:** AppFolio Reports API client. Calls the Unit Vacancy report over
HTTP Basic auth, normalizes rows into `AvailableUnit` objects, scrapes public
listing pages for photos/gallery/video/description, pushes guest cards, resolves
listable UIDs.  
**Class:** ⚙️ Needs Woods config  
**Changes required:**

| Line/constant | What to change | Example |
|---|---|---|
| `PROPERTY_MATCH = "exhibit"` | Lowercase substring of your property's name in AppFolio | `"woods crossing"` |
| `APPFOLIO_DATABASE` env var default | Your management company's AppFolio database name | `"woodscrossingmgmt"` |
| `EXCLUDED_PHOTO_IDS` set | Replace with photo IDs of your management company's logo/watermark images | Get IDs from your AppFolio listing pages |
| `filters[property_list]` in `fetchListingMedia()` | Your property's exact listing filter name in AppFolio | `"Woods Crossing"` |
| `AMENITY_SPELLING_FIXES` | Add typos observed in your AppFolio amenity feed | Optional |
| `CONTRADICTORY_FEE_SENTENCE_RE` | Regex matching copy that contradicts your fee policy | Update or set to `/(?!)/` to disable |
| `PROPERTY_AMENITY_RE` | Building-wide amenities to strip from unit marketing titles | `pool`, `gym`, etc. |
| `resolveTourUnitListableUid()` | Implement your reserved TOUR unit lookup | See `dedicated-tour-unit.md` pattern in the Exhibit APPFOLIO_INTEGRATION_PLAYBOOK.md |

---

#### `lib/botGuard.ts`
**Purpose:** Honeypot (`xh_note` field) + fill-time (`elapsedMs`) bot detection
for lead forms. Returns a reason string when a submission looks automated, or
`null` for real visitors.  
**Class:** ✅ Portable as-is  
**Note:** The honeypot field is named `xh_note`. Safari was observed
auto-filling a field named "company", so keep the nonsense name. The
`elapsedMs` field must be omitted from the server payload when the visitor
never typed (mobile autofill can complete before the timer fires).

---

#### `lib/botGuardAlert.ts`
**Purpose:** Sliding-window bot-guard alert — fires an email when `N` bot
detections occur within `M` minutes, to flag if a real visitor is being
incorrectly blocked.  
**Class:** ✅ Portable as-is  
**Note:** Alert thresholds are tunable via constants at the top of the file.

---

#### `lib/dailyClaim.ts`
**Purpose:** Claim-before-send mutex for once-per-period alert emails. Prevents
duplicate sends in multi-instance deploys. Every alert that uses this module
must release its slot in ALL send-failure catch blocks — including escalation
alerts — or the period goes silent.  
**Class:** ✅ Portable as-is

---

#### `lib/dailyHeartbeat.ts`
**Purpose:** Once-per-UTC-day watchdog liveness counter factory. The showing
scheduler uses this to prove the slot-fetch cron ran today.  
**Class:** ✅ Portable as-is

---

#### `lib/email.ts`
**Purpose:** Assembles and dispatches all property emails — lead notifications,
prospect confirmations, tour confirmations, and operational alerts (stale seed,
rented-check failures, etc.). Builds RFC 2822 MIME messages with inline logo
and both text+HTML parts.  
**Class:** ⚙️ Needs Woods config  
**Changes required:**

| Constant | What to change |
|---|---|
| `PROPERTY_NAME` | `"Exhibit on Superior"` → `"Woods Crossing"` (or your property name) |
| `LEASING_INBOX_EMAIL` env var | Your leasing team's inbox |
| `SEED_ALERT_EMAIL` env var | Ops person who can redeploy |

**Also:** Replace `emailLogo.ts` / `emailLogo.json` with your property's
wordmark encoded as base64 PNG. The inline logo is referenced via
`EMAIL_LOGO_CONTENT_ID` as a `cid:` src in the HTML templates.

---

#### `lib/emailTemplates.ts`
**Purpose:** HTML + plain-text render functions for every email the system
sends: lead notifications, prospect/tour confirmations, operational alerts
(stale seed, rented-noindex, legacy-redirect, GTM, showing-format, guest-card,
fee-copy, slots-failure, live-failure).  
**Class:** 🔧 Pattern-only  
**Changes required:** All Exhibit copy (`"Exhibit on Superior"`, address,
contact links, brand colours) must be replaced with Woods Crossing content.
The email structure and MIME assembly logic are reusable as-is; only the
rendered HTML strings need updating.

---

#### `lib/emailThrottle.ts`
**Purpose:** DB-backed + in-memory fallback per-recipient and global daily caps
for confirmation emails. Prevents confirmation spam if a form is repeatedly
submitted.  
**Class:** ✅ Portable as-is  
**Note:** Requires a `confirmation_email_log` table in your PostgreSQL database.
The schema is embedded at the top of the file; run the `CREATE TABLE IF NOT
EXISTS` statement once on first deploy.

---

#### `lib/feeCopyAlert.ts`
**Purpose:** Sliding-window alert when AppFolio listing descriptions contain
sentences that contradict the confirmed fee policy. Fires to the leasing inbox.  
**Class:** ✅ Portable as-is  
**Note:** The regex that detects contradictory copy lives in `appfolio.ts`
(`CONTRADICTORY_FEE_SENTENCE_RE`). Update that regex for your fee policy.

---

#### `lib/guestCardAlert.ts`
**Purpose:** Sliding-window alert on repeated AppFolio guest-card push failures.  
**Class:** ✅ Portable as-is

---

#### `lib/indexnow.ts`
**Purpose:** Pings Bing/Copilot via IndexNow when the availability inventory
changes (units rented, re-priced, or re-dated), so engines recrawl the
availability pages quickly instead of waiting for the scheduled crawl.  
**Class:** ⚙️ Needs Woods config  
**Changes required:**

| Constant | What to change |
|---|---|
| `INDEXNOW_KEY` | Generate a fresh key at https://www.indexnow.org/ and host `<key>.txt` at your domain root |
| `SITE_URL` | `"https://www.rentatexhibit.com"` → your production domain |
| `AVAILABILITY_URLS` | Your availability page URL(s) |
| `CORE_SITEMAP_URLS` | Your full list of indexable page URLs |

---

#### `lib/leadNotificationRetry.ts`
**Purpose:** DB-backed retry queue for lead notification emails that failed on
first send. A background sweep retries unsent notifications so no lead is
silently dropped due to a transient SMTP hiccup.  
**Class:** ✅ Portable as-is  
**Note:** Requires a `leads` table with a `notification_sent` boolean column.

---

#### `lib/leadSource.ts`
**Purpose:** Sanitizes UTM/click-ID data into the `Website (Token)` format
AppFolio accepts as a lead source label. Validates that the token contains only
alphanumerics and hyphens. The server is the trust boundary; the client also
computes this but the server always re-validates.  
**Class:** ⚙️ Needs Woods config  
**Change:** `DEFAULT_LEAD_SOURCE = "Website (Exhibit)"` → `"Website (WoodsCrossing)"` (or your property token).

---

#### `lib/logger.ts`
**Purpose:** Pino logger with production/development config. Redacts PII fields
(`email`, `phone`, `firstName`, `lastName`) from log output.  
**Class:** ✅ Portable as-is

---

#### `lib/mailer.ts`
**Purpose:** Gmail SMTP transport via nodemailer + app password. Gets the
transporter lazily, logs a once-only warning when the credential is absent.  
**Class:** ⚙️ Needs Woods config  
**Changes:** Set `GMAIL_SMTP_USER` env var and `GMAIL_APP_PASSWORD` secret to
your property's dedicated Gmail account and its app password.

---

#### `lib/redirectCheck.ts`, `lib/rentedCheck.ts`, `lib/floorPlanCheck.ts`, `lib/knowledgeCheck.ts`, `lib/gtmCheck.ts`, `lib/ga4DataCheck.ts`, `lib/applyLinkCheck.ts`, `lib/apexRedirectCheck.ts`
**Purpose:** Individual post-publish watchdog checker modules. Each implements
a `run()` function returning a pass/fail result; the `watch-postpublish.mjs`
script orchestrates them all after a new build goes live.  
**Class:** 🔧 Pattern-only  
**Changes:** Update URL patterns, expected redirect targets, and GTM/GA4 IDs to
match Woods Crossing's site structure.

---

#### `lib/showingFormatAlert.ts`, `lib/showingLiveFailureAlert.ts`, `lib/showingSlotsFailureAlert.ts`
**Purpose:** Sliding-window alerts for the showing scheduler — unexpected slot
formats (new AppFolio API shape), live booking failures, and slot-fetch
failures. Each sends an escalation email and backs off to avoid noise floods.  
**Class:** ✅ Portable as-is

---

#### `lib/showings.ts`
**Purpose:** Full AppFolio showing scheduler integration: fetches available
time slots, normalizes the ISO+legacy date formats AppFolio uses, books
showings via the guest-card API, handles near-term slot recovery, fires
daily heartbeats, and routes general-tour bookings to the reserved TOUR unit.  
**Class:** ⚙️ Needs Woods config  
**Change:** `PROPERTY_TIMEZONE = "America/Chicago"` — update if Woods Crossing
is in a different timezone. All slot times are displayed in this zone.

---

#### `lib/startupSummary.ts`
**Purpose:** Logs a structured startup summary (env checks, seed health, config
values) to help diagnose cold-start issues in production.  
**Class:** ✅ Portable as-is

---

#### `lib/tourUnit.ts`
**Purpose:** Reserved TOUR token logic. When a prospect books a tour without
specifying an apartment, their guest card is pushed against a hidden AppFolio
unit reserved for general bookings.  
**Class:** 🔧 Pattern-only  
**Change:** Update the unit name/address needles to match your property's
hidden tour unit in AppFolio. See `dedicated-tour-unit.md` in the Exhibit
playbook for the full setup pattern.

---

#### `lib/seoWeeklyDigest.ts`
**Purpose:** Once-per-week email digest to the leasing team with SEO health
signals (crawl errors, indexed page count, top landing pages).  
**Class:** 🔧 Pattern-only  
**Changes:** Update GA4 property ID references and digest email copy.

---

#### `routes/availability.ts`
**Purpose:** `GET /api/availability` — 5-minute in-memory cache over the
AppFolio Unit Vacancy report. Background warmer refreshes the cache before it
expires. Cold-start loads the baked seed from `data/availabilitySeed.json`.
Triggers IndexNow pings on inventory changes. Exposes `getAvailabilitySnapshot()`
for other routes to read the live payload.  
**Class:** ✅ Portable as-is  
**Note:** No Exhibit-specific values. All config comes from `appfolio.ts` and
`indexnow.ts` (already annotated above).

---

#### `routes/leads.ts`
**Purpose:** `POST /api/leads` — full lead capture pipeline: bot guard →
Zod validation → DB insert → leasing notification email → prospect confirmation
email → AppFolio guest card push. Returns 400 on validation failure, 200 on
success (even when the AppFolio push fails, so the prospect is never shown an
error due to a backend hiccup).  
**Class:** ✅ Portable as-is  
**Note:** Lead source sanitization uses `leadSource.ts` (update that file's
default; this file needs no changes).

---

#### `routes/showings.ts`
**Purpose:** Three-endpoint showing scheduler proxy:
- `GET /api/showings/slots` — available time slots from AppFolio
- `POST /api/showings/contact` — capture prospect contact info  
- `POST /api/showings/book` — book the showing + send tour confirmation  

Wires together the daily heartbeat, all alert modules, and the tour-unit
resolver.  
**Class:** ✅ Portable as-is

---

#### `routes/health.ts`
**Purpose:** `GET /api/health` — returns `{ status: "ok", uptime }`.  
**Class:** ✅ Portable as-is

---

#### `data/availabilitySeed.json`
**Purpose:** Build-time baked availability snapshot. Committed to the repo so
cold-started autoscale instances answer the availability endpoint instantly
while the first live AppFolio fetch completes in the background.  
**Class:** 🔧 Pattern-only (template placeholder included)  
**How to populate:** After deploying the API server, run:
```
pnpm --filter @workspace/YOUR-WEB-ARTIFACT run fetch:availability-snapshot
```
Then commit the updated `src/data/availabilitySeed.json` and redeploy.

---

### `web/scripts/` — Build & Utility Scripts

#### `prerender.mjs`
**Purpose:** Full SSG prerenderer. Renders every route (static pages, per-unit
pages, floor-plan pages, knowledge pages, blog pages) by importing
`entry-server.tsx`'s `renderRoute()`, injects SEO `<head>` tags, validates
JSON-LD schemas, checks LCP preload links, writes prerendered HTML files, and
generates `sitemap.xml`.  
**Class:** 🔧 Pattern-only  
**Changes:** Route lists (`UNIT_PATHS`, `KNOWLEDGE_PATHS`, `BLOG_PATHS`,
`FLOOR_PLAN_PAGE_PATHS`) come from `entry-server.tsx`. Update `PAGE_SEO` map
in `src/data/seo.ts` with Woods Crossing's page titles and meta descriptions.
The prerender harness itself is portable; the data it reads is site-specific.

---

#### `optimize-images.mjs`
**Purpose:** Batch AVIF + WebP responsive image generator using ImageMagick.
Reads `images-src/` originals, writes responsive rungs to `public/images/`, and
updates `src/data/imageManifest.json`.  
**Class:** ✅ Portable as-is  
**Note:** Quality overrides per-image are in the script's config object;
defaults are fine for most photos.

---

#### `generate-og-cards.mjs`
**Purpose:** Generates Open Graph social share card images using ImageMagick.
Overlays a tagline onto a hero photo for each page.  
**Class:** 🔧 Pattern-only  
**Change:** The `CARDS` map at the top of the file contains Exhibit-specific
taglines and photo references. Replace with Woods Crossing's pages, taglines,
and photo assets.

---

#### `precompress.mjs`
**Purpose:** Brotli + gzip pre-compresses all HTML, JS, CSS, JSON, and SVG
files in `dist/public/` at build time so the production server can serve
pre-compressed files without runtime compression overhead.  
**Class:** ✅ Portable as-is

---

#### `fetch-availability-snapshot.mjs`
**Purpose:** Calls the production `/api/availability` endpoint and writes the
result to `src/data/availabilitySeed.json` for the next build.  
**Class:** ⚙️ Needs Woods config  
**Change:** Update `API_URL` constant to point to your API server's
`/api/availability` endpoint.

---

#### `generate-unit-map.mjs`
**Purpose:** Generates `src/data/unitMap.json` — the canonical unit-data lookup
table combining AppFolio sqft/beds/baths with any floor-plan overrides.  
**Class:** 🔧 Pattern-only  
**Change:** Update the floor-plan data source to match Woods Crossing's unit
line/floor structure.

---

#### `generate-unit-rewrites.mjs`
**Purpose:** Reads `UNIT_PATHS` from `entry-server.tsx` and writes/updates the
`# [UNIT REWRITES START]` / `# [UNIT REWRITES END]` region in `artifact.toml`
with one rewrite pair per unit. Run after any unit is added or removed.  
**Class:** ✅ Portable as-is

---

#### `watch-postpublish.mjs`
**Purpose:** Long-running Replit workflow process. Polls the live site's
`/build-id.txt` endpoint, detects when a new publish goes live (by comparing
the build ID against the last-known value), then runs `check:postpublish`.
Sends an alert email if any check fails.  
**Class:** ⚙️ Needs Woods config  
**Change:** Update `SITE_URL` and `API_SERVER_URL` constants to your production
domains.

---

#### `submit-indexnow.mjs`
**Purpose:** One-shot script that diffs the live sitemap `<lastmod>` values
against a committed state file and submits only new/changed URLs to IndexNow.
Run as part of the post-publish flow.  
**Class:** ⚙️ Needs Woods config  
**Change:** Update `SITE_URL` to your production domain.

---

#### `write-build-id.mjs`
**Purpose:** Writes `dist/public/build-id.txt` with a short timestamp-based ID.
The post-publish watcher polls this file to detect new deploys.  
**Class:** ✅ Portable as-is

---

#### `validate-jsonld.mjs`
**Purpose:** Parses all prerendered HTML files and validates every embedded
`<script type="application/ld+json">` block for required properties and schema
type correctness.  
**Class:** 🔧 Pattern-only  
**Change:** Update the expected schema types and required properties to match
Woods Crossing's JSON-LD structure.

---

#### `html-to-markdown.mjs`
**Purpose:** Converts prerendered `<main>` HTML to a `.md` twin for each page.
The twins are served via `Accept: text/markdown` content negotiation so AI
crawlers (ChatGPT, Perplexity) can read clean structured text.  
**Class:** ✅ Portable as-is

---

### `web/server/index.mjs` — Production Static Server

**Purpose:** Express-based static server for the prerendered property site.
Serves pre-compressed files, sets cache headers (immutable for hashed assets,
short for HTML), enforces CSP, handles legacy 301 redirects, serves real 404
pages with status 404, and parses the rewrite table from `artifact.toml`.  
**Class:** ⚙️ Needs Woods config  
**Changes required:**

| Section | What to change |
|---|---|
| `gtmInjectedScriptHashes` array (~line 111) | Replace with the sha256 hash of YOUR GTM container's Custom HTML tag scripts. Run `pnpm run check:csp` after deploy to get the required value. |
| `CSP` directives (~line 130) | Remove Exhibit-specific hosts (Matterport, SightMap, Ahrefs). Add Woods Crossing's third-party services (Matterport, SightMap, Clarity, etc.) |

---

### `web/src/entry-server.tsx` — SSR Entry Point

**Purpose:** Exports `renderRoute()` for the prerenderer plus all route-list
constants (`UNIT_PATHS`, `KNOWLEDGE_PATHS`, `BLOG_PATHS`, `FLOOR_PLAN_PAGE_PATHS`,
`BAKED_SNAPSHOT_STATUS`, `PAGE_SEO`, `ROUTE_PATHS`). Also exports `App` for
browser hydration.  
**Class:** 🔧 Pattern-only  
**Changes:** Replace `PAGE_SEO`, `UNIT_PATHS`, and all other data constants with
Woods Crossing's page structure and unit list. The SSR render harness is portable.

---

### `web/src/lib/analytics.ts`

**Purpose:** GA4 analytics — deferred gtag.js loader, SPA page-view tracking,
`generate_lead` conversion events, outbound click events. Supports both
direct-gtag mode (VITE_GA_MEASUREMENT_ID build var) and GTM-managed mode.  
**Class:** ⚙️ Needs Woods config  
**Changes required:**

| Constant | What to change |
|---|---|
| `GTM_GA4_ID = 'G-1S66YHBN91'` | Your GA4 Measurement ID (GA4 Admin → Data Streams → Web → Measurement ID) |
| `UTM_STORAGE_KEY = 'exhibit_utm_params'` | Rename to `'woodscrossing_utm_params'` |

---

### `web/src/lib/visitSource.ts`

**Purpose:** Visit-scoped UTM → `Website (Token)` attribution. Reads the
landing URL's UTM params / click-IDs, stores the derived source label in
`sessionStorage`, and exposes it to every lead pathway.  
**Class:** ⚙️ Needs Woods config  
**Change:** `STORAGE_KEY = 'exhibit-visit-source'` → `'woodscrossing-visit-source'`

---

### `web/src/components/SmartImg.tsx`

**Purpose:** Optimized `<picture>` component. Reads `IMAGE_MANIFEST` to resolve
srcSet entries for AVIF + WebP + JPEG responsive rungs. Handles missing-manifest
gracefully. Integrates with React 19's SSR preload system via `fetchPriority`.  
**Class:** ✅ Portable as-is  
**Note:** Requires `src/data/imageManifest.json` populated by `optimize-images.mjs`.

---

### `web/src/components/Seo.tsx`

**Purpose:** Client-only `<Helmet>` head injector (SSR-guarded so it doesn't
conflict with the prerendered `<head>`). Used to update canonical URL, title,
and meta tags after client-side navigation.  
**Class:** ✅ Portable as-is

---

### `guards/` — Check Scripts

All guard scripts share the same pattern: they spin up a headless Chromium
(or make direct HTTP requests), check specific properties of the live (or
locally-served) site, and exit non-zero with a descriptive error on failure.
The `check:prepublish` script chain runs them all before every publish.

| Script | Purpose | Class | Woods Crossing changes |
|---|---|---|---|
| `check-hydrated-seo.mjs` | Verifies each page's hydrated `<title>`, `<meta description>`, `<canonical>` match the expected values | 🔧 Pattern-only | Update expected SEO values for WC pages |
| `check-schema-validator.mjs` | Validates JSON-LD schemas in prerendered HTML: required properties, type correctness, no duplicate aggregate ratings | 🔧 Pattern-only | Update schema type expectations for WC |
| `check-rented-noindex.mjs` | Fetches live availability; asserts that any prerendered per-unit page for a rented unit carries `noindex` | ✅ Portable as-is | No changes |
| `check-legacy-redirects.mjs` | Requests every legacy URL and asserts it returns a 301 to the correct canonical | 🔧 Pattern-only | Update the legacy URL map for WC's old addresses |
| `check-floor-plan-pages.mjs` | Verifies every floor-plan landing page renders with correct bed/bath/sqft data | 🔧 Pattern-only | Update with WC floor-plan slugs and data |
| `check-gtm-tracking.mjs` | Loads the homepage and asserts the GTM container fires within 10 seconds | ⚙️ Needs Woods config | Update GTM container ID constant |
| `check-units-above-fold.mjs` | Renders the availability page in a real viewport and asserts at least one unit card is above the fold | ✅ Portable as-is | No changes |
| `check-csp-violations.mjs` | Loads the site with CSP Report-Only and captures any reported violations | ⚙️ Needs Woods config | Update origin constants |
| `check-perf.mjs` | Runs Lighthouse against the production server; asserts LCP, TBT, and CLS thresholds | ⚙️ Needs Woods config | Update URL and threshold constants |
| `check-a11y.mjs` | Runs axe-core accessibility checks on key pages | ✅ Portable as-is | No changes |
| `check-link-names.mjs` | Finds links with non-descriptive text ("click here", "here", bare URLs) | ✅ Portable as-is | No changes |
| `check-knowledge-pages.mjs` | Verifies every knowledge-center Q&A page renders and has correct JSON-LD | 🔧 Pattern-only | Update with WC knowledge slugs |

---

### `config/`

| File | Purpose |
|---|---|
| `env-vars.md` | Complete environment variables reference for both artifacts |
| `package-scripts.md` | Templated `package.json` scripts block with the full build/check pipeline |
| `artifact-toml-pattern.md` | `artifact.toml` rewrite and build-command pattern with per-unit rewrite region |

---

## Excluded Content (not in this kit)

The following Exhibit-specific content was intentionally excluded:

- Unit data, floor-plan facts, square footage overrides
- All copy (taglines, descriptions, marketing text)
- Photo assets and the image manifest
- OG card images and the CARDS map (template stub only)
- Blog articles and knowledge-center Q&A content
- Review quotes and structured review data
- Apartment floor-plan diagrams
- Vimeo/YouTube metadata cache files
- Design tokens, brand colours, typography — see the separate design handoff

---

## Quick-start Checklist

- [ ] Clone the Exhibit monorepo structure into a new Woods Crossing project
- [ ] Copy `api-server/` files; update all `WOODS-CROSSING` annotations
- [ ] Copy `web/scripts/`, `web/server/`, `web/src/lib/`, `web/src/components/`
- [ ] Replace `web/src/entry-server.tsx` data constants with WC's page/unit structure
- [ ] Replace `web/src/data/seo.ts` with WC's PAGE_SEO map
- [ ] Set all environment variables from `config/env-vars.md`
- [ ] Run `pnpm run generate:images` for WC's photo assets
- [ ] Run `pnpm run generate:og-cards` after updating the CARDS map
- [ ] Run `pnpm run generate:unit-map` + `generate:unit-rewrites` for WC's units
- [ ] Run `pnpm run fetch:availability-snapshot` → commit the seed
- [ ] Run `pnpm run check:prepublish` — all checks must pass before first publish
- [ ] Deploy; set `CSP_ENFORCE=1` after verifying CSP Report-Only is clean
- [ ] Set up the `watch:postpublish` workflow in Replit

---

*Generated from Exhibit on Superior production codebase. All paths are relative
to the Exhibit monorepo root. Woods Crossing paths will differ based on your
artifact name.*
