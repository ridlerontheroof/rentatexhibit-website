# Page-speed lab report

Generated: 2026-07-28T12:47:48.023Z

Target: local production build (dist/public via `vite preview`)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 91 | 3394 ms | 0.000 | 28 ms | 273 KB | 461 KB | 112 KB | ✅ |
| mobile | /available-units | 91 | 3241 ms | 0.000 | 106 ms | 322 KB | 680 KB | 260 KB | ✅ |
| mobile | /available-units/0208 | 75 | 6169 ms | 0.043 | 88 ms | 277 KB | 910 KB | 561 KB | ❌ lcpMs 6169 > limit 6100 |
| mobile | /available-units/2705 | 91 | 3320 ms | 0.034 | 55 ms | 277 KB | 1209 KB | 860 KB | ✅ |
| mobile | /amenities | 82 | 4819 ms | 0.000 | 45 ms | 273 KB | 544 KB | 112 KB | ❌ lcpMs 4819 > limit 4200 |
| mobile | /photo-gallery | 87 | 3910 ms | 0.000 | 55 ms | 277 KB | 559 KB | 112 KB | ✅ |
| mobile | /virtual-tour | 89 | 3544 ms | 0.000 | 22 ms | 271 KB | 597 KB | 112 KB | ✅ |
| mobile | /knowledge | 91 | 3312 ms | 0.000 | 8 ms | 267 KB | 461 KB | 112 KB | ✅ |
| mobile | /knowledge/application-fee | 81 | 4965 ms | 0.000 | 18 ms | 266 KB | 461 KB | 112 KB | ❌ lcpMs 4965 > limit 4400 |
| mobile | /contact-us | 93 | 3097 ms | 0.000 | 51 ms | 295 KB | 480 KB | 112 KB | ✅ |
| desktop | / | 91 | 1944 ms | 0.000 | 0 ms | 273 KB | 1433 KB | 112 KB | ✅ |
| desktop | /available-units | 97 | 1192 ms | 0.000 | 0 ms | 322 KB | 1733 KB | 283 KB | ✅ |
| desktop | /available-units/0208 | 93 | 1794 ms | 0.001 | 0 ms | 277 KB | 1882 KB | 561 KB | ✅ |
| desktop | /available-units/2705 | 97 | 1273 ms | 0.001 | 0 ms | 277 KB | 2191 KB | 870 KB | ✅ |
| desktop | /amenities | 95 | 1469 ms | 0.000 | 0 ms | 273 KB | 1741 KB | 112 KB | ✅ |
| desktop | /photo-gallery | 97 | 1269 ms | 0.000 | 0 ms | 277 KB | 1792 KB | 112 KB | ✅ |
| desktop | /virtual-tour | 91 | 1937 ms | 0.000 | 0 ms | 271 KB | 1717 KB | 112 KB | ✅ |
| desktop | /knowledge | 92 | 1906 ms | 0.000 | 0 ms | 267 KB | 1433 KB | 112 KB | ✅ |
| desktop | /knowledge/application-fee | 98 | 1088 ms | 0.000 | 0 ms | 266 KB | 1435 KB | 112 KB | ✅ |
| desktop | /contact-us | 91 | 1972 ms | 0.000 | 0 ms | 295 KB | 1536 KB | 112 KB | ✅ |
