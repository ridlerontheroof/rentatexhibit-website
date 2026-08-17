# Environment Variables & Secrets

All variables are read from the process environment. On Replit, secrets
(credentials/keys) live in the Replit Secrets vault; non-secret config lives
as plain environment variables in the artifact's settings.

Every value here maps to a field in `property-config.json` — see the schema
at `.agents/skills/property-site-onboarding/schema/property-config.schema.json`.

## API Server (artifacts/api-server)

| Variable | Secret? | Required | Config field | Description |
|---|---|---|---|---|
| `APPFOLIO_CLIENT_ID` | ✅ | Yes | `secrets.required` | AppFolio Reports API OAuth client ID |
| `APPFOLIO_CLIENT_SECRET` | ✅ | Yes | `secrets.required` | AppFolio Reports API OAuth client secret |
| `APPFOLIO_DATABASE` | No | **Yes** | `appfolio.database` | AppFolio database name (subdomain prefix, e.g. `woodscrossingmgmt`). Visible in your AppFolio portal URL. **No default — missing throws on startup.** |
| `PROPERTY_TIMEZONE` | No | **Yes** | `nap.timezone` | IANA timezone for slot times and date formatting, e.g. `America/Denver`. Falls back to `America/Chicago` if unset — always set explicitly to avoid booking-time errors. |
| `APPFOLIO_PROPERTY_NAME` | No | **Yes** | `appfolio.propertyName` | Exact property name for AppFolio filters and row matching, e.g. `Woods Crossing` |
| `APPFOLIO_LEAD_SOURCE_DEFAULT` | No | **Yes** | `appfolio.leadSourceDefault` | Default AppFolio lead-source label, e.g. `Website (WoodsCrossing)` |
| `SITE_URL` | No | **Yes** | `identity.canonicalOrigin` | Canonical www production URL, e.g. `https://www.woodscrossing.com`. Used by apex check, IndexNow, SEO digest, snapshot fetcher, and post-publish watcher. |
| `ALLOWED_ORIGIN` | No | **Yes** | `identity.canonicalOrigin` | Web app's production HTTPS origin for CORS (same as SITE_URL unless API is on a separate subdomain) |
| `PROPERTY_NAME` | No | **Yes** | `property.name` | Full marketing name shown in email from-name, e.g. `Woods Crossing Apartments` |
| `INDEXNOW_KEY` | No | **Yes** | *(deployment)* | Key string from indexnow.org; must also be hosted at `<SITE_URL>/<key>.txt` |
| `GMAIL_APP_PASSWORD` | ✅ | Yes | `secrets.required` | 16-char Gmail app password for SMTP sending |
| `GMAIL_SMTP_USER` | No | **Yes** | `email.senderAddress` | Sending Gmail account address — **no fallback, must be set** |
| `LEASING_INBOX_EMAIL` | No | Yes | `email.leasingInbox` | Leasing team's notification inbox |
| `SEED_ALERT_EMAIL` | No | Yes | `email.alertInbox` | Operational alerts recipient (can redeploy) |
| `GSC_SITE_URL` | No | No | *(derived)* | Override for the Search Console property string (default: derived as `sc-domain:<apex>` from SITE_URL) |
| `SESSION_SECRET` | ✅ | No | `secrets.required` | Express session secret |
| `NODE_ENV` | No | Yes (prod) | — | Set to `production` in deployed environment |
| `LOG_LEVEL` | No | No | — | Pino log level (default: `info`) |
| `PORT` | No | Yes | — | Server port (Replit injects this automatically) |
| `CONFIRMATION_EMAIL_PER_RECIPIENT_DAILY_MAX` | No | No | — | Max confirmations per email per day (default: 3) |
| `CONFIRMATION_EMAIL_GLOBAL_DAILY_MAX` | No | No | — | Max total confirmations per day (default: 300) |
| `CSP_ENFORCE` | No | No | — | Set to `1` to enforce CSP (vs report-only). Start report-only, enforce after `check:csp` passes. |

## Web Artifact (artifacts/your-web-artifact)

| Variable | Secret? | Required | Config field | Description |
|---|---|---|---|---|
| `VITE_API_URL` | No | Yes | — | API server origin for browser fetches, e.g. `https://api.woodscrossing.replit.app/api` |
| `VITE_UTM_STORAGE_KEY` | No | **Yes** | `analytics.utmStorageKey` | sessionStorage key for UTM capture, e.g. `woodscrossing_utm_params`. Also drives the visit-source key (`woodscrossing-visit-source`). |
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

1. Create `APPFOLIO_CLIENT_ID` + `APPFOLIO_CLIENT_SECRET` in AppFolio Admin → Integrations
2. Create a dedicated Gmail account for the property, enable 2FA, generate app password
3. Add all Replit Secrets in the api-server artifact's Secrets panel
4. Set `SITE_URL`, `PROPERTY_NAME`, `APPFOLIO_PROPERTY_NAME`, `APPFOLIO_LEAD_SOURCE_DEFAULT`, `APPFOLIO_DATABASE` as plain env vars on the API server
5. Set `PROPERTY_TIMEZONE` to the property's IANA timezone string (e.g. `America/Denver`)
6. Set `ALLOWED_ORIGIN` to match the web artifact's deployed domain (usually same as `SITE_URL`)
7. Set `GMAIL_SMTP_USER`, `LEASING_INBOX_EMAIL`, and `SEED_ALERT_EMAIL`
8. Generate an IndexNow key, host `<key>.txt`, set `INDEXNOW_KEY`
9. Set `VITE_GA4_MEASUREMENT_ID` and `VITE_UTM_STORAGE_KEY` in the web artifact's env vars
10. Fill in `web/server/csp-property.mjs` (run `check:csp` → paste the listed hashes)
11. Test with `NODE_ENV=development` first (emails send, CSP is report-only)
12. Set `NODE_ENV=production` and `CSP_ENFORCE=1` once `check:csp` passes cleanly
