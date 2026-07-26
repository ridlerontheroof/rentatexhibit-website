# RentAtExhibit.com SEO & AEO Technical Handoff

**Website:** https://www.rentatexhibit.com  
**Scope:** Audit items 7 and above  
**Audience:** Replit developer / implementation agent  
**Priority order:** Complete P0 items before P1, then P2  
**Goal:** Make the current website technically authoritative, crawlable, machine-readable, fast, and accessible without changing approved marketing content.

---

## P0 — Critical Technical Controls

### 1. Validate and Repair `robots.txt`

**Objective:** Ensure search engines can crawl all canonical public pages and are not wasting crawl activity on duplicate or non-public URLs.

**Required work:**

- Confirm `https://www.rentatexhibit.com/robots.txt` returns HTTP `200`.
- Use plain-text syntax with no HTML or template output.
- Allow crawling of:
  - Homepage
  - Available Units
  - Unit detail pages
  - Amenities
  - Apartment Guide
  - Knowledge Center
  - Individual Knowledge Center articles
  - Contact, neighborhood, fees, pet, parking, and application pages
- Do not block CSS, JavaScript, images, or other assets required to render pages.
- Disallow non-public or duplicate application/session paths only where needed.
- Do not block query-parameter pages before Google can process their canonical tags.
- Add the preferred XML sitemap location.

**Expected example:**

```txt
User-agent: *
Disallow:

Sitemap: https://www.rentatexhibit.com/sitemap.xml
```

Modify only where the application has confirmed private, administrative, or session-based paths.

**Acceptance criteria:**

- `robots.txt` returns `200`.
- No canonical public page is blocked.
- The sitemap URL is present and valid.
- Google Search Console robots testing reports no unintended blocks.

---

### 2. Rebuild the XML Sitemap

**Objective:** Submit only canonical, indexable, current URLs.

**Required work:**

Include only URLs that:

- Use `https://www.rentatexhibit.com`
- Return HTTP `200`
- Are self-canonical
- Are intended to appear in search
- Contain current content

Include:

- Homepage
- Primary property pages
- Available Units page
- Current unit detail pages
- Apartment Guide
- Knowledge Center hub
- Current Knowledge Center articles
- Fees, parking, pet, accessibility, application, neighborhood, contact, and amenity pages

Exclude:

- `.aspx` URLs
- `/apartments/il/chicago/` legacy URLs
- Redirecting URLs
- `404` pages
- Query-parameter filter URLs
- Application session URLs
- Duplicate trailing-slash variants
- Internal search results
- Deprecated unit URLs that are no longer maintained

Use accurate `<lastmod>` dates derived from content changes, not the deployment time of every build.

**Acceptance criteria:**

- Every sitemap URL returns `200`.
- Every sitemap URL is self-canonical.
- No redirected, parameterized, legacy, or `404` URL appears.
- The sitemap validates as XML.
- Google Search Console accepts the sitemap without format errors.
- Bing Webmaster Tools accepts the sitemap.

---

### 3. Enforce One Canonical Host and URL Format

**Objective:** Ensure every alternate URL resolves to one preferred URL in a single redirect.

**Preferred format:**

```txt
https://www.rentatexhibit.com/[preferred-path]/
```

**Required work:**

Normalize:

- HTTP → HTTPS
- Non-`www` → `www`
- Uppercase paths → lowercase paths
- Duplicate trailing-slash variations
- Default documents
- Repeated slashes
- Legacy query variants where they do not represent unique content

Every alternate version must redirect in one hop using HTTP `301` or `308`.

**Do not:**

- Use JavaScript redirects
- Use meta refreshes
- Create redirect chains
- Redirect all missing pages to the homepage
- Canonicalize to a redirecting URL

**Acceptance criteria:**

- All tested hostname and protocol variants resolve in one hop.
- Final pages return `200`.
- Final pages contain self-referencing canonicals.
- Open Graph `og:url` matches the canonical URL.
- Structured-data URLs and `@id` values use the same preferred hostname.

---

### 4. Verify Canonical Tags Sitewide

**Objective:** Prevent duplicate indexing across alternate paths, parameters, and templates.

**Required work:**

Add one canonical tag to every indexable page:

```html
<link rel="canonical" href="https://www.rentatexhibit.com/preferred-path/" />
```

Rules:

