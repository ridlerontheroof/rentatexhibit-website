# Page-speed lab report

Generated: 2026-07-26T23:45:07.143Z

Target: local production build (dist/public via `vite preview`)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 90 | 3334 ms | 0.000 | 133 ms | 267 KB | 575 KB | 112 KB | ✅ |
| mobile | /available-units | 82 | 4515 ms | 0.000 | 93 ms | 319 KB | 818 KB | 283 KB | ✅ |
| mobile | /available-units/0208 | 82 | 4638 ms | 0.043 | 64 ms | 271 KB | 1024 KB | 561 KB | ✅ |
| mobile | /available-units/2705 | 77 | 5867 ms | 0.042 | 47 ms | 271 KB | 1323 KB | 860 KB | ✅ |
| mobile | /amenities | 78 | 5712 ms | 0.000 | 38 ms | 268 KB | 680 KB | 112 KB | ✅ |
| mobile | /photo-gallery | 82 | 4884 ms | 0.000 | 55 ms | 272 KB | 673 KB | 112 KB | ✅ |
| mobile | /virtual-tour | 81 | 4885 ms | 0.000 | 20 ms | 266 KB | 729 KB | 112 KB | ✅ |
| mobile | /knowledge | 80 | 5111 ms | 0.000 | 18 ms | 262 KB | 575 KB | 112 KB | ✅ |
| mobile | /knowledge/application-fee | 83 | 4587 ms | 0.000 | 12 ms | 261 KB | 575 KB | 112 KB | ✅ |
| mobile | /contact-us | 80 | 5187 ms | 0.000 | 54 ms | 291 KB | 594 KB | 112 KB | ✅ |
| desktop | / | 93 | 1730 ms | 0.000 | 0 ms | 267 KB | 1486 KB | 112 KB | ✅ |
| desktop | /available-units | 97 | 1209 ms | 0.000 | 0 ms | 319 KB | 1785 KB | 283 KB | ✅ |
| desktop | /available-units/0208 | 92 | 1917 ms | 0.001 | 0 ms | 271 KB | 1934 KB | 561 KB | ✅ |
| desktop | /available-units/2705 | 90 | 2136 ms | 0.001 | 0 ms | 271 KB | 2243 KB | 870 KB | ✅ |
| desktop | /amenities | 95 | 1577 ms | 0.000 | 0 ms | 268 KB | 1873 KB | 112 KB | ✅ |
| desktop | /photo-gallery | 98 | 1150 ms | 0.000 | 0 ms | 272 KB | 1844 KB | 112 KB | ✅ |
| desktop | /virtual-tour | 97 | 1295 ms | 0.000 | 0 ms | 266 KB | 1769 KB | 112 KB | ✅ |
| desktop | /knowledge | 98 | 1129 ms | 0.000 | 0 ms | 262 KB | 1486 KB | 112 KB | ✅ |
| desktop | /knowledge/application-fee | 91 | 1928 ms | 0.000 | 0 ms | 261 KB | 1487 KB | 112 KB | ✅ |
| desktop | /contact-us | 98 | 1150 ms | 0.000 | 0 ms | 290 KB | 1588 KB | 112 KB | ✅ |
