# Page-speed lab report

Generated: 2026-07-28T09:42:02.238Z

Target: local production build (dist/public via `vite preview`)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 86 | 3998 ms | 0.000 | 47 ms | 272 KB | 461 KB | 112 KB | ✅ |
| mobile | /available-units | 79 | 5121 ms | 0.000 | 112 ms | 322 KB | 681 KB | 260 KB | ❌ lcpMs 5121 > limit 3600 |
| mobile | /available-units/0208 | 91 | 3293 ms | 0.043 | 67 ms | 277 KB | 910 KB | 561 KB | ✅ |
| mobile | /available-units/2705 | 84 | 4375 ms | 0.034 | 84 ms | 277 KB | 1209 KB | 860 KB | ✅ |
| mobile | /amenities | 91 | 3319 ms | 0.000 | 48 ms | 273 KB | 544 KB | 112 KB | ✅ |
| mobile | /photo-gallery | 93 | 3167 ms | 0.000 | 56 ms | 277 KB | 559 KB | 112 KB | ✅ |
| mobile | /virtual-tour | 91 | 3388 ms | 0.000 | 27 ms | 271 KB | 597 KB | 112 KB | ✅ |
| mobile | /knowledge | 91 | 3311 ms | 0.000 | 34 ms | 267 KB | 461 KB | 112 KB | ✅ |
| mobile | /knowledge/application-fee | 89 | 3543 ms | 0.000 | 27 ms | 266 KB | 461 KB | 112 KB | ✅ |
| mobile | /contact-us | 84 | 4377 ms | 0.000 | 75 ms | 295 KB | 480 KB | 112 KB | ✅ |
| desktop | / | 95 | 1474 ms | 0.000 | 0 ms | 272 KB | 1433 KB | 112 KB | ✅ |
| desktop | /available-units | 92 | 1823 ms | 0.000 | 0 ms | 322 KB | 1733 KB | 283 KB | ✅ |
| desktop | /available-units/0208 | 92 | 1854 ms | 0.001 | 0 ms | 277 KB | 1882 KB | 561 KB | ✅ |
| desktop | /available-units/2705 | 98 | 1155 ms | 0.001 | 0 ms | 277 KB | 2191 KB | 870 KB | ✅ |
| desktop | /amenities | 95 | 1571 ms | 0.000 | 0 ms | 273 KB | 1741 KB | 112 KB | ✅ |
| desktop | /photo-gallery | 93 | 1751 ms | 0.000 | 0 ms | 277 KB | 1792 KB | 112 KB | ✅ |
| desktop | /virtual-tour | 90 | 2073 ms | 0.000 | 0 ms | 271 KB | 1717 KB | 112 KB | ✅ |
| desktop | /knowledge | 99 | 1028 ms | 0.000 | 0 ms | 267 KB | 1433 KB | 112 KB | ✅ |
| desktop | /knowledge/application-fee | 92 | 1890 ms | 0.000 | 0 ms | 266 KB | 1435 KB | 112 KB | ✅ |
| desktop | /contact-us | 97 | 1310 ms | 0.000 | 0 ms | 295 KB | 1536 KB | 112 KB | ✅ |
