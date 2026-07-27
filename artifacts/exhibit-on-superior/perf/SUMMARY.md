# Page-speed lab report

Generated: 2026-07-27T12:31:19.236Z

Target: local production build (dist/public via `vite preview`)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 78 | 5583 ms | 0.000 | 96 ms | 268 KB | 575 KB | 112 KB | ❌ lcpMs 5583 > limit 5300 |
| mobile | /available-units | 86 | 3837 ms | 0.000 | 145 ms | 321 KB | 818 KB | 283 KB | ✅ |
| mobile | /available-units/0208 | 82 | 4527 ms | 0.043 | 91 ms | 276 KB | 1024 KB | 561 KB | ✅ |
| mobile | /available-units/2705 | 79 | 5125 ms | 0.034 | 140 ms | 276 KB | 1323 KB | 860 KB | ✅ |
| mobile | /amenities | 75 | 6041 ms | 0.000 | 156 ms | 268 KB | 680 KB | 112 KB | ✅ |
| mobile | /photo-gallery | 78 | 5130 ms | 0.000 | 154 ms | 273 KB | 673 KB | 112 KB | ✅ |
| mobile | /virtual-tour | 82 | 4597 ms | 0.000 | 114 ms | 267 KB | 729 KB | 112 KB | ✅ |
| mobile | /knowledge | 80 | 4857 ms | 0.000 | 108 ms | 262 KB | 575 KB | 112 KB | ✅ |
| mobile | /knowledge/application-fee | 79 | 5298 ms | 0.000 | 90 ms | 262 KB | 575 KB | 112 KB | ✅ |
| mobile | /contact-us | 81 | 4819 ms | 0.000 | 102 ms | 291 KB | 594 KB | 112 KB | ✅ |
| desktop | / | 93 | 1714 ms | 0.000 | 0 ms | 268 KB | 1486 KB | 112 KB | ✅ |
| desktop | /available-units | 90 | 2081 ms | 0.000 | 14 ms | 321 KB | 1785 KB | 283 KB | ✅ |
| desktop | /available-units/0208 | 91 | 1930 ms | 0.001 | 0 ms | 276 KB | 1934 KB | 561 KB | ✅ |
| desktop | /available-units/2705 | 89 | 2216 ms | 0.001 | 0 ms | 276 KB | 2243 KB | 869 KB | ✅ |
| desktop | /amenities | 95 | 1465 ms | 0.000 | 0 ms | 268 KB | 1873 KB | 112 KB | ✅ |
| desktop | /photo-gallery | 95 | 1570 ms | 0.000 | 0 ms | 273 KB | 1844 KB | 112 KB | ✅ |
| desktop | /virtual-tour | 97 | 1309 ms | 0.000 | 0 ms | 267 KB | 1769 KB | 112 KB | ✅ |
| desktop | /knowledge | 98 | 1107 ms | 0.000 | 0 ms | 262 KB | 1486 KB | 112 KB | ✅ |
| desktop | /knowledge/application-fee | 98 | 1046 ms | 0.000 | 0 ms | 262 KB | 1487 KB | 112 KB | ✅ |
| desktop | /contact-us | 98 | 1151 ms | 0.000 | 0 ms | 291 KB | 1588 KB | 112 KB | ✅ |
