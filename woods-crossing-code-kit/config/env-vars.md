# Environment Variables & Secrets

All variables are read from the process environment. On Replit, secrets
(credentials/keys) live in the Replit Secrets vault; non-secret config lives
as plain environment variables in the artifact's settings.

## API Server (artifacts/api-server)

| Variable | Secret? | Required | Description | Woods Crossing value |
|---|---|---|---|---|
| `APPFOLIO_CLIENT_ID` | ✅ | Yes | AppFolio Reports API OAuth client ID | From AppFolio Admin → Integrations |
| `APPFOLIO_CLIENT_SECRET` | ✅ | Yes | AppFolio Reports API OAuth client secret | From AppFolio Admin → Integrations |
| `APPFOLIO_DATABASE` | No | No | AppFolio database name (subdomain prefix) | e.g. `woodscrossingmgmt` |
| `GMAIL_APP_PASSWORD` | ✅ | Yes | 16-char Gmail app password for SMTP sending | Google Account → Security → App passwords |
| `GMAIL_SMTP_USER` | No | No | Sending Gmail account address | e.g. `leasingwoodscrossing@yourdomain.com` |
| `LEASING_INBOX_EMAIL` | No | No | Leasing team's notification inbox | e.g. `leasing@woodscrossing.com` |
| `SEED_ALERT_EMAIL` | No | No | Operational alerts recipient (can redeploy) | e.g. `ops@yourmanagementcompany.com` |
| `ALLOWED_ORIGIN` | No | Yes (prod) | Web app's production HTTPS origin for CORS | e.g. `https://www.woodscrossing.com` |
| `SESSION_SECRET` | ✅ | No | Express session secret (if using sessions) | Any strong random string |
| `NODE_ENV` | No | Yes (prod) | Set to `production` in deployed environment | `production` |
| `LOG_LEVEL` | No | No | Pino log level (default: `info`) | Leave default |
| `PORT` | No | Yes | Server port (Replit injects this) | Injected automatically |
| `CONFIRMATION_EMAIL_PER_RECIPIENT_DAILY_MAX` | No | No | Max confirmations per email per day (default: 3) | Leave default |
| `CONFIRMATION_EMAIL_GLOBAL_DAILY_MAX` | No | No | Max total confirmations per day (default: 300) | Leave default |
| `GENERAL_TOUR_CONFIRMATION_EMAIL` | No | No | Set to `1` to enable Exhibit-branded tour confirmations | Enable once AppFolio templates updated |
| `CSP_ENFORCE` | No | No | Set to `1` to enforce CSP (vs report-only) | Start report-only, enforce after testing |

## Web Artifact (artifacts/exhibit-on-superior)

| Variable | Secret? | Required | Description | Woods Crossing value |
|---|---|---|---|---|
| `VITE_API_URL` | No | Yes | API server origin for browser fetches | e.g. `https://api.woodscrossing.replit.app/api` |
| `VITE_GA_MEASUREMENT_ID` | No | No | GA4 Measurement ID (omit if using GTM) | Omit if GTM-managed |
| `VITE_SIGHTMAP_ID` | No | No | Engrain SightMap property ID (if using) | From Engrain dashboard |
| `PORT` | No | Yes | Web server port (Replit injects this) | Injected automatically |

## Setup checklist

1. Create APPFOLIO_CLIENT_ID + APPFOLIO_CLIENT_SECRET in AppFolio Admin
2. Create a dedicated Gmail account for the property, enable 2FA, generate app password
3. Add all Replit Secrets in the api-server artifact's Secrets panel
4. Set ALLOWED_ORIGIN to match the web artifact's deployed domain
5. Set LEASING_INBOX_EMAIL and SEED_ALERT_EMAIL as plain env vars
6. Test with NODE_ENV=development first (emails send, CSP is report-only)
7. Set NODE_ENV=production and CSP_ENFORCE=1 once verified
