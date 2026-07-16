# SEO Launch & Monitoring Checklist — Exhibit On Superior

Owner actions to complete at launch of https://www.rentatexhibit.com, plus the
monthly monitoring cadence. In-repo SEO work (prerendering, sitemap, meta,
schema, image optimization, analytics wiring) is already done — see
`SEO_PLAN.md`.

## One-time launch steps

### 1. Analytics (GA4)
- [ ] Create a GA4 property at https://analytics.google.com and copy the Measurement ID (`G-XXXXXXXXXX`).
- [ ] Set it as the `VITE_GA_MEASUREMENT_ID` environment variable (production) and redeploy. Analytics is fully wired in the app: page views fire on every page (including SPA navigation), and contact/tour form submissions send a `generate_lead` event. **Without the env var, no analytics script loads.**
- [ ] In GA4 Admin → Events, mark `generate_lead` as a **key event** so tour/contact submissions count as conversions.

### 2. Google Search Console
- [ ] Add and verify `https://www.rentatexhibit.com` at https://search.google.com/search-console. For the HTML-tag method, set the tag's `content` value as the `VITE_GOOGLE_SITE_VERIFICATION` env var and redeploy — the meta tag is injected automatically on every page. (Domain/DNS verification also works and needs no code.)
- [ ] Submit the sitemap: `https://www.rentatexhibit.com/sitemap.xml`.

### 3. Bing Webmaster Tools
- [ ] Verify the site at https://www.bing.com/webmasters (or import from Search Console). For the meta-tag method, set the `msvalidate.01` content value as `VITE_BING_SITE_VERIFICATION` and redeploy.
- [ ] Submit the same sitemap.

### 4. Canonical host redirects
- [ ] Confirm at the host/DNS level that `http://` → `https://` and `rentatexhibit.com` → `www.rentatexhibit.com` return **301** redirects (canonicals and the sitemap all use the `https://www.` host). Test: `curl -I http://rentatexhibit.com/amenities`.

### 5. Google Business Profile (biggest local-SEO lever)
- [ ] Claim/verify the profile for **165 W Superior St, Chicago, IL 60654** at https://business.google.com.
- [ ] Set categories (primary: Apartment complex; secondary: Apartment building / Apartment rental agency).
- [ ] Match name, address, phone (312-450-0635) and office hours exactly to the site.
- [ ] Add current photos (exterior, amenities, units) and the website link; post occasional updates.
- [ ] Note: the live reviews feed reads the correct listing; a duplicate profile holding old reviews is pending a Google merge — follow up on that merge request.

## Monthly monitoring cadence
- [ ] **Search Console → Indexing → Pages:** all indexable pages indexed, no unexpected excludes.
- [ ] **Search Console → Experience → Core Web Vitals:** mobile LCP/INP/CLS in "Good"; investigate regressions (usually new images — run `scripts/optimize-images.mjs`).
- [ ] **Search Console → Performance:** track clicks/impressions for branded ("exhibit on superior") and non-branded ("river north apartments") queries.
- [ ] **GA4:** organic sessions and `generate_lead` conversions trend.
- [ ] After content changes: keep titles ~50–60 chars, descriptions unique; the build regenerates the sitemap automatically.
