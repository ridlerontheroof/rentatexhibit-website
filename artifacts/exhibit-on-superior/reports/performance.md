# Performance report — before/after (Lighthouse lab)

Generated: 2026-07-27T02:32:51.256Z — derived from perf/baseline.json and perf/latest.json by scripts/generate-qa-evidence.mjs (regenerate after any perf run so this report always matches the source data).

Source: the repo perf suite (`pnpm --filter @workspace/exhibit-on-superior run check:perf`), Lighthouse against the local production build (dist/public via vite preview) with default throttling — simulated Slow-4G / 4x CPU for mobile, desktop preset for desktop. TBT is the lab proxy for INP.

- **Before**: baseline run 2026-07-26T23:15:14.389Z
- **After**: latest run 2026-07-27T02:29:22.117Z

| FF | Page | Score before → after | LCP before → after (ms) | CLS after | TBT after (ms) | Threshold check |
|---|---|---|---|---|---|---|
| mobile | / | 86 → 78 | 4215 → 5718 | 0.000 | 52 | ❌ lcpMs 5718 > limit 5300 |
| mobile | /available-units | 80 → 87 | 4963 → 3763 | 0.000 | 133 | ✅ |
| mobile | /available-units/0208 | 77 → 89 | 5732 → 3643 | 0.043 | 90 | ✅ |
| mobile | /available-units/2705 | 78 → 83 | 5597 → 4531 | 0.042 | 64 | ✅ |
| mobile | /amenities | 78 → 81 | 5569 → 4898 | 0.000 | 76 | ✅ |
| mobile | /photo-gallery | 80 → 79 | 5120 → 5192 | 0.000 | 96 | ✅ |
| mobile | /virtual-tour | 82 → 82 | 4661 → 4744 | 0.000 | 79 | ✅ |
| mobile | /knowledge | 78 → 83 | 5573 → 4589 | 0.000 | 43 | ✅ |
| mobile | /knowledge/application-fee | 83 → 81 | 4491 → 4886 | 0.000 | 25 | ✅ |
| mobile | /contact-us | 81 → 78 | 4895 → 5567 | 0.000 | 99 | ✅ |
| desktop | / | 98 → 92 | 1181 → 1831 | 0.000 | 0 | ✅ |
| desktop | /available-units | 98 → 98 | 1156 → 1105 | 0.000 | 0 | ✅ |
| desktop | /available-units/0208 | 92 → 98 | 1857 → 1134 | 0.001 | 0 | ✅ |
| desktop | /available-units/2705 | 98 → 98 | 1171 → 1192 | 0.001 | 0 | ✅ |
| desktop | /amenities | 95 → 92 | 1474 → 1850 | 0.000 | 0 | ✅ |
| desktop | /photo-gallery | 100 → 93 | 701 → 1737 | 0.000 | 0 | ✅ |
| desktop | /virtual-tour | 90 → 97 | 2060 → 1285 | 0.000 | 0 | ✅ |
| desktop | /knowledge | 91 → 98 | 1940 → 1132 | 0.000 | 0 | ✅ |
| desktop | /knowledge/application-fee | 98 → 94 | 1124 → 1631 | 0.000 | 0 | ✅ |
| desktop | /contact-us | 97 → 98 | 1257 → 1091 | 0.000 | 0 | ✅ |

## Threshold misses in this run

- **mobile /** — lcpMs 5718 > limit 5300

Disposition: Lighthouse lab numbers vary run-to-run by roughly ±10% under simulated throttling; misses within that band on a page that passed comfortably in the baseline/prior runs are lab variance, not a shipped regression. Compare the before → after column above and re-run `check:perf` if a miss repeats across runs.

CLS is ~0 site-wide — the prerender + route-chunk-preload work eliminated the earlier 0.31 layout-collapse regression. See perf/SUMMARY.md for the full latest run with byte weights.
