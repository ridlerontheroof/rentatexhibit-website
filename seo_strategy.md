# SEO Strategy — Exhibit On Superior

## Site overview
Exhibit On Superior (`https://www.rentatexhibit.com`) is a luxury apartment community marketing site for a River North Chicago property at 165 W Superior St, managed by Highland Management LLC. The site is a React SPA (Vite + Wouter) with build-time prerendering via `scripts/prerender.mjs` and `entry-server.tsx`. Every indexable route is rendered to static HTML at build time, so crawlers and social bots receive full per-page titles, descriptions, canonicals, Open Graph tags, and JSON-LD in the initial HTML response. `react-helmet-async` handles live head updates on client-side navigation.

## In scope
- All public marketing pages: Home, Available Units & Floor Plans, Photo Gallery, Virtual Tour, Amenities, Pet Friendly, Neighborhood, Artist-in-Residence (now redirects to /), Contact Us, Map & Directions, Schedule a Tour, Reviews, Apartment Guide, Fees, Parking & Transportation, Application Guide, About, FAQ, Knowledge Center hub and articles
- Floor Plan hub and all floor-plan landing pages (34 layouts)
- Available unit detail pages (`/available-units/:unit`) — prerendered and indexed as of current build; contain per-unit title, description, canonical, structured data (Apartment + OfferForLease JSON-LD), and VideoObject when a YouTube tour is available
- Residents page (public but utility-focused)
- Privacy Policy (intentionally indexed — discoverable privacy policy is a trust signal; see seo.ts comment ~line 738)

## Out of scope
- Accessibility Statement (intentionally `noindex`'d in source; `noindex: true` at seo.ts line 750)
- `/schedule-showing` and `/start-application` (intentionally `noindex`'d in source — utility pages, not conversion landing pages)
- Authenticated dashboards or admin pages (none present)

## Target audience
- Prospective apartment renters searching for luxury apartments in River North / Chicago
- People relocating to Chicago looking for high-end rental communities

## Primary keywords
- "River North Chicago apartments"
- "Chicago apartments River North"
- "Exhibit On Superior"
- "165 W Superior St Chicago apartments"
- Pet-friendly, studio, 1BR, 2BR, 3BR apartment variants

## Dismissed categories
- (None yet)

## Crawler assumptions
- Static HTML (prerendered at build time) is served to all crawlers — Googlebot, social bots, and AI crawlers all receive full page content in the initial HTML response
- No Cloudflare proxy configured in source
- robots.txt: allows all (including all major AI crawlers explicitly), references sitemap at `https://www.rentatexhibit.com/sitemap.xml`
- llms.txt: present at `/llms.txt`, references `/llms-full.txt` for the full dynamic page catalog (build-generated; not a committed source file)
- Sitemap lastmod: computed from SHA-256 hash of each page's markdown twin — advances only when content actually changes
