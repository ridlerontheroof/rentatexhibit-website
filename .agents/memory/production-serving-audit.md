---
name: Production serving-layer audits
description: Quirks discovered auditing the Express serving layer live (squirrel CLI, CSP report-only, edge cookie/cache rewrites)
---

- The `squirrel` CLI is not preinstalled: `curl -fsSL https://squirrelscan.com/install.sh -o /tmp/i.sh && bash /tmp/i.sh` (piping to `sh` fails); installs to `~/.local/bin`. Background it with the absolute path — nohup loses PATH.
- squirrelscan does NOT count `Content-Security-Policy-Report-Only` as a CSP (`security/csp` keeps warning until enforced).
- The platform's Google Frontend edge sets a `GAESA` cookie (flagged by cookie-flag rules, not fixable in app) and rewrites `Cache-Control: public` → `private`; max-age/immutable survive.
- Google Maps JS on /map-directions needs CSP allowances beyond maps.googleapis.com: `style-src` fonts.googleapis.com, `font-src` fonts.gstatic.com, `connect-src` mapsresources-pa.googleapis.com.
- **How to check CSP violations live:** playwright-core in `.agents/skills/playwright-skill/node_modules` + nix chromium (`/nix/store/*playwright-browsers-chromium/chromium-*/chrome-linux/chrome`, `--no-sandbox`); listen for console messages and `securitypolicyviolation` events; run the script from inside the skill dir so module resolution works.
- The web artifact's committed `src/data/availabilitySnapshot.json` also drifts at build time (like the api-server seed) — revert before completing a task.
- Prepublish CSP lockout guard: `check:csp` serves dist/public via the real server with CSP_ENFORCE=1, drives nix chromium over raw CDP across the key page types, and fails on any violation (DOM event + console channels). It self-tests by injecting an unhashed inline script first — if that isn't detected, the harness aborts rather than green-lighting blindly.
- script-src carries no 'unsafe-inline': the prod server hashes every executing inline `<script>` found in dist HTML at startup (ld+json skipped). New inline scripts are auto-hashed on restart, but scripts GTM injects as inline "Custom HTML" tags would be blocked — keep GTM tags to external-src types.
- squirrelscan doesn't credit AVIF `imagesrcset` preloads against the rendered WebP `<img>` (lcp-hints/lcp-fetchpriority keep warning — scanner noise, not a regression); `ax/token-weight` and `perf/total-byte-weight` are structural SPA/photography ceilings that cap the overall score around low-70s despite `.md` twins.
- Param-variant duplicate titles (?ada=1/?unit=): fixed with client-side title/description overrides via the Seo component — squirrel renders JS so Helmet titles count; canonicals untouched.
