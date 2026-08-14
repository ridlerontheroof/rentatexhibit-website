# SEO/AEO Launch Checklist

## Technical SEO

- [x] Unique page titles and meta descriptions in `app/site-data.ts`
- [x] Canonical URLs emitted through Next metadata
- [x] `public/sitemap.xml` included
- [x] `public/robots.txt` included with explicit AI crawler allowance
- [x] Server-rendered page content
- [x] Real table markup for floor plans, availability, pet policy, and local places
- [x] Descriptive internal links
- [x] Accessible labels, skip link, visible focus behavior through browser defaults, and semantic page regions
- [x] Local image assets copied to `public/assets/source/`
- [x] Analytics placeholders behind environment variables

## Structured Data

- [x] WebSite JSON-LD
- [x] WebPage JSON-LD
- [x] BreadcrumbList JSON-LD
- [x] ApartmentComplex JSON-LD
- [x] FAQPage JSON-LD
- [x] OfferCatalog JSON-LD for floor plans and availability pages
- [x] AggregateRating JSON-LD on reviews page

## AEO/GEO Content

- [x] Direct answer block near the top of each page
- [x] Source scrape date shown in pricing and availability contexts
- [x] FAQ content for common renter questions
- [x] Markdown twins in `public/markdown/`
- [x] `llms.txt` and `llms-full.txt`
- [x] Source map and inventories preserved
- [x] Missing or uncertain facts flagged rather than invented

## Launch Tasks

- [ ] Confirm final domain and update canonical files if needed
- [ ] Confirm current rent, availability, specials, deposits, and fees
- [ ] Confirm final ownership/manager details
- [ ] Connect contact, tour, and application forms
- [ ] Add owned Google Analytics or GTM IDs
- [ ] Validate schema with Schema.org Validator and Google Rich Results Test
- [ ] Submit sitemap in Google Search Console after launch
- [ ] Update Google Business Profile and local citations with identical NAP details
- [ ] Confirm review-source ownership and approved display method
- [ ] Run Lighthouse/accessibility check before production launch
