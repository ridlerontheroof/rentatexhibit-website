# Exhibit On Superior Full WXR Package

This package is a fuller WordPress migration export for Exhibit On Superior.

## Best upload file

If you are importing into a fresh WordPress site, start with `exhibit-on-superior-full-site-with-media-downloads.wxr`.

If the pages already exist and only media failed, upload `exhibit-on-superior-media-only-import.wxr`.

If the importer asks for a ZIP instead, use the matching `*-import.zip` file. Each import ZIP contains only one `.wxr` file.

## What is included in the WXR

- Published page records for the site pages, Available Units, and Apply Now.
- Primary navigation menu records.
- Attachment records for 88 property images.
- Image galleries inserted into page content.
- SEO custom fields for Yoast and Rank Math.
- AEO answer-summary custom fields.
- JSON-LD schema stored as page-level custom metadata.
- Source URL and old-path metadata for migration review.

## What still needs setup after import

- Set the imported Home page as the static homepage.
- Assign the imported Primary Navigation menu to the theme header.
- Confirm images in Media Library. If WordPress does not ingest the media records automatically, upload the files from `media/`.
- Reapply final theme styling in the selected WordPress theme.
- Add 301 redirects from `redirects.csv` using a redirect plugin.
- Confirm Available Units and Apply Now point to:
  - Available Units: https://www.highlandptrs.com/chicago-availability?search=exhibit
  - Apply Now: https://highlandrealestatepartners.appfolio.com/apply/9ccea374-8cca-48fa-8f86-4aff06b01f03/start?source=Website

WXR is a WordPress content export format, so it cannot fully carry a theme, plugins, or host-level settings.
