# Performance report — before/after (Lighthouse lab)

Generated: 2026-07-27T05:01:46.789Z — derived from perf/baseline.json and perf/latest.json by scripts/generate-qa-evidence.mjs (regenerate after any perf run so this report always matches the source data).

Source: the repo perf suite (`pnpm --filter @workspace/exhibit-on-superior run check:perf`), Lighthouse against the local production build (dist/public via vite preview) with default throttling — simulated Slow-4G / 4x CPU for mobile, desktop preset for desktop. TBT is the lab proxy for INP.

- **Before**: baseline run 2026-07-26T23:15:14.389Z
- **After**: latest run 2026-07-27T05:01:17.401Z

| FF | Page | Score before → after | LCP before → after (ms) | CLS after | TBT after (ms) | Threshold check |
|---|---|---|---|---|---|---|
| mobile | / | 86 → 88 | 4215 → 3844 | 0.000 | 68 | ✅ |
| mobile | /available-units | 80 → 78 | 4963 → 5576 | 0.000 | 100 | ✅ |
| mobile | /available-units/0208 | 77 → 83 | 5732 → 4293 | 0.043 | 69 | ✅ |
| mobile | /available-units/2705 | 78 → 78 | 5597 → 5579 | 0.042 | 66 | ✅ |
| mobile | /amenities | 78 → 86 | 5569 → 3992 | 0.000 | 87 | ✅ |
| mobile | /photo-gallery | 80 → 83 | 5120 → 4525 | 0.000 | 71 | ✅ |
| mobile | /virtual-tour | 82 → 85 | 4661 → 4214 | 0.000 | 87 | ✅ |
| mobile | /knowledge | 78 → 81 | 5573 → 4886 | 0.000 | 44 | ✅ |
| mobile | /knowledge/application-fee | 83 → 78 | 4491 → 5563 | 0.000 | 43 | ✅ |
| mobile | /contact-us | 81 → 82 | 4895 → 4591 | 0.000 | 114 | ✅ |
| desktop | / | 98 → 97 | 1181 → 1329 | 0.000 | 0 | ✅ |
| desktop | /available-units | 98 → 97 | 1156 → 1220 | 0.000 | 0 | ✅ |
| desktop | /available-units/0208 | 92 → 95 | 1857 → 1552 | 0.001 | 0 | ✅ |
| desktop | /available-units/2705 | 98 → 96 | 1171 → 1407 | 0.001 | 0 | ✅ |
| desktop | /amenities | 95 → 93 | 1474 → 1774 | 0.000 | 0 | ✅ |
| desktop | /photo-gallery | 100 → 89 | 701 → 2188 | 0.000 | 1 | ✅ |
| desktop | /virtual-tour | 90 → 97 | 2060 → 1295 | 0.000 | 0 | ✅ |
| desktop | /knowledge | 91 → 98 | 1940 → 1147 | 0.000 | 0 | ✅ |
| desktop | /knowledge/application-fee | 98 → 98 | 1124 → 1046 | 0.000 | 0 | ✅ |
| desktop | /contact-us | 97 → 97 | 1257 → 1338 | 0.000 | 0 | ✅ |

All pages pass the calibrated per-page thresholds in perf/thresholds.json.

CLS is ~0 site-wide — the prerender + route-chunk-preload work eliminated the earlier 0.31 layout-collapse regression. See perf/SUMMARY.md for the full latest run with byte weights.
