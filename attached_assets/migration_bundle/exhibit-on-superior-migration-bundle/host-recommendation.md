# Hosting Recommendation

## Best fit: managed WordPress

For the cleanest import path, use WordPress.com Business or a managed WordPress host such as WP Engine, Kinsta, SiteGround, or Pressable. WordPress can import a WXR/XML file containing pages, slugs, page bodies, excerpts, menu ordering, and metadata, which is why this bundle includes `wordpress/exhibit-on-superior-wordpress-import.xml`.

This is the closest match to your goal of a clean import plus future editing. It also handles redirects, forms, SEO plugins, media libraries, and AppFolio/Highland outbound links cleanly.

## Good but more manual: Webflow

Use Webflow if the priority is a polished visual rebuild and tight design control. This bundle includes `webflow/cms-pages.csv`, but Webflow does not turn an arbitrary exported apartment website into fully designed editable pages automatically. Treat the CSV as a content feed/build sheet.

## Usable but least seamless: Squarespace

Squarespace is fine for straightforward editing, but arbitrary page imports are more constrained. This bundle includes `squarespace/page-build-sheet.csv` for a manual rebuild.

## Fastest exact port: static hosting

If the priority is speed over no-code editing, the `static-reference` folder can be deployed to Cloudflare Pages, Netlify, Vercel, or similar. It is not a pixel-perfect clone, but it is a clean, portable starting point with Highland contact details and availability links already applied.

## AppFolio/Highland routing

Use this availability destination everywhere units, availability, pricing, or current inventory CTAs appear:

https://www.highlandptrs.com/chicago-availability?search=exhibit

Use this AppFolio destination for Apply Now CTAs:

https://highlandrealestatepartners.appfolio.com/apply/9ccea374-8cca-48fa-8f86-4aff06b01f03/start?source=Website
