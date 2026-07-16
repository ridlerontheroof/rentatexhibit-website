---
name: Cloning a live site from screenshots + migration bundle
description: Approach for faithfully reproducing an existing (e.g. Wix/leasing) website the user owns.
---

# Cloning a live site into an owned web app

**When it applies:** user owns a site (built on a closed platform like Wix) and wants a pixel-perfect clone they control.

**Two sources of truth, use both:**
- Extracted full-page screenshots per route = the *visual/pixel spec*. Feed these directly to design subagents.
- A content/migration bundle (per-page content markdown, site-settings.json, owned image files + manifest, SEO files, real embed IDs) = the *content/asset source of truth*. Never let a subagent invent content, addresses, phone numbers, or embed IDs — pull them from the bundle.

**Owner-confirmed deviations:** keep an explicit list of intended changes from the live site (rebranded management name, changed CTA URLs, contact email/phone overrides, removed pages + legacy-path redirects, footer copyright). Everything else must match live exactly.

**Embeds are real, not placeholders:** SightMap (floor plans), Vimeo/Matterport (virtual tour), Google Maps iframe with real cid — get the real IDs from the bundle. Subagents tend to drop in `example`/placeholder embeds; grep for those and replace.

**Gotchas seen:** subagents produced wrong image paths (doubled prefix), invented a wrong street address, simplified nav into a single catch-all dropdown instead of the real multi-dropdown structure, and pointed CTAs at the wrong URL. Always verify address, nav structure, CTA URLs, and embeds against the spec after a build pass.

**The bundle's `static-reference/*.html` is FLATTENED text** — it drops interactive structure like hero sliders/carousels (a rotating slideshow collapses to a couple of stray caption/CTA lines). To recover the real hero, fetch the live page and filter cloudinary transforms: the hero carousel images carry a distinct large transform (here `c_fill,g_center,h_700,w_1200`) vs thumbnails/gallery. Extract those URLs in document order, then map each source filename fragment (e.g. `20170808_0861_n4esrp`) to the local migrated file (`image-013-...-n4esrp.jpg`). The Exhibit home hero is a 9-image carousel: local images 013→021 in that order.
