---
name: Release evidence commit binding
description: How to keep immutable release tags bound to the exact commit that passed clean-checkout validation when evidence is recorded later.
---

When release evidence is written in a metadata-only commit after a candidate passes, the release command must target the recorded candidate SHA explicitly, not `HEAD`. It should verify that the candidate exists and that no implementation files differ between the candidate and the evidence-record commit.

**Why:** A metadata record cannot contain its own commit SHA. Without explicit binding, rerunning release preparation after recording evidence can recommend tagging the later, unvalidated metadata commit and silently break the audit chain.

**How to apply:** Keep publication metadata outside implementation digests and property-neutral scans, validate the evidence schema, recheck final checkout cleanliness, and permit only the declared publication metadata file to differ from the recorded candidate.

When validating a fresh consumer clone from an annotated tag, Git may warn that the tag ref itself is not a commit before peeling it and checking out the tagged commit. Treat the clone as valid only after `git rev-parse HEAD` matches the recorded candidate and `git describe --tags --exact-match` returns the intended release tag.