---
name: Trust proxy on Replit
description: How X-Forwarded-For behaves behind Replit's proxy chain and the safe Express trust-proxy setting for IP-keyed rate limiting.
---

**Rule:** Set Express `trust proxy` to the private/loopback ranges (`["loopback","linklocal","uniquelocal","10.0.0.0/8","172.16.0.0/12","192.168.0.0/16"]`), never a numeric hop count.

**Why:** Empirically (dev domain, July 2026) the Replit edge *strips* client-supplied `X-Forwarded-For` and the chain arriving at the app has multiple internal hops, e.g. `<client-ip>, 10.x.x.x, 127.0.0.1`. With `trust proxy: 1`, `req.ip` resolved to `127.0.0.1` for every visitor — collapsing any per-IP rate limit into one shared bucket. Trusting private ranges makes Express walk the chain right-to-left and stop at the first public IP (the genuine client), so attacker-prepended XFF values can never become `req.ip` even if an upstream ever passed them through.

**How to apply:** Any Express service doing IP-keyed rate limiting or logging behind Replit's proxy. Verify with a temporary middleware logging `req.headers["x-forwarded-for"]`, `req.ip`, `req.ips` — regression tests exist in the api-server (`app.trustproxy.test.ts`).
