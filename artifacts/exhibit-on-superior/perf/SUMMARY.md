# Page-speed lab report

Generated: 2026-07-30T04:14:41.330Z

Target: local production build (dist/public via `vite preview`)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 82 | 4623 ms | 0.000 | 132 ms | 495 KB | 461 KB | 335 KB | ✅ |
| mobile | /available-units | 89 | 3093 ms | 0.000 | 222 ms | 544 KB | 671 KB | 472 KB | ❌ tbtMs 222 > limit 200 |
| mobile | /available-units/0208 | 83 | 4152 ms | 0.046 | 167 ms | 500 KB | 910 KB | 782 KB | ✅ |
| mobile | /available-units/2705 | 93 | 2720 ms | 0.000 | 170 ms | 500 KB | 463 KB | 333 KB | ✅ |
| mobile | /amenities | 93 | 2872 ms | 0.000 | 159 ms | 496 KB | 544 KB | 334 KB | ✅ |
| mobile | /photo-gallery | 79 | 4893 ms | 0.000 | 173 ms | 500 KB | 559 KB | 333 KB | ✅ |
| mobile | /virtual-tour | 80 | 4665 ms | 0.000 | 151 ms | 494 KB | 597 KB | 333 KB | ✅ |
| mobile | /knowledge | 78 | 5045 ms | 0.000 | 154 ms | 489 KB | 461 KB | 333 KB | ✅ |
| mobile | /knowledge/application-fee | 87 | 2577 ms | 0.000 | 398 ms | 489 KB | 461 KB | 333 KB | ❌ tbtMs 398 > limit 200 |
| mobile | /contact-us | 85 | 3990 ms | 0.000 | 146 ms | 518 KB | 480 KB | 333 KB | ✅ |
| desktop | / | 99 | 948 ms | 0.000 | 3 ms | 495 KB | 1433 KB | 333 KB | ✅ |
| desktop | /available-units | 98 | 1192 ms | 0.000 | 3 ms | 544 KB | 1752 KB | 524 KB | ✅ |
| desktop | /available-units/0208 | 91 | 1978 ms | 0.001 | 1 ms | 500 KB | 1882 KB | 782 KB | ✅ |
| desktop | /available-units/2705 | 92 | 1814 ms | 0.000 | 0 ms | 500 KB | 1435 KB | 333 KB | ✅ |
| desktop | /amenities | 92 | 1894 ms | 0.000 | 0 ms | 495 KB | 1741 KB | 333 KB | ✅ |
| desktop | /photo-gallery | 92 | 1816 ms | 0.000 | 30 ms | 500 KB | 1792 KB | 333 KB | ✅ |
| desktop | /virtual-tour | 97 | 1321 ms | 0.000 | 0 ms | 494 KB | 1717 KB | 333 KB | ✅ |
| desktop | /knowledge | 99 | 931 ms | 0.000 | 1 ms | 489 KB | 1433 KB | 333 KB | ✅ |
| desktop | /knowledge/application-fee | 91 | 1931 ms | 0.000 | 0 ms | 489 KB | 1435 KB | 333 KB | ✅ |
| desktop | /contact-us | 90 | 2058 ms | 0.000 | 0 ms | 518 KB | 1536 KB | 333 KB | ✅ |
