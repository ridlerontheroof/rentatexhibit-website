---
name: Production DB writes are impossible from the workspace
description: Every workspace path to the production database is read-only; owner runs writes via the database pane.
---
The rule: there is no workspace path that can write to the production database. `executeSql` with `environment: "production"` runs on a read-only replica ("cannot execute DELETE in a read-only transaction"), and the production `DATABASE_URL`/`PG*` values are runtime-managed secrets whose values are never exposed (`viewEnvVars` shows existence only).

**Why:** confirmed 2026-08-17 while trying an owner-approved delete of test rows; both paths were tried and blocked by platform design.

**How to apply:** for any production data fix, hand the owner exact SQL to run in the production database pane (deep link `<open-in-pane tool="database/production/public/<table>">`), then verify afterward with a read-only prod SELECT. Don't build one-off admin endpoints for this.
