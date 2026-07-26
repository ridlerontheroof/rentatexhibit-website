---
name: Image size cap vs sharpness guard
description: How the ~200KB per-image budget coexists with the largest-rung sharpness test in the web artifact
---

The optimize-images pipeline enforces a hard ~195 KB per-file ceiling, while
`smartimg-sizes.test.ts` fails any 100vw-rendered image whose largest manifest
rung is below ~1920px (needed device px / BLUR_SHORTFALL 1.5).

**Rule:** never satisfy the byte cap by shrinking a rung's pixel width — use
libwebp's size targeting instead: `magick src -resize "2000x>"
-define webp:target-size=<bytes> out.webp` binary-searches quality and fits
dense 2000px photos in <195 KB where even quality-40 fixed encodes could not.

**Why:** an earlier attempt shrank stubborn rungs to 1600px; every one failed
the sharpness guard (and srcset `w` drifted from the filename's nominal width).

**How to apply:** in `scripts/optimize-images.mjs`, the cap loop steps quality
down first, then falls back to `webp:target-size`. The cap is re-checked every
run (not just on regeneration), and AVIF twins are re-compared so they always
beat their WebP. OG cards use `-define jpeg:extent=190kb` in
`generate-og-cards.mjs`.
