# Page-speed lab report

Generated: 2026-07-28T11:53:51.138Z

Target: local production build (dist/public via `vite preview`)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 93 | 2905 ms | 0.000 | 125 ms | 272 KB | 461 KB | 112 KB | ✅ |
| mobile | /available-units | 84 | 4095 ms | 0.000 | 160 ms | 322 KB | 681 KB | 260 KB | ❌ lcpMs 4095 > limit 3600 |
| mobile | /available-units/0208 | 72 | 5606 ms | 0.043 | 249 ms | 277 KB | 910 KB | 561 KB | ❌ tbtMs 249 > limit 200 |
| mobile | /available-units/2705 | 78 | 4993 ms | 0.034 | 174 ms | 277 KB | 1209 KB | 860 KB | ✅ |
| mobile | /amenities | 77 | 4532 ms | 0.000 | 290 ms | 273 KB | 544 KB | 112 KB | ❌ lcpMs 4532 > limit 4200; tbtMs 290 > limit 200 |
| mobile | /photo-gallery | 91 | 3319 ms | 0.000 | 66 ms | 277 KB | 559 KB | 112 KB | ✅ |
| mobile | /virtual-tour | 81 | 4966 ms | 0.000 | 50 ms | 271 KB | 597 KB | 112 KB | ✅ |
| mobile | /knowledge | 91 | 3392 ms | 0.000 | 31 ms | 267 KB | 461 KB | 112 KB | ✅ |
| mobile | /knowledge/application-fee | 91 | 3388 ms | 0.000 | 38 ms | 266 KB | 461 KB | 112 KB | ✅ |
| mobile | /contact-us | 91 | 3310 ms | 0.000 | 57 ms | 295 KB | 480 KB | 112 KB | ✅ |
| desktop | / | 97 | 1269 ms | 0.000 | 0 ms | 272 KB | 1433 KB | 112 KB | ✅ |
| desktop | /available-units | 97 | 1337 ms | 0.000 | 0 ms | 322 KB | 1733 KB | 283 KB | ✅ |
| desktop | /available-units/0208 | 93 | 1714 ms | 0.001 | 0 ms | 277 KB | 1882 KB | 561 KB | ✅ |
| desktop | /available-units/2705 | 92 | 1862 ms | 0.001 | 0 ms | 277 KB | 2191 KB | 870 KB | ✅ |
| desktop | /amenities | 98 | 1106 ms | 0.000 | 0 ms | 273 KB | 1741 KB | 112 KB | ✅ |
| desktop | /photo-gallery | 92 | 1815 ms | 0.000 | 0 ms | 277 KB | 1792 KB | 112 KB | ✅ |
| desktop | /virtual-tour | 97 | 1311 ms | 0.000 | 0 ms | 271 KB | 1717 KB | 112 KB | ✅ |
| desktop | /knowledge | 94 | 1692 ms | 0.000 | 0 ms | 267 KB | 1433 KB | 112 KB | ✅ |
| desktop | /knowledge/application-fee | 99 | 1026 ms | 0.000 | 0 ms | 266 KB | 1435 KB | 112 KB | ✅ |
| desktop | /contact-us | 97 | 1320 ms | 0.000 | 0 ms | 295 KB | 1536 KB | 112 KB | ✅ |
