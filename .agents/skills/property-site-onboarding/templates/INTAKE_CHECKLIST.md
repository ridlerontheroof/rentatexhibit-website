# Owner intake checklist — <Property Name>

What the owner/operator must provide before each phase can proceed. Check off with date + provider.

## Needed for discovery/design
- [ ] Claude-generated website ZIP received, hashed, and inventoried read-only (standard input)
- [ ] Offering memorandum (PDF) — facts extracted into the uncertainty register
- [ ] High-res photos (exteriors, interiors, amenities; originals, not web-compressed)
- [ ] Logos & brand assets (vector preferred) + any brand guidelines
- [ ] Confirmation of reuse rights for legacy site photos/copy (gate G2)
- [ ] Legacy-site access if bot-walled: CDN allowlist for our crawler, platform export, or hosting login
- [ ] Any GSC/analytics export from the legacy site (top pages, queries)

## Needed for build (gate G7)
- [ ] AppFolio database host confirmation (company database, not the brand name)
- [ ] EXACT AppFolio property name (verified via unit_directory report)
- [ ] Hidden "Tour" unit created in AppFolio by the leasing team (name recorded in config)
- [ ] AppFolio Reports API credential scope/owner verified; approved Account Secret explicitly linked
      or property-specific credential requested securely (names/status only in manifests)
- [ ] Leasing inbox address (leads) and alert inbox address (technical) — never the same mailbox
- [ ] Sender mailbox + SMTP app password (Replit Secret)
- [ ] Verified leasing facts: gate G1 sign-off on the uncertainty register

## Needed for go-live (gates G5, G6, G8)
- [ ] Environment manifest reviewed by artifact/environment; no values recorded
- [ ] Every Account Secret reuse explicitly approved and linked to this app (development and production separately)
- [ ] Every property-specific secret requested through the secure flow and present in its declared artifact/environment
- [ ] Every non-secret setting configured as an environment setting, not a Secret
- [ ] Domain/registrar access (note provider — Squarespace has the Domain Connect preset trap)
- [ ] GA4 property + GTM container created (IDs into config); GA4 service account granted Viewer
- [ ] Google Search Console access for the new canonical origin
- [ ] Google Business Profile URL confirmed (reviews feed)
- [ ] Publish approval after reviewing the prelaunch evidence package (gate G8)