- Canonicals must be absolute URLs.
- Canonicals must point to an HTTP `200` page.
- Canonicals must use HTTPS and `www`.
- Canonicals must match the intended sitemap URL.
- Parameter-based inventory filters should normally canonicalize to `/available-units/`.
- A page should not contain multiple conflicting canonical tags.
- Legacy templates must not inject a second canonical.

**Acceptance criteria:**

- Every indexable page has exactly one valid canonical.
- No canonical points to a redirect, `404`, parameter variation, or legacy URL.
- Parameter pages do not self-canonicalize unless intentionally designed as standalone landing pages.

---

### 5. Audit Indexing Headers and Meta Robots Directives

**Objective:** Prevent accidental deindexing or duplicate indexation.

**Required work:**

Review:

- `<meta name="robots">`
- `X-Robots-Tag`
- HTTP headers
- CMS-level SEO controls
- Environment-specific defaults

Canonical public pages should generally use:

```html
<meta name="robots" content="index,follow,max-image-preview:large" />
```

Use `noindex` only for confirmed non-search pages such as:

- Internal search results
- Session-based application pages
- Administrative paths
- Temporary preview routes
- Duplicate filter combinations with no search value

**Acceptance criteria:**

- No canonical public page contains `noindex`.
- No server header overrides the intended meta robots directive.
- Images are eligible for large previews.
- Preview, staging, and administrative pages cannot be indexed.

---

## P0 — Structured Data

### 6. Create a Consistent Sitewide Entity Graph

**Objective:** Give search engines and AI systems a stable identity for Exhibit On Superior.

**Homepage schema should include:**

- `Organization`
- `WebSite`
- `ApartmentComplex`
- `PostalAddress`
- `GeoCoordinates`
- `OpeningHoursSpecification`
- `ImageObject`
- `sameAs`
- Tour-booking URL
- Stable `@id` values

**Required standards:**

- Use JSON-LD.
- Match all visible website facts.
- Use the current phone number and management information.
- Use stable IDs such as:

```json
{
  "@id": "https://www.rentatexhibit.com/#apartment-complex"
}
```

- Reuse the same entity IDs across all pages.
- Do not publish an apartment count until the 290-versus-298 discrepancy is resolved.

**Acceptance criteria:**

- Schema.org Validator reports no critical errors.
- Google Rich Results Test parses the markup.
- No conflicting organization, address, phone, or property entities exist.
- All schema facts match visible page content.

---

### 7. Add Structured Data to the Available Units Page

**Objective:** Make inventory relationships and unit facts machine-readable.

**Recommended schema:**

- `ApartmentComplex`
- `ItemList`
- `Apartment`
- `Offer`
- `BreadcrumbList`

Each current unit should expose, where available:

- Unit number
- Unit URL
- Bedroom count
- Bathroom count
- Square footage
- Floor level
- Accessibility designation
- Rent
- `priceCurrency: USD`
- Availability
- `availabilityStarts`
- Pet status
- Image
- Application URL
- Tour URL
- `dateModified`

**Rules:**

- Structured data must be generated from the same source as visible inventory.
- Do not publish stale offers after a unit is leased.
- Do not expose rent or availability in schema when it is absent from the visible page.
- Use stable unit URLs.

**Acceptance criteria:**

- Every currently available unit has a valid `Offer`.
- Visible rent, square footage, and availability match the JSON-LD exactly.
- Leased units do not retain an active available offer.
- Duplicate entities are not created by both CMS and page templates.

---

### 8. Add Structured Data to Unit Detail Pages

**Objective:** Give each unit a complete, internally consistent entity record.

**Recommended schema:**

- `Apartment`
- `Offer`
- `BreadcrumbList`
- Relationship to the main `ApartmentComplex`

Include:

- Unit name and number
- Building relationship
- Full address
- Floor
- Bedrooms
- Bathrooms
- Square footage
- Accessibility details
- Balcony status
- Pet policy
- Images
- Rent
- Availability date
- Application link
- Tour link
- `dateModified`

**Acceptance criteria:**

- Unit detail schema matches the Available Units card.
- No unit has conflicting square footage across visible copy, metadata, or JSON-LD.
- Apartment 2705 is consistently listed as `450 SF`.
- No typo such as `Diswasher` appears in schema or visible amenities.
- Each unit references the same main property `@id`.

---

### 9. Add Structured Data to Knowledge Center Pages

**Objective:** Improve answer extraction and clarify the relationship between questions, answers, and the property.

**Recommended schema:**

