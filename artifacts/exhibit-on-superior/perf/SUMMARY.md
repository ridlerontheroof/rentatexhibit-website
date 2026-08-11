# Page-speed lab report

Generated: 2026-07-29T23:55:53.108Z

Target: local production build (dist/public via `vite preview`)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 75 | 5587 ms | 0.000 | 215 ms | 495 KB | 461 KB | 335 KB | ❌ lcpMs 5587 > limit 5300; tbtMs 215 > limit 200 |
| mobile | /available-units | 92 | 2722 ms | 0.000 | 202 ms | 544 KB | 671 KB | 472 KB | ❌ tbtMs 202 > limit 200 |
| mobile | /available-units/0208 | 87 | 3553 ms | 0.046 | 166 ms | 500 KB | 910 KB | 782 KB | ✅ |
| mobile | /available-units/2705 | 93 | 2717 ms | 0.000 | 174 ms | 500 KB | 463 KB | 334 KB | ✅ |
| mobile | /amenities | 84 | 3846 ms | 0.000 | 197 ms | 495 KB | 544 KB | 333 KB | ✅ |
| mobile | /photo-gallery | 85 | 3764 ms | 0.000 | 191 ms | 500 KB | 559 KB | 333 KB | ✅ |
| mobile | /virtual-tour | 91 | 3162 ms | 0.000 | 118 ms | 494 KB | 597 KB | 333 KB | ✅ |
| mobile | /knowledge | 79 | 4968 ms | 0.000 | 143 ms | 490 KB | 461 KB | 333 KB | ✅ |
| mobile | /knowledge/application-fee | 88 | 3613 ms | 0.000 | 119 ms | 489 KB | 461 KB | 333 KB | ✅ |
| mobile | /contact-us | 88 | 3315 ms | 0.000 | 182 ms | 519 KB | 480 KB | 334 KB | ✅ |
| desktop | / | 91 | 1933 ms | 0.000 | 3 ms | 495 KB | 1433 KB | 333 KB | ✅ |
| desktop | /available-units | 91 | 1955 ms | 0.000 | 6 ms | 544 KB | 1752 KB | 524 KB | ✅ |
| desktop | /available-units/0208 | 90 | 2077 ms | 0.001 | 9 ms | 500 KB | 1882 KB | 782 KB | ✅ |
| desktop | /available-units/2705 | 92 | 1877 ms | 0.000 | 1 ms | 500 KB | 1435 KB | 333 KB | ✅ |
| desktop | /amenities | 96 | 1444 ms | 0.000 | 2 ms | 495 KB | 1741 KB | 333 KB | ✅ |
| desktop | /photo-gallery | 91 | 1957 ms | 0.000 | 0 ms | 500 KB | 1792 KB | 333 KB | ✅ |
| desktop | /virtual-tour | 90 | 2122 ms | 0.000 | 0 ms | 494 KB | 1717 KB | 333 KB | ✅ |
| desktop | /knowledge | 98 | 1158 ms | 0.000 | 0 ms | 489 KB | 1433 KB | 333 KB | ✅ |
| desktop | /knowledge/application-fee | 95 | 1472 ms | 0.000 | 0 ms | 489 KB | 1435 KB | 333 KB | ✅ |
| desktop | /contact-us | 95 | 1569 ms | 0.000 | 1 ms | 518 KB | 1536 KB | 333 KB | ✅ |
