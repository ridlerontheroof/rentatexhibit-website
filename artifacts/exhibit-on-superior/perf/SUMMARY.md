# Page-speed lab report

Generated: 2026-07-30T11:10:08.803Z

Target: local production build (dist/public via `vite preview`)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 71 | 4872 ms | 0.000 | 393 ms | 495 KB | 461 KB | 335 KB | ❌ tbtMs 393 > limit 200 |
| mobile | /available-units | 79 | 3602 ms | 0.000 | 351 ms | 545 KB | 671 KB | 472 KB | ❌ lcpMs 3602 > limit 3600; tbtMs 351 > limit 200 |
| mobile | /available-units/0208 | 92 | 2731 ms | 0.046 | 208 ms | 501 KB | 910 KB | 782 KB | ❌ tbtMs 208 > limit 200 |
| mobile | /available-units/2705 | 83 | 4371 ms | 0.000 | 117 ms | 501 KB | 463 KB | 333 KB | ✅ |
| mobile | /amenities | 89 | 3312 ms | 0.000 | 153 ms | 495 KB | 544 KB | 333 KB | ✅ |
| mobile | /photo-gallery | 89 | 3317 ms | 0.000 | 171 ms | 500 KB | 559 KB | 333 KB | ✅ |
| mobile | /virtual-tour | 84 | 4227 ms | 0.000 | 113 ms | 494 KB | 597 KB | 333 KB | ✅ |
| mobile | /knowledge | 83 | 4295 ms | 0.000 | 125 ms | 489 KB | 461 KB | 333 KB | ✅ |
| mobile | /knowledge/application-fee | 90 | 3311 ms | 0.000 | 123 ms | 489 KB | 461 KB | 334 KB | ✅ |
| mobile | /contact-us | 94 | 2718 ms | 0.000 | 158 ms | 518 KB | 480 KB | 334 KB | ✅ |
| desktop | / | 95 | 1574 ms | 0.000 | 3 ms | 495 KB | 1433 KB | 333 KB | ✅ |
| desktop | /available-units | 91 | 1908 ms | 0.000 | 1 ms | 545 KB | 1752 KB | 524 KB | ✅ |
| desktop | /available-units/0208 | 93 | 1793 ms | 0.001 | 2 ms | 501 KB | 1882 KB | 782 KB | ✅ |
| desktop | /available-units/2705 | 92 | 1852 ms | 0.000 | 0 ms | 501 KB | 1435 KB | 334 KB | ✅ |
| desktop | /amenities | 95 | 1505 ms | 0.000 | 2 ms | 495 KB | 1741 KB | 333 KB | ✅ |
| desktop | /photo-gallery | 98 | 1135 ms | 0.000 | 0 ms | 500 KB | 1792 KB | 334 KB | ✅ |
| desktop | /virtual-tour | 97 | 1262 ms | 0.000 | 0 ms | 494 KB | 1717 KB | 333 KB | ✅ |
| desktop | /knowledge | 98 | 1103 ms | 0.000 | 0 ms | 490 KB | 1433 KB | 334 KB | ✅ |
| desktop | /knowledge/application-fee | 98 | 1113 ms | 0.000 | 1 ms | 489 KB | 1435 KB | 333 KB | ✅ |
| desktop | /contact-us | 96 | 1351 ms | 0.000 | 0 ms | 518 KB | 1536 KB | 334 KB | ✅ |
