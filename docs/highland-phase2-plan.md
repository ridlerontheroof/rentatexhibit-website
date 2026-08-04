# Highland Phase 2: hosted availability & unit pages (reference plan — execute in a FORK)

> This is a saved reference plan. **Do not execute it in this workspace.** Fork the Exhibit
> Replit App and run the steps below inside the fork. This project deploys as
> rentatexhibit.com; Highland needs its own domain, branding, and publish cadence.

## What & Why
Phase 2 of the Highland refresh: give highlandptrs.com Exhibit-quality availability and unit detail pages. These cannot exist inside Highland's Duda/AppFolio site (unit pages are hosted on appfolio.com and are unstylable), so they are built and hosted on Replit as a standalone pair of page types — like Exhibit's `/available-units` and `/available-units/<unit>` — and Highland's site simply links to them (e.g. `rentals.highlandptrs.com`).

## Why forking wins
- Reuses the proven machinery as-is: AppFolio availability feed (5-min cache, outage fallbacks, baked build-time snapshot), unit detail pages, tour scheduling + lead delivery into AppFolio guest cards, SEO/prerendering, image pipeline, automated guards (above-the-fold checks, JSON-LD validation, image-size guards).
- Highland's AppFolio account (`highlandrealestatepartners.appfolio.com`) is the same account family that manages Exhibit — the widget's property group is "Chicago including Exhibit". The existing APPFOLIO_CLIENT_ID/SECRET may already cover all Chicago listings. Verify this FIRST in the fork (AppFolio blocks workspace egress; verify from a deployed/production environment).

## Done looks like
- A deployed Replit app serving a Highland-branded availability list (all ~38 Chicago listings, live pricing, filters as needed) and per-unit detail pages with photo collages, marketing copy, and Apply/Schedule-a-Tour actions feeding AppFolio
- Highland branding throughout: navy rgba(3,49,72) primary, Highland logo and typography direction (adapt Exhibit's patterns; do not copy Exhibit's gold/script identity wholesale)
- Custom domain (e.g. rentals.highlandptrs.com) connected; Highland's Duda site nav pointing its Availability link there
- Lead notifications routed to Highland's leasing inbox (their SMTP/from-address, not Exhibit's)

## Out of scope
- Rebuilding the rest of highlandptrs.com (stays on Duda)
- Changing anything on the Exhibit site or this workspace
- Multi-property architecture beyond what the listings feed already provides

## Steps (run inside the fork)
1. **Fork & strip** — Fork the Exhibit project; remove Exhibit-specific pages/content not needed (reviews, neighborhood, amenities marketing pages) or park them; keep availability + unit detail + lead pipeline.
2. **Verify AppFolio scope** — Confirm the existing AppFolio Reports API credentials return all Highland Chicago listings (unit_vacancy report); if not, request Highland-scoped credentials from the owner.
3. **Rebrand** — Highland navy palette, logo, typography system; adjust the display-headline tracking rules for Highland's more corporate voice; update all SEO/JSON-LD entities to Highland Partners.
4. **Multi-building support** — Exhibit assumes one property/address; generalize unit pages and availability grouping to handle multiple buildings/addresses in the feed.
5. **Lead pipeline re-point** — Route tour/apply leads to Highland's inbox and their AppFolio guest-card endpoint; replace Exhibit email branding.
6. **Deploy & connect domain** — Publish, connect rentals.highlandptrs.com (owner adds the DNS record and updates the Duda nav link).

## Relevant files (paths as they exist in this project / the fork)
- `artifacts/api-server/src/routes/availability.ts`
- `artifacts/exhibit-on-superior/src/pages/AvailableUnits.tsx`
- `artifacts/exhibit-on-superior/src/pages/UnitDetail.tsx`
- `artifacts/exhibit-on-superior/src/data/seo.ts`
- `artifacts/exhibit-on-superior/scripts/fetch-availability-snapshot.mjs`
