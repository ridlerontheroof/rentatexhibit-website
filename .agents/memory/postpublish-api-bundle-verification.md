---
name: Post-publish API bundle verification
description: How to avoid mistaking a fresh web release for fresh API behavior in a multi-artifact deployment
---

Treat the live API's behavior and log fields as the release proof; do not infer that the API bundle is current only because the published commit and web build stamp are current.

**Why:** A multi-artifact publish used a commit containing a new CSP classifier, while a unique production probe still executed the prior API behavior and sent an alert. A reused daily signature would have hidden this behind deduplication.

**How to apply:** Build the API deterministically from deployment source. For post-publish API checks, use an authenticated, uniquely signed probe with a reserved rate-limit budget; verify branch-specific log evidence and the expected side effect or non-effect from the same response. If behavior or runtime provenance is stale, fail the publish health check.