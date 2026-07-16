---
name: Image sources live in images-src/
description: Original JPEG/PNG photos are not in public/images anymore; where they live and how the optimizer resolves them.
---

Original source photos for the web artifact live in `artifacts/exhibit-on-superior/images-src/` (not published). `public/images/` holds only generated WebP/AVIF variants, floor-plan sheets, and directly-served share cards (`og-card.jpg`, `og/*.jpg`).

**Why:** the originals (~10MB+ of JPEG/PNG) shipped in every publish although SmartImg only ever serves the variants.

**How to apply:** add new photos to `images-src/` and run `node scripts/optimize-images.mjs`. Manifest keys remain `/images/<original-name>` — that's a lookup key, not a shipped file. The optimizer also treats any top-level JPEG/PNG still in `public/images` (e.g. og-card.jpg) as a source, since it ships anyway. Tests in `siteImages.test.ts` resolve originals via public-then-images-src fallback.
