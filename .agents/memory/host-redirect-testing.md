---
name: Host redirect testing
description: How to exercise canonical-host redirects in server tests without Node fetch rewriting Host.
---

Production host redirects should be verified with a native HTTP client or curl that can set the `Host` header directly. Node's built-in `fetch` replaces a custom `Host` header with the loopback request host; its trusted `X-Forwarded-Host` header can exercise the same Express proxy-host path in automated tests.

**Why:** Host canonicalization is evaluated before route handling, and a test that cannot actually control the request host can pass or fail for the wrong reason.

**How to apply:** Use curl or `node:http` for direct-host coverage; use `X-Forwarded-Host` only when intentionally testing the trusted Replit proxy path.