- `WebPage`
- `Question`
- `Answer`
- `BreadcrumbList`
- `dateModified`
- `reviewedBy`
- `about`
- `mainEntity`

**Required work:**

- Use the page question as the `Question.name`.
- Use the concise visible answer as `acceptedAnswer.text`.
- Add a visible and machine-readable last-reviewed date.
- Link `about` to the Exhibit apartment-complex entity.
- Add `reviewedBy` only when the reviewer is identified on the page.
- Do not use `QAPage` unless users can submit multiple answers.
- Do not expect FAQ rich-result dropdowns as a guaranteed outcome.

**Acceptance criteria:**

- Every Knowledge Center page has one clear main question.
- The JSON-LD answer matches visible copy.
- `dateModified` changes only when content changes.
- Pricing, policy, and availability answers display a current review date.

---

## P1 — Performance and Core Web Vitals

### 10. Establish a Repeatable Performance Test Suite

**Objective:** Measure the current build and prevent regressions.

Test mobile and desktop versions of:

1. Homepage
2. Available Units
3. Apartment 0208
4. Apartment 2705
5. Amenities
6. Photo Gallery
7. Virtual Tour
8. Knowledge Center
9. One Knowledge Center article
10. Contact or tour page

Track:

- Largest Contentful Paint
- Interaction to Next Paint
- Cumulative Layout Shift
- Total Blocking Time in lab tests
- JavaScript payload
- Image payload
- Third-party script impact

**Targets:**

| Metric | Target |
|---|---:|
| LCP | ≤ 2.5 seconds |
| INP | ≤ 200 milliseconds |
| CLS | ≤ 0.10 |

**Acceptance criteria:**

- Test reports are stored or exportable for comparison.
- Mobile results are treated as the primary benchmark.
- No deployment is approved if it creates a major regression on representative pages.

---

### 11. Reduce Image Weight and Rendering Cost

**Required work:**

- Serve AVIF or WebP where supported.
- Generate responsive image sizes.
- Use correct `srcset` and `sizes`.
- Preload only the initial hero image.
- Lazy-load offscreen images.
- Define explicit image width and height.
- Avoid loading every carousel image on initial render.
- Compress unit-gallery images without visible degradation.
- Use unique, descriptive alt text where images convey content.

**Acceptance criteria:**

- Offscreen images are not loaded during the initial viewport render.
- Hero image is correctly sized for mobile and desktop.
- No visible layout shift occurs while images load.
- Unit pages do not load full-resolution images when smaller rendered sizes are sufficient.

---

### 12. Defer Heavy Third-Party Embeds

**Required work:**

Use click-to-load or preview placeholders for:

- Matterport
- YouTube
- Other video embeds
- Nonessential map embeds

Delay or conditionally load:

- Nonessential tracking scripts
- Marketing tags
- Widgets below the fold

**Acceptance criteria:**

- Third-party iframe code is not loaded until interaction or viewport proximity.
- Core property copy and inventory render without waiting for third-party services.
- Tracking changes do not break consent requirements.

---

### 13. Reduce JavaScript and CSS Overhead

**Required work:**

- Remove legacy G5 and RentCafe assets.
- Remove unused libraries, widgets, and duplicate analytics tags.
- Code-split large JavaScript bundles.
- Load page-specific code only where required.
- Minify production assets.
- Remove unused CSS.
- Reduce font families and font weights.
- Use `font-display: swap`.
- Ensure inventory text is server-rendered or present in initial HTML.

**Acceptance criteria:**

- Primary text and inventory are readable with delayed JavaScript.
- No legacy platform scripts are loaded.
- Duplicate analytics or tag-manager calls are removed.
- Navigation, filters, and forms remain functional after code reduction.

---

### 14. Configure Caching and Compression

**Required work:**

- Enable Brotli or gzip compression.
- Use long-lived caching for fingerprinted static assets.
- Do not over-cache current inventory HTML or API responses.
- Use revalidation rules appropriate for availability and pricing data.
- Confirm CDN purge behavior on republish.
- Set secure cache headers for HTML and application routes.

**Acceptance criteria:**

- Fingerprinted assets use long cache lifetimes.
- Inventory changes appear promptly after source updates.
- Republishing does not leave stale HTML at the edge.
- Compression is active for text assets.

---

## P1 — Accessibility and Semantic Front End

### 15. Correct Heading Hierarchy

