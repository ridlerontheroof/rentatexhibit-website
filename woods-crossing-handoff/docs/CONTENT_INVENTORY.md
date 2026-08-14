# Content and Asset Inventory

## Scrape Summary

- Source site: https://www.woodscrossingslc.com/
- Scrape date: August 6, 2026
- HTML pages fetched: 39
- Public image assets recorded: 129
- Local public asset folder: `public/assets/source/`
- Source HTML/text folder: `content/source/`

## Key Inventory Files

- `content/source/source-page-inventory.csv`
- `content/source/asset-inventory.csv`
- `content/source/new-site-source-map.csv`
- `content/seo/seo-aeo-metadata.csv`
- `content/schema/schema-manifest.csv`

## Main Page Set

- Home
- Floor Plans
- Apartment Search / Availability
- Gallery
- Amenities
- Neighborhood
- Pet Friendly
- Reviews
- Contact
- Schedule a Tour
- Apply Online
- Residents
- Virtual Leasing
- Rental Fee Disclosure
- Avoid Rental Scams
- Accessibility Statement
- Privacy Policy
- Terms of Service

## Asset Notes

The source image host provided multiple formats and sizes for several photos. The asset inventory preserves all copied public image URLs and local paths. The visible site uses a curated set of property images for performance and renter clarity, while the full local image set remains available for the build phase.

## Content Cleanup Notes

- The prior platform navigation and MarketApts runtime were not preserved.
- Source copy was tightened for answer extraction and readability.
- Legal pages are summarized in the live rebuild and full source text is preserved in `content/source/text/` for legal review.
- Availability and pricing are dated source snapshots, not guaranteed operating data.
