---
name: Legacy URL 301s
description: How old-platform URLs (Wix, G5 /apartments/il/chicago/*, RentCafe .aspx) become single-hop 301s in production.
---
The production Express server scans dist/public at startup for meta-refresh redirect stubs (written by the prerenderer from `src/data/legacyRedirects.ts`) and turns each into a real single-hop 301 — checked BEFORE the trailing-slash redirect so `/legacy/path/` goes straight to the target in one hop. Query strings are preserved on internal targets.

**Why:** the audit flagged legacy URLs answering 200 with stub/shell content (soft-404). Stubs alone signal a redirect only via `refresh=0`; a real 301 is unambiguous and single-hop.

**How to apply:**
- To add a legacy redirect: add the entry to `src/data/legacyRedirects.ts` AND the bare+trailing-slash rewrite pair in artifact.toml (prerender parity guard fails the build otherwise). The server picks it up automatically from the built stub — no server edit needed.
- `.aspx` legacy paths work the same way (stub dir literally named `floorplans.aspx/`).
- The stubs remain in the build as belt-and-braces for any non-301 serving path; client-side `<Redirect>` routes in App.tsx remain too.
- Guard tests live in `src/server/production-server.test.ts` (redirect map + soft-404 guard for unknown `/apartments/il/chicago/*` and `.aspx` paths).
