# Page-speed lab report

Generated: 2026-07-27T02:29:22.117Z

Target: local production build (dist/public via `vite preview`)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 78 | 5718 ms | 0.000 | 52 ms | 268 KB | 575 KB | 112 KB | ❌ lcpMs 5718 > limit 5300 |
| mobile | /available-units | 87 | 3763 ms | 0.000 | 133 ms | 320 KB | 818 KB | 283 KB | ✅ |
| mobile | /available-units/0208 | 89 | 3643 ms | 0.043 | 90 ms | 274 KB | 1024 KB | 561 KB | ✅ |
| mobile | /available-units/2705 | 83 | 4531 ms | 0.042 | 64 ms | 274 KB | 1323 KB | 860 KB | ✅ |
| mobile | /amenities | 81 | 4898 ms | 0.000 | 76 ms | 268 KB | 680 KB | 112 KB | ✅ |
| mobile | /photo-gallery | 79 | 5192 ms | 0.000 | 96 ms | 273 KB | 673 KB | 112 KB | ✅ |
| mobile | /virtual-tour | 82 | 4744 ms | 0.000 | 79 ms | 267 KB | 729 KB | 112 KB | ✅ |
| mobile | /knowledge | 83 | 4589 ms | 0.000 | 43 ms | 262 KB | 575 KB | 112 KB | ✅ |
| mobile | /knowledge/application-fee | 81 | 4886 ms | 0.000 | 25 ms | 262 KB | 575 KB | 112 KB | ✅ |
| mobile | /contact-us | 78 | 5567 ms | 0.000 | 99 ms | 291 KB | 594 KB | 112 KB | ✅ |
| desktop | / | 92 | 1831 ms | 0.000 | 0 ms | 268 KB | 1486 KB | 112 KB | ✅ |
| desktop | /available-units | 98 | 1105 ms | 0.000 | 0 ms | 320 KB | 1785 KB | 283 KB | ✅ |
| desktop | /available-units/0208 | 98 | 1134 ms | 0.001 | 0 ms | 274 KB | 1934 KB | 561 KB | ✅ |
| desktop | /available-units/2705 | 98 | 1192 ms | 0.001 | 0 ms | 274 KB | 2243 KB | 870 KB | ✅ |
| desktop | /amenities | 92 | 1850 ms | 0.000 | 0 ms | 268 KB | 1873 KB | 112 KB | ✅ |
| desktop | /photo-gallery | 93 | 1737 ms | 0.000 | 0 ms | 273 KB | 1844 KB | 112 KB | ✅ |
| desktop | /virtual-tour | 97 | 1285 ms | 0.000 | 0 ms | 267 KB | 1769 KB | 112 KB | ✅ |
| desktop | /knowledge | 98 | 1132 ms | 0.000 | 0 ms | 262 KB | 1486 KB | 112 KB | ✅ |
| desktop | /knowledge/application-fee | 94 | 1631 ms | 0.000 | 0 ms | 262 KB | 1487 KB | 112 KB | ✅ |
| desktop | /contact-us | 98 | 1091 ms | 0.000 | 0 ms | 291 KB | 1588 KB | 112 KB | ✅ |
