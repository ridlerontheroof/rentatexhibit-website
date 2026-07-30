# Page-speed lab report

Generated: 2026-07-29T23:56:55.645Z

Target: local production build (dist/public via `vite preview`)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 74 | 5464 ms | 0.000 | 217 ms | 494 KB | 461 KB | 335 KB | ❌ lcpMs 5464 > limit 5300; tbtMs 217 > limit 200 |
| mobile | /available-units | 83 | 3473 ms | 0.000 | 322 ms | 544 KB | 671 KB | 472 KB | ❌ tbtMs 322 > limit 200 |
| mobile | /available-units/0208 | 88 | 2737 ms | 0.046 | 319 ms | 500 KB | 910 KB | 782 KB | ❌ tbtMs 319 > limit 200 |
| mobile | /available-units/2705 | 81 | 4371 ms | 0.000 | 190 ms | 500 KB | 463 KB | 333 KB | ✅ |
| mobile | /amenities | 90 | 3017 ms | 0.000 | 228 ms | 495 KB | 544 KB | 333 KB | ❌ tbtMs 228 > limit 200 |
| mobile | /photo-gallery | 74 | 5423 ms | 0.000 | 228 ms | 499 KB | 559 KB | 333 KB | ❌ tbtMs 228 > limit 200 |
| mobile | /virtual-tour | 81 | 4369 ms | 0.000 | 217 ms | 493 KB | 597 KB | 333 KB | ❌ tbtMs 217 > limit 200 |
| mobile | /knowledge | 87 | 3387 ms | 0.000 | 220 ms | 489 KB | 461 KB | 333 KB | ❌ tbtMs 220 > limit 200 |
| mobile | /knowledge/application-fee | 83 | 4212 ms | 0.000 | 158 ms | 488 KB | 461 KB | 333 KB | ✅ |
| mobile | /contact-us | 76 | 4970 ms | 0.000 | 255 ms | 518 KB | 480 KB | 334 KB | ❌ lcpMs 4970 > limit 4700; tbtMs 255 > limit 200 |
| desktop | / | 91 | 1935 ms | 0.000 | 3 ms | 494 KB | 1433 KB | 333 KB | ✅ |
| desktop | /available-units | 88 | 2385 ms | 0.000 | 10 ms | 544 KB | 1752 KB | 524 KB | ✅ |
| desktop | /available-units/0208 | 93 | 1795 ms | 0.001 | 5 ms | 500 KB | 1882 KB | 782 KB | ✅ |
| desktop | /available-units/2705 | 97 | 1323 ms | 0.000 | 11 ms | 500 KB | 1435 KB | 333 KB | ✅ |
| desktop | /amenities | 95 | 1499 ms | 0.000 | 7 ms | 495 KB | 1741 KB | 333 KB | ✅ |
| desktop | /photo-gallery | 93 | 1736 ms | 0.000 | 11 ms | 499 KB | 1792 KB | 333 KB | ✅ |
| desktop | /virtual-tour | 96 | 1342 ms | 0.000 | 6 ms | 493 KB | 1717 KB | 333 KB | ✅ |
| desktop | /knowledge | 98 | 1047 ms | 0.000 | 11 ms | 489 KB | 1433 KB | 333 KB | ✅ |
| desktop | /knowledge/application-fee | 98 | 1116 ms | 0.000 | 3 ms | 488 KB | 1435 KB | 333 KB | ✅ |
| desktop | /contact-us | 91 | 1982 ms | 0.000 | 8 ms | 517 KB | 1536 KB | 333 KB | ✅ |
