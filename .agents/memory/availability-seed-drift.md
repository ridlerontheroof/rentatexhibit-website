---
name: Availability seed drift in task diffs
description: api-server's committed availability seed JSON gets rewritten at runtime and can pollute unrelated task diffs
---
The api-server's committed availability seed (`artifacts/api-server/src/data/availabilitySeed.json`) is rewritten by live availability refreshes while workflows run, so unrelated changes to it can appear in a task's diff and get the completion code review rejected.

**Why:** A task touching only web-artifact tests was rejected because the seed had drifted (fees/amenities/timestamps changed) during the session.

**How to apply:** Before `markTaskComplete`, check `git diff` for this file; if it changed and your task didn't intend it, restore it via `git show <base>:path > path` and commit (a plain `git checkout <base> -- path` can be silently re-overwritten by the running server).
