---
name: GTM-injected inline scripts vs hashed CSP
description: How runtime GTM Custom HTML tags interact with the hash-only script-src and where their hashes live.
---

The production CSP allows inline scripts by hash only, collected from dist HTML at server startup. Scripts injected at **runtime** by the GTM container (GTM-MDPWH532) are invisible to that walk.

**Known case (2026-07-29):** the container serves a Custom HTML tag that injects the Ahrefs Analytics loader as an inline `<script>` (`analytics.ahrefs.com/analytics.js`, data-key). Its content is fixed by the container config, so its sha256 hash is allowed via the `gtmInjectedScriptHashes` constant in `server/index.mjs` (next to the CSP definition).

**Why:** hashing is safer than 'unsafe-inline' or 'strict-dynamic' (strict-dynamic would break the parser-inserted app bundle scripts by disabling the host allowlist).

**How to apply:** if `check:csp` fails with "Refused to execute inline script … a hash ('sha256-…') is required", the GTM container changed a tag. Verify what the script is (query `script:not([src])` in the DOM under the enforced server — blocked scripts still keep their textContent), then update the hash constant. Google tag beacon hosts (www.google.com /g/collect + /ccm/collect, analytics.google.com, stats/ad/googleads doubleclick, analytics.ahrefs.com) are in connect-src; new hosts show up as connect-src violations in the same check.

**Google Ads conversion tag (2026-08):** the GTM container now fires a gtag config that loads scripts from googleads.g.doubleclick.net and www.googleadservices.com; both are allowed in script-src in server/index.mjs (connect-src alone is not enough — the violation is script-src-elem).
