# Environment Variables & Secrets

All variables are read from the process environment. On Replit, secrets
(credentials/keys) live in the Replit Secrets vault; non-secret config lives
as plain environment variables in the artifact's settings.

Every value here maps to a field in `property-config.json` — see the schema
at `.agents/skills/property-site-onboarding/schema/property-config.schema.json`.

## API Server (artifacts/api-server)

| Variable | Secret? | Required | Config field | Description |
|---|---|---|---|---|
| `DATABASE_URL` | ✅ | Yes | `secrets.required` | PostgreSQL connection string for accepted leads and persistent alert throttles. Production refuses to start when it is missing. |
| `APPFOLIO_CLIENT_ID` | ✅ | Yes | `secrets.required` | AppFolio Reports API OAuth client ID |
| `APPFOLIO_CLIENT_SECRET` | ✅ | Yes | `secrets.required` | AppFolio Reports API OAuth client secret |
| `APPFOLIO_DATABASE` | No | **Yes** | `appfolio.database` | AppFolio database name (subdomain prefix, e.g. `propertymanagement`). Visible in your AppFolio portal URL. **No default — missing throws on startup.** |
| `PROPERTY_TIMEZONE` | No | **Yes** | `nap.timezone` | IANA timezone for slot times and date formatting, e.g. `America/Denver`. Falls back to `America/Chicago` if unset — always set explicitly to avoid booking-time errors. |
| `APPFOLIO_PROPERTY_NAME` | No | **Yes** | `appfolio.propertyName` | Exact property name for AppFolio filters and row matching, e.g. `Example Property` |
| `APPFOLIO_LEAD_SOURCE_DEFAULT` | No | **Yes** | `appfolio.leadSourceDefault` | Default AppFolio lead-source label, e.g. `Website (ExampleProperty)` |
| `SITE_URL` | No | **Yes** | `identity.canonicalOrigin` | Canonical www production URL, e.g. `https://www.example-property.invalid`. Used by apex check, IndexNow, SEO digest, snapshot fetcher, and post-publish watcher. |
| `ALLOWED_ORIGIN` | No | **Yes** | `identity.canonicalOrigin` | Web app's production HTTPS origin for CORS (same as SITE_URL unless API is on a separate subdomain) |
| `PROPERTY_NAME` | No | **Yes** | `property.name` | Full marketing name shown in email from-name, e.g. `Example Property Apartments` |
| `INDEXNOW_KEY` | No | **Yes** | *(deployment)* | Key string from indexnow.org; must also be hosted at `<SITE_URL>/<key>.txt` |
| `GMAIL_APP_PASSWORD` | ✅ | Yes | `secrets.required` | 16-char Gmail app password for SMTP sending |
| `GMAIL_SMTP_USER` | No | **Yes** | `email.senderAddress` | Sending Gmail account address — **no fallback, must be set** |
| `LEASING_INBOX_EMAIL` | No | Yes | `email.leasingInbox` | Leasing team's notification inbox |
| `SEED_ALERT_EMAIL` | No | Yes | `email.alertInbox` | Operational alerts recipient (can redeploy) |
| `GSC_SITE_URL` | No | No | *(derived)* | Override for the Search Console property string (default: derived as `sc-domain:<apex>` from SITE_URL) |
| `SESSION_SECRET` | ✅ | No | `secrets.required` | Express session secret |
| `NODE_ENV` | No | Yes (prod) | — | Set to `production` in deployed environment |
| `LOG_LEVEL` | No | No | — | Pino log level (default: `info`) |
| `PORT` | No | Yes (Replit) | — | Server port (Replit injects this automatically) |
| `CONFIRMATION_EMAIL_PER_RECIPIENT_DAILY_MAX` | No | No | — | Max confirmations per email per day (default: 3) |
| `CONFIRMATION_EMAIL_GLOBAL_DAILY_MAX` | No | No | — | Max total confirmations per day (default: 300) |
| `CSP_ENFORCE` | No | No | — | Set to `1` to enforce CSP (vs report-only). Start report-only, enforce after `check:csp` passes. |