**Objective:** Improve screen-reader navigation and machine extraction.

**Required work:**

- Use one descriptive H1 per page.
- Render decorative eyebrow copy as a `span` or paragraph, not part of the H1.
- Use H2s for major sections.
- Use H3s for individual FAQ or amenity subsections.
- Do not skip heading levels without reason.

**Example:**

```html
<p class="eyebrow">Find Your Fit</p>
<h1>The Exhibit Apartment Guide</h1>
```

**Acceptance criteria:**

- Every page has one clear H1.
- Heading text reads naturally without concatenated phrases.
- Automated accessibility testing reports no heading-order errors.

---

### 16. Make Inventory Filters Fully Accessible

**Required work:**

- Support complete keyboard operation.
- Provide visible focus indicators.
- Use proper labels and accessible names.
- Announce result-count updates with an ARIA live region.
- Preserve filter state in a readable way.
- Ensure ADA filters are understandable without visual context.
- Keep touch targets large enough for mobile users.

**Acceptance criteria:**

- A keyboard-only user can operate every filter.
- Screen readers announce changed result counts.
- Focus does not disappear after filtering.
- Controls meet contrast and target-size requirements.

---

### 17. Improve Carousel, Gallery, Video, and Matterport Accessibility

**Required work:**

- Add pause controls to auto-advancing carousels.
- Ensure previous and next controls have accessible names.
- Prevent keyboard traps.
- Provide text alternatives for video and virtual-tour content.
- Add descriptive titles to iframes.
- Ensure gallery modal focus is contained and returned correctly.

**Acceptance criteria:**

- Carousels can be paused.
- All media controls work by keyboard.
- Iframes have descriptive titles.
- Closing a modal returns focus to the originating element.

---

### 18. Audit Forms and Repeated Calls to Action

**Required work:**

- Add programmatic labels to every field.
- Connect error messages to fields.
- Make validation errors specific.
- Give repeated links contextual accessible names.

Instead of multiple links named only `Apply Now`, use accessible labels such as:

```html
<a aria-label="Apply for Apartment 2705">Apply Now</a>
```

**Acceptance criteria:**

- Forms pass automated label tests.
- Errors are announced to screen readers.
- Repeated calls to action are distinguishable.
- Form completion works at 200% zoom.

---

### 19. Run Automated and Manual Accessibility QA

Test with:

- axe
- Lighthouse Accessibility
- Keyboard-only navigation
- VoiceOver on Safari
- NVDA or another Windows screen reader where available
- Mobile zoom and orientation changes

**Acceptance criteria:**

- No critical automated accessibility violations remain.
- All core leasing paths can be completed by keyboard.
- Findings are documented by URL and severity.

---

## P1 — AEO Content Governance

### 20. Add Review Metadata to Volatile Answer Pages

**Objective:** Prevent outdated first-party answers from being cited by search and AI systems.

Apply to pages covering:

- Rent
- Specials
- Availability
- Fees
- Parking pricing
- Application standards
- Insurance requirements
- Lease terms
- Utility charges
- Office hours
- Pet fees or policies

Add visible text such as:

> Last reviewed [date] by the Exhibit On Superior leasing team. Pricing, availability, fees, and leasing policies may change.

Add matching:

- `dateModified`
- Reviewer information
- Source relationship
- Link to current inventory or official fee page

**Acceptance criteria:**

- Every volatile article shows a review date.
- The review date is not automatically changed by unrelated deployments.
- Current pricing and availability answers link to the live inventory source.

---

### 21. Keep Stable Facts and Volatile Facts in Separate Data Sources

**Objective:** Reduce conflicts across pages.

**Stable facts include:**

- Address
- Floor-plan dimensions
- Amenity locations
- Balcony exceptions
- Transportation proximity
- Building services

**Volatile facts include:**

- Rent
- Availability
- Fees
- Specials
- Parking pricing
- Screening requirements
- Lease terms
- Office hours

**Required work:**

- Create one authoritative source for each fact type.
- Prevent manual duplication of volatile values across multiple CMS fields.
- Add automated conflict checks during build or publish.
- Flag mismatches between unit cards, unit pages, JSON-LD, and feeds.

**Acceptance criteria:**

- A single source update changes every dependent page.
- Builds fail or warn when the same unit has conflicting rent, square footage, or availability.
- Volatile facts can be reviewed without editing unrelated page copy.

---

## P2 — Local and Entity Consistency

