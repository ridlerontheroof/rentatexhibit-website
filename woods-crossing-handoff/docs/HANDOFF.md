# Woods Crossing Website Handoff

Prepared August 6, 2026.

## Project Goal

Create a clean, Replit-ready property website from authorized public Woods Crossing content and assets. The rebuild keeps factual claims tied to the source site, improves machine readability, and leaves integrations as explicit placeholders for the build phase.

## Current Build

- Framework: vinext/Next-style app router
- Package manager: pnpm
- Local preview script: `pnpm run dev`
- Replit script: `pnpm run dev:replit`
- Build check: `pnpm run build`
- Canonical host used for this draft: `https://www.woodscrossingslc.com`

## Main Implementation Files

- `app/site-data.ts`: property facts, pages, aliases, floor plans, availability, amenities, pet policy, reviews, and source URLs
- `app/site-components.tsx`: page renderer, JSON-LD, tables, forms, header, footer, and page layouts
- `app/page.tsx`: home route
- `app/[...slug]/page.tsx`: all non-home routes and alias resolution
- `app/globals.css`: final visual system
- `public/assets/source/`: copied public image assets
- `public/llms.txt` and `public/llms-full.txt`: answer-engine files
- `public/markdown/`: markdown twins

## Source and Inventory Files

- `content/source/source-page-inventory.csv`: all crawled public pages and scrape status
- `content/source/asset-inventory.csv`: all copied public image assets, source URLs, local paths, and page usage
- `content/source/new-site-source-map.csv`: new route to source route map
- `content/seo/seo-aeo-metadata.csv`: title, description, target queries, answer summaries, and indexing guidance
- `content/schema/`: standalone JSON-LD references

## Integrations to Wire in Replit

- Contact form endpoint: `NEXT_PUBLIC_LEASING_FORM_ENDPOINT`
- Tour form endpoint: `NEXT_PUBLIC_TOUR_FORM_ENDPOINT`
- Application form endpoint: `NEXT_PUBLIC_APPLICATION_FORM_ENDPOINT`
- Analytics: `NEXT_PUBLIC_GA_MEASUREMENT_ID` and/or `NEXT_PUBLIC_GTM_ID`
- Final site URL: `NEXT_PUBLIC_SITE_URL`

The current form fallbacks post back to the existing source routes. Replace those with owned endpoints during the Replit build phase.

## Canonical Strategy

The build keeps source-aligned canonical URLs where they are clean:

- `/` stays canonical home.
- `/floor-plans`, `/apartment-search`, `/gallery`, `/pet-friendly`, `/reviews`, `/contact`, `/schedule-a-tour`, `/apply-online`, `/residents`, `/virtual-leasing`, `/disclosure-fees`, `/rental-scams`, `/accessibility-statement`, `/privacy-policy`, and `/terms-of-service` are canonical.
- `/amenities` resolves to `/north-salt-lake-ut/amenities`.
- `/neighborhood` resolves to `/north-salt-lake-ut/neighborhood`.
- `/availability` resolves to `/apartment-search`.
- `/apply-now` resolves to `/apply-online`.
- `/terms` and `/termsofservice` resolve to `/terms-of-service`.
- `/virtual-tours` resolves to `/virtual-leasing` because the source `/virtual-tours` route returned home-page content during scrape.

If the final domain changes, update `NEXT_PUBLIC_SITE_URL`, `public/sitemap.xml`, `public/robots.txt`, `public/llms.txt`, and `public/llms-full.txt`.

## Facts to Confirm

- Current rents, move-in dates, availability, specials, and deposits
- Fee-guide values from the MarketApts iframe
- Pet deposit wording because the source page conflicts on refundable/non-refundable deposits
- Review rating and display approvals
- Final legal/privacy/accessibility copy
- Final ownership and manager references
- Whether a separate virtual tour embed should be restored

## SEO/AEO Notes

- Core page copy is server-rendered and available in initial HTML.
- Floor plans, availability, pet policy, and nearby places use real tables.
- Pages include direct-answer blocks, FAQ sections, canonical metadata, and JSON-LD.
- `llms.txt`, `llms-full.txt`, and markdown twins are included for machine-readable content extraction.
- The source site allowed all crawlers in its robots file; this rebuild keeps broad crawler access and names major AI crawlers explicitly.
