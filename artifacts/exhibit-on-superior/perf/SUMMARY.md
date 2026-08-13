# Page-speed lab report

Generated: 2026-08-13T00:06:03.096Z

Target: local production build (dist/public via the production server, server/index.mjs)

Lab metrics with Lighthouse default throttling (simulated Slow-4G/4x-CPU mobile; desktop preset). TBT is the lab proxy for INP. Byte figures are transfer sizes.

| FF | Page | Score | LCP | CLS | TBT | JS | Images | 3rd-party | Result |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 83 | 4518 ms | 0.000 | 39 ms | 127 KB | 480 KB | 0 KB | ✅ |
| mobile | /available-units | 92 | 3052 ms | 0.000 | 58 ms | 164 KB | 1530 KB | 1480 KB | ✅ |
| mobile | /available-units/0208 | 92 | 3112 ms | 0.001 | 63 ms | 182 KB | 1809 KB | 1802 KB | ✅ |
| mobile | /available-units/3108 | 97 | 2406 ms | 0.001 | 67 ms | 182 KB | 1804 KB | 1800 KB | ✅ |
| mobile | /amenities | 96 | 2706 ms | 0.000 | 11 ms | 125 KB | 144 KB | 0 KB | ✅ |
| mobile | /photo-gallery | 96 | 2634 ms | 0.000 | 44 ms | 131 KB | 109 KB | 0 KB | ✅ |
| mobile | /virtual-tour | 97 | 2482 ms | 0.000 | 9 ms | 123 KB | 147 KB | 0 KB | ✅ |
| mobile | /knowledge | 98 | 2255 ms | 0.000 | 17 ms | 150 KB | 4 KB | 0 KB | ✅ |
| mobile | /knowledge/application-fee | 94 | 2907 ms | 0.000 | 7 ms | 148 KB | 4 KB | 0 KB | ✅ |
| mobile | /contact-us | 98 | 2259 ms | 0.000 | 46 ms | 147 KB | 25 KB | 0 KB | ✅ |
| desktop | / | 94 | 1669 ms | 0.000 | 0 ms | 127 KB | 1452 KB | 0 KB | ✅ |
| desktop | /available-units | 100 | 607 ms | 0.000 | 0 ms | 164 KB | 2649 KB | 2510 KB | ✅ |
| desktop | /available-units/0208 | 95 | 1492 ms | 0.000 | 0 ms | 182 KB | 1809 KB | 1802 KB | ✅ |
| desktop | /available-units/3108 | 100 | 485 ms | 0.001 | 0 ms | 182 KB | 1808 KB | 1800 KB | ✅ |
| desktop | /amenities | 99 | 826 ms | 0.000 | 0 ms | 125 KB | 372 KB | 0 KB | ✅ |
| desktop | /photo-gallery | 100 | 666 ms | 0.000 | 0 ms | 131 KB | 385 KB | 0 KB | ✅ |
| desktop | /virtual-tour | 100 | 685 ms | 0.000 | 0 ms | 123 KB | 293 KB | 0 KB | ✅ |
| desktop | /knowledge | 100 | 621 ms | 0.000 | 0 ms | 150 KB | 4 KB | 0 KB | ✅ |
| desktop | /knowledge/application-fee | 100 | 498 ms | 0.000 | 0 ms | 148 KB | 8 KB | 0 KB | ✅ |
| desktop | /contact-us | 100 | 685 ms | 0.000 | 0 ms | 147 KB | 108 KB | 0 KB | ✅ |
