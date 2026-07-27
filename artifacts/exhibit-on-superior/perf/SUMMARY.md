# Page-speed lab report

Generated: 2026-07-27T02:08:33.781Z

Target: local production build (dist/public via `vite preview`)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 84 | 4119 ms | 0.000 | 145 ms | 268 KB | 575 KB | 112 KB | ✅ |
| mobile | /available-units | 92 | 3161 ms | 0.000 | 106 ms | 320 KB | 818 KB | 283 KB | ✅ |
| mobile | /available-units/0208 | 91 | 3325 ms | 0.043 | 65 ms | 274 KB | 1024 KB | 561 KB | ✅ |
| mobile | /available-units/2705 | 78 | 5717 ms | 0.042 | 77 ms | 274 KB | 1323 KB | 860 KB | ✅ |
| mobile | /amenities | 83 | 4435 ms | 0.000 | 40 ms | 268 KB | 680 KB | 112 KB | ✅ |
| mobile | /photo-gallery | 89 | 3623 ms | 0.000 | 69 ms | 273 KB | 673 KB | 112 KB | ✅ |
| mobile | /virtual-tour | 79 | 5490 ms | 0.000 | 55 ms | 267 KB | 729 KB | 112 KB | ✅ |
| mobile | /knowledge | 85 | 4192 ms | 0.000 | 19 ms | 262 KB | 575 KB | 112 KB | ✅ |
| mobile | /knowledge/application-fee | 80 | 5108 ms | 0.000 | 21 ms | 262 KB | 575 KB | 112 KB | ✅ |
| mobile | /contact-us | 75 | 6042 ms | 0.000 | 136 ms | 291 KB | 594 KB | 112 KB | ✅ |
| desktop | / | 100 | 813 ms | 0.000 | 0 ms | 268 KB | 1486 KB | 112 KB | ✅ |
| desktop | /available-units | 97 | 1212 ms | 0.000 | 0 ms | 320 KB | 1785 KB | 283 KB | ✅ |
| desktop | /available-units/0208 | 98 | 1189 ms | 0.001 | 0 ms | 274 KB | 1934 KB | 561 KB | ✅ |
| desktop | /available-units/2705 | 94 | 1590 ms | 0.001 | 0 ms | 274 KB | 2243 KB | 870 KB | ✅ |
| desktop | /amenities | 89 | 2271 ms | 0.000 | 0 ms | 268 KB | 1873 KB | 112 KB | ✅ |
| desktop | /photo-gallery | 91 | 1956 ms | 0.000 | 0 ms | 273 KB | 1844 KB | 112 KB | ✅ |
| desktop | /virtual-tour | 98 | 1150 ms | 0.000 | 0 ms | 267 KB | 1769 KB | 112 KB | ✅ |
| desktop | /knowledge | 98 | 1132 ms | 0.000 | 0 ms | 262 KB | 1486 KB | 112 KB | ✅ |
| desktop | /knowledge/application-fee | 97 | 1228 ms | 0.000 | 0 ms | 262 KB | 1487 KB | 112 KB | ✅ |
| desktop | /contact-us | 97 | 1282 ms | 0.000 | 0 ms | 291 KB | 1588 KB | 112 KB | ✅ |
