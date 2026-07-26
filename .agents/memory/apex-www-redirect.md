---
name: Apex→www 301 via Squarespace forwarding
description: How the rentatexhibit.com apex 301 is configured at Squarespace DNS, and the preset gotcha that blocks setup.
---

The apex `rentatexhibit.com` gets a real HTTP 301 to `www` via a Squarespace Domain Forwarding rule (301, Maintain paths), not from hosting — the static deployment cannot issue host-level redirects.

**Why:** Squarespace's "Unable to save this domain forwarding rule" error is caused by apex records locked inside Domain Connect presets ("Domain Connect to Entri" and "Squarespace Domain Connect" `_domainconnect` CNAME). Both presets must be deleted (and any apex `A` record gone) before a forwarding rule will save. The `replit-verify` TXT on `@` was re-added as a custom record.

**How to apply:**
- Verify from shell with `curl -sI "https://rentatexhibit.com/?nc=$(date +%s)"` (add a cache-busting query string to bypass Squarespace's CDN edge cache). Expect `location: https://www.rentatexhibit.com` — a single 301 hop. Without the cache-bust the CDN serves a stale response for several hours.
- The forwarding destination was updated to `https://www.rentatexhibit.com` on 2026-07-26; Squarespace CDN propagation took several hours to clear.
- Squarespace's forwarder drops query strings; the inline JS redirect in the web artifact's `index.html` stays as a browser safety net.
- Risk: if the domain is ever reconnected to Replit via Entri/Domain Connect, the apex A record can be re-provisioned and silently replace the 301 with site-serving again. Squarespace forwarding IPs are 198.185.159.x / 198.49.23.x; the deployment IP was 34.111.179.208.
