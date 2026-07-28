# Page-speed lab report

Generated: 2026-07-28T16:49:21.499Z

Target: local production build (dist/public via `vite preview`)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 75 | 5480 ms | 0.000 | 228 ms | 273 KB | 461 KB | 112 KB | ❌ lcpMs 5480 > limit 5300; tbtMs 228 > limit 200 |
| mobile | /available-units | 79 | 4978 ms | 0.000 | 152 ms | 322 KB | 680 KB | 260 KB | ❌ lcpMs 4978 > limit 3600 |
| mobile | /available-units/0208 | 70 | 7667 ms | 0.042 | 195 ms | 277 KB | 910 KB | 561 KB | ❌ lcpMs 7667 > limit 6100 |
| mobile | /available-units/2705 | 80 | 4984 ms | 0.034 | 131 ms | 277 KB | 1209 KB | 860 KB | ✅ |
| mobile | /amenities | 88 | 3851 ms | 0.000 | 66 ms | 273 KB | 544 KB | 112 KB | ✅ |
| mobile | /photo-gallery | 66 | 4556 ms | 0.000 | 663 ms | 277 KB | 559 KB | 112 KB | ❌ tbtMs 663 > limit 200 |
| mobile | /virtual-tour | 80 | 4971 ms | 0.000 | 112 ms | 271 KB | 597 KB | 112 KB | ✅ |
| mobile | /knowledge | 96 | 2570 ms | 0.000 | 54 ms | 267 KB | 461 KB | 112 KB | ✅ |
| mobile | /knowledge/application-fee | 91 | 3309 ms | 0.000 | 80 ms | 267 KB | 461 KB | 112 KB | ✅ |
| mobile | /contact-us | 81 | 4525 ms | 0.000 | 153 ms | 295 KB | 480 KB | 112 KB | ✅ |
| desktop | / | 93 | 1745 ms | 0.000 | 0 ms | 272 KB | 1433 KB | 112 KB | ✅ |
| desktop | /available-units | 94 | 1553 ms | 0.000 | 11 ms | 322 KB | 1733 KB | 283 KB | ✅ |
| desktop | /available-units/0208 | 93 | 1791 ms | 0.001 | 0 ms | 277 KB | 1882 KB | 561 KB | ✅ |
| desktop | /available-units/2705 | 99 | 872 ms | 0.001 | 0 ms | 277 KB | 2191 KB | 870 KB | ✅ |
| desktop | /amenities | 91 | 1938 ms | 0.000 | 4 ms | 273 KB | 1741 KB | 112 KB | ✅ |
| desktop | /photo-gallery | 97 | 1272 ms | 0.000 | 0 ms | 277 KB | 1792 KB | 112 KB | ✅ |
| desktop | /virtual-tour | 98 | 1140 ms | 0.000 | 0 ms | 271 KB | 1717 KB | 112 KB | ✅ |
| desktop | /knowledge | 92 | 1813 ms | 0.000 | 0 ms | 267 KB | 1433 KB | 112 KB | ✅ |
| desktop | /knowledge/application-fee | 92 | 1892 ms | 0.000 | 0 ms | 266 KB | 1435 KB | 112 KB | ✅ |
| desktop | /contact-us | 96 | 1364 ms | 0.000 | 0 ms | 295 KB | 1536 KB | 112 KB | ✅ |
