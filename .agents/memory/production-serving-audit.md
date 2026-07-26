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
- squirrel refuses localhost/127.0.0.1 targets ("Cannot reach") — you cannot audit the local prod server; verify fixes by inspecting dist HTML instead, and re-audit live after publish.
- squirrel is case-sensitive on attributes: renderToString ships `fetchPriority=`/`srcSet=` camelCase, so heroes get flagged as missing fetchpriority; prerender.mjs now lowercases them post-render (behavior-neutral for browsers).
- squirrel's `schema/video` rule does NOT credit VideoObject nodes nested in a JSON-LD `@graph` — persistent false positive on unit pages with video tours; verified present statically and post-hydration.
- Radix Slider SSRs two hidden form-bridge `<input style="display:none">` (it can't call closest('form') server-side); prerender.mjs stamps aria-hidden/tabindex=-1 on them or scanners flag unlabeled inputs.
- `/privacy-policy` is deliberately indexable + in sitemap: a noindexed policy trips 4 audit warnings incl. "no privacy policy found" (E-E-A-T). Booking + accessibility-statement stay noindex.
- `a11y/color-contrast` "potential" flags all traced to the single `--muted-foreground` token; darkened to 35% lightness (#595959, 7.0:1 white / 6.4:1 muted panels) for headroom. Remaining flags on aria-hidden lucide SVGs are decorative false positives.
- The color-contrast rule is a CLASS-NAME heuristic, not a computed check: it pattern-matches muted/gray-ish utility classes ("may have low contrast", classBasedIssues) and keeps listing all ~34 items forever regardless of actual color. Verified live 2026-07-26 via headless-chromium computed styles: all flagged elements measure 7.0:1 (white) / 6.42:1 (gray panels) — permanent won't-fix scanner noise.
- Won't-fix scanner findings: GAESA cookie flags (platform edge), first-row AppFolio thumbs lazy in SSR HTML (deliberate — React 19 auto-preload of rotating CDN photos), token-weight/keyword-density (SPA nature), Instagram 429 link check (rate limit).
