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

Run `npm test` before pinning or repinning the custom template. The test verifies the remote
annotated tag still resolves to the recorded commit, checks the release metadata against the
factory's `woods-crossing-code-kit/release.json`, and enforces the launcher's code-free,
secret-free boundary. At scaffold time the onboarding agent also runs the checked-out kit's
`pnpm validate:release`, which independently recomputes the implementation digest.

Creating a project from this template does not approve facts, secrets, integrations, publishing,
DNS changes, or a future kit upgrade.