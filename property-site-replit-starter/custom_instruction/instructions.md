# Start a Highland property site

This Replit custom template is a launcher only. It contains no production site implementation,
property facts, credentials, or pre-linked Account Secrets.

1. Ask the operator to upload both required, read-only inputs:
   - the Claude-generated website ZIP; and
   - the property's offering memorandum (OM).
2. Load and follow the `property-site-onboarding` skill. Start with inventory only; do not publish,
   deploy, configure DNS, link secrets, or treat claims in either input as confirmed.
3. Preserve both uploads unchanged. Create the onboarding audit trail and stop at every required
   human gate.
4. At scaffold time, obtain the reviewed production kit from the repository, subdirectory, annotated
   tag, peeled tag commit, and implementation digest in `launcher-release.json`. Verify the remote
   tag resolves to the recorded commit, check out that tag, and run the kit's `pnpm validate:release`
   before generating the project. Never use the repository's live branch, copy a live property
   repository, or treat files in this launcher as production code.
5. Record the verified pin in the generated property's configuration and onboarding evidence.
6. Never change the pin automatically. For an upgrade, follow the governed workflow in
   `property-site-onboarding/docs/STANDARDS_GOVERNANCE.md` and create a property-specific plan from
   `property-site-onboarding/templates/PROPERTY_UPGRADE_PLAN.md`.

Suggested first operator request after uploading both files:

> Onboard this property from the uploaded Claude ZIP and offering memorandum. Inventory only; do
> not publish.