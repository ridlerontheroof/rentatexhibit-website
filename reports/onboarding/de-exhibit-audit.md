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
