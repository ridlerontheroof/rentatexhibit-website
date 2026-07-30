# Page-speed lab report

Generated: 2026-07-30T01:23:29.379Z

Target: local production build (dist/public via `vite preview`)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 77 | 5479 ms | 0.000 | 139 ms | 495 KB | 461 KB | 335 KB | ❌ lcpMs 5479 > limit 5300 |
| mobile | /available-units | 80 | 3740 ms | 0.000 | 299 ms | 544 KB | 671 KB | 472 KB | ❌ lcpMs 3740 > limit 3600; tbtMs 299 > limit 200 |
| mobile | /available-units/0208 | 80 | 4402 ms | 0.046 | 213 ms | 500 KB | 910 KB | 782 KB | ❌ tbtMs 213 > limit 200 |
| mobile | /available-units/2705 | 89 | 2737 ms | 0.000 | 302 ms | 500 KB | 463 KB | 333 KB | ❌ tbtMs 302 > limit 200 |
| mobile | /amenities | 83 | 4296 ms | 0.000 | 142 ms | 495 KB | 544 KB | 333 KB | ❌ lcpMs 4296 > limit 4200 |
| mobile | /photo-gallery | 89 | 3311 ms | 0.000 | 155 ms | 499 KB | 559 KB | 333 KB | ✅ |
| mobile | /virtual-tour | 88 | 3466 ms | 0.000 | 155 ms | 493 KB | 597 KB | 333 KB | ✅ |
| mobile | /knowledge | 77 | 5195 ms | 0.000 | 148 ms | 489 KB | 461 KB | 333 KB | ✅ |
| mobile | /knowledge/application-fee | 90 | 3463 ms | 0.000 | 124 ms | 488 KB | 461 KB | 333 KB | ✅ |
| mobile | /contact-us | 72 | 4526 ms | 0.000 | 434 ms | 518 KB | 480 KB | 334 KB | ❌ tbtMs 434 > limit 200 |
| desktop | / | 92 | 1840 ms | 0.000 | 5 ms | 494 KB | 1433 KB | 333 KB | ✅ |
| desktop | /available-units | 87 | 2194 ms | 0.000 | 63 ms | 544 KB | 1752 KB | 524 KB | ✅ |
| desktop | /available-units/0208 | 85 | 1609 ms | 0.001 | 253 ms | 500 KB | 1882 KB | 782 KB | ❌ tbtMs 253 > limit 200 |
| desktop | /available-units/2705 | 92 | 1783 ms | 0.000 | 53 ms | 500 KB | 1435 KB | 333 KB | ✅ |
| desktop | /amenities | 90 | 2068 ms | 0.000 | 63 ms | 495 KB | 1741 KB | 333 KB | ✅ |
| desktop | /photo-gallery | 89 | 2203 ms | 0.000 | 81 ms | 499 KB | 1792 KB | 333 KB | ✅ |
| desktop | /virtual-tour | 97 | 1228 ms | 0.000 | 8 ms | 493 KB | 1717 KB | 333 KB | ✅ |
| desktop | /knowledge | 92 | 1825 ms | 0.000 | 0 ms | 489 KB | 1433 KB | 333 KB | ✅ |
| desktop | /knowledge/application-fee | 92 | 1900 ms | 0.000 | 9 ms | 488 KB | 1435 KB | 333 KB | ✅ |
| desktop | /contact-us | 88 | 2260 ms | 0.000 | 0 ms | 517 KB | 1536 KB | 333 KB | ✅ |
