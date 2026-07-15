# Exhibit On Superior Migration Bundle

Prepared for the RealPage/G5-to-Highland/AppFolio transition.

## Updates already applied

- Contact email changed to `exhibit@highlandptrs.com`.
- Phone retained as `312-450-0635`.
- Copyright set to `Highland Management LLC`.
- Available-units CTAs point to `https://www.highlandptrs.com/chicago-availability?search=exhibit`.
- Apply Now CTAs point to `https://highlandrealestatepartners.appfolio.com/apply/9ccea374-8cca-48fa-8f86-4aff06b01f03/start?source=Website`.
- SEO/AEO metadata, visible answer blocks, FAQ content, structured data, sitemap, and robots templates are included.
- Prior-owner rewards navigation and page content are omitted from the rebuild bundle.
- Old G5 lead forms, old analytics IDs, old cookie-consent IDs, old resident portal login, and old review widgets are flagged for replacement.

## Key files

- `host-recommendation.md`: recommended hosting path.
- `site-settings.json`: canonical site settings for the rebuild.
- `content/page-inventory.csv`: page-by-page migration inventory.
- `content/navigation.csv`: updated navigation and CTA map.
- `content/redirects.csv`: recommended 301 redirects.
- `content/integrations-to-replace.csv`: old vendor functionality and replacements.
- `content/seo/seo-aeo-metadata.csv`: page titles, descriptions, target queries, and answer summaries.
- `content/seo/faq-answer-bank.csv`: visible FAQ/AEO content for long-tail renter questions.
- `content/seo/seo-aeo-playbook.md`: launch checklist and SEO/AEO implementation notes.
- `content/schema/*.jsonld`: structured data files for the rebuilt site.
- `content/pages/*.md`: editable page content.
- `assets/images/`: downloaded property image assets.
- `assets/image-manifest.csv`: image alt text and page usage.
- `wordpress/exhibit-on-superior-wordpress-import.zip`: first-choice WordPress.com upload file.
- `wordpress/exhibit-on-superior-wordpress-import.xml`: unzipped WordPress page import file.
- `webflow/cms-pages.csv`: Webflow CMS/content import sheet.
- `squarespace/page-build-sheet.csv`: Squarespace rebuild sheet.
- `static-reference/`: clean static reference site.

## WordPress.com import note

Upload `wordpress/exhibit-on-superior-wordpress-import.zip` first. If WordPress.com asks for the raw XML instead, use `wordpress/exhibit-on-superior-wordpress-import.xml`.

## Notes

The bundle intentionally does not preserve the old RealPage/G5 runtime code. The useful property content and media are separated from the prior platform plumbing so the new site can be rebuilt cleanly under Highland Management LLC.
