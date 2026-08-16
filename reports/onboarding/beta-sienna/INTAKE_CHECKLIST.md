# Owner intake checklist — Sienna Chicago

What the owner must provide before each phase can proceed (from the skill template, Sienna-specific
items added). Check off with date + provider.

## Needed for discovery/design
- [ ] **Site access for a live crawl** — the site is behind a Cloudflare managed challenge:
      either allowlist our crawler IP/UA in Cloudflare, or provide a platform export
      (RentCafe/WordPress), or hosting login. (Archive-mode inventory already captured as fallback.)
- [ ] Offering memorandum (PDF) — facts extracted into the uncertainty register
- [ ] High-res photos (originals; the archived RentCafe/WP images are web-compressed and
      rights-unclear)
- [ ] Logos & brand assets — note the naming question: legacy site brands both "Sienna" and
      "Sienna Flats"; confirm the go-forward name
- [ ] Confirmation of reuse rights for any legacy photos/copy (gate G2)
- [ ] GSC/analytics export from the legacy site (top pages/queries) — needed to rank-order the
      9 duplicate-URL consolidation decisions in the parity draft
- [ ] Current domain registrar + DNS provider for siennachicago.com (and whether Cloudflare stays)

## Needed for build (gate G7)
- [ ] AppFolio database host confirmation (Highland company database expected — verify Sienna is in it)
- [ ] EXACT AppFolio property name (verified via unit_directory report)
- [ ] Hidden "Tour" unit created in AppFolio by the leasing team
- [ ] AppFolio Reports API credentials as Replit Secrets (names only in config)
- [ ] Leasing inbox + alert inbox addresses (never the same mailbox)
- [ ] Sender mailbox + SMTP app password (Replit Secret)
- [ ] Gate G1 sign-off on the uncertainty register (pet policy, fees, hours, unit mix — none of
      these were recoverable from the archive)

## Needed for go-live (gates G5, G6, G8)
- [ ] All secrets from `secrets.required` set in the production deployment
- [ ] Registrar/DNS access for siennachicago.com; decide canonical host (www) and Cloudflare fate
- [ ] GA4 property + GTM container created; GA4 service account granted Viewer
- [ ] Google Search Console access for the new canonical origin
- [ ] Google Business Profile URL confirmed (reviews feed)
- [ ] Publish approval after reviewing the prelaunch evidence package (gate G8)
