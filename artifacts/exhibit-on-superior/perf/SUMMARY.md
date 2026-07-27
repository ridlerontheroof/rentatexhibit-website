# Page-speed lab report

Generated: 2026-07-27T23:03:28.849Z

Target: local production build (dist/public via `vite preview`)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 57 | 4912 ms | 0.000 | 1215 ms | 272 KB | 461 KB | 112 KB | ❌ tbtMs 1215 > limit 200 |
| mobile | /available-units | 60 | 5346 ms | 0.000 | 640 ms | 321 KB | 269 KB | 260 KB | ❌ lcpMs 5346 > limit 3600; tbtMs 640 > limit 200 |
| mobile | /available-units/0208 | 89 | 2969 ms | 0.043 | 241 ms | 276 KB | 910 KB | 561 KB | ❌ tbtMs 241 > limit 200 |
| mobile | /available-units/2705 | 70 | 2974 ms | 0.034 | 1138 ms | 276 KB | 1209 KB | 860 KB | ❌ tbtMs 1138 > limit 200 |
| mobile | /amenities | 86 | 2931 ms | 0.000 | 355 ms | 272 KB | 544 KB | 112 KB | ❌ tbtMs 355 > limit 200 |
| mobile | /photo-gallery | 72 | 5949 ms | 0.000 | 230 ms | 277 KB | 559 KB | 112 KB | ❌ tbtMs 230 > limit 200 |
| mobile | /virtual-tour | 96 | 2576 ms | 0.000 | 38 ms | 271 KB | 597 KB | 112 KB | ✅ |
| mobile | /knowledge | 74 | 5309 ms | 0.000 | 255 ms | 266 KB | 461 KB | 112 KB | ❌ lcpMs 5309 > limit 5300; tbtMs 255 > limit 200 |
| mobile | /knowledge/application-fee | 85 | 2606 ms | 0.000 | 445 ms | 266 KB | 461 KB | 112 KB | ❌ tbtMs 445 > limit 200 |
| mobile | /contact-us | 92 | 3152 ms | 0.000 | 72 ms | 295 KB | 480 KB | 112 KB | ✅ |
| desktop | / | 98 | 1098 ms | 0.000 | 0 ms | 271 KB | 1433 KB | 112 KB | ✅ |
| desktop | /available-units | 98 | 1185 ms | 0.000 | 0 ms | 321 KB | 1733 KB | 283 KB | ✅ |
| desktop | /available-units/0208 | 94 | 1628 ms | 0.001 | 12 ms | 276 KB | 1882 KB | 561 KB | ✅ |
| desktop | /available-units/2705 | 95 | 1503 ms | 0.001 | 0 ms | 276 KB | 2191 KB | 870 KB | ✅ |
| desktop | /amenities | 89 | 2224 ms | 0.000 | 0 ms | 272 KB | 1741 KB | 112 KB | ✅ |
| desktop | /photo-gallery | 92 | 1820 ms | 0.000 | 0 ms | 277 KB | 1792 KB | 112 KB | ✅ |
| desktop | /virtual-tour | 95 | 1497 ms | 0.000 | 0 ms | 270 KB | 1717 KB | 112 KB | ✅ |
| desktop | /knowledge | 94 | 1663 ms | 0.000 | 0 ms | 266 KB | 1433 KB | 112 KB | ✅ |
| desktop | /knowledge/application-fee | 91 | 1915 ms | 0.000 | 0 ms | 266 KB | 1435 KB | 112 KB | ✅ |
| desktop | /contact-us | 99 | 943 ms | 0.000 | 16 ms | 295 KB | 278 KB | 112 KB | ✅ |
