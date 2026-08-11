# Performance report — before/after (Lighthouse lab)

Generated: 2026-08-11T19:10:56.792Z — derived from perf/baseline.json and perf/latest.json by scripts/generate-qa-evidence.mjs (regenerate after any perf run so this report always matches the source data).

Source: the repo perf suite (`pnpm --filter @workspace/exhibit-on-superior run check:perf`), Lighthouse against the local production build (dist/public via vite preview) with default throttling — simulated Slow-4G / 4x CPU for mobile, desktop preset for desktop. TBT is the lab proxy for INP.

- **Before**: baseline run 2026-07-27T13:33:22.041Z
- **After**: latest run 2026-08-11T19:07:47.934Z

| FF | Page | Score before → after | LCP before → after (ms) | CLS after | TBT after (ms) | Threshold check |
|---|---|---|---|---|---|---|
| mobile | / | 88 → 91 | 3912 → 3387 | 0.000 | 53 | ✅ |
| mobile | /available-units | 91 → 97 | 3311 → 2108 | 0.085 | 55 | ✅ |
| mobile | /available-units/0208 | 80 → 97 | 4974 → 2405 | 0.005 | 44 | ✅ |
| mobile | /available-units/3108 | — → 95 | — → 2609 | 0.005 | 97 | ✅ |
| mobile | /amenities | 91 → 95 | 3309 → 2790 | 0.000 | 17 | ✅ |
| mobile | /photo-gallery | 85 → 96 | 4227 → 2564 | 0.000 | 33 | ✅ |
| mobile | /virtual-tour | 93 → 97 | 3163 → 2406 | 0.000 | 10 | ✅ |
| mobile | /knowledge | 91 → 98 | 3316 → 2261 | 0.001 | 15 | ✅ |
| mobile | /knowledge/application-fee | 88 → 98 | 3789 → 2258 | 0.000 | 16 | ✅ |
| mobile | /contact-us | 91 → 98 | 3308 → 2258 | 0.000 | 41 | ✅ |
| desktop | / | 99 → 92 | 1013 → 1824 | 0.000 | 0 | ✅ |
| desktop | /available-units | 95 → 100 | 1503 → 643 | 0.034 | 15 | ✅ |
| desktop | /available-units/0208 | 90 → 100 | 2053 → 544 | 0.003 | 0 | ✅ |
| desktop | /available-units/3108 | — → 100 | — → 487 | 0.003 | 0 | ✅ |
| desktop | /amenities | 95 → 99 | 1464 → 846 | 0.000 | 0 | ✅ |
| desktop | /photo-gallery | 98 → 100 | 1173 → 707 | 0.000 | 0 | ✅ |
| desktop | /virtual-tour | 98 → 100 | 1178 → 665 | 0.000 | 0 | ✅ |
| desktop | /knowledge | 97 → 100 | 1213 → 500 | 0.001 | 0 | ✅ |
| desktop | /knowledge/application-fee | 92 → 100 | 1893 → 502 | 0.000 | 0 | ✅ |
| desktop | /contact-us | 97 → 100 | 1235 → 686 | 0.000 | 0 | ✅ |

All pages pass the calibrated per-page thresholds in perf/thresholds.json.

CLS is ~0 site-wide — the prerender + route-chunk-preload work eliminated the earlier 0.31 layout-collapse regression. See perf/SUMMARY.md for the full latest run with byte weights.
