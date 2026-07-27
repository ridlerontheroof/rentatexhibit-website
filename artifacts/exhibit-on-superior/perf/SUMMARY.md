# Page-speed lab report

Generated: 2026-07-27T13:20:24.421Z

Target: local production build (dist/public via `vite preview`)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 72 | 6219 ms | 0.000 | 196 ms | 271 KB | 575 KB | 112 KB | ❌ lcpMs 6219 > limit 5300 |
| mobile | /available-units | 72 | 4812 ms | 0.000 | 289 ms | 320 KB | 818 KB | 283 KB | ❌ tbtMs 289 > limit 200 |
| mobile | /available-units/0208 | 80 | 4985 ms | 0.043 | 99 ms | 275 KB | 1024 KB | 561 KB | ✅ |
| mobile | /available-units/2705 | 83 | 4537 ms | 0.034 | 109 ms | 275 KB | 1323 KB | 860 KB | ✅ |
| mobile | /amenities | 83 | 4592 ms | 0.000 | 53 ms | 271 KB | 680 KB | 112 KB | ✅ |
| mobile | /photo-gallery | 82 | 4635 ms | 0.000 | 135 ms | 275 KB | 673 KB | 112 KB | ✅ |
| mobile | /virtual-tour | 78 | 5718 ms | 0.000 | 75 ms | 269 KB | 729 KB | 112 KB | ✅ |
| mobile | /knowledge | 75 | 6162 ms | 0.000 | 106 ms | 265 KB | 575 KB | 112 KB | ✅ |
| mobile | /knowledge/application-fee | 78 | 5567 ms | 0.000 | 64 ms | 265 KB | 575 KB | 112 KB | ✅ |
| mobile | /contact-us | 89 | 3614 ms | 0.000 | 72 ms | 294 KB | 594 KB | 112 KB | ✅ |
| desktop | / | 93 | 1788 ms | 0.000 | 0 ms | 270 KB | 1486 KB | 112 KB | ✅ |
| desktop | /available-units | 95 | 1516 ms | 0.000 | 0 ms | 320 KB | 1785 KB | 283 KB | ✅ |
| desktop | /available-units/0208 | 90 | 2123 ms | 0.001 | 0 ms | 275 KB | 1934 KB | 561 KB | ✅ |
| desktop | /available-units/2705 | 94 | 1624 ms | 0.001 | 0 ms | 275 KB | 2243 KB | 870 KB | ✅ |
| desktop | /amenities | 95 | 1483 ms | 0.000 | 0 ms | 271 KB | 1873 KB | 112 KB | ✅ |
| desktop | /photo-gallery | 97 | 1272 ms | 0.000 | 0 ms | 275 KB | 1844 KB | 112 KB | ✅ |
| desktop | /virtual-tour | 97 | 1204 ms | 0.000 | 0 ms | 269 KB | 1769 KB | 112 KB | ✅ |
| desktop | /knowledge | 98 | 1046 ms | 0.000 | 0 ms | 265 KB | 1486 KB | 112 KB | ✅ |
| desktop | /knowledge/application-fee | 93 | 1732 ms | 0.000 | 0 ms | 264 KB | 1487 KB | 112 KB | ✅ |
| desktop | /contact-us | 97 | 1217 ms | 0.000 | 0 ms | 293 KB | 1588 KB | 112 KB | ✅ |
