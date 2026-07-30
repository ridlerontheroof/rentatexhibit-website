# Page-speed lab report

Generated: 2026-07-30T01:41:56.892Z

Target: local production build (dist/public via `vite preview`)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 74 | 4592 ms | 0.000 | 356 ms | 495 KB | 461 KB | 335 KB | ❌ tbtMs 356 > limit 200 |
| mobile | /available-units | 64 | 4423 ms | 0.000 | 864 ms | 544 KB | 671 KB | 472 KB | ❌ lcpMs 4423 > limit 3600; tbtMs 864 > limit 200 |
| mobile | /available-units/0208 | 83 | 3326 ms | 0.046 | 354 ms | 500 KB | 910 KB | 782 KB | ❌ tbtMs 354 > limit 200 |
| mobile | /available-units/2705 | 77 | 4861 ms | 0.000 | 242 ms | 500 KB | 463 KB | 333 KB | ❌ tbtMs 242 > limit 200 |
| mobile | /amenities | 90 | 3023 ms | 0.000 | 205 ms | 495 KB | 544 KB | 333 KB | ❌ tbtMs 205 > limit 200 |
| mobile | /photo-gallery | 87 | 3315 ms | 0.000 | 231 ms | 499 KB | 559 KB | 333 KB | ❌ tbtMs 231 > limit 200 |
| mobile | /virtual-tour | 91 | 3103 ms | 0.000 | 162 ms | 493 KB | 597 KB | 333 KB | ✅ |
| mobile | /knowledge | 92 | 3088 ms | 0.000 | 127 ms | 489 KB | 461 KB | 333 KB | ✅ |
| mobile | /knowledge/application-fee | 90 | 3238 ms | 0.000 | 140 ms | 489 KB | 461 KB | 334 KB | ✅ |
| mobile | /contact-us | 88 | 3314 ms | 0.000 | 188 ms | 517 KB | 480 KB | 333 KB | ✅ |
| desktop | / | 100 | 652 ms | 0.000 | 0 ms | 494 KB | 1433 KB | 333 KB | ✅ |
| desktop | /available-units | 98 | 1196 ms | 0.000 | 18 ms | 544 KB | 1752 KB | 524 KB | ✅ |
| desktop | /available-units/0208 | 95 | 1466 ms | 0.001 | 21 ms | 500 KB | 1882 KB | 782 KB | ✅ |
| desktop | /available-units/2705 | 91 | 1991 ms | 0.000 | 5 ms | 500 KB | 1435 KB | 333 KB | ✅ |
| desktop | /amenities | 91 | 1939 ms | 0.000 | 0 ms | 495 KB | 1741 KB | 333 KB | ✅ |
| desktop | /photo-gallery | 91 | 1937 ms | 0.000 | 4 ms | 499 KB | 1792 KB | 333 KB | ✅ |
| desktop | /virtual-tour | 94 | 1633 ms | 0.000 | 5 ms | 493 KB | 1717 KB | 333 KB | ✅ |
| desktop | /knowledge | 91 | 1938 ms | 0.000 | 1 ms | 489 KB | 1433 KB | 333 KB | ✅ |
| desktop | /knowledge/application-fee | 93 | 1718 ms | 0.000 | 0 ms | 488 KB | 1435 KB | 333 KB | ✅ |
| desktop | /contact-us | 98 | 1068 ms | 0.000 | 0 ms | 517 KB | 1536 KB | 333 KB | ✅ |
