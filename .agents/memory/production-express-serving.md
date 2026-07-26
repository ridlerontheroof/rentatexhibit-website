---
name: Production Express serving layer
description: How the web artifact serves in production (Express, not static) and the constraints to respect.
---

The web artifact's production is an Express server (`server/index.mjs`) run via `[services.production.run]` (autoscale), NOT `serve = "static"`.

**Why:** the platform static edge could not do compression, cache-control, security headers, non-slash 301s, or real 404s (SEO Phase 1).

**How to apply:**
- The rewrite table in `artifact.toml` is still authoritative: the server parses it at startup, and prerender/unit-rewrite build guards check the toml text — never delete the rewrites even though the platform no longer consumes them.
- `[services.production.run.env] PORT` must match the service `localPort`.
- Trailing-slash `from` entries are 301s to non-slash; `/*` and `/knowledge/*` wildcards are 404s (prerendered `404.html` / knowledge not-found stub).
- Compression is build-time (`scripts/precompress.mjs` writes `.br`/`.gz` siblings, last step of build); the server does no runtime compression.
- CSP ships Report-Only; set `CSP_ENFORCE=1` in the deployment env to enforce after verifying GTM/YouTube/Maps/AppFolio in prod.
- Health probe: `/healthz`.
