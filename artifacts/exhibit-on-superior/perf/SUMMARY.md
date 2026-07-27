# Page-speed lab report

Generated: 2026-07-27T00:53:11.607Z

Target: local production build (dist/public via `vite preview`)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 88 | 3772 ms | 0.000 | 16 ms | 267 KB | 575 KB | 112 KB | ✅ |
| mobile | /available-units | 91 | 3384 ms | 0.000 | 69 ms | 318 KB | 818 KB | 283 KB | ✅ |
| mobile | /available-units/0208 | 83 | 4477 ms | 0.043 | 21 ms | 270 KB | 1024 KB | 561 KB | ✅ |
| mobile | /available-units/2705 | 77 | 5272 ms | 0.042 | 150 ms | 1137 KB | 1348 KB | 1901 KB | ✅ |
| mobile | /amenities | 81 | 4814 ms | 0.000 | 96 ms | 267 KB | 680 KB | 112 KB | ✅ |
| mobile | /photo-gallery | 79 | 5264 ms | 0.000 | 55 ms | 272 KB | 673 KB | 112 KB | ✅ |
| mobile | /virtual-tour | 78 | 5729 ms | 0.000 | 53 ms | 1748 KB | 608 KB | 2238 KB | ✅ |
| mobile | /knowledge | 83 | 4483 ms | 0.000 | 64 ms | 262 KB | 575 KB | 112 KB | ✅ |
| mobile | /knowledge/application-fee | 84 | 4292 ms | 0.000 | 35 ms | 261 KB | 575 KB | 112 KB | ✅ |
| mobile | /contact-us | 83 | 4436 ms | 0.000 | 68 ms | 290 KB | 594 KB | 112 KB | ✅ |
| desktop | / | 94 | 1624 ms | 0.000 | 0 ms | 267 KB | 1486 KB | 112 KB | ✅ |
| desktop | /available-units | 95 | 1496 ms | 0.000 | 0 ms | 318 KB | 1785 KB | 283 KB | ✅ |
| desktop | /available-units/0208 | 98 | 1047 ms | 0.001 | 0 ms | 270 KB | 1934 KB | 561 KB | ✅ |
| desktop | /available-units/2705 | 90 | 2095 ms | 0.001 | 0 ms | 1106 KB | 2288 KB | 1950 KB | ✅ |
| desktop | /amenities | 96 | 1375 ms | 0.000 | 0 ms | 267 KB | 1873 KB | 112 KB | ✅ |
| desktop | /photo-gallery | 97 | 1207 ms | 0.000 | 0 ms | 272 KB | 1844 KB | 112 KB | ✅ |
| desktop | /virtual-tour | 97 | 1236 ms | 0.000 | 0 ms | 1749 KB | 1589 KB | 2227 KB | ✅ |
| desktop | /knowledge | 98 | 1128 ms | 0.000 | 0 ms | 262 KB | 1486 KB | 112 KB | ✅ |
| desktop | /knowledge/application-fee | 98 | 1145 ms | 0.000 | 0 ms | 261 KB | 1487 KB | 112 KB | ✅ |
| desktop | /contact-us | 97 | 1279 ms | 0.000 | 0 ms | 290 KB | 1588 KB | 112 KB | ✅ |
