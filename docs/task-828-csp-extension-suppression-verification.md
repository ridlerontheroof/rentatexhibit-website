# Task 828 — Production Verification Record

**Verified against:** build `mt2w33kf-f7cc7027`, built `2026-08-21T11:52:02.511Z`  
**Verification run:** 2026-08-22T19:28 UTC  
**API commit in production at verification time:** `474543e` (chrome-extension suppression)  
**API commit at HEAD (ships `knownNoise` warn field):** `440141d` — active in next publish

---

## Criterion 1 — Production CSP does not allow `https://apis.google.com`

```
curl -sSD - -o /dev/null https://www.rentatexhibit.com/ | grep content-security-policy | grep -c apis.google.com
0   →  OK: apis.google.com absent
```

---

## Criterion 2 & 3 — Extension report is logged then suppressed; no alert email consumed

**Probe:** `source-file: chrome-extension`, `blocked-uri: https://csp-ext-ev-1787426902.invalid/client.js`

```
[2026-08-22T19:28:22.213Z INFO] CSP violation suppressed as known noise
  signature: "script-src-elem|https://csp-ext-ev-1787426902.invalid"

[2026-08-22T19:28:22.213Z WARN] Visitor browser reported a CSP violation
  signature:          "script-src-elem|https://csp-ext-ev-1787426902.invalid"
  effectiveDirective: "script-src-elem"
  blockedUri:         "https://csp-ext-ev-1787426902.invalid/client.js"
  sourceFile:         "chrome-extension"
  disposition:        "enforce"
```

No `Sent CSP violation alert email` entry for this signature. ✅

> The `knownNoise: true` field in the WARN log body is present in commit `440141d` (HEAD) and
> will appear in production logs after the next publish.

---

## Criterion 4 — Actionable site-originated report still reaches the alert path

**Probe:** `source-file: null`, `blocked-uri: https://csp-act-ev-1787426902.invalid/client.js`

```
[2026-08-22T19:28:22.351Z WARN] Visitor browser reported a CSP violation
  signature:          "script-src-elem|https://csp-act-ev-1787426902.invalid"
  effectiveDirective: "script-src-elem"
  blockedUri:         "https://csp-act-ev-1787426902.invalid/client.js"
  sourceFile:         null
  disposition:        "enforce"

[2026-08-22T19:28:24.565Z INFO] Sent CSP violation alert email
  recipient:  "ridler@highlandptrs.com"
  directive:  "script-src-elem"
```

Alert email delivered; actionable path intact. ✅

---

## Summary

| Criterion | Result |
|---|---|
| `apis.google.com` absent from live CSP | ✅ |
| Extension report present in logs | ✅ |
| Extension report suppressed (no email) | ✅ |
| Actionable report reaches alert inbox | ✅ |

All four task acceptance criteria confirmed on the deployed build.
