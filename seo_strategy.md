# SEO Strategy — Exhibit On Superior

## Site overview
Exhibit On Superior (`https://www.rentatexhibit.com`) is a luxury apartment community marketing site for a River North Chicago property at 165 W Superior St, managed by Highland Management LLC. The site is a React SPA (Vite + Wouter) with `react-helmet-async` for per-route metadata; there is no SSR layer.

## In scope
- All public marketing pages: Home, Floor Plans, Photo Gallery, Virtual Tour, Amenities, Pet Friendly, Neighborhood, Artist-in-Residence, Contact Us, Map & Directions, Schedule a Tour, Reviews
- Residents page (public but utility-focused)

## Out of scope
- Privacy Policy and Accessibility Statement (intentionally `noindex`'d in source)
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
- Googlebot renders JavaScript; per-route metadata eventually indexed but social bots and AI crawlers cannot render JS
- No Cloudflare proxy configured in source
