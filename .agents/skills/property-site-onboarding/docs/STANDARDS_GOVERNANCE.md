# Standards promotion and property upgrades

Standards, kit releases, and property deployments are separate governed objects. No live-site fix
becomes reusable merely because it shipped.

## Promote a reusable learning

1. **Propose:** copy `templates/STANDARDS_CHANGE_MANIFEST.json` into a governance work item. Record
   source evidence, affected checks, property-neutral behavior, risks, migration, tests, and proposed
   semantic bumps. Status is `PROPOSED`.
2. **Evaluate:** reproduce the behavior outside the source property. Reject property facts, brand,
   vendor identity, credentials, and one-off launch decisions. Security/privacy review is mandatory
   for data, forms, tracking, vendors, CSP, or secret scope.
3. **Review:** standards owner and technical reviewer set named/date-stamped approvals. A required
   rejection returns the proposal to `PROPOSED`; no blank or `PENDING` approval permits promotion.
4. **Implement:** update the standards manifest and production kit on reviewable branches. Add or
   update an automated guard where feasible. Keep manifest and kit versions independent and record
   compatibility in the change manifest.
5. **Release:** run the complete kit verification suite, attach evidence, publish immutable semantic
   releases, record tag/digest, then set status `RELEASED`. Never rewrite a tag.
6. **Offer:** identify potentially affected pinned sites. Do not modify them. Create an upgrade plan
   only when an owner elects to evaluate adoption.

For analytics data watchdogs, an at-or-below-floor result is not definitive until an immediate
second query is also at or below the floor. A recovered confirmation is healthy; an errored
confirmation is ambiguous. Operational logs must retain both readings and a non-secret
configuration fingerprint without exposing property credentials.

### Semantic rules

- Standards **MAJOR**: removes, reverses, or incompatibly changes a requirement or gate.
- Standards **MINOR**: adds or materially strengthens a requirement.
- Standards **PATCH**: clarification/evidence correction with no conformance change.
- Kit **MAJOR**: incompatible project/config/migration contract; **MINOR**: backward-compatible
  capability; **PATCH**: compatible fix. A standards bump does not mechanically dictate the kit bump.

## Upgrade a pinned property

1. Copy `templates/PROPERTY_UPGRADE_PLAN.md` into that property's `onboarding/upgrades/`.
2. Record current/target kit tags and digests, compatible standards versions, change manifests,
   property-specific conflicts, config/content/schema migrations, environment deltas, risk, rollback,
   and exact validation commands.
3. Technical, property-owner, and any required security/privacy reviewers approve the plan. Keep the
   site pinned if deferred or rejected.
4. Apply on an isolated branch; never merge from a live property's repository. Secret links remain
   manual and environment-specific.
5. Run migration and full prepublish evidence, verify no gate was invalidated, obtain G8 publish
   approval, deploy, and run post-publish checks.
6. Record outcome, evidence paths, deployed digest, reviewer/date, and rollback result. Update
   `kitVersion` only after the approved upgrade is applied. Failure restores the prior pin.

Gap reports always retain the manifest version measured. Upgrade availability never means consent,
and no release is automatically forced into an existing site.