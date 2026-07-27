# Page-speed lab report

Generated: 2026-07-27T05:01:17.401Z

Target: local production build (dist/public via `vite preview`)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 88 | 3844 ms | 0.000 | 68 ms | 268 KB | 575 KB | 112 KB | ✅ |
| mobile | /available-units | 78 | 5576 ms | 0.000 | 100 ms | 320 KB | 818 KB | 283 KB | ✅ |
| mobile | /available-units/0208 | 83 | 4293 ms | 0.043 | 69 ms | 276 KB | 1024 KB | 561 KB | ✅ |
| mobile | /available-units/2705 | 78 | 5579 ms | 0.042 | 66 ms | 276 KB | 1323 KB | 860 KB | ✅ |
| mobile | /amenities | 86 | 3992 ms | 0.000 | 87 ms | 268 KB | 680 KB | 112 KB | ✅ |
| mobile | /photo-gallery | 83 | 4525 ms | 0.000 | 71 ms | 273 KB | 673 KB | 112 KB | ✅ |
| mobile | /virtual-tour | 85 | 4214 ms | 0.000 | 87 ms | 267 KB | 729 KB | 112 KB | ✅ |
| mobile | /knowledge | 81 | 4886 ms | 0.000 | 44 ms | 262 KB | 575 KB | 112 KB | ✅ |
| mobile | /knowledge/application-fee | 78 | 5563 ms | 0.000 | 43 ms | 262 KB | 575 KB | 112 KB | ✅ |
| mobile | /contact-us | 82 | 4591 ms | 0.000 | 114 ms | 291 KB | 594 KB | 112 KB | ✅ |
| desktop | / | 97 | 1329 ms | 0.000 | 0 ms | 268 KB | 1486 KB | 112 KB | ✅ |
| desktop | /available-units | 97 | 1220 ms | 0.000 | 0 ms | 320 KB | 1785 KB | 283 KB | ✅ |
| desktop | /available-units/0208 | 95 | 1552 ms | 0.001 | 0 ms | 276 KB | 1934 KB | 561 KB | ✅ |
| desktop | /available-units/2705 | 96 | 1407 ms | 0.001 | 0 ms | 276 KB | 2243 KB | 870 KB | ✅ |
| desktop | /amenities | 93 | 1774 ms | 0.000 | 0 ms | 268 KB | 1873 KB | 112 KB | ✅ |
| desktop | /photo-gallery | 89 | 2188 ms | 0.000 | 1 ms | 273 KB | 1844 KB | 112 KB | ✅ |
| desktop | /virtual-tour | 97 | 1295 ms | 0.000 | 0 ms | 267 KB | 1769 KB | 112 KB | ✅ |
| desktop | /knowledge | 98 | 1147 ms | 0.000 | 0 ms | 262 KB | 1486 KB | 112 KB | ✅ |
| desktop | /knowledge/application-fee | 98 | 1046 ms | 0.000 | 0 ms | 262 KB | 1487 KB | 112 KB | ✅ |
| desktop | /contact-us | 97 | 1338 ms | 0.000 | 0 ms | 291 KB | 1588 KB | 112 KB | ✅ |
