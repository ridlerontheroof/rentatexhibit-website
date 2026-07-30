# Page-speed lab report

Generated: 2026-07-30T01:24:23.754Z

Target: local production build (dist/public via `vite preview`)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 52 | 4705 ms | 0.000 | 2555 ms | 495 KB | 461 KB | 335 KB | ❌ tbtMs 2555 > limit 200 |
| mobile | /available-units | 56 | 4331 ms | 0.000 | 1987 ms | 544 KB | 671 KB | 472 KB | ❌ lcpMs 4331 > limit 3600; tbtMs 1987 > limit 200 |
| mobile | /available-units/0208 | 79 | 2827 ms | 0.046 | 579 ms | 500 KB | 910 KB | 782 KB | ❌ tbtMs 579 > limit 200 |
| mobile | /available-units/2705 | 58 | 5182 ms | 0.000 | 989 ms | 500 KB | 463 KB | 333 KB | ❌ tbtMs 989 > limit 200 |
| mobile | /amenities | 63 | 5934 ms | 0.000 | 496 ms | 495 KB | 544 KB | 333 KB | ❌ lcpMs 5934 > limit 4200; tbtMs 496 > limit 200 |
| mobile | /photo-gallery | 71 | 5019 ms | 0.000 | 388 ms | 500 KB | 559 KB | 334 KB | ❌ tbtMs 388 > limit 200 |
| mobile | /virtual-tour | 82 | 2813 ms | 0.000 | 502 ms | 493 KB | 597 KB | 333 KB | ❌ tbtMs 502 > limit 200 |
| mobile | /knowledge | 92 | 2651 ms | 0.000 | 221 ms | 489 KB | 461 KB | 333 KB | ❌ tbtMs 221 > limit 200 |
| mobile | /knowledge/application-fee | 89 | 2953 ms | 0.000 | 256 ms | 488 KB | 461 KB | 333 KB | ❌ tbtMs 256 > limit 200 |
| mobile | /contact-us | 79 | 4105 ms | 0.000 | 317 ms | 517 KB | 480 KB | 334 KB | ❌ tbtMs 317 > limit 200 |
| desktop | / | 98 | 1094 ms | 0.000 | 2 ms | 494 KB | 1433 KB | 333 KB | ✅ |
| desktop | /available-units | 88 | 2303 ms | 0.000 | 2 ms | 544 KB | 1752 KB | 524 KB | ✅ |
| desktop | /available-units/0208 | 89 | 2213 ms | 0.001 | 14 ms | 500 KB | 1882 KB | 782 KB | ✅ |
| desktop | /available-units/2705 | 91 | 1986 ms | 0.000 | 4 ms | 500 KB | 1435 KB | 333 KB | ✅ |
| desktop | /amenities | 95 | 1503 ms | 0.000 | 6 ms | 495 KB | 1741 KB | 333 KB | ✅ |
| desktop | /photo-gallery | 98 | 1064 ms | 0.000 | 7 ms | 500 KB | 1792 KB | 334 KB | ✅ |
| desktop | /virtual-tour | 97 | 1321 ms | 0.000 | 31 ms | 493 KB | 1717 KB | 333 KB | ✅ |
| desktop | /knowledge | 94 | 1608 ms | 0.000 | 89 ms | 489 KB | 1433 KB | 333 KB | ✅ |
| desktop | /knowledge/application-fee | 91 | 1949 ms | 0.000 | 64 ms | 489 KB | 1435 KB | 333 KB | ✅ |
| desktop | /contact-us | 62 | 1713 ms | 0.000 | 706 ms | 518 KB | 1536 KB | 333 KB | ❌ tbtMs 706 > limit 200 |
