# Threat Model

## Project Overview

A property-listing web app for "Exhibit on Superior" (a residential apartment property). It consists of:
- A React frontend (artifacts/exhibit-on-superior) serving property pages, a contact form, and a tour-scheduling form.
- An Express 5 API server (artifacts/api-server) that accepts lead submissions, persists them to PostgreSQL via Drizzle ORM, and sends email notifications via the Replit Google-Mail connector.
- No authentication layer — the API is intentionally public to support anonymous visitor form submissions.
- Deployed on Replit (not yet deployed at time of scan).

Tech stack: Node.js 24, TypeScript 5, Express 5, PostgreSQL, Drizzle ORM, Zod validation, pino logging, Replit Connectors SDK for Gmail.

## Assets

- **Lead PII** — visitor first/last name, email address, phone number, and optional message. Stored in the `leads` PostgreSQL table and transmitted in emails. Compromise or abuse allows spam, harassment, and privacy violations.
- **Leasing-team Gmail account** — accessed via Replit Connectors. Abuse could get the account suspended or flagged for spam, disrupting business operations.
- **DATABASE_URL** — the only secret in use; exposure would grant full database access.
- **PostgreSQL database** — contains all submitted leads including PII.

## Trust Boundaries

- **Browser → API** — the POST `/api/leads` endpoint is unauthenticated and publicly reachable. All input must be treated as untrusted.
- **API → PostgreSQL** — parameterized queries via Drizzle ORM. Direct injection is mitigated.
- **API → Gmail (via Replit Connectors)** — email content is built from user-supplied input. Header injection is mitigated; the connector itself is trusted infrastructure.
- **Public vs. authenticated** — there is no authenticated surface; all routes are public.

## Scan Anchors

- Production entry points: `artifacts/api-server/src/routes/leads.ts` (POST `/api/leads`), `artifacts/api-server/src/routes/health.ts` (GET `/api/healthz`)
- Highest-risk area: `artifacts/api-server/src/lib/email.ts` — builds email from user input; `artifacts/api-server/src/app.ts` — CORS and middleware configuration
- Public surface: all API routes are public (no auth)
- Dev-only: `artifacts/mockup-sandbox/` (design preview, `/__mockup` path), `.agents/` (agent skills)

## Threat Categories

### Denial of Service / Email Abuse

The POST `/api/leads` endpoint has no rate limiting. An attacker can submit unlimited requests. Each submission triggers two outbound emails: one to the leasing team's inbox and one to the email address provided in the form body. Because the `email` field accepts any valid RFC 5322 address, an attacker can direct confirmation emails at any third-party inbox, effectively using the app as an email spam cannon. This risks getting the leasing team's Gmail account suspended and can be used to harass third parties.

**Required guarantee:** Rate limiting MUST be applied to POST `/api/leads` (e.g., per-IP, max 5 requests/minute). The message/name/phone fields MUST have maximum-length constraints to prevent payload abuse.

### Information Disclosure

The CORS configuration (`app.use(cors())`) defaults to `Access-Control-Allow-Origin: *`. This allows any webpage to make cross-origin requests to the API without restriction. For a fully public endpoint this has limited direct impact, but it prevents CORS from being used as a defense-in-depth control in the future.

**Required guarantee:** CORS SHOULD be restricted to the known frontend origin(s) in production.

### Tampering / Injection

Email header injection is mitigated by `sanitizeHeaderValue` and `encodeHeader`. SQL injection is mitigated by Drizzle ORM parameterized queries. Input types are validated by Zod on every request. No path traversal or template injection surfaces are present in production routes.

### Spoofing

No authentication exists by design (public contact/tour forms). The leasing team's inbox is the sole notification channel; no admin or privileged surface exists.
