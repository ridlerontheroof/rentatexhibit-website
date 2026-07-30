# Page-speed lab report

Generated: 2026-07-30T03:36:48.871Z

Target: local production build (dist/public via `vite preview`)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 89 | 3097 ms | 0.000 | 228 ms | 495 KB | 461 KB | 336 KB | ❌ tbtMs 228 > limit 200 |
| mobile | /available-units | 81 | 3998 ms | 0.000 | 273 ms | 544 KB | 671 KB | 472 KB | ❌ lcpMs 3998 > limit 3600; tbtMs 273 > limit 200 |
| mobile | /available-units/0208 | 91 | 2727 ms | 0.046 | 242 ms | 500 KB | 910 KB | 782 KB | ❌ tbtMs 242 > limit 200 |
| mobile | /available-units/2705 | 76 | 4978 ms | 0.000 | 231 ms | 500 KB | 463 KB | 333 KB | ❌ tbtMs 231 > limit 200 |
| mobile | /amenities | 77 | 4973 ms | 0.000 | 220 ms | 495 KB | 544 KB | 333 KB | ❌ lcpMs 4973 > limit 4200; tbtMs 220 > limit 200 |
| mobile | /photo-gallery | 81 | 3707 ms | 0.000 | 311 ms | 500 KB | 559 KB | 333 KB | ❌ tbtMs 311 > limit 200 |
| mobile | /virtual-tour | 78 | 4969 ms | 0.000 | 190 ms | 493 KB | 597 KB | 333 KB | ✅ |
| mobile | /knowledge | 89 | 3239 ms | 0.000 | 166 ms | 489 KB | 461 KB | 333 KB | ✅ |
| mobile | /knowledge/application-fee | 76 | 4961 ms | 0.000 | 249 ms | 489 KB | 461 KB | 335 KB | ❌ lcpMs 4961 > limit 4400; tbtMs 249 > limit 200 |
| mobile | /contact-us | 75 | 4296 ms | 0.000 | 382 ms | 518 KB | 480 KB | 334 KB | ❌ tbtMs 382 > limit 200 |
| desktop | / | 98 | 1112 ms | 0.000 | 4 ms | 495 KB | 1433 KB | 333 KB | ✅ |
| desktop | /available-units | 90 | 2075 ms | 0.000 | 16 ms | 544 KB | 1752 KB | 524 KB | ✅ |
| desktop | /available-units/0208 | 93 | 1695 ms | 0.001 | 11 ms | 500 KB | 1882 KB | 782 KB | ✅ |
| desktop | /available-units/2705 | 92 | 1846 ms | 0.000 | 34 ms | 500 KB | 1435 KB | 333 KB | ✅ |
| desktop | /amenities | 91 | 1944 ms | 0.000 | 6 ms | 495 KB | 1741 KB | 333 KB | ✅ |
| desktop | /photo-gallery | 91 | 1943 ms | 0.000 | 6 ms | 500 KB | 1792 KB | 333 KB | ✅ |
| desktop | /virtual-tour | 98 | 1198 ms | 0.000 | 29 ms | 493 KB | 1717 KB | 333 KB | ✅ |
| desktop | /knowledge | 98 | 1108 ms | 0.000 | 7 ms | 489 KB | 1433 KB | 334 KB | ✅ |
| desktop | /knowledge/application-fee | 93 | 1792 ms | 0.000 | 7 ms | 489 KB | 1435 KB | 333 KB | ✅ |
| desktop | /contact-us | 97 | 1278 ms | 0.000 | 4 ms | 518 KB | 1536 KB | 333 KB | ✅ |
