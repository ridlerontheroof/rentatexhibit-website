# Register the Highland property-site launcher

## Ownership

Registration and repinning require a Replit organization administrator with the `system_admins`
role. The kit maintainer owns the immutable release pin; the organization administrator owns the
workspace-visible template registration. These may be different people.

## Validate before registration

From this standalone launcher project:

```sh
npm test
npm run validate
npm start
```

All checks must pass. The first-run output must request only:

1. the Claude-generated website ZIP; and
2. the property offering memorandum.

Do not add property facts, environment settings, credential values, Account Secret links, or
production implementation to the launcher.

## Register in Replit

Replit does not currently provide an Admin API endpoint for custom-template registration.
An organization administrator must:

1. Create a new, clean Replit App in the Highland organization.
2. Place only this launcher's allowlisted files at the app root.
3. Run the validation commands above in that app.
4. Open the app's three-dot action menu.
5. Select **Pin to Agent input box**.
6. Name it **Highland Property Website — New Property**.
7. Confirm it is available to authorized organization members.

## Clean-launch drill

1. From the Agent input box, select **Highland Property Website — New Property**.
2. Create a disposable app.
3. Confirm `npm test` passes without a sibling factory repository.
4. Confirm no property config, environment manifest, `.env` file, credential, or Account Secret
   link exists.
5. Run `npm start`; confirm it requests the ZIP and OM and directs Agent to inventory-only
   onboarding.
6. Do not upload real credentials or publish the disposable app.
7. Record the result in `registration-evidence.json` in the source launcher project.

## Refresh policy

Never repin because a live branch changed. First publish a governed, immutable kit release, update
`launcher-release.json`, run the launcher tests, complete another disposable-app drill, and only
then refresh the pinned template. Existing property projects remain pinned and are never upgraded
automatically.