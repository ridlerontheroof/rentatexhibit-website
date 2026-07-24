---
name: Recovering larger photo originals via Cloudinary URLs
description: The migration bundle's WXR files hold Cloudinary URLs whose 400x400 downscale is just a URL transform; request bigger renditions of the same crop.
---

The old site's photos were served from Cloudinary (`g5-assets-cld-res.cloudinary.com` and `res.cloudinary.com/g5-assets-cld`). The migration bundle only ships 400×400 crops, but the WXR files in `wordpress/full-wxr/` record the full transform URLs, e.g. `x_144,y_0,h_1330,w_1330,c_crop/q_auto,f_auto,c_fill,g_center,h_400,w_400/...`.

**Why:** The first transform is the editorial crop (often 1200–3600px); the second is only a downscale. Rewriting `h_400,w_400` to e.g. `h_1200,w_1200` (and `f_auto`→`f_jpg`) fetches a sharp original with the exact same framing — no re-photography or Getty licensing needed.

Many URLs have no crop step at all (plain `c_fill,g_center,h_700,w_1200`) — fetch the bare untransformed original first (drop the transform segment) to learn its true size, then request a fill at the same aspect up to that width; Cloudinary will upscale silently if you overshoot. Hero-slide manifest rungs feed the LCP preload in index.html — update its imagesrcset when rungs change (guarded by hero-lcp-preload test).

**How to apply:** When an image in `images-src/` is too small, grep the WXR for a distinctive part of its filename, take the Cloudinary URL, bump the fill dimensions (stay ≤ the crop's `w_`), download into `images-src/` under the existing name, and rerun `scripts/optimize-images.mjs`. Verify the crop matches by downscaling the new file and RMSE-comparing against the old 400w variant (<~5% is a match).
