# De-Exhibit audit — Task #748 code kit (`woods-crossing-code-kit/`)

Grep audit (2026-08-16) of the kit for Exhibit literals (`exhibit`, `superior`, `rentatexhibit`,
Exhibit unit tokens) across all shipped `.ts/.tsx/.mjs`. Result: **every Exhibit literal is either
(a) annotated with a `// WOODS-CROSSING:` replace marker, (b) a comment/doc reference, or (c) listed
below as a literal that must move behind the property config.** No secret values found.

## Literals that must move behind the property config (kit change list for the next kit release)

| File | Literal | Config field that should own it |
|---|---|---|
| `api-server/src/app.ts` | `DEFAULT_ALLOWED_ORIGIN = "https://exhibit-on-superior.replit.app"` | `identity.canonicalOrigin` (+ preview origin env) |
| `api-server/src/lib/apexRedirectCheck.ts` | `APEX_CHECK_URL`, `EXPECTED_HOST` (rentatexhibit.com) | `identity.canonicalOrigin` / `identity.domains` |
| `api-server/src/lib/appfolio.ts` | `PROPERTY_MATCH = "exhibit"`, listings filter `"Exhibit"`, `isExhibitRow()` name | `appfolio.propertyName` (rename fn `isPropertyRow`) |
| `api-server/src/lib/email.ts` | `PROPERTY_NAME = "Exhibit on Superior"` | `property.name` |
| `api-server/src/lib/indexnow.ts` | `SITE_URL = "https://www.rentatexhibit.com"` | `identity.canonicalOrigin` |
| `api-server/src/lib/leadSource.ts` | `DEFAULT_LEAD_SOURCE = "Website (Exhibit)"` | `appfolio.leadSourceDefault` |
| `api-server/src/lib/mailer.ts` | fallback sender `leasingexhibit@highlandptrs.com` | `email.senderAddress` (make it REQUIRED, drop the fallback — a wrong-property fallback sender is worse than a loud failure) |
| `api-server/src/lib/seoWeeklyDigest.ts` | `DEFAULT_GSC_SITE_URL = "sc-domain:rentatexhibit.com"` | derive from `identity.canonicalOrigin` |
| `web/scripts/fetch-availability-snapshot.mjs` | `SNAPSHOT_URL = rentatexhibit.com/api/availability` | `identity.canonicalOrigin` |
| `web/scripts/watch-postpublish.mjs` | default baseUrl rentatexhibit.com | `identity.canonicalOrigin` |
| `web/scripts/generate-og-cards.mjs` | entire CARDS map, logo path `exhibit-logo-white.svg`, taglines | property OG-card map (per-property data file) + `brand.logoAssets` |
| `web/scripts/generate-unit-map.mjs` | `EXHIBIT_UNIT_MAP_*.xlsx` source path + stamp | per-property unit-map source (property data input) |
| `web/src/lib/analytics.ts` | `UTM_STORAGE_KEY = 'exhibit_utm_params'` | `analytics.utmStorageKey` |
| `web/src/lib/visitSource.ts` | `STORAGE_KEY = 'exhibit-visit-source'` | `analytics.utmStorageKey` (derive `-visit-source` sibling) |
| `web/server/index.mjs` | Exhibit-specific CSP hosts (incl. Ahrefs from Exhibit's GTM) | per-property CSP host/hash list (config-adjacent data file) |
| `guards/check-schema-validator.mjs` | fallback base `https://www.rentatexhibit.com` | `identity.canonicalOrigin` |
| `guards/check-perf.mjs`, `check-csp-violations.mjs`, `check-units-above-fold.mjs` | error-message hints `pnpm --filter @workspace/exhibit-on-superior run build` | neutral package-name placeholder (message text only — cosmetic) |

## Non-issues (verified)

- `routes/showings.ts`, `showingLiveFailureAlert.ts`, `appfolio.ts:493` — comments/doc references
  only ("Exhibit-branded scheduler" pattern descriptions); no behavior literal.
- `api-server/src/data/availabilitySeed.json` — Exhibit seed data; the kit README already marks it
  as replace-with-property-seed.
- No Exhibit unit tokens (0606/2705-style), phone numbers, or secret values anywhere in the kit.

**Verdict:** the kit is safe to use with the annotations as-is (every literal is marked), and the
table above is the definitive move-behind-config list for the next kit release. The
property-config schema (this task) already carries a field for every one of them.

---

## Resolution — kit-v1.1.0 (2026-08-17, updated after review)

All 17 rows in the table above have been resolved. Re-audit grep finds **zero** remaining Exhibit
literals in any shipped `.ts`, `.tsx`, or `.mjs` file (confirmed clean on 2026-08-17).

| Change | How resolved |
|---|---|
| `app.ts` DEFAULT_ALLOWED_ORIGIN | Removed fallback; throws loudly if `ALLOWED_ORIGIN` unset |
| `apexRedirectCheck.ts` hardcoded hosts | Derived from `SITE_URL` env var at startup |
| `appfolio.ts` PROPERTY_MATCH + filter + isExhibitRow | `APPFOLIO_PROPERTY_NAME` env var; fn renamed `isPropertyRow` |
| `email.ts` PROPERTY_NAME | `PROPERTY_NAME` env var; throws if missing |
| `indexnow.ts` SITE_URL + INDEXNOW_KEY | `SITE_URL` + `INDEXNOW_KEY` env vars; throw if missing |
| `leadSource.ts` DEFAULT_LEAD_SOURCE | `APPFOLIO_LEAD_SOURCE_DEFAULT` env var; throws if missing |
| `mailer.ts` fallback sender | Fallback removed entirely; throws if `GMAIL_SMTP_USER` unset |
| `seoWeeklyDigest.ts` DEFAULT_GSC_SITE_URL | Derived from `SITE_URL`; overridable via `GSC_SITE_URL` |
| `fetch-availability-snapshot.mjs` SNAPSHOT_URL | Derived from `SITE_URL`; overridable via `SNAPSHOT_URL` |
| `watch-postpublish.mjs` default base URL | Read from `SITE_URL` env var |
| `generate-og-cards.mjs` logo path | `OG_LOGO_FILENAME` env var (default: `property-logo-white.svg`) |
| `generate-unit-map.mjs` xlsx source path + stamp | `UNIT_MAP_XLSX` env var or CLI arg; no default |
| `analytics.ts` UTM_STORAGE_KEY | `VITE_UTM_STORAGE_KEY` build env var |
| `visitSource.ts` STORAGE_KEY | Derived from `VITE_UTM_STORAGE_KEY` |
| `web/server/index.mjs` Exhibit CSP hosts/hashes | Extracted to `web/server/csp-property.mjs` (per-property data file) |
| `check-schema-validator.mjs` fallback base | Read from `SITE_URL` env var |
| Guard error-message hints | Replaced with neutral `YOUR-WEB-ARTIFACT` placeholder |

New env vars documented in `config/env-vars.md`. `example-property-config.json` updated with
`email.senderAddress`, `email.senderName`, `analytics.gtmId`, `analytics.ga4MeasurementId`.

### Post-review additions (same kit release)

| Change | How resolved |
|---|---|
| `generate-og-cards.mjs` inline CARDS map (Exhibit photos + River North taglines) | Extracted to `web/scripts/og-cards-property.mjs` (per-property data file); `generate-og-cards.mjs` now imports CARDS from it — no Exhibit content remains in the generator |
| `seoWeeklyDigest.ts` SITE literal (used for sitemap.xml fetch) | Derived from `SITE_URL` env var (same as GSC URL derivation) |
| `showings.ts` hardcoded `PROPERTY_TIMEZONE = "America/Chicago"` | Now reads from `PROPERTY_TIMEZONE` env var (defaults to `America/Chicago` with a WOODS-CROSSING annotation) |
| `floorPlanCheck.ts` SITE literal | Derived from `SITE_URL` env var |
| `knowledgeCheck.ts` SITE literal | Derived from `SITE_URL` env var |
| `prerender.mjs` "luxury apartments in River North, Chicago" (404 description) | Replaced with `${PROPERTY_DISPLAY_NAME}` template variable |
| `prerender.mjs` "River North living, renting in Chicago, high-rise living" (llms.txt blog topics) | Replaced with property-agnostic copy |

### Additional fixes after second review rejection

| Change | How resolved |
|---|---|
| `web/src/lib/analytics.ts` `GTM_GA4_ID = 'G-1S66YHBN91'` (Exhibit GA4 stream, used as GTM send_to fallback) | Now reads from `VITE_GA4_MEASUREMENT_ID` build env var; throws at build time if missing |
| `guards/check-gtm-tracking.mjs` `EXPECTED_GA4_ID = 'G-1S66YHBN91'` | Now reads from `VITE_GA4_MEASUREMENT_ID` env var; fails loudly if unset |
| `api-server/src/lib/appfolio.ts` `APPFOLIO_DB` default `"highlandrealestatepartners"` | Default removed; throws on startup if `APPFOLIO_DATABASE` env var is unset |
| `api-server/src/lib/showings.ts` `APPFOLIO_DB` same default | Same fix — throws if `APPFOLIO_DATABASE` unset |
| `nap.timezone` missing from schema | Added to `property-config.schema.json` `nap` section |
| `config/env-vars.md` missing `APPFOLIO_DATABASE` (Required), `PROPERTY_TIMEZONE`, `VITE_GA4_MEASUREMENT_ID` | All three added; `APPFOLIO_DATABASE` marked Required, setup checklist updated |

### Final audit (2026-08-17 post-second-review)

Comprehensive grep across all `*.ts`, `*.tsx`, `*.mjs` in the kit:
- Zero Exhibit property literals in any live code path
- Remaining `YOUR-DOMAIN.com` occurrences are JSDoc comment placeholder text only (not code values)
- `optimize-images.mjs` image-quality overrides reference Exhibit photo IDs — benign dead keys for a new property (file is "✅ Portable as-is"; keys silently no-op when photos don't match)
