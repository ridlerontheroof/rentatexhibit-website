# Page-speed lab report

Generated: 2026-07-30T04:53:31.447Z

Target: local production build (dist/public via `vite preview`)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 76 | 5465 ms | 0.000 | 186 ms | 495 KB | 461 KB | 335 KB | ❌ lcpMs 5465 > limit 5300 |
| mobile | /available-units | 85 | 3323 ms | 0.000 | 273 ms | 544 KB | 671 KB | 472 KB | ❌ tbtMs 273 > limit 200 |
| mobile | /available-units/0208 | 83 | 4215 ms | 0.046 | 168 ms | 500 KB | 910 KB | 782 KB | ✅ |
| mobile | /available-units/2705 | 80 | 4826 ms | 0.000 | 139 ms | 500 KB | 463 KB | 333 KB | ✅ |
| mobile | /amenities | 94 | 2565 ms | 0.000 | 180 ms | 495 KB | 544 KB | 333 KB | ✅ |
| mobile | /photo-gallery | 91 | 3017 ms | 0.000 | 178 ms | 500 KB | 559 KB | 333 KB | ✅ |
| mobile | /virtual-tour | 91 | 3091 ms | 0.000 | 171 ms | 494 KB | 597 KB | 333 KB | ✅ |
| mobile | /knowledge | 94 | 2561 ms | 0.000 | 158 ms | 489 KB | 461 KB | 333 KB | ✅ |
| mobile | /knowledge/application-fee | 79 | 5123 ms | 0.000 | 130 ms | 489 KB | 461 KB | 333 KB | ❌ lcpMs 5123 > limit 4400 |
| mobile | /contact-us | 92 | 2796 ms | 0.000 | 191 ms | 518 KB | 480 KB | 334 KB | ✅ |
| desktop | / | 93 | 1779 ms | 0.000 | 1 ms | 495 KB | 1433 KB | 333 KB | ✅ |
| desktop | /available-units | 93 | 1776 ms | 0.000 | 5 ms | 544 KB | 1752 KB | 524 KB | ✅ |
| desktop | /available-units/0208 | 98 | 1157 ms | 0.001 | 0 ms | 500 KB | 1882 KB | 782 KB | ✅ |
| desktop | /available-units/2705 | 98 | 1147 ms | 0.000 | 1 ms | 500 KB | 1435 KB | 333 KB | ✅ |
| desktop | /amenities | 90 | 2129 ms | 0.000 | 0 ms | 495 KB | 1741 KB | 333 KB | ✅ |
| desktop | /photo-gallery | 91 | 1999 ms | 0.000 | 0 ms | 500 KB | 1792 KB | 333 KB | ✅ |
| desktop | /virtual-tour | 90 | 2056 ms | 0.000 | 0 ms | 494 KB | 1717 KB | 333 KB | ✅ |
| desktop | /knowledge | 98 | 1194 ms | 0.000 | 1 ms | 489 KB | 1433 KB | 333 KB | ✅ |
| desktop | /knowledge/application-fee | 97 | 1331 ms | 0.000 | 0 ms | 489 KB | 1435 KB | 333 KB | ✅ |
| desktop | /contact-us | 98 | 1070 ms | 0.000 | 6 ms | 518 KB | 1536 KB | 333 KB | ✅ |
