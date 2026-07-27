# Page-speed lab report

Generated: 2026-07-27T13:21:35.263Z

Target: local production build (dist/public via `vite preview`)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 41 | 6103 ms | 0.000 | 7571 ms | 271 KB | 575 KB | 112 KB | ❌ lcpMs 6103 > limit 5300; tbtMs 7571 > limit 200 |
| mobile | /available-units | 67 | 5543 ms | 0.000 | 421 ms | 320 KB | 818 KB | 283 KB | ❌ tbtMs 421 > limit 200 |
| mobile | /available-units/0208 | 67 | 5573 ms | 0.045 | 448 ms | 276 KB | 1024 KB | 561 KB | ❌ tbtMs 448 > limit 200 |
| mobile | /available-units/2705 | 86 | 3789 ms | 0.034 | 162 ms | 276 KB | 1323 KB | 860 KB | ✅ |
| mobile | /amenities | 76 | 4785 ms | 0.000 | 289 ms | 271 KB | 680 KB | 112 KB | ❌ tbtMs 289 > limit 200 |
| mobile | /photo-gallery | 77 | 5578 ms | 0.000 | 142 ms | 276 KB | 673 KB | 112 KB | ✅ |
| mobile | /virtual-tour | 88 | 3689 ms | 0.000 | 98 ms | 270 KB | 729 KB | 112 KB | ✅ |
| mobile | /knowledge | 87 | 3910 ms | 0.000 | 92 ms | 265 KB | 575 KB | 112 KB | ✅ |
| mobile | /knowledge/application-fee | 78 | 5728 ms | 0.000 | 38 ms | 265 KB | 575 KB | 112 KB | ❌ lcpMs 5728 > limit 5700 |
| mobile | /contact-us | 87 | 3686 ms | 0.000 | 156 ms | 294 KB | 594 KB | 112 KB | ✅ |
| desktop | / | 95 | 1506 ms | 0.000 | 0 ms | 271 KB | 1486 KB | 112 KB | ✅ |
| desktop | /available-units | 89 | 2138 ms | 0.000 | 1 ms | 320 KB | 1785 KB | 283 KB | ✅ |
| desktop | /available-units/0208 | 90 | 2065 ms | 0.001 | 0 ms | 276 KB | 1934 KB | 561 KB | ✅ |
| desktop | /available-units/2705 | 92 | 1898 ms | 0.001 | 0 ms | 276 KB | 2243 KB | 870 KB | ✅ |
| desktop | /amenities | 91 | 1968 ms | 0.000 | 0 ms | 271 KB | 1873 KB | 112 KB | ✅ |
| desktop | /photo-gallery | 96 | 1357 ms | 0.000 | 0 ms | 276 KB | 1844 KB | 112 KB | ✅ |
| desktop | /virtual-tour | 98 | 1149 ms | 0.000 | 0 ms | 270 KB | 1769 KB | 112 KB | ✅ |
| desktop | /knowledge | 97 | 1266 ms | 0.000 | 0 ms | 265 KB | 1486 KB | 112 KB | ✅ |
| desktop | /knowledge/application-fee | 91 | 1951 ms | 0.000 | 0 ms | 265 KB | 1487 KB | 112 KB | ✅ |
| desktop | /contact-us | 98 | 1130 ms | 0.000 | 0 ms | 294 KB | 1588 KB | 112 KB | ✅ |
