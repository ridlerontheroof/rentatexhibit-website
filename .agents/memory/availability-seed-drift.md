---
name: Availability seed drift in task diffs
description: api-server's committed availability seed JSON gets rewritten at runtime and can pollute unrelated task diffs
---
The api-server's committed availability seed (`artifacts/api-server/src/data/availabilitySeed.json`) is rewritten by live availability refreshes while workflows run, and the web artifact's committed `availabilitySnapshot.json` is rewritten by every prepublish/production build (it refetches from prod). Unrelated changes to either can appear in a task's diff and get the completion code review rejected.

**Why:** A task touching only web-artifact tests was rejected because the seed had drifted (fees/amenities/timestamps changed) during the session.

**Update 2026-08-11:** the web snapshot side is fixed — `fetch-availability-snapshot.mjs` now skips the write when only `updatedAt` changed, so builds no longer dirty the tree with timestamp-only drift. The api-server seed can still drift. If a merge stalls anyway, also check for a stale `.git/index.lock` (no git process running → safe to remove); timestamp-only rebase conflicts in the snapshot resolve by keeping the newer `updatedAt`.

**How to apply:** Before `markTaskComplete`, check `git diff` for these files; if changed and your task didn't intend it, restore via `git show <base>:path > path` and commit (a plain `git checkout <base> -- path` can be silently re-overwritten by the running server). If the review still flags them despite a clean commit, retry with `request_fresh_code_review` and a `drift_reason` explaining the regeneration drift — that passed.
