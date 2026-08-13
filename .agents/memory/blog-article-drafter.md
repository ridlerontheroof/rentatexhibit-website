---
name: Blog draft publish-readiness
description: Why draft-gated blog content must be validated against the simulated published set, not just the draft-excluded guard run.
---

# Blog draft publish-readiness

The blog guard suites run only on the published set (drafts excluded), and the no-orphans rule requires every published article to have an inbound `related` link — an edit that can only happen at publish time, since existing articles may not reference unpublished slugs.

**Why:** "append draft + run tests green" proves nothing about publishability; a reviewer flipping `draft: true` off per the docs would hit guard failures.

**How to apply:** any tool that writes draft-gated blog content must (a) validate the candidate against the full published-article rule set (including nonempty-field rules the tests assert), and (b) simulate the prospective published set with all documented publish edits applied — and name the inbound-host article as a mandatory publish edit.
