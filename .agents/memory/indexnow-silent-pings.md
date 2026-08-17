---
name: IndexNow pings can vanish silently in production
description: Background IndexNow fetches on autoscale can hang with no log; verify via the start-log breadcrumb.
---

A fire-and-forget `fetch` on an autoscale instance can be starved/hung between requests; without a timeout it neither resolves nor rejects, so no outcome line ever appears — indistinguishable from "never fired".

**Why:** autoscale throttles CPU between requests, freezing background network work; a hung promise logs nothing.

**How to apply:** every IndexNow attempt logs "IndexNow submission starting" before the network call and carries a 15s abort timeout, so each attempt yields exactly two log lines (start + accepted/rejected/failed; contract enforced by tests). When verifying pings in production, grep for the *starting* line first: start-with-no-outcome = hang; no start = code path not running. Deployment log retention only spans since the latest publish, so capture evidence promptly after the triggering event.
