---
name: CSP violation reporting
description: Real-visitor CSP reports flow to the api-server; wire-format and hardening rules for the endpoint.
---

The prod CSP carries `report-uri /api/csp-reports` + `report-to csp-endpoint` (with a `Reporting-Endpoints` header); api-server's `/csp-reports` route (reached as `/api/csp-reports` via the shared `/api` prefix) logs reports and emails deduped alerts.

**Why:** the prepublish check:csp only exercises pages as built — GTM container changes break only in production, silently, once CSP is enforced.

**How to apply:**
- Browsers send `application/csp-report` (legacy `csp-report` wrapper) or `application/reports+json` (array of `{type:"csp-violation", body}`); the app-level `express.json` won't parse either — the route needs its own parser with an explicit `type` list, and a router-level error handler so malformed bodies still get 204 (express.json otherwise 400s).
- Some legacy user agents send the whole policy fragment in `violated-directive` and omit `blocked-uri`; normalize the first directive token, keep the report in logs, but do not email or spend the daily alert budget because no blocked resource can be investigated.
- The endpoint is unauthenticated by nature: keep the per-request report cap, per-minute processing cap, per-signature daily claim (shared dailyClaim, subKey = directive|blocked-origin), and hard daily email cap. Don't release the claim on failed send — a broken mailer would burn the email budget on one signature.
- Dedupe signature collapses blocked URLs to their origin so query-string rotation can't split it.
