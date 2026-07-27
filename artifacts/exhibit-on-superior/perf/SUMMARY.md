# Page-speed lab report

Generated: 2026-07-27T12:57:09.656Z

Target: local production build (dist/public via `vite preview`)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 81 | 4966 ms | 0.000 | 49 ms | 268 KB | 575 KB | 112 KB | ✅ |
| mobile | /available-units | 85 | 4285 ms | 0.000 | 42 ms | 321 KB | 818 KB | 283 KB | ✅ |
| mobile | /available-units/0208 | 81 | 4970 ms | 0.043 | 22 ms | 276 KB | 1024 KB | 561 KB | ✅ |
| mobile | /available-units/2705 | 88 | 3697 ms | 0.034 | 104 ms | 276 KB | 1323 KB | 860 KB | ✅ |
| mobile | /amenities | 82 | 4634 ms | 0.000 | 45 ms | 268 KB | 680 KB | 112 KB | ✅ |
| mobile | /photo-gallery | 78 | 5723 ms | 0.000 | 53 ms | 273 KB | 673 KB | 112 KB | ✅ |
| mobile | /virtual-tour | 84 | 4373 ms | 0.000 | 23 ms | 267 KB | 729 KB | 112 KB | ✅ |
| mobile | /knowledge | 85 | 4331 ms | 0.000 | 22 ms | 262 KB | 575 KB | 112 KB | ✅ |
| mobile | /knowledge/application-fee | 81 | 4811 ms | 0.000 | 3 ms | 262 KB | 575 KB | 112 KB | ✅ |
| mobile | /contact-us | 75 | 6246 ms | 0.000 | 64 ms | 291 KB | 594 KB | 112 KB | ❌ lcpMs 6246 > limit 6200 |
| desktop | / | 91 | 1973 ms | 0.000 | 0 ms | 268 KB | 1486 KB | 112 KB | ✅ |
| desktop | /available-units | 96 | 1407 ms | 0.000 | 0 ms | 321 KB | 1785 KB | 283 KB | ✅ |
| desktop | /available-units/0208 | 98 | 1169 ms | 0.001 | 0 ms | 276 KB | 1934 KB | 561 KB | ✅ |
| desktop | /available-units/2705 | 98 | 1129 ms | 0.001 | 0 ms | 276 KB | 2243 KB | 870 KB | ✅ |
| desktop | /amenities | 94 | 1598 ms | 0.000 | 0 ms | 268 KB | 1873 KB | 112 KB | ✅ |
| desktop | /photo-gallery | 97 | 1213 ms | 0.000 | 0 ms | 273 KB | 1844 KB | 112 KB | ✅ |
| desktop | /virtual-tour | 98 | 1196 ms | 0.000 | 0 ms | 267 KB | 1769 KB | 112 KB | ✅ |
| desktop | /knowledge | 91 | 1942 ms | 0.000 | 0 ms | 262 KB | 1486 KB | 112 KB | ✅ |
| desktop | /knowledge/application-fee | 92 | 1815 ms | 0.000 | 0 ms | 262 KB | 1487 KB | 112 KB | ✅ |
| desktop | /contact-us | 98 | 1152 ms | 0.000 | 0 ms | 291 KB | 1588 KB | 112 KB | ✅ |
