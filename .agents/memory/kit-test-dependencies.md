---
name: Kit test dependencies
description: Why focused production-kit regression tests should prefer the existing TypeScript runtime and Node test runner.
---

Focused production-kit regression tests should use Node's built-in test runner through the kit's
existing TypeScript runtime when they do not require framework-specific mocking or browser behavior.

**Why:** Adding a separate test runner can pass in the parent workspace yet fail in the isolated kit
because the package firewall or clean consumer store cannot fetch one of its transitive packages.
Keeping the release dependency-neutral makes clean-checkout and consumer-bootstrap validation more
reliable.

**How to apply:** Extract the behavior under test behind a small typed seam, exercise it with
`node:test` and `node:assert`, and keep an integration test in the source property when broader
module mocking is useful.