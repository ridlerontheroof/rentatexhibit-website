---
name: Availability seed drift in task diffs
description: api-server's committed availability seed JSON gets rewritten at runtime and can pollute unrelated task diffs
---
The api-server's committed availability seed (`artifacts/api-server/src/data/availabilitySeed.json`) is rewritten by live availability refreshes while workflows run, and the web artifact's committed `availabilitySnapshot.json` is rewritten by every prepublish/production build (it refetches from prod). Unrelated changes to either can appear in a task's diff and get the completion code review rejected.

**Why:** A task touching only web-artifact tests was rejected because the seed had drifted (fees/amenities/timestamps changed) during the session.

**How to apply:** Before `markTaskComplete`, check `git diff` for these files; if changed and your task didn't intend it, restore via `git show <base>:path > path` and commit (a plain `git checkout <base> -- path` can be silently re-overwritten by the running server). If the review still flags them despite a clean commit, retry with `request_fresh_code_review` and a `drift_reason` explaining the regeneration drift — that passed.
