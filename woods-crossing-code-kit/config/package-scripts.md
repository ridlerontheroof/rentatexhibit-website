# Package Scripts Template

Copy the relevant blocks into your web artifact's `package.json` `scripts` section.
The `&&`-chained build pipeline runs steps in dependency order; the check suite
can be run independently at any time.

```json
{
  "scripts": {
    "dev": "vite --port $PORT --host",

    "build": "pnpm run build:vite && pnpm run build:precompress && pnpm run build:prerender && pnpm run build:stamp",
    "build:vite": "vite build",
    "build:precompress": "node scripts/precompress.mjs",
    "build:prerender": "node --experimental-vm-modules scripts/prerender.mjs",
    "build:stamp": "node scripts/write-build-id.mjs",

    "preview": "node server/index.mjs",

    "generate:images": "node scripts/optimize-images.mjs",
    "generate:og-cards": "node scripts/generate-og-cards.mjs",
    "generate:unit-map": "node scripts/generate-unit-map.mjs",
    "generate:unit-rewrites": "node scripts/generate-unit-rewrites.mjs",
    "generate:unit-rewrites:check": "node scripts/generate-unit-rewrites.mjs --check",

    "fetch:availability-snapshot": "node scripts/fetch-availability-snapshot.mjs",
    "fetch:vimeo": "node scripts/fetch-vimeo-oembed.mjs",
    "fetch:youtube": "node scripts/fetch-youtube-metadata.mjs",

    "check:hydrated-seo": "node scripts/check-hydrated-seo.mjs",
    "check:schema": "node scripts/check-schema-validator.mjs",
    "check:rented-noindex": "node scripts/check-rented-noindex.mjs",
    "check:legacy-redirects": "node scripts/check-legacy-redirects.mjs",
    "check:gtm": "node scripts/check-gtm-tracking.mjs",
    "check:units-above-fold": "node scripts/check-units-above-fold.mjs",
    "check:csp": "node scripts/check-csp-violations.mjs",
    "check:perf": "node scripts/check-perf.mjs",
    "check:a11y": "node scripts/check-a11y.mjs",
    "check:links": "node scripts/check-link-names.mjs",
    "check:knowledge-pages": "node scripts/check-knowledge-pages.mjs",
    "check:floor-plan-pages": "node scripts/check-floor-plan-pages.mjs",
    "check:fold": "node scripts/check-units-above-fold.mjs",

    "check:prepublish": "pnpm run check:hydrated-seo && pnpm run check:schema && pnpm run check:rented-noindex && pnpm run check:legacy-redirects && pnpm run check:gtm && pnpm run check:csp && pnpm run check:links",
    "check:postpublish": "pnpm run check:hydrated-seo && pnpm run check:schema && pnpm run check:rented-noindex",

    "watch:postpublish": "node scripts/watch-postpublish.mjs",

    "test": "vitest run"
  }
}
```

## Notes

- `build:precompress` must run **before** `build:prerender` (prerender reads the Vite output).
- `build:prerender` writes `dist/public/` HTML pages and the sitemap; `build:stamp` writes `dist/build-id.txt` afterwards.
- `generate:*` scripts are run manually or in CI whenever source data changes (images, unit data, OG cards).
- `fetch:availability-snapshot` is run at build time to bake a warm seed into `src/data/availabilitySeed.json`.
- `check:prepublish` is the gate that must pass before every publish.
- `check:postpublish` is run by the `watch:postpublish` workflow after a new build goes live.
- `watch:postpublish` runs as a long-lived Replit workflow (not a one-shot script).
