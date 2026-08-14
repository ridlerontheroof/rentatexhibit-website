# Secrets Migration Checklist — Exhibit → Woods Crossing

Secret **names** from the Exhibit On Superior project with reuse-vs-create-new guidance for the Woods Crossing Replit project. **No values here, ever** — values are entered directly into the new project's Secrets pane by the owner.

## Reusable (same value can be entered in the new project)

| Secret | Purpose | Notes |
|---|---|---|
| `GOOGLE_MAPS_BROWSER_API_KEY` | Browser-side Maps JS/embed key | Reusable, but add the new domain (`www.woodscrossingslc.com` + the new repl's `.replit.dev`/`.replit.app` domains) to the key's HTTP-referrer restrictions in Google Cloud Console. |
| `GOOGLE_PLACES_API_KEY` | Server-side Places API (nearby places, reviews feed) | Reusable as-is (server key, IP/API restrictions only). Same GCP project billing. |
| `GOOGLE_CRUX_API_KEY` | Chrome UX Report API (field CWV checks) | Reusable as-is; CrUX queries are per-origin, just query the new origin. |
| `GA4_SERVICE_ACCOUNT_JSON` | Service account for GA4 Data API reporting | Reusable **if** the same service account is granted Viewer access on the NEW GA4 property. Grant access in GA4 Admin → Property access management. |
| `GITHUB_PAT` | Code-mirror sync to GitHub | Reusable if the same GitHub account hosts the Woods Crossing mirror repo; scope it to the new repo. Otherwise mint a fresh fine-grained PAT. |
| `GMAIL_APP_PASSWORD` | SMTP sending for alert/lead emails | Reusable **only if** the same alert inbox (Gmail account) serves both properties. If Woods Crossing gets its own leasing inbox, create a new app password on that account. Remember: envelope recipients must be set explicitly with nodemailer raw sends; DKIM/DMARC live in the sending domain's DNS. |

## Create new (property/owner-specific — do NOT reuse)

| Secret | Purpose | How to obtain |
|---|---|---|
| `GA4_PROPERTY_ID` | GA4 reporting property | Create a **new GA4 property** for woodscrossingslc.com (new stream, new Measurement ID → `NEXT_PUBLIC_GA_MEASUREMENT_ID` too). Don't mix two properties' traffic. |
| `APPFOLIO_CLIENT_ID` / `APPFOLIO_CLIENT_SECRET` | AppFolio Reports/listings API (availability, guest cards, showings) | The new owner's AppFolio database is separate — request API credentials from **their** AppFolio admin (API access must be enabled on their account). Endpoints/report names may differ; re-verify unit_vacancy, guest_cards, and showing endpoints against their database. |
| `SESSION_SECRET` | Server session signing | Generate fresh random bytes for the new project (e.g. `openssl rand -base64 32`). Never share between apps. |
| IndexNow key | Bing/IndexNow submissions | Generate a new key for the new domain and host the key file at the site root. |

## Not secrets, but must be re-established per-domain

- **Google Search Console**: verify `www.woodscrossingslc.com` (domain property preferred — covers apex/www/http/https) for the new owner's Google account.
- **Bing Webmaster Tools**: verify the new domain (can import from Search Console).
- **GTM container** (`NEXT_PUBLIC_GTM_ID`): create a new container for the new site if GTM is used.
- **Google Business Profile**: the reviews feed reads a specific listing — confirm the correct Woods Crossing listing ID (watch for duplicate profiles; Exhibit had one).
- Form endpoints (`NEXT_PUBLIC_*_FORM_ENDPOINT` in `.env.example`): point at the new project's own API once built — never at the old platform's routes.

## Process

1. In the new Replit project, add secrets via the Secrets pane / agent secrets flow only — never paste values into chat, code, or committed files.
2. Reused Google keys: update key restrictions **before** launch, not after.
3. After launch, confirm each integration end-to-end (a test lead into the new AppFolio database, a GA4 realtime hit, a Maps load on the production domain).