## Web Artifact (artifacts/your-web-artifact)

| Variable | Secret? | Required | Config field | Description |
|---|---|---|---|---|
| `VITE_API_URL` | No | Yes | — | API server origin for browser fetches, e.g. `https://api.example-property.invalid/api` |
| `VITE_UTM_STORAGE_KEY` | No | **Yes** | `analytics.utmStorageKey` | sessionStorage key for UTM capture, e.g. `example_property_utm_params`. Also drives the visit-source key (`example-property-visit-source`). |
| `VITE_GA4_MEASUREMENT_ID` | No | **Yes** | `analytics.ga4MeasurementId` | GA4 Measurement ID for GTM send_to routing and guard validation, e.g. `G-XXXXXXXXXX`. **Required — missing throws at build time.** |
| `VITE_GA_MEASUREMENT_ID` | No | No | `analytics.ga4MeasurementId` | GA4 Measurement ID for direct (non-GTM) mode. Omit when GTM manages the stream; `VITE_GA4_MEASUREMENT_ID` is still required in GTM mode. |
| `VITE_SIGHTMAP_ID` | No | No | — | Engrain SightMap property ID (if using) |
| `PORT` | No | Yes | — | Web server port (Replit injects this automatically) |

## Scripts (web/scripts/)

| Variable | Required | Config field | Description |
|---|---|---|---|
| `SITE_URL` | **Yes** | `identity.canonicalOrigin` | Canonical www origin — used by fetch-availability-snapshot and watch-postpublish |
| `SNAPSHOT_URL` | No | — | Override availability endpoint (default: `SITE_URL + /api/availability`) |
| `OG_LOGO_FILENAME` | No | `brand.logoAssets` | White wordmark SVG filename in `public/images/` (default: `property-logo-white.svg`) |
| `UNIT_MAP_XLSX` | **Yes** | — | Path to your unit-map spreadsheet (or pass as first CLI arg) |

## Setup checklist

> **Build-time guard** — `web/vite.config.ts` calls `validateWebEnv()` on every
> `vite build` and `vite dev` invocation. In a deployment build
> (`REPLIT_DEPLOYMENT=1`) it **throws** if any Required=Yes web var is missing,
> stopping a bad deploy before user traffic arrives. In workspace / local builds
> it logs a warning and continues so `check:prepublish` and local dev still work.
> Steps 9–10 below must be done before the first production publish.

1. Provision PostgreSQL, apply `packages/db/migrations/0001_leads.sql`, and link its `DATABASE_URL` secret
2. Create `APPFOLIO_CLIENT_ID` + `APPFOLIO_CLIENT_SECRET` in AppFolio Admin → Integrations
3. Create a dedicated Gmail account for the property, enable 2FA, generate app password
4. Add all Replit Secrets in the api-server artifact's Secrets panel
5. Set `SITE_URL`, `PROPERTY_NAME`, `APPFOLIO_PROPERTY_NAME`, `APPFOLIO_LEAD_SOURCE_DEFAULT`, `APPFOLIO_DATABASE` as plain env vars on the API server
6. Set `PROPERTY_TIMEZONE` to the property's IANA timezone string (e.g. `America/Denver`)
7. Set `ALLOWED_ORIGIN` to match the web artifact's deployed domain (usually same as `SITE_URL`)
8. Set `GMAIL_SMTP_USER`, `LEASING_INBOX_EMAIL`, and `SEED_ALERT_EMAIL`
9. Generate an IndexNow key, host `<key>.txt`, set `INDEXNOW_KEY`
10. Set `VITE_GA4_MEASUREMENT_ID` and `VITE_UTM_STORAGE_KEY` in the web artifact's env vars
11. Fill in `web/server/csp-property.mjs` (run `check:csp` → paste the listed hashes)
12. Test with `NODE_ENV=development` first (emails send, CSP is report-only)
13. Set `NODE_ENV=production` and `CSP_ENFORCE=1` once `check:csp` passes cleanly
