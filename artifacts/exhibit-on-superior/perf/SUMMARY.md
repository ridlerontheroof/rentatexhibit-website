# Page-speed lab report

Generated: 2026-07-26T23:23:05.872Z

Target: local production build (dist/public via `vite preview`)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 92 | 3325 ms | 0.000 | 61 ms | 266 KB | 575 KB | 112 KB | ✅ |
| mobile | /available-units | 91 | 3161 ms | 0.000 | 151 ms | 318 KB | 818 KB | 283 KB | ✅ |
| mobile | /available-units/0208 | 79 | 4894 ms | 0.043 | 92 ms | 270 KB | 1024 KB | 561 KB | ✅ |
| mobile | /available-units/2705 | 86 | 3984 ms | 0.042 | 39 ms | 1106 KB | 1348 KB | 1922 KB | ✅ |
| mobile | /amenities | 81 | 4965 ms | 0.000 | 38 ms | 267 KB | 681 KB | 112 KB | ✅ |
| mobile | /photo-gallery | 83 | 4526 ms | 0.000 | 84 ms | 271 KB | 673 KB | 112 KB | ✅ |
| mobile | /virtual-tour | 83 | 4512 ms | 0.000 | 21 ms | 1748 KB | 607 KB | 2230 KB | ✅ |
| mobile | /knowledge | 79 | 5561 ms | 0.000 | 25 ms | 261 KB | 575 KB | 112 KB | ✅ |
| mobile | /knowledge/application-fee | 79 | 5345 ms | 0.000 | 18 ms | 260 KB | 575 KB | 112 KB | ✅ |
| mobile | /contact-us | 83 | 4558 ms | 0.000 | 48 ms | 289 KB | 594 KB | 112 KB | ✅ |
| desktop | / | 98 | 1045 ms | 0.000 | 0 ms | 266 KB | 1486 KB | 112 KB | ✅ |
| desktop | /available-units | 96 | 1399 ms | 0.000 | 0 ms | 318 KB | 1785 KB | 283 KB | ✅ |
| desktop | /available-units/0208 | 92 | 1853 ms | 0.001 | 0 ms | 269 KB | 1934 KB | 561 KB | ✅ |
| desktop | /available-units/2705 | 91 | 2016 ms | 0.001 | 0 ms | 1136 KB | 2287 KB | 1927 KB | ✅ |
| desktop | /amenities | 91 | 1997 ms | 0.000 | 0 ms | 267 KB | 1873 KB | 112 KB | ✅ |
| desktop | /photo-gallery | 96 | 1344 ms | 0.000 | 0 ms | 271 KB | 1844 KB | 112 KB | ✅ |
| desktop | /virtual-tour | 97 | 1294 ms | 0.000 | 0 ms | 1747 KB | 1590 KB | 2227 KB | ✅ |
| desktop | /knowledge | 98 | 1131 ms | 0.000 | 0 ms | 261 KB | 1486 KB | 112 KB | ✅ |
| desktop | /knowledge/application-fee | 93 | 1796 ms | 0.000 | 0 ms | 260 KB | 1487 KB | 112 KB | ✅ |
| desktop | /contact-us | 93 | 1799 ms | 0.000 | 0 ms | 289 KB | 1588 KB | 112 KB | ✅ |
