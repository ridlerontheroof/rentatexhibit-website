# Page-speed lab report

Generated: 2026-07-30T00:25:45.257Z

Target: local production build (dist/public via `vite preview`)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 56 | 4399 ms | 0.000 | 1468 ms | 494 KB | 461 KB | 335 KB | ❌ tbtMs 1468 > limit 200 |
| mobile | /available-units | 50 | 6487 ms | 0.000 | 1078 ms | 544 KB | 671 KB | 472 KB | ❌ lcpMs 6487 > limit 3600; tbtMs 1078 > limit 200 |
| mobile | /available-units/0208 | 65 | 3822 ms | 0.001 | 997 ms | 500 KB | 910 KB | 782 KB | ❌ tbtMs 997 > limit 200 |
| mobile | /available-units/2705 | 90 | 2815 ms | 0.000 | 261 ms | 500 KB | 463 KB | 333 KB | ❌ tbtMs 261 > limit 200 |
| mobile | /amenities | 79 | 4854 ms | 0.000 | 171 ms | 495 KB | 544 KB | 333 KB | ❌ lcpMs 4854 > limit 4200 |
| mobile | /photo-gallery | 87 | 3478 ms | 0.000 | 192 ms | 499 KB | 559 KB | 333 KB | ✅ |
| mobile | /virtual-tour | 88 | 3400 ms | 0.000 | 178 ms | 493 KB | 597 KB | 334 KB | ✅ |
| mobile | /knowledge | 79 | 3269 ms | 0.000 | 463 ms | 489 KB | 461 KB | 333 KB | ❌ tbtMs 463 > limit 200 |
| mobile | /knowledge/application-fee | 69 | 4038 ms | 0.000 | 690 ms | 488 KB | 461 KB | 333 KB | ❌ tbtMs 690 > limit 200 |
| mobile | /contact-us | 76 | 4055 ms | 0.000 | 320 ms | 517 KB | 480 KB | 333 KB | ❌ tbtMs 320 > limit 200 |
| desktop | / | 81 | 1793 ms | 0.000 | 279 ms | 494 KB | 1433 KB | 333 KB | ❌ tbtMs 279 > limit 200 |
| desktop | /available-units | 87 | 2170 ms | 0.000 | 129 ms | 544 KB | 1752 KB | 524 KB | ✅ |
| desktop | /available-units/0208 | 92 | 1690 ms | 0.002 | 111 ms | 500 KB | 1882 KB | 782 KB | ✅ |
| desktop | /available-units/2705 | 98 | 1114 ms | 0.000 | 72 ms | 500 KB | 1435 KB | 333 KB | ✅ |
| desktop | /amenities | 90 | 2117 ms | 0.000 | 22 ms | 495 KB | 1741 KB | 333 KB | ✅ |
| desktop | /photo-gallery | 94 | 1628 ms | 0.000 | 8 ms | 499 KB | 1792 KB | 333 KB | ✅ |
| desktop | /virtual-tour | 93 | 1735 ms | 0.000 | 0 ms | 493 KB | 1717 KB | 334 KB | ✅ |
| desktop | /knowledge | 99 | 928 ms | 0.000 | 27 ms | 489 KB | 1433 KB | 333 KB | ✅ |
| desktop | /knowledge/application-fee | 93 | 1718 ms | 0.000 | 0 ms | 488 KB | 1435 KB | 333 KB | ✅ |
| desktop | /contact-us | 94 | 1682 ms | 0.000 | 0 ms | 517 KB | 1536 KB | 333 KB | ✅ |
