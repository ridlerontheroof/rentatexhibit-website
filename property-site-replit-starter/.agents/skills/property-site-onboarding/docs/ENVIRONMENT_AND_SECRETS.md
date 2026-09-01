# Environment and secrets contract

Create one `onboarding/environment-manifest.json` from the supplied template and reference it as
`environmentManifestPath` in `onboarding/property-config.json` (the path is relative to that config).
Validate both together with:

```sh
node tools/validate-config.mjs onboarding/property-config.json --phase build
node tools/validate-config.mjs onboarding/property-config.json --phase prelaunch
node tools/validate-config.mjs onboarding/property-config.json --phase golive
```

The first command requires a structurally valid manifest, matching `propertySlug` and `kitVersion`,
and rejects secret-value fields/value-shaped strings. Prelaunch and go-live additionally require an
approved manifest and terminal required-entry status. The manifest is metadata only: never put a credential,
token, password, private key, or secret JSON value in it, reports, config, source control, chat, or
screenshots.

## Classify every runtime name

- **`account-secret-link`** — an existing Replit Account Secret proposed for reuse. Record its name,
  scope owner, artifact/environment, and reason. An operator must verify that the credential's
  account/vendor/property scope is appropriate, approve it, and explicitly link it to this app.
  Discovery of an Account Secret never authorizes linking. Development and production are separate.
- **`property-secret`** — a credential unique to this property/app (for example a session key or
  property-owned service credential). Request it through Replit's secure secret flow and configure it
  only in the declared artifact/environment.
- **`non-secret`** — canonical URLs, public analytics IDs, inbox addresses, property names,
  timezones, API origins, database labels, and similar settings. Configure these as ordinary
  environment variables. Do not hide them in Secrets.

Classification follows actual credential ownership, not a hard-coded guess. AppFolio, Gmail, Google,
Maps, or analytics credentials may be account-scoped or property-scoped; the owner must decide after
scope verification. Never assume one property's identity applies to another.

## Operator procedure (G5)

1. Review manifest completeness against the pinned kit release and property config.
2. For each account link, obtain named approval, verify least privilege/vendor scope, and explicitly
   link it to the stated app, artifact, and environment. Record `APPROVED` then `LINKED`.
3. For each property secret, use the secure request flow; record existence only, then `CONFIGURED`.
4. Set non-secret values through environment settings; these may be sourced from confirmed config.
5. Check existence/status without reading values. A key in the wrong artifact or environment is
   missing. Never copy a development link into production implicitly.
6. A second operator/reviewer records date and G5 outcome. G5 passes only when every required entry
   is `LINKED` or `CONFIGURED`, no approval is pending, and secret scanning/evidence contains no
   values. Rotation or revocation reopens G5.

Deployment manifests must name artifacts exactly as the project defines them (for example
`api-server`, `web`, and `workspace-watcher`). Add rows rather than relying on inheritance; this makes
placement reviewable.