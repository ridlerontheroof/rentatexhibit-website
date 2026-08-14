# Woods Crossing Replit-Ready Website

Source-backed apartment website project for Woods Crossing at 850 N. Hwy 89, North Salt Lake, UT 84054.

The public source site was scraped on August 6, 2026 from https://www.woodscrossingslc.com/. The user stated that the new owner has rights to the website content. This project separates useful property content and media from the prior platform runtime so the site can be built further in Replit or another host.

## What is Included

- Multi-page server-rendered property website in `app/`
- Local copies of authorized public images in `public/assets/source/`
- `robots.txt`, `sitemap.xml`, `llms.txt`, `llms-full.txt`, and markdown twins in `public/`
- JSON-LD emitted by the app, with schema reference files in `content/schema/`
- Source page inventory in `content/source/source-page-inventory.csv`
- Asset inventory in `content/source/asset-inventory.csv`
- New-site source map in `content/source/new-site-source-map.csv`
- SEO/AEO metadata in `content/seo/seo-aeo-metadata.csv`
- Handoff notes and launch checklist in `docs/`

## Local Setup

Use Node.js 22 or newer.

```bash
pnpm install
pnpm run dev
pnpm run build
```

For Replit, the `.replit` file runs:

```bash
pnpm run dev:replit
```

## Environment Variables

Create `.env` from `.env.example` if the build phase needs final integrations.

- `NEXT_PUBLIC_SITE_URL`: final canonical site URL. Defaults to `https://www.woodscrossingslc.com`.
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`: Google Analytics measurement ID.
- `NEXT_PUBLIC_GTM_ID`: Google Tag Manager container ID.
- `NEXT_PUBLIC_LEASING_FORM_ENDPOINT`: contact form POST destination.
- `NEXT_PUBLIC_TOUR_FORM_ENDPOINT`: tour request form POST destination.
- `NEXT_PUBLIC_APPLICATION_FORM_ENDPOINT`: application request form POST destination.

If the final launch domain is not `www.woodscrossingslc.com`, update `NEXT_PUBLIC_SITE_URL`, `public/sitemap.xml`, `public/robots.txt`, `public/llms.txt`, and `public/llms-full.txt`.

## Confirmation Required Before Launch

- Current rent, availability, specials, deposits, and fee-guide values
- Final pet policy wording; the source page conflicts on refundable/non-refundable deposits
- Legal review for privacy policy, terms, accessibility statement, and rental-scam content
- Approved reputation source and current review rating
- Final analytics IDs and form endpoints
- Ownership or management entity if it should appear visibly or in schema
- Whether `/virtual-tours` should have its own page; the source route returned home content during scrape

## Source Notes

The scraped source HTML and extracted text are stored under `content/source/` for traceability. The public deliverable uses cleaned, structured copy and flags uncertain facts instead of filling gaps.
