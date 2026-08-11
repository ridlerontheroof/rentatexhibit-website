# Performance report — before/after (Lighthouse lab)

Generated: 2026-08-11T18:28:50.185Z — derived from perf/baseline.json and perf/latest.json by scripts/generate-qa-evidence.mjs (regenerate after any perf run so this report always matches the source data).

Source: the repo perf suite (`pnpm --filter @workspace/exhibit-on-superior run check:perf`), Lighthouse against the local production build (dist/public via vite preview) with default throttling — simulated Slow-4G / 4x CPU for mobile, desktop preset for desktop. TBT is the lab proxy for INP.

- **Before**: baseline run 2026-07-27T13:33:22.041Z
- **After**: latest run 2026-08-11T18:26:50.262Z

| FF | Page | Score before → after | LCP before → after (ms) | CLS after | TBT after (ms) | Threshold check |
|---|---|---|---|---|---|---|
| mobile | / | 88 → 80 | 3912 → 5114 | 0.000 | 76 | ✅ |
| mobile | /available-units | 91 → 94 | 3311 → 2687 | 0.085 | 90 | ✅ |
| mobile | /available-units/0208 | 80 → 96 | 4974 → 2407 | 0.005 | 65 | ✅ |
| mobile | /available-units/3108 | — → 97 | — → 2301 | 0.005 | 63 | ✅ |
| mobile | /amenities | 91 → 95 | 3309 → 2783 | 0.000 | 28 | ✅ |
| mobile | /photo-gallery | 85 → 97 | 4227 → 2481 | 0.000 | 55 | ✅ |
| mobile | /virtual-tour | 93 → 96 | 3163 → 2557 | 0.000 | 16 | ✅ |
| mobile | /knowledge | 91 → 98 | 3316 → 2256 | 0.001 | 49 | ✅ |
| mobile | /knowledge/application-fee | 88 → 98 | 3789 → 2255 | 0.000 | 14 | ✅ |
| mobile | /contact-us | 91 → 93 | 3308 → 3067 | 0.000 | 80 | ✅ |
| desktop | / | 99 → 94 | 1013 → 1598 | 0.000 | 0 | ✅ |
| desktop | /available-units | 95 → 100 | 1503 → 607 | 0.034 | 0 | ✅ |
| desktop | /available-units/0208 | 90 → 100 | 2053 → 779 | 0.002 | 0 | ✅ |
| desktop | /available-units/3108 | — → 100 | — → 486 | 0.003 | 0 | ✅ |
| desktop | /amenities | 95 → 99 | 1464 → 847 | 0.000 | 0 | ✅ |
| desktop | /photo-gallery | 98 → 100 | 1173 → 707 | 0.000 | 0 | ✅ |
| desktop | /virtual-tour | 98 → 100 | 1178 → 687 | 0.000 | 0 | ✅ |
| desktop | /knowledge | 97 → 100 | 1213 → 445 | 0.001 | 0 | ✅ |
| desktop | /knowledge/application-fee | 92 → 100 | 1893 → 451 | 0.000 | 0 | ✅ |
| desktop | /contact-us | 97 → 100 | 1235 → 687 | 0.000 | 0 | ✅ |

All pages pass the calibrated per-page thresholds in perf/thresholds.json.

CLS is ~0 site-wide — the prerender + route-chunk-preload work eliminated the earlier 0.31 layout-collapse regression. See perf/SUMMARY.md for the full latest run with byte weights.
