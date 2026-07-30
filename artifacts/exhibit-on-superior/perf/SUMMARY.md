# Page-speed lab report

Generated: 2026-07-30T03:18:41.236Z

Target: local production build (dist/public via `vite preview`)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 62 | 5505 ms | 0.000 | 598 ms | 495 KB | 461 KB | 335 KB | ❌ lcpMs 5505 > limit 5300; tbtMs 598 > limit 200 |
| mobile | /available-units | 84 | 2811 ms | 0.000 | 412 ms | 544 KB | 671 KB | 472 KB | ❌ tbtMs 412 > limit 200 |
| mobile | /available-units/0208 | 61 | 4564 ms | 0.046 | 942 ms | 500 KB | 910 KB | 782 KB | ❌ tbtMs 942 > limit 200 |
| mobile | /available-units/2705 | 81 | 4079 ms | 0.000 | 261 ms | 500 KB | 463 KB | 333 KB | ❌ tbtMs 261 > limit 200 |
| mobile | /amenities | 79 | 4831 ms | 0.000 | 172 ms | 495 KB | 544 KB | 333 KB | ❌ lcpMs 4831 > limit 4200 |
| mobile | /photo-gallery | 89 | 3165 ms | 0.000 | 208 ms | 500 KB | 559 KB | 333 KB | ❌ tbtMs 208 > limit 200 |
| mobile | /virtual-tour | 88 | 3312 ms | 0.000 | 184 ms | 493 KB | 597 KB | 333 KB | ✅ |
| mobile | /knowledge | 79 | 4970 ms | 0.000 | 152 ms | 489 KB | 461 KB | 333 KB | ✅ |
| mobile | /knowledge/application-fee | 83 | 4377 ms | 0.000 | 128 ms | 489 KB | 461 KB | 334 KB | ✅ |
| mobile | /contact-us | 91 | 2579 ms | 0.000 | 266 ms | 518 KB | 480 KB | 333 KB | ❌ tbtMs 266 > limit 200 |
| desktop | / | 94 | 1600 ms | 0.000 | 9 ms | 495 KB | 1433 KB | 333 KB | ✅ |
| desktop | /available-units | 95 | 1492 ms | 0.000 | 34 ms | 544 KB | 1752 KB | 524 KB | ✅ |
| desktop | /available-units/0208 | 92 | 1916 ms | 0.001 | 37 ms | 501 KB | 1882 KB | 782 KB | ✅ |
| desktop | /available-units/2705 | 91 | 1759 ms | 0.000 | 110 ms | 500 KB | 1435 KB | 333 KB | ✅ |
| desktop | /amenities | 88 | 2271 ms | 0.000 | 31 ms | 495 KB | 1741 KB | 333 KB | ✅ |
| desktop | /photo-gallery | 90 | 1998 ms | 0.000 | 62 ms | 500 KB | 1792 KB | 333 KB | ✅ |
| desktop | /virtual-tour | 94 | 1659 ms | 0.000 | 0 ms | 494 KB | 1717 KB | 333 KB | ✅ |
| desktop | /knowledge | 92 | 1833 ms | 0.000 | 0 ms | 489 KB | 1433 KB | 333 KB | ✅ |
| desktop | /knowledge/application-fee | 95 | 1577 ms | 0.000 | 0 ms | 489 KB | 1435 KB | 333 KB | ✅ |
| desktop | /contact-us | 98 | 1095 ms | 0.000 | 0 ms | 518 KB | 1536 KB | 333 KB | ✅ |
