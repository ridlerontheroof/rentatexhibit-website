# Highland Property Site — Replit Launcher

Pin this clean project as the organization's Replit custom template. Replit Agent automatically
loads `custom_instruction/instructions.md` when a new project is created from it.

The launcher is intentionally not a site:

- it contains no reusable production implementation or property-specific facts;
- it contains no credential values, environment variables, or Account Secret links;
- it pins the `kit-v2.0.0-r1` repository, annotated tag commit, and reviewed implementation digest in
  `launcher-release.json`;
- it starts intake by requesting the Claude website ZIP and offering memorandum; and
- it sends all onboarding and upgrades through the `property-site-onboarding` skill.

The launcher bundles that process-only skill under `.agents/skills/` so every generated project can
discover it. The skill contains gates, schemas, report templates, standards metadata, and intake
tools—not the deployable property-site kit.

Run `npm test` before pinning or repinning the custom template. The test verifies the remote
annotated tag still resolves to the recorded commit, checks release metadata fetched from that
exact pinned tag, and enforces the launcher's code-free, secret-free boundary without requiring
the factory repository as a sibling. At scaffold time the onboarding agent also runs the checked-out kit's
`pnpm validate:release`, which independently recomputes the implementation digest.

Creating a project from this template does not approve facts, secrets, integrations, publishing,
DNS changes, or a future kit upgrade.

See `TEMPLATE_REGISTRATION.md` for the organization-administrator registration and clean-launch
procedure. Replit currently exposes template pinning through the organization UI, not the Admin API.