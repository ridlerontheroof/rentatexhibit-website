# Page-speed lab report

Generated: 2026-07-27T13:56:17.391Z

Target: local production build (dist/public via `vite preview`)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 86 | 4084 ms | 0.000 | 58 ms | 271 KB | 461 KB | 112 KB | ✅ |
| mobile | /available-units | 92 | 3086 ms | 0.000 | 114 ms | 320 KB | 704 KB | 283 KB | ✅ |
| mobile | /available-units/0208 | 82 | 4819 ms | 0.043 | 44 ms | 276 KB | 910 KB | 561 KB | ✅ |
| mobile | /available-units/2705 | 91 | 3310 ms | 0.034 | 37 ms | 276 KB | 1209 KB | 860 KB | ✅ |
| mobile | /amenities | 81 | 4856 ms | 0.000 | 42 ms | 271 KB | 544 KB | 112 KB | ❌ lcpMs 4856 > limit 4200 |
| mobile | /photo-gallery | 79 | 5121 ms | 0.000 | 97 ms | 276 KB | 559 KB | 112 KB | ✅ |
| mobile | /virtual-tour | 77 | 5636 ms | 0.000 | 50 ms | 270 KB | 597 KB | 112 KB | ✅ |
| mobile | /knowledge | 90 | 3460 ms | 0.000 | 17 ms | 265 KB | 461 KB | 112 KB | ✅ |
| mobile | /knowledge/application-fee | 91 | 3317 ms | 0.000 | 13 ms | 265 KB | 461 KB | 112 KB | ✅ |
| mobile | /contact-us | 91 | 3313 ms | 0.000 | 32 ms | 294 KB | 480 KB | 112 KB | ✅ |
| desktop | / | 99 | 850 ms | 0.000 | 0 ms | 271 KB | 1433 KB | 112 KB | ✅ |
| desktop | /available-units | 96 | 1346 ms | 0.000 | 0 ms | 320 KB | 1733 KB | 283 KB | ✅ |
| desktop | /available-units/0208 | 91 | 1954 ms | 0.001 | 0 ms | 276 KB | 1882 KB | 561 KB | ✅ |
| desktop | /available-units/2705 | 90 | 2057 ms | 0.001 | 0 ms | 276 KB | 2191 KB | 870 KB | ✅ |
| desktop | /amenities | 93 | 1801 ms | 0.000 | 0 ms | 271 KB | 1741 KB | 112 KB | ✅ |
| desktop | /photo-gallery | 97 | 1226 ms | 0.000 | 0 ms | 276 KB | 1792 KB | 112 KB | ✅ |
| desktop | /virtual-tour | 91 | 1934 ms | 0.000 | 0 ms | 270 KB | 1717 KB | 112 KB | ✅ |
| desktop | /knowledge | 98 | 1047 ms | 0.000 | 0 ms | 265 KB | 1433 KB | 112 KB | ✅ |
| desktop | /knowledge/application-fee | 97 | 1327 ms | 0.000 | 0 ms | 265 KB | 1435 KB | 112 KB | ✅ |
| desktop | /contact-us | 97 | 1286 ms | 0.000 | 0 ms | 294 KB | 1536 KB | 112 KB | ✅ |