### 22. Standardize Website NAP and Property Identity

**Required website values:**

- **Name:** Exhibit On Superior
- **Address:** 165 W Superior St, Chicago, IL 60654
- **Phone:** 312-450-0635
- **Neighborhood:** River North
- **Current management/ownership references:** Approved Highland wording only

**Required work:**

- Store NAP information in one reusable source.
- Use the same values in footer, contact page, schema, metadata, Open Graph tags, and application links.
- Remove any remaining Magellan references.
- Remove old phone numbers.
- Add approved social and directory profiles to `sameAs`.

**Acceptance criteria:**

- No internal page contains the old phone number or management company.
- Schema matches visible website identity.
- All contact links use the current phone and email.

---

### 23. Add Search-Engine Submission and Monitoring Hooks

**Required work:**

- Verify Google Search Console ownership.
- Verify Bing Webmaster Tools ownership.
- Submit the new sitemap to both.
- Add IndexNow support for:
  - New pages
  - Updated pages
  - Removed pages
  - Unit availability changes
- Avoid submitting unchanged URLs on every minor deployment.
- Log submission success and failure.

**Acceptance criteria:**

- Sitemap is accepted in Google and Bing.
- IndexNow can submit changed URLs successfully.
- Removed URLs can be submitted promptly.
- Submission events are logged.

---

### 24. Add Automated SEO Regression Tests

Run on every deployment or scheduled crawl.

Check:

- Status codes
- Redirect chains
- Canonicals
- Meta robots
- Title and H1 presence
- Duplicate titles
- Duplicate descriptions
- Sitemap inclusion
- Structured-data validity
- Broken internal links
- Legacy URL reappearance
- Old phone number
- Magellan references
- `Diswasher` typo
- Unit square-footage conflicts
- Missing review dates on volatile Knowledge Center pages

**Acceptance criteria:**

- Critical regressions block production deployment or trigger an alert.
- Results identify the exact URL and failed rule.
- Historical results are retained for comparison.

---

## P2 — Future Search Growth

### 25. Build Clean Floor-Plan Landing Pages

Do this only after the P0 and P1 work is complete.

**Recommended URL pattern:**

```txt
/floor-plans/two-bedroom-two-bath-1003-sf/
```

Each page should contain:

- Unique title and H1
- Floor-plan image
- Bedrooms and bathrooms
- Square footage
- Floor range
- Balcony status
- Accessibility information
- Unit features
- Current matching inventory
- Tour link
- Application link
- Related floor plans
- Self-referencing canonical
- `FloorPlan` structured data

**Do not:**

- Index temporary query-string filters as substitutes.
- Create near-identical pages without unique plan information.
- Leave pages empty when no matching unit is currently available.

**Acceptance criteria:**

- Each floor-plan page has unique factual content.
- Matching units update automatically.
- Pages remain useful when no unit is currently available.
- No duplicate floor-plan URLs are generated.

---

## Required QA Deliverables

Replit should provide the following after implementation:

1. **URL crawl export**
   - URL
   - Status
   - Redirect destination
   - Canonical
   - Indexability
   - Title
   - H1
   - Sitemap status

2. **Structured-data validation report**
   - Homepage
   - Available Units
   - At least two unit pages
   - Knowledge Center hub
   - At least two Knowledge Center articles

3. **Performance report**
   - Mobile and desktop results
   - Before-and-after comparison
   - Representative URLs listed in this handoff

4. **Accessibility report**
   - Automated findings
   - Keyboard test results
   - Screen-reader test summary

5. **Header report**
   - HTTP status
   - Redirect chain
   - Canonical
   - `X-Robots-Tag`
   - Cache headers
   - Compression
   - HSTS

6. **Change log**
   - Files or routes changed
   - Redirects added
   - Schema added
   - Remaining known issues
   - Items requiring business confirmation

---

## Completion Definition

The work is complete when:

- Canonical public pages are crawlable and indexable.
- Sitemaps contain only preferred HTTP `200` URLs.
- All canonical, Open Graph, and structured-data URLs agree.
- Structured data matches visible page facts.
- Inventory data is consistent across cards, detail pages, and schema.
- Core pages meet or are moving toward Core Web Vitals targets.
- Core leasing paths are keyboard and screen-reader accessible.
- Volatile answer pages have visible review controls.
- Website NAP and property identity are consistent.
- Automated tests detect future SEO and AEO regressions.
