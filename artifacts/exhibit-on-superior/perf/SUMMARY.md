# Page-speed lab report

Generated: 2026-07-27T03:16:26.210Z

Target: local production build (dist/public via `vite preview`)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 77 | 6178 ms | 0.000 | 90 ms | 268 KB | 575 KB | 112 KB | ❌ lcpMs 6178 > limit 5300 |
| mobile | /available-units | 78 | 5729 ms | 0.000 | 88 ms | 320 KB | 818 KB | 283 KB | ✅ |
| mobile | /available-units/0208 | 81 | 4677 ms | 0.043 | 92 ms | 276 KB | 1024 KB | 561 KB | ✅ |
| mobile | /available-units/2705 | 77 | 5723 ms | 0.042 | 96 ms | 276 KB | 1323 KB | 860 KB | ✅ |
| mobile | /amenities | 83 | 4585 ms | 0.000 | 41 ms | 268 KB | 680 KB | 112 KB | ✅ |
| mobile | /photo-gallery | 81 | 4744 ms | 0.000 | 123 ms | 273 KB | 673 KB | 112 KB | ✅ |
| mobile | /virtual-tour | 83 | 4593 ms | 0.000 | 39 ms | 267 KB | 729 KB | 112 KB | ✅ |
| mobile | /knowledge | 83 | 4588 ms | 0.000 | 36 ms | 262 KB | 575 KB | 112 KB | ✅ |
| mobile | /knowledge/application-fee | 78 | 5571 ms | 0.000 | 59 ms | 262 KB | 575 KB | 112 KB | ✅ |
| mobile | /contact-us | 79 | 5274 ms | 0.000 | 90 ms | 291 KB | 594 KB | 112 KB | ✅ |
| desktop | / | 94 | 1607 ms | 0.000 | 0 ms | 268 KB | 1486 KB | 112 KB | ✅ |
| desktop | /available-units | 95 | 1437 ms | 0.000 | 0 ms | 320 KB | 1785 KB | 283 KB | ✅ |
| desktop | /available-units/0208 | 92 | 1874 ms | 0.001 | 0 ms | 276 KB | 1934 KB | 561 KB | ✅ |
| desktop | /available-units/2705 | 91 | 2019 ms | 0.001 | 0 ms | 276 KB | 2243 KB | 870 KB | ✅ |
| desktop | /amenities | 96 | 1378 ms | 0.000 | 0 ms | 268 KB | 1873 KB | 112 KB | ✅ |
| desktop | /photo-gallery | 98 | 1152 ms | 0.000 | 0 ms | 273 KB | 1844 KB | 112 KB | ✅ |
| desktop | /virtual-tour | 98 | 1066 ms | 0.000 | 0 ms | 267 KB | 1769 KB | 112 KB | ✅ |
| desktop | /knowledge | 91 | 1940 ms | 0.000 | 0 ms | 262 KB | 1486 KB | 112 KB | ✅ |
| desktop | /knowledge/application-fee | 98 | 1046 ms | 0.000 | 0 ms | 262 KB | 1487 KB | 112 KB | ✅ |
| desktop | /contact-us | 98 | 1152 ms | 0.000 | 0 ms | 291 KB | 1588 KB | 112 KB | ✅ |